using System.Text;
using System.Threading.RateLimiting;
using HouseholdFinance.Api.Configuration;
using HouseholdFinance.Api.Logging;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using HouseholdFinance.Api.Data;
using HouseholdFinance.Api.Middleware;
using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

try
{
    DeploymentFileLogger.Info("startup", "Application boot begin", new
    {
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        baseDirectory = AppContext.BaseDirectory,
        logsDirectory = DeploymentFileLogger.LogsDirectory
    });

    var builder = WebApplication.CreateBuilder(args);
    var isTesting = builder.Environment.IsEnvironment("Testing");

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    DeploymentFileLogger.Info("config", "Connection string loaded", new
    {
        hasConnectionString = !string.IsNullOrWhiteSpace(connectionString),
        serverHint = ExtractServerHint(connectionString)
    });

    if (string.IsNullOrWhiteSpace(connectionString) && !isTesting)
    {
        throw new InvalidOperationException("ConnectionStrings__DefaultConnection no está configurada.");
    }

    var jwtSection = builder.Configuration.GetSection(JwtSettings.SectionName);
    builder.Services.Configure<JwtSettings>(jwtSection);
    builder.Services.Configure<CorsSettings>(builder.Configuration.GetSection(CorsSettings.SectionName));

    var jwtSettings = jwtSection.Get<JwtSettings>() ?? new JwtSettings();
    if (isTesting)
    {
        jwtSettings.Key = "IntegrationTestsSecretKeyAtLeast32Chars!";
        jwtSettings.Issuer = "HouseholdFinance";
        jwtSettings.Audience = "HouseholdFinanceClient";
        builder.Services.PostConfigure<JwtSettings>(s =>
        {
            s.Key = jwtSettings.Key;
            s.Issuer = jwtSettings.Issuer;
            s.Audience = jwtSettings.Audience;
        });
    }
    else if (string.IsNullOrWhiteSpace(jwtSettings.Key) || jwtSettings.Key.Length < 32)
    {
        throw new InvalidOperationException("JwtSettings__Key debe tener al menos 32 caracteres.");
    }

    DeploymentFileLogger.Info("config", "JWT settings loaded", new
    {
        hasKey = !string.IsNullOrWhiteSpace(jwtSettings.Key),
        keyLength = jwtSettings.Key.Length,
        jwtSettings.Issuer,
        jwtSettings.Audience
    });

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        if (isTesting)
        {
            var dbName = builder.Configuration["TestingDbName"] ?? "HouseholdFinanceTests";
            options.UseInMemoryDatabase(dbName);
        }
        else options.UseSqlServer(connectionString);
    });

    builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
        options.User.RequireUniqueEmail = true;
    }).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

    builder.Services.AddAuthorization();
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Finanzas del Hogar API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
        });
    });

    builder.Services.AddHealthChecks().AddDbContextCheck<ApplicationDbContext>("database");

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    var corsSettings = builder.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>() ?? new CorsSettings();
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            policy.WithOrigins(corsSettings.AllowedOrigins.Length > 0 ? corsSettings.AllowedOrigins : ["http://localhost:5173"])
                .AllowAnyHeader().AllowAnyMethod();
        });
    });

    DeploymentFileLogger.Info("config", "CORS settings loaded", new { origins = corsSettings.AllowedOrigins });

    builder.Services.AddRateLimiter(options =>
    {
        options.AddFixedWindowLimiter("auth", limiter => { limiter.Window = TimeSpan.FromMinutes(1); limiter.PermitLimit = 10; limiter.QueueLimit = 0; });
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IHouseholdService, HouseholdService>();
    builder.Services.AddScoped<IPeriodService, PeriodService>();
    builder.Services.AddScoped<IIncomeService, IncomeService>();
    builder.Services.AddScoped<ICategoryService, CategoryService>();
    builder.Services.AddScoped<IRecurringExpenseService, RecurringExpenseService>();
    builder.Services.AddScoped<IBudgetService, BudgetService>();
    builder.Services.AddScoped<IExpenseService, ExpenseService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<IReportService, ReportService>();
    builder.Services.AddScoped<IAuditService, AuditService>();
    builder.Services.AddScoped<IHouseholdAccessService, HouseholdAccessService>();
    builder.Services.AddScoped<IDataSeedService, DataSeedService>();

    var app = builder.Build();
    DeploymentFileLogger.Info("startup", "Application built");

    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (isTesting) await db.Database.EnsureCreatedAsync();

        DeploymentFileLogger.Info("seed", "Seed begin");
        var seedService = scope.ServiceProvider.GetRequiredService<IDataSeedService>();
        await seedService.SeedAsync();
        if (app.Environment.IsDevelopment())
        {
            await seedService.SeedDemoAsync();
        }
        DeploymentFileLogger.Info("seed", "Seed completed");
    }
    catch (Exception ex)
    {
        DeploymentFileLogger.Error("seed", "Seed failed", ex);
        throw;
    }

    app.UseForwardedHeaders();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    if (app.Environment.IsDevelopment() || isTesting)
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();
    app.UseCors("Frontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = WriteHealthCheckResponseAsync
    });

    DeploymentFileLogger.Info("startup", "Application listening");
    app.Run();
}
catch (Exception ex)
{
    DeploymentFileLogger.Error("startup", "Fatal startup failure", ex);
    throw;
}

static async Task WriteHealthCheckResponseAsync(HttpContext context, HealthReport report)
{
    DeploymentFileLogger.Info("health", "Health check executed", new
    {
        status = report.Status.ToString(),
        totalDurationMs = report.TotalDuration.TotalMilliseconds,
        entries = report.Entries.ToDictionary(
            e => e.Key,
            e => new { status = e.Value.Status.ToString(), description = e.Value.Description, error = e.Value.Exception?.Message })
    });

    context.Response.ContentType = "text/plain";
    context.Response.StatusCode = report.Status == HealthStatus.Healthy
        ? StatusCodes.Status200OK
        : StatusCodes.Status503ServiceUnavailable;
    await context.Response.WriteAsync(report.Status.ToString());
}

static string? ExtractServerHint(string? connectionString)
{
    if (string.IsNullOrWhiteSpace(connectionString)) return null;
    const string serverKey = "Server=";
    var start = connectionString.IndexOf(serverKey, StringComparison.OrdinalIgnoreCase);
    if (start < 0) return null;
    start += serverKey.Length;
    var end = connectionString.IndexOf(';', start);
    return end < 0 ? connectionString[start..] : connectionString[start..end];
}

public partial class Program;
