using HouseholdFinance.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HouseholdFinance.Api.Data.Configurations;

public sealed class ExpenseCategoryConfiguration : IEntityTypeConfiguration<ExpenseCategory>
{
    public void Configure(EntityTypeBuilder<ExpenseCategory> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.HasOne(x => x.Household).WithMany(x => x.ExpenseCategories).HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class RecurringExpenseConfiguration : IEntityTypeConfiguration<RecurringExpense>
{
    public void Configure(EntityTypeBuilder<RecurringExpense> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EstimatedAmount).HasPrecision(18, 2);
        builder.HasOne(x => x.Household).WithMany(x => x.RecurringExpenses).HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Category).WithMany(x => x.RecurringExpenses).HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class IncomeConfiguration : IEntityTypeConfiguration<Income>
{
    public void Configure(EntityTypeBuilder<Income> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EstimatedAmount).HasPrecision(18, 2);
        builder.Property(x => x.ReceivedAmount).HasPrecision(18, 2);
        builder.HasOne(x => x.Household).WithMany(x => x.Incomes).HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Period).WithMany(x => x.Incomes).HasForeignKey(x => x.PeriodId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.IncomeType).WithMany(x => x.Incomes).HasForeignKey(x => x.IncomeTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class MonthlyBudgetConfiguration : IEntityTypeConfiguration<MonthlyBudget>
{
    public void Configure(EntityTypeBuilder<MonthlyBudget> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.PeriodId).IsUnique();
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasOne(x => x.Period).WithOne(x => x.Budget).HasForeignKey<MonthlyBudget>(x => x.PeriodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class BudgetLineConfiguration : IEntityTypeConfiguration<BudgetLine>
{
    public void Configure(EntityTypeBuilder<BudgetLine> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.MonthlyBudgetId, x.CategoryId }).IsUnique();
        builder.Property(x => x.BudgetedAmount).HasPrecision(18, 2);
        builder.Property(x => x.CommittedAmount).HasPrecision(18, 2);
        builder.HasOne(x => x.MonthlyBudget).WithMany(x => x.Lines).HasForeignKey(x => x.MonthlyBudgetId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Category).WithMany(x => x.BudgetLines).HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.RecurringExpense).WithMany().HasForeignKey(x => x.RecurringExpenseId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.HasIndex(x => x.IdempotencyKey);
        builder.HasOne(x => x.Household).WithMany(x => x.Expenses).HasForeignKey(x => x.HouseholdId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Period).WithMany(x => x.Expenses).HasForeignKey(x => x.PeriodId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Category).WithMany(x => x.Expenses).HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.RecurringExpense).WithMany(x => x.Expenses).HasForeignKey(x => x.RecurringExpenseId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
