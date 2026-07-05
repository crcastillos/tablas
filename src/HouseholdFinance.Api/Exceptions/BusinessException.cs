namespace HouseholdFinance.Api.Exceptions;

public class BusinessException : Exception
{
    public int StatusCode { get; }

    public BusinessException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}

public sealed class NotFoundException : BusinessException
{
    public NotFoundException(string message) : base(message, 404) { }
}

public sealed class ForbiddenException : BusinessException
{
    public ForbiddenException(string message) : base(message, 403) { }
}

public sealed class ConflictException : BusinessException
{
    public ConflictException(string message) : base(message, 409) { }
}

public sealed class UnauthorizedBusinessException : BusinessException
{
    public UnauthorizedBusinessException(string message) : base(message, 401) { }
}
