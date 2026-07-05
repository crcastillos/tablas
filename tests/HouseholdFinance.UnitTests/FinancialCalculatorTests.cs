using HouseholdFinance.Api.Models;
using HouseholdFinance.Api.Models.Enums;
using HouseholdFinance.Api.Services;
using Xunit;

namespace HouseholdFinance.UnitTests;

public class FinancialCalculatorTests
{
    [Fact]
    public void TotalEstimatedIncome_ExcludesCancelled()
    {
        var incomes = new[]
        {
            new Income { EstimatedAmount = 1000, Status = IncomeStatus.Pending },
            new Income { EstimatedAmount = 500, Status = IncomeStatus.Cancelled },
            new Income { EstimatedAmount = 200, Status = IncomeStatus.Received, ReceivedAmount = 200 }
        };
        Assert.Equal(1200, FinancialCalculator.TotalEstimatedIncome(incomes));
    }

    [Fact]
    public void ConsumedPercentage_HandlesZeroBudget()
    {
        Assert.Equal(100, FinancialCalculator.ConsumedPercentage(0, 50));
        Assert.Equal(0, FinancialCalculator.ConsumedPercentage(0, 0));
    }

    [Fact]
    public void PeriodHelper_ReturnsCorrectMonthRange()
    {
        var (start, end) = PeriodHelper.GetMonthRange(2026, 2);
        Assert.Equal(new DateOnly(2026, 2, 1), start);
        Assert.Equal(new DateOnly(2026, 2, 28), end);
    }

    [Fact]
    public void TotalConfirmedExpenses_OnlyConfirmed()
    {
        var expenses = new[]
        {
            new Expense { Amount = 100, Status = ExpenseStatus.Confirmed },
            new Expense { Amount = 50, Status = ExpenseStatus.Pending },
            new Expense { Amount = 25, Status = ExpenseStatus.Cancelled }
        };
        Assert.Equal(100, FinancialCalculator.TotalConfirmedExpenses(expenses));
    }
}
