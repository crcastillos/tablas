using HouseholdFinance.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HouseholdFinance.Api.Data.Configurations;

public sealed class HouseholdConfiguration : IEntityTypeConfiguration<Household>
{
    public void Configure(EntityTypeBuilder<Household> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        builder.Property(x => x.TimeZoneId).HasMaxLength(64).IsRequired();
    }
}

public sealed class HouseholdMemberConfiguration : IEntityTypeConfiguration<HouseholdMember>
{
    public void Configure(EntityTypeBuilder<HouseholdMember> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.HouseholdId, x.UserId }).IsUnique();
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired();
        builder.HasOne(x => x.Household).WithMany(x => x.Members).HasForeignKey(x => x.HouseholdId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.User).WithMany(x => x.HouseholdMemberships).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class FinancialPeriodConfiguration : IEntityTypeConfiguration<FinancialPeriod>
{
    public void Configure(EntityTypeBuilder<FinancialPeriod> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.HouseholdId, x.Year, x.Month }).IsUnique();
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasOne(x => x.Household).WithMany(x => x.Periods).HasForeignKey(x => x.HouseholdId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.HouseholdId);
        builder.HasIndex(x => x.CreatedAtUtc);
    }
}
