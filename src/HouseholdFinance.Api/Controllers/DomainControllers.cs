using HouseholdFinance.Api.DTOs.Budgets;
using HouseholdFinance.Api.DTOs.Common;
using HouseholdFinance.Api.DTOs.Expenses;
using HouseholdFinance.Api.DTOs.Incomes;
using HouseholdFinance.Api.DTOs.Reports;
using HouseholdFinance.Api.Security;
using HouseholdFinance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HouseholdFinance.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}")]
public sealed class IncomesController(IIncomeService incomeService) : ControllerBase
{
    [HttpGet("periods/{periodId:guid}/incomes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<IncomeDto>>>> GetIncomes(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<IncomeDto>>.Ok(await incomeService.GetIncomesAsync(householdId, periodId, User.GetUserId(), ct)));

    [HttpPost("periods/{periodId:guid}/incomes")]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Create(Guid householdId, Guid periodId, [FromBody] CreateIncomeRequest request, CancellationToken ct) =>
        Ok(ApiResponse<IncomeDto>.Ok(await incomeService.CreateAsync(householdId, periodId, User.GetUserId(), request, ct)));

    [HttpPut("incomes/{incomeId:guid}")]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Update(Guid householdId, Guid incomeId, [FromBody] UpdateIncomeRequest request, CancellationToken ct) =>
        Ok(ApiResponse<IncomeDto>.Ok(await incomeService.UpdateAsync(householdId, incomeId, User.GetUserId(), request, ct)));

    [HttpPost("incomes/{incomeId:guid}/receive")]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Receive(Guid householdId, Guid incomeId, [FromBody] ReceiveIncomeRequest request, CancellationToken ct) =>
        Ok(ApiResponse<IncomeDto>.Ok(await incomeService.ReceiveAsync(householdId, incomeId, User.GetUserId(), request, ct)));

    [HttpPost("incomes/{incomeId:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<IncomeDto>>> Cancel(Guid householdId, Guid incomeId, [FromBody] CancelIncomeRequest request, CancellationToken ct) =>
        Ok(ApiResponse<IncomeDto>.Ok(await incomeService.CancelAsync(householdId, incomeId, User.GetUserId(), request, ct)));
}

[Authorize]
[ApiController]
[Route("api/income-types")]
public sealed class IncomeTypesController(IIncomeService incomeService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<IncomeTypeDto>>>> GetAll(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<IncomeTypeDto>>.Ok(await incomeService.GetIncomeTypesAsync(ct)));
}

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}")]
public sealed class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet("expense-categories")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExpenseCategoryDto>>>> GetAll(Guid householdId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ExpenseCategoryDto>>.Ok(await categoryService.GetCategoriesAsync(householdId, User.GetUserId(), ct)));

    [HttpPost("expense-categories")]
    public async Task<ActionResult<ApiResponse<ExpenseCategoryDto>>> Create(Guid householdId, [FromBody] CreateExpenseCategoryRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseCategoryDto>.Ok(await categoryService.CreateAsync(householdId, User.GetUserId(), request, ct)));

    [HttpPut("expense-categories/{categoryId:guid}")]
    public async Task<ActionResult<ApiResponse<ExpenseCategoryDto>>> Update(Guid householdId, Guid categoryId, [FromBody] UpdateExpenseCategoryRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseCategoryDto>.Ok(await categoryService.UpdateAsync(householdId, User.GetUserId(), categoryId, request, ct)));

    [HttpPost("expense-categories/{categoryId:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid householdId, Guid categoryId, CancellationToken ct)
    {
        await categoryService.DeactivateAsync(householdId, User.GetUserId(), categoryId, ct);
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}/recurring-expenses")]
public sealed class RecurringExpensesController(IRecurringExpenseService recurringExpenseService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RecurringExpenseDto>>>> GetAll(Guid householdId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<RecurringExpenseDto>>.Ok(await recurringExpenseService.GetAsync(householdId, User.GetUserId(), ct)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<RecurringExpenseDto>>> Create(Guid householdId, [FromBody] CreateRecurringExpenseRequest request, CancellationToken ct) =>
        Ok(ApiResponse<RecurringExpenseDto>.Ok(await recurringExpenseService.CreateAsync(householdId, User.GetUserId(), request, ct)));

    [HttpPut("{recurringExpenseId:guid}")]
    public async Task<ActionResult<ApiResponse<RecurringExpenseDto>>> Update(Guid householdId, Guid recurringExpenseId, [FromBody] UpdateRecurringExpenseRequest request, CancellationToken ct) =>
        Ok(ApiResponse<RecurringExpenseDto>.Ok(await recurringExpenseService.UpdateAsync(householdId, User.GetUserId(), recurringExpenseId, request, ct)));

    [HttpPost("{recurringExpenseId:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid householdId, Guid recurringExpenseId, CancellationToken ct)
    {
        await recurringExpenseService.DeactivateAsync(householdId, User.GetUserId(), recurringExpenseId, ct);
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}/periods/{periodId:guid}/budget")]
public sealed class BudgetsController(IBudgetService budgetService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<BudgetSummaryDto>>> Get(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<BudgetSummaryDto>.Ok(await budgetService.GetAsync(householdId, periodId, User.GetUserId(), ct)));

    [HttpPost]
    [HttpPut]
    public async Task<ActionResult<ApiResponse<BudgetSummaryDto>>> Upsert(Guid householdId, Guid periodId, [FromBody] UpsertBudgetRequest request, CancellationToken ct) =>
        Ok(ApiResponse<BudgetSummaryDto>.Ok(await budgetService.UpsertAsync(householdId, periodId, User.GetUserId(), request, ct)));

    [HttpPost("generate-from-recurring")]
    public async Task<ActionResult<ApiResponse<BudgetSummaryDto>>> GenerateFromRecurring(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<BudgetSummaryDto>.Ok(await budgetService.GenerateFromRecurringAsync(householdId, periodId, User.GetUserId(), ct)));
}

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}")]
public sealed class ExpensesController(IExpenseService expenseService) : ControllerBase
{
    [HttpGet("periods/{periodId:guid}/expenses")]
    public async Task<ActionResult<ApiResponse<PagedResult<ExpenseDto>>>> GetExpenses(Guid householdId, Guid periodId, [FromQuery] ExpenseFilterRequest filter, CancellationToken ct) =>
        Ok(ApiResponse<PagedResult<ExpenseDto>>.Ok(await expenseService.GetExpensesAsync(householdId, periodId, User.GetUserId(), filter, ct)));

    [HttpPost("periods/{periodId:guid}/expenses")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Create(Guid householdId, Guid periodId, [FromBody] CreateExpenseRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseDto>.Ok(await expenseService.CreateAsync(householdId, periodId, User.GetUserId(), request, ct)));

    [HttpGet("expenses/{expenseId:guid}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> GetById(Guid householdId, Guid expenseId, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseDto>.Ok(await expenseService.GetByIdAsync(householdId, expenseId, User.GetUserId(), ct)));

    [HttpPut("expenses/{expenseId:guid}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Update(Guid householdId, Guid expenseId, [FromBody] UpdateExpenseRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseDto>.Ok(await expenseService.UpdateAsync(householdId, expenseId, User.GetUserId(), request, ct)));

    [HttpPost("expenses/{expenseId:guid}/confirm")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Confirm(Guid householdId, Guid expenseId, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseDto>.Ok(await expenseService.ConfirmAsync(householdId, expenseId, User.GetUserId(), ct)));

    [HttpPost("expenses/{expenseId:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> Cancel(Guid householdId, Guid expenseId, [FromBody] CancelExpenseRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ExpenseDto>.Ok(await expenseService.CancelAsync(householdId, expenseId, User.GetUserId(), request, ct)));
}

[Authorize]
[ApiController]
[Route("api/households/{householdId:guid}")]
public sealed class ReportsController(IDashboardService dashboardService, IReportService reportService) : ControllerBase
{
    [HttpGet("periods/{periodId:guid}/dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> Dashboard(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<DashboardDto>.Ok(await dashboardService.GetDashboardAsync(householdId, periodId, User.GetUserId(), ct)));

    [HttpGet("periods/{periodId:guid}/reports/budget-vs-actual")]
    public async Task<ActionResult<ApiResponse<BudgetVsActualReportDto>>> BudgetVsActual(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<BudgetVsActualReportDto>.Ok(await reportService.GetBudgetVsActualAsync(householdId, periodId, User.GetUserId(), ct)));

    [HttpGet("periods/{periodId:guid}/reports/by-category")]
    public async Task<ActionResult<ApiResponse<CategoryReportDto>>> ByCategory(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<CategoryReportDto>.Ok(await reportService.GetByCategoryAsync(householdId, periodId, User.GetUserId(), ct)));

    [HttpGet("periods/{periodId:guid}/reports/cash-flow")]
    public async Task<ActionResult<ApiResponse<CashFlowReportDto>>> CashFlow(Guid householdId, Guid periodId, CancellationToken ct) =>
        Ok(ApiResponse<CashFlowReportDto>.Ok(await reportService.GetCashFlowAsync(householdId, periodId, User.GetUserId(), ct)));

    [HttpGet("reports/monthly-comparison")]
    public async Task<ActionResult<ApiResponse<MonthlyComparisonReportDto>>> MonthlyComparison(Guid householdId, [FromQuery] int months = 6, CancellationToken ct = default) =>
        Ok(ApiResponse<MonthlyComparisonReportDto>.Ok(await reportService.GetMonthlyComparisonAsync(householdId, User.GetUserId(), months, ct)));
}
