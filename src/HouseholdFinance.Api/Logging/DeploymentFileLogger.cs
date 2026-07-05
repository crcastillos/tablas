using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace HouseholdFinance.Api.Logging;

public static class DeploymentFileLogger
{
    private static readonly object Gate = new();
    private static readonly List<string> ActiveLogDirectories = [];
    private static string? _primaryLogsDirectory;
    private static bool _initialized;

    static DeploymentFileLogger() => Initialize();

    [ModuleInitializer]
    internal static void ModuleInit() => Initialize();

    public static IReadOnlyList<string> LogDirectories => ActiveLogDirectories.AsReadOnly();

    public static string? PrimaryLogsDirectory => _primaryLogsDirectory;

    public static string LogsDirectory => _primaryLogsDirectory ?? ResolvePrimaryDirectory();

    public static void Info(string phase, string message, object? data = null) =>
        Write("INFO", phase, message, data);

    public static void Warn(string phase, string message, object? data = null) =>
        Write("WARN", phase, message, data);

    public static void Error(string phase, string message, Exception? ex = null, object? data = null) =>
        Write("ERROR", phase, message, data, ex);

    public static string ReadLatestLogTail(int maxLines = 200)
    {
        var file = Path.Combine(LogsDirectory, "deployment-latest.log");
        if (!File.Exists(file)) return string.Empty;

        var lines = File.ReadAllLines(file);
        return string.Join(Environment.NewLine, lines.TakeLast(maxLines));
    }

    private static void Initialize()
    {
        if (_initialized) return;

        lock (Gate)
        {
            if (_initialized) return;
            ActiveLogDirectories.Clear();

            foreach (var directory in GetCandidateDirectories())
            {
                if (!TryEnsureWritableDirectory(directory)) continue;
                if (!ActiveLogDirectories.Contains(directory)) ActiveLogDirectories.Add(directory);
            }

            _primaryLogsDirectory = ActiveLogDirectories.FirstOrDefault() ?? ResolvePrimaryDirectory();
            _initialized = true;

            Write("INFO", "logger", "Deployment logger initialized", new
            {
                baseDirectory = AppContext.BaseDirectory,
                activeDirectories = ActiveLogDirectories,
                primaryDirectory = _primaryLogsDirectory
            });
        }
    }

    private static IEnumerable<string> GetCandidateDirectories()
    {
        var baseDir = AppContext.BaseDirectory;
        yield return Path.Combine(baseDir, "App_Data", "logs");
        yield return Path.Combine(baseDir, "logs");
        yield return Path.Combine(Path.GetTempPath(), "HouseholdFinance", "logs");
    }

    private static string ResolvePrimaryDirectory()
    {
        var preferred = Path.Combine(AppContext.BaseDirectory, "App_Data", "logs");
        return TryEnsureWritableDirectory(preferred)
            ? preferred
            : Path.Combine(AppContext.BaseDirectory, "logs");
    }

    private static bool TryEnsureWritableDirectory(string directory)
    {
        try
        {
            Directory.CreateDirectory(directory);
            var probe = Path.Combine(directory, ".write-test");
            File.WriteAllText(probe, DateTime.UtcNow.ToString("O"));
            File.Delete(probe);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static void Write(string level, string phase, string message, object? data, Exception? ex = null)
    {
        if (!_initialized) Initialize();

        try
        {
            var entry = new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                level,
                phase,
                message,
                data,
                exception = ex is null ? null : new
                {
                    type = ex.GetType().Name,
                    ex.Message,
                    stackTrace = ex.StackTrace,
                    inner = ex.InnerException?.Message
                }
            };

            var json = JsonSerializer.Serialize(entry);
            var targets = ActiveLogDirectories.Count > 0
                ? ActiveLogDirectories
                : [LogsDirectory];

            lock (Gate)
            {
                foreach (var directory in targets)
                {
                    try
                    {
                        Directory.CreateDirectory(directory);
                        var dailyFile = Path.Combine(directory, $"deployment-{DateTime.UtcNow:yyyyMMdd}.log");
                        var latestFile = Path.Combine(directory, "deployment-latest.log");
                        File.AppendAllText(dailyFile, json + Environment.NewLine, Encoding.UTF8);
                        File.AppendAllText(latestFile, json + Environment.NewLine, Encoding.UTF8);
                    }
                    catch
                    {
                        // Try next directory.
                    }
                }
            }
        }
        catch
        {
            // Never block startup because logging failed.
        }
    }
}
