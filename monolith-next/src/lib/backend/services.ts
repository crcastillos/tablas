import crypto from "crypto";

import sql from "mssql";

import { createJwtToken } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/passwordHasher";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/http/errors";
import { runExecute, runQuery, asDateOnly, toBase64, type SqlParam } from "@/lib/sql/db";

type HouseholdRole = 0 | 1;
type PeriodStatus = 0 | 1 | 2;
type IncomeStatus = 0 | 1 | 2;
type ExpenseStatus = 0 | 1 | 2;

const OWNER_ROLE: HouseholdRole = 0;
const CLOSED_PERIOD: PeriodStatus = 2;

function toUtcNow() {
  return new Date();
}

function normalizeEmail(email: string): string {
  return email.trim().toUpperCase();
}

function requirePositiveAmount(amount: number, message = "El monto debe ser mayor que cero."): void {
  if (!(amount > 0)) {
    throw new BadRequestError(message);
  }
}

async function getMembership(householdId: string, userId: string) {
  const memberships = await runQuery<{
    id: string;
    role: HouseholdRole;
    canManageMembers: boolean;
    canManagePeriods: boolean;
    isActive: boolean;
  }>(
    `SELECT TOP (1)
      Id AS id,
      Role AS role,
      CanManageMembers AS canManageMembers,
      CanManagePeriods AS canManagePeriods,
      IsActive AS isActive
     FROM HouseholdMembers
     WHERE HouseholdId = @householdId AND UserId = @userId`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "userId", type: sql.NVarChar(450), value: userId },
    ],
  );
  const membership = memberships[0];
  if (!membership || !membership.isActive) {
    throw new ForbiddenError("No pertenece a este hogar.");
  }
  return membership;
}

async function requireOwner(householdId: string, userId: string): Promise<void> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== OWNER_ROLE) {
    throw new ForbiddenError("Se requiere rol de propietario.");
  }
}

async function requireManageMembers(householdId: string, userId: string): Promise<void> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== OWNER_ROLE && !membership.canManageMembers) {
    throw new ForbiddenError("No tiene permiso para administrar integrantes.");
  }
}

async function requireManagePeriods(householdId: string, userId: string): Promise<void> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== OWNER_ROLE && !membership.canManagePeriods) {
    throw new ForbiddenError("No tiene permiso para administrar períodos.");
  }
}

async function requirePeriod(householdId: string, periodId: string) {
  const periods = await runQuery<{
    id: string;
    householdId: string;
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
    status: PeriodStatus;
    createdAtUtc: Date;
    closedAtUtc: Date | null;
  }>(
    `SELECT TOP (1)
      Id AS id,
      HouseholdId AS householdId,
      [Year] AS [year],
      [Month] AS [month],
      StartDate AS startDate,
      EndDate AS endDate,
      Status AS status,
      CreatedAtUtc AS createdAtUtc,
      ClosedAtUtc AS closedAtUtc
     FROM FinancialPeriods
     WHERE Id = @periodId AND HouseholdId = @householdId`,
    [
      { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const period = periods[0];
  if (!period) {
    throw new NotFoundError("Período no encontrado.");
  }
  return period;
}

async function requireOpenPeriod(householdId: string, periodId: string) {
  const period = await requirePeriod(householdId, periodId);
  if (period.status === CLOSED_PERIOD) {
    throw new ConflictError("El período está cerrado y es de solo lectura.");
  }
  return period;
}

async function getUserProfile(userId: string) {
  const users = await runQuery<{ id: string; email: string; displayName: string }>(
    `SELECT TOP (1) Id AS id, Email AS email, DisplayName AS displayName
     FROM AspNetUsers
     WHERE Id = @userId`,
    [{ name: "userId", type: sql.NVarChar(450), value: userId }],
  );
  const user = users[0];
  if (!user) {
    throw new NotFoundError("Usuario no encontrado.");
  }
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
  };
}

export async function getProfile(userId: string) {
  return getUserProfile(userId);
}

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function calcConsumedPercentage(budgeted: number, spent: number): number {
  if (budgeted <= 0) {
    return spent > 0 ? 100 : 0;
  }
  return Math.round((spent / budgeted) * 10000) / 100;
}

export async function register(payload: { email: string; password: string; displayName: string }) {
  if (!payload.email?.trim() || !payload.password?.trim() || !payload.displayName?.trim()) {
    throw new BadRequestError("Datos de registro incompletos.");
  }
  if (payload.password.length < 8) {
    throw new BadRequestError("La contraseña debe tener al menos 8 caracteres.");
  }

  const existingUsers = await runQuery<{ id: string }>(
    `SELECT TOP (1) Id AS id FROM AspNetUsers WHERE NormalizedEmail = @normalizedEmail`,
    [{ name: "normalizedEmail", type: sql.NVarChar(256), value: normalizeEmail(payload.email) }],
  );
  if (existingUsers.length > 0) {
    throw new ConflictError("El correo ya está registrado.");
  }

  const id = crypto.randomUUID();
  const now = toUtcNow();
  await runExecute(
    `INSERT INTO AspNetUsers
      (Id, DisplayName, CreatedAtUtc, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
       PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled,
       AccessFailedCount)
     VALUES
      (@id, @displayName, @createdAtUtc, @userName, @normalizedUserName, @email, @normalizedEmail, 1,
       @passwordHash, @securityStamp, @concurrencyStamp, 0, 0, 1, 0)`,
    [
      { name: "id", type: sql.NVarChar(450), value: id },
      { name: "displayName", type: sql.NVarChar(sql.MAX), value: payload.displayName.trim() },
      { name: "createdAtUtc", type: sql.DateTime2, value: now },
      { name: "userName", type: sql.NVarChar(256), value: payload.email.trim() },
      { name: "normalizedUserName", type: sql.NVarChar(256), value: normalizeEmail(payload.email) },
      { name: "email", type: sql.NVarChar(256), value: payload.email.trim() },
      { name: "normalizedEmail", type: sql.NVarChar(256), value: normalizeEmail(payload.email) },
      { name: "passwordHash", type: sql.NVarChar(sql.MAX), value: hashPassword(payload.password) },
      { name: "securityStamp", type: sql.NVarChar(sql.MAX), value: crypto.randomUUID() },
      { name: "concurrencyStamp", type: sql.NVarChar(sql.MAX), value: crypto.randomUUID() },
    ],
  );

  const tokenResult = createJwtToken(id, payload.email.trim());
  return {
    token: tokenResult.token,
    expiresAtUtc: tokenResult.expiresAtUtc,
    user: await getUserProfile(id),
  };
}

export async function login(payload: { email: string; password: string }) {
  const users = await runQuery<{
    id: string;
    email: string;
    passwordHash: string;
    lockoutEnd: Date | null;
    accessFailedCount: number;
  }>(
    `SELECT TOP (1)
      Id AS id,
      Email AS email,
      PasswordHash AS passwordHash,
      LockoutEnd AS lockoutEnd,
      AccessFailedCount AS accessFailedCount
     FROM AspNetUsers
     WHERE NormalizedEmail = @normalizedEmail`,
    [{ name: "normalizedEmail", type: sql.NVarChar(256), value: normalizeEmail(payload.email) }],
  );
  const user = users[0];
  if (!user) {
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  if (user.lockoutEnd && new Date(user.lockoutEnd).getTime() > Date.now()) {
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  const validPassword = user.passwordHash ? verifyPassword(payload.password, user.passwordHash) : false;
  if (!validPassword) {
    const failedCount = (user.accessFailedCount ?? 0) + 1;
    const lockoutEnd = failedCount >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
    await runExecute(
      `UPDATE AspNetUsers
       SET AccessFailedCount = @failedCount, LockoutEnd = @lockoutEnd
       WHERE Id = @id`,
      [
        { name: "failedCount", type: sql.Int, value: failedCount },
        { name: "lockoutEnd", type: sql.DateTimeOffset, value: lockoutEnd },
        { name: "id", type: sql.NVarChar(450), value: user.id },
      ],
    );
    throw new UnauthorizedError("Credenciales inválidas.");
  }

  await runExecute(
    `UPDATE AspNetUsers
     SET AccessFailedCount = 0, LockoutEnd = NULL
     WHERE Id = @id`,
    [{ name: "id", type: sql.NVarChar(450), value: user.id }],
  );

  const tokenResult = createJwtToken(user.id, user.email ?? payload.email);
  return {
    token: tokenResult.token,
    expiresAtUtc: tokenResult.expiresAtUtc,
    user: await getUserProfile(user.id),
  };
}

export async function listHouseholds(userId: string) {
  return runQuery(
    `SELECT
      h.Id AS id,
      h.Name AS name,
      h.Description AS description,
      h.CurrencyCode AS currencyCode,
      h.TimeZoneId AS timeZoneId,
      m.Role AS role
     FROM HouseholdMembers m
     INNER JOIN Households h ON h.Id = m.HouseholdId
     WHERE m.UserId = @userId AND m.IsActive = 1
     ORDER BY h.Name ASC`,
    [{ name: "userId", type: sql.NVarChar(450), value: userId }],
  );
}

export async function createHousehold(userId: string, payload: { name: string; description?: string }) {
  const householdId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const now = toUtcNow();
  await runExecute(
    `INSERT INTO Households (Id, Name, Description, CurrencyCode, TimeZoneId, CreatedAtUtc)
     VALUES (@id, @name, @description, 'USD', 'America/El_Salvador', @createdAtUtc);
     INSERT INTO HouseholdMembers
      (Id, HouseholdId, UserId, Role, CanManageMembers, CanManagePeriods, IsActive, JoinedAtUtc)
     VALUES
      (@memberId, @id, @userId, 0, 1, 1, 1, @createdAtUtc);`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: householdId },
      { name: "name", type: sql.NVarChar(120), value: payload.name.trim() },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description?.trim() ?? null },
      { name: "memberId", type: sql.UniqueIdentifier, value: memberId },
      { name: "userId", type: sql.NVarChar(450), value: userId },
      { name: "createdAtUtc", type: sql.DateTime2, value: now },
    ],
  );
  const rows = await runQuery(
    `SELECT TOP (1)
      Id AS id, Name AS name, Description AS description, CurrencyCode AS currencyCode, TimeZoneId AS timeZoneId, CAST(0 AS int) AS role
     FROM Households WHERE Id = @id`,
    [{ name: "id", type: sql.UniqueIdentifier, value: householdId }],
  );
  return rows[0];
}

export async function getHousehold(householdId: string, userId: string) {
  const membership = await getMembership(householdId, userId);
  const rows = await runQuery(
    `SELECT TOP (1)
      Id AS id, Name AS name, Description AS description, CurrencyCode AS currencyCode, TimeZoneId AS timeZoneId
     FROM Households WHERE Id = @id`,
    [{ name: "id", type: sql.UniqueIdentifier, value: householdId }],
  );
  if (!rows[0]) {
    throw new NotFoundError("Hogar no encontrado.");
  }
  return {
    ...rows[0],
    role: membership.role,
  };
}

export async function updateHousehold(householdId: string, userId: string, payload: { name: string; description?: string }) {
  await getMembership(householdId, userId);
  await runExecute(
    `UPDATE Households
     SET Name = @name, Description = @description, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @id`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: householdId },
      { name: "name", type: sql.NVarChar(120), value: payload.name.trim() },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description?.trim() ?? null },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  return getHousehold(householdId, userId);
}

export async function listMembers(householdId: string, userId: string) {
  await getMembership(householdId, userId);
  return runQuery(
    `SELECT
      m.Id AS id,
      m.UserId AS userId,
      u.Email AS email,
      u.DisplayName AS displayName,
      m.Role AS role,
      m.CanManageMembers AS canManageMembers,
      m.CanManagePeriods AS canManagePeriods,
      m.IsActive AS isActive
     FROM HouseholdMembers m
     INNER JOIN AspNetUsers u ON u.Id = m.UserId
     WHERE m.HouseholdId = @householdId
     ORDER BY m.Role ASC, u.DisplayName ASC`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );
}

export async function addMember(
  householdId: string,
  userId: string,
  payload: { email: string; role: HouseholdRole; canManageMembers: boolean; canManagePeriods: boolean },
) {
  await requireManageMembers(householdId, userId);
  const targets = await runQuery<{ id: string; email: string; displayName: string }>(
    `SELECT TOP (1) Id AS id, Email AS email, DisplayName AS displayName
     FROM AspNetUsers
     WHERE NormalizedEmail = @email`,
    [{ name: "email", type: sql.NVarChar(256), value: normalizeEmail(payload.email) }],
  );
  const target = targets[0];
  if (!target) {
    throw new NotFoundError("Usuario no encontrado.");
  }

  const existing = await runQuery<{ id: string }>(
    `SELECT TOP (1) Id AS id
     FROM HouseholdMembers
     WHERE HouseholdId = @householdId AND UserId = @targetUserId`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "targetUserId", type: sql.NVarChar(450), value: target.id },
    ],
  );
  if (existing.length > 0) {
    throw new ConflictError("El usuario ya es miembro del hogar.");
  }

  const memberId = crypto.randomUUID();
  const isOwner = payload.role === OWNER_ROLE;
  await runExecute(
    `INSERT INTO HouseholdMembers
      (Id, HouseholdId, UserId, Role, CanManageMembers, CanManagePeriods, IsActive, JoinedAtUtc)
     VALUES
      (@id, @householdId, @targetUserId, @role, @canManageMembers, @canManagePeriods, 1, @joinedAtUtc)`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: memberId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "targetUserId", type: sql.NVarChar(450), value: target.id },
      { name: "role", type: sql.Int, value: payload.role },
      { name: "canManageMembers", type: sql.Bit, value: isOwner || payload.canManageMembers },
      { name: "canManagePeriods", type: sql.Bit, value: isOwner || payload.canManagePeriods },
      { name: "joinedAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );

  return {
    id: memberId,
    userId: target.id,
    email: target.email ?? "",
    displayName: target.displayName ?? "",
    role: payload.role,
    canManageMembers: isOwner || payload.canManageMembers,
    canManagePeriods: isOwner || payload.canManagePeriods,
    isActive: true,
  };
}

export async function removeMember(householdId: string, userId: string, memberId: string) {
  await requireManageMembers(householdId, userId);
  const members = await runQuery<{ id: string; userId: string; role: HouseholdRole }>(
    `SELECT TOP (1) Id AS id, UserId AS userId, Role AS role
     FROM HouseholdMembers
     WHERE HouseholdId = @householdId AND Id = @memberId`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "memberId", type: sql.UniqueIdentifier, value: memberId },
    ],
  );
  const member = members[0];
  if (!member) {
    throw new NotFoundError("Miembro no encontrado.");
  }
  if (member.userId === userId) {
    throw new BadRequestError("No puede eliminarse a sí mismo como propietario.");
  }
  if (member.role === OWNER_ROLE) {
    const owners = await runQuery<{ count: number }>(
      `SELECT COUNT(1) AS count
       FROM HouseholdMembers
       WHERE HouseholdId = @householdId AND Role = 0 AND IsActive = 1 AND Id <> @memberId`,
      [
        { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
        { name: "memberId", type: sql.UniqueIdentifier, value: memberId },
      ],
    );
    if ((owners[0]?.count ?? 0) < 1) {
      throw new ConflictError("Debe existir al menos un propietario activo.");
    }
  }
  await runExecute(`DELETE FROM HouseholdMembers WHERE Id = @memberId`, [{ name: "memberId", type: sql.UniqueIdentifier, value: memberId }]);
}

export async function updateMember(
  householdId: string,
  userId: string,
  memberId: string,
  payload: { role: HouseholdRole; canManageMembers: boolean; canManagePeriods: boolean; isActive: boolean },
) {
  await requireManageMembers(householdId, userId);
  const existing = await runQuery<{ id: string; userId: string; email: string; displayName: string }>(
    `SELECT TOP (1) m.Id AS id, m.UserId AS userId, u.Email AS email, u.DisplayName AS displayName
     FROM HouseholdMembers m
     INNER JOIN AspNetUsers u ON u.Id = m.UserId
     WHERE m.Id = @memberId AND m.HouseholdId = @householdId`,
    [
      { name: "memberId", type: sql.UniqueIdentifier, value: memberId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const row = existing[0];
  if (!row) {
    throw new NotFoundError("Miembro no encontrado.");
  }
  const isOwner = payload.role === OWNER_ROLE;
  await runExecute(
    `UPDATE HouseholdMembers
     SET Role = @role, CanManageMembers = @canManageMembers, CanManagePeriods = @canManagePeriods, IsActive = @isActive
     WHERE Id = @memberId`,
    [
      { name: "role", type: sql.Int, value: payload.role },
      { name: "canManageMembers", type: sql.Bit, value: isOwner || payload.canManageMembers },
      { name: "canManagePeriods", type: sql.Bit, value: isOwner || payload.canManagePeriods },
      { name: "isActive", type: sql.Bit, value: payload.isActive },
      { name: "memberId", type: sql.UniqueIdentifier, value: memberId },
    ],
  );
  return {
    id: row.id,
    userId: row.userId,
    email: row.email ?? "",
    displayName: row.displayName ?? "",
    role: payload.role,
    canManageMembers: isOwner || payload.canManageMembers,
    canManagePeriods: isOwner || payload.canManagePeriods,
    isActive: payload.isActive,
  };
}

export async function listPeriods(householdId: string, userId: string) {
  await getMembership(householdId, userId);
  const rows = await runQuery<{
    id: string;
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
    status: number;
    createdAtUtc: Date;
    closedAtUtc: Date | null;
  }>(
    `SELECT Id AS id, [Year] AS [year], [Month] AS [month], StartDate AS startDate, EndDate AS endDate,
      Status AS status, CreatedAtUtc AS createdAtUtc, ClosedAtUtc AS closedAtUtc
     FROM FinancialPeriods
     WHERE HouseholdId = @householdId
     ORDER BY [Year] DESC, [Month] DESC`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );
  return rows.map((row) => ({
    ...row,
    startDate: asDateOnly(row.startDate),
    endDate: asDateOnly(row.endDate),
    createdAtUtc: row.createdAtUtc.toISOString(),
    closedAtUtc: row.closedAtUtc?.toISOString() ?? null,
  }));
}

export async function createPeriod(householdId: string, userId: string, payload: { year: number; month: number }) {
  await requireManagePeriods(householdId, userId);
  if (payload.month < 1 || payload.month > 12) {
    throw new BadRequestError("Mes inválido.");
  }
  const exists = await runQuery<{ id: string }>(
    `SELECT TOP (1) Id AS id
     FROM FinancialPeriods
     WHERE HouseholdId = @householdId AND [Year] = @year AND [Month] = @month`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "year", type: sql.Int, value: payload.year },
      { name: "month", type: sql.Int, value: payload.month },
    ],
  );
  if (exists.length > 0) {
    throw new ConflictError("Ya existe un período para ese año y mes.");
  }
  const id = crypto.randomUUID();
  const range = monthRange(payload.year, payload.month);
  await runExecute(
    `INSERT INTO FinancialPeriods
      (Id, HouseholdId, [Year], [Month], StartDate, EndDate, Status, CreatedAtUtc)
     VALUES
      (@id, @householdId, @year, @month, @startDate, @endDate, 1, @createdAtUtc)`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: id },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "year", type: sql.Int, value: payload.year },
      { name: "month", type: sql.Int, value: payload.month },
      { name: "startDate", type: sql.Date, value: new Date(range.start) },
      { name: "endDate", type: sql.Date, value: new Date(range.end) },
      { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  const periods = await listPeriods(householdId, userId);
  return periods.find((period) => period.id === id)!;
}

export async function getPeriodById(householdId: string, periodId: string, userId: string) {
  await getMembership(householdId, userId);
  const period = await requirePeriod(householdId, periodId);
  return {
    id: period.id,
    year: period.year,
    month: period.month,
    startDate: asDateOnly(period.startDate),
    endDate: asDateOnly(period.endDate),
    status: period.status,
    createdAtUtc: period.createdAtUtc.toISOString(),
    closedAtUtc: period.closedAtUtc?.toISOString() ?? null,
  };
}

export async function closePeriod(householdId: string, periodId: string, userId: string) {
  await requireManagePeriods(householdId, userId);
  const period = await requirePeriod(householdId, periodId);
  if (period.status === CLOSED_PERIOD) {
    throw new ConflictError("El período ya está cerrado.");
  }
  await runExecute(
    `UPDATE FinancialPeriods
     SET Status = 2, ClosedAtUtc = @closedAtUtc, ClosedByUserId = @userId, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @periodId`,
    [
      { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
      { name: "closedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "userId", type: sql.NVarChar(sql.MAX), value: userId },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  const periods = await listPeriods(householdId, userId);
  return periods.find((item) => item.id === periodId)!;
}

export async function reopenPeriod(householdId: string, periodId: string, userId: string) {
  await requireManagePeriods(householdId, userId);
  const period = await requirePeriod(householdId, periodId);
  if (period.status !== CLOSED_PERIOD) {
    throw new ConflictError("Solo se pueden reabrir períodos cerrados.");
  }
  await runExecute(
    `UPDATE FinancialPeriods
     SET Status = 1, ClosedAtUtc = NULL, ClosedByUserId = NULL, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @periodId`,
    [
      { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  const periods = await listPeriods(householdId, userId);
  return periods.find((item) => item.id === periodId)!;
}

export async function getIncomeTypes(userId: string) {
  if (!userId) throw new UnauthorizedError("No se pudo identificar al usuario.");
  return runQuery(
    `SELECT Id AS id, Code AS code, Name AS name
     FROM IncomeTypes
     WHERE IsActive = 1
     ORDER BY SortOrder ASC`,
  );
}

export async function listIncomes(householdId: string, periodId: string, userId: string) {
  await getMembership(householdId, userId);
  await requirePeriod(householdId, periodId);
  const rows = await runQuery<{
    id: string;
    incomeTypeId: number;
    incomeTypeName: string;
    description: string;
    estimatedAmount: number;
    receivedAmount: number;
    expectedDate: Date | null;
    receivedDate: Date | null;
    sourcePerson: string | null;
    isRecurring: boolean;
    status: IncomeStatus;
    notes: string | null;
  }>(
    `SELECT
      i.Id AS id, i.IncomeTypeId AS incomeTypeId, t.Name AS incomeTypeName, i.Description AS description,
      i.EstimatedAmount AS estimatedAmount, i.ReceivedAmount AS receivedAmount, i.ExpectedDate AS expectedDate,
      i.ReceivedDate AS receivedDate, i.SourcePerson AS sourcePerson, i.IsRecurring AS isRecurring,
      i.Status AS status, i.Notes AS notes
     FROM Incomes i
     INNER JOIN IncomeTypes t ON t.Id = i.IncomeTypeId
     WHERE i.HouseholdId = @householdId AND i.PeriodId = @periodId
     ORDER BY i.CreatedAtUtc DESC`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
    ],
  );
  return rows.map((row) => ({
    ...row,
    expectedDate: asDateOnly(row.expectedDate),
    receivedDate: asDateOnly(row.receivedDate),
  }));
}

export async function createIncome(
  householdId: string,
  periodId: string,
  userId: string,
  payload: {
    incomeTypeId: number;
    description: string;
    estimatedAmount: number;
    expectedDate?: string | null;
    sourcePerson?: string | null;
    isRecurring?: boolean;
    notes?: string | null;
  },
) {
  await getMembership(householdId, userId);
  await requireOpenPeriod(householdId, periodId);
  requirePositiveAmount(payload.estimatedAmount);
  const id = crypto.randomUUID();
  await runExecute(
    `INSERT INTO Incomes
      (Id, HouseholdId, PeriodId, IncomeTypeId, Description, EstimatedAmount, ReceivedAmount, ExpectedDate,
       SourcePerson, IsRecurring, Status, Notes, CreatedByUserId, CreatedAtUtc)
     VALUES
      (@id, @householdId, @periodId, @incomeTypeId, @description, @estimatedAmount, 0, @expectedDate,
       @sourcePerson, @isRecurring, 0, @notes, @createdByUserId, @createdAtUtc)`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: id },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
      { name: "incomeTypeId", type: sql.Int, value: payload.incomeTypeId },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description.trim() },
      { name: "estimatedAmount", type: sql.Decimal(18, 2), value: payload.estimatedAmount },
      { name: "expectedDate", type: sql.Date, value: payload.expectedDate ? new Date(payload.expectedDate) : null },
      { name: "sourcePerson", type: sql.NVarChar(sql.MAX), value: payload.sourcePerson?.trim() ?? null },
      { name: "isRecurring", type: sql.Bit, value: payload.isRecurring ?? false },
      { name: "notes", type: sql.NVarChar(sql.MAX), value: payload.notes?.trim() ?? null },
      { name: "createdByUserId", type: sql.NVarChar(sql.MAX), value: userId },
      { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  const incomes = await listIncomes(householdId, periodId, userId);
  return incomes.find((income) => income.id === id)!;
}

export async function receiveIncome(
  householdId: string,
  incomeId: string,
  userId: string,
  payload: { receivedAmount: number; receivedDate: string },
) {
  await getMembership(householdId, userId);
  requirePositiveAmount(payload.receivedAmount);
  const incomes = await runQuery<{ id: string; periodId: string }>(
    `SELECT TOP (1) Id AS id, PeriodId AS periodId
     FROM Incomes
     WHERE Id = @incomeId AND HouseholdId = @householdId`,
    [
      { name: "incomeId", type: sql.UniqueIdentifier, value: incomeId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const income = incomes[0];
  if (!income) throw new NotFoundError("Ingreso no encontrado.");
  await requireOpenPeriod(householdId, income.periodId);
  await runExecute(
    `UPDATE Incomes
     SET ReceivedAmount = @receivedAmount, ReceivedDate = @receivedDate, Status = 1, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @incomeId`,
    [
      { name: "receivedAmount", type: sql.Decimal(18, 2), value: payload.receivedAmount },
      { name: "receivedDate", type: sql.Date, value: new Date(payload.receivedDate) },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "incomeId", type: sql.UniqueIdentifier, value: incomeId },
    ],
  );
  const items = await listIncomes(householdId, income.periodId, userId);
  return items.find((item) => item.id === incomeId)!;
}

export async function updateIncome(
  householdId: string,
  incomeId: string,
  userId: string,
  payload: {
    incomeTypeId: number;
    description: string;
    estimatedAmount: number;
    expectedDate?: string | null;
    sourcePerson?: string | null;
    isRecurring?: boolean;
    notes?: string | null;
  },
) {
  await getMembership(householdId, userId);
  requirePositiveAmount(payload.estimatedAmount);
  const rows = await runQuery<{ periodId: string; status: IncomeStatus }>(
    `SELECT TOP (1) PeriodId AS periodId, Status AS status
     FROM Incomes
     WHERE Id = @incomeId AND HouseholdId = @householdId`,
    [
      { name: "incomeId", type: sql.UniqueIdentifier, value: incomeId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const income = rows[0];
  if (!income) throw new NotFoundError("Ingreso no encontrado.");
  if (income.status === 2) throw new ConflictError("No se puede editar un ingreso anulado.");
  await requireOpenPeriod(householdId, income.periodId);
  await runExecute(
    `UPDATE Incomes
     SET IncomeTypeId = @incomeTypeId, Description = @description, EstimatedAmount = @estimatedAmount,
      ExpectedDate = @expectedDate, SourcePerson = @sourcePerson, IsRecurring = @isRecurring, Notes = @notes, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @incomeId`,
    [
      { name: "incomeTypeId", type: sql.Int, value: payload.incomeTypeId },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description.trim() },
      { name: "estimatedAmount", type: sql.Decimal(18, 2), value: payload.estimatedAmount },
      { name: "expectedDate", type: sql.Date, value: payload.expectedDate ? new Date(payload.expectedDate) : null },
      { name: "sourcePerson", type: sql.NVarChar(sql.MAX), value: payload.sourcePerson?.trim() ?? null },
      { name: "isRecurring", type: sql.Bit, value: payload.isRecurring ?? false },
      { name: "notes", type: sql.NVarChar(sql.MAX), value: payload.notes?.trim() ?? null },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "incomeId", type: sql.UniqueIdentifier, value: incomeId },
    ],
  );
  const items = await listIncomes(householdId, income.periodId, userId);
  return items.find((item) => item.id === incomeId)!;
}

export async function cancelIncome(householdId: string, incomeId: string, userId: string, payload: { reason: string }) {
  await getMembership(householdId, userId);
  if (!payload.reason?.trim()) throw new BadRequestError("Se requiere motivo de anulación.");
  const rows = await runQuery<{ periodId: string }>(
    `SELECT TOP (1) PeriodId AS periodId
     FROM Incomes
     WHERE Id = @incomeId AND HouseholdId = @householdId`,
    [
      { name: "incomeId", type: sql.UniqueIdentifier, value: incomeId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const income = rows[0];
  if (!income) throw new NotFoundError("Ingreso no encontrado.");
  await requireOpenPeriod(householdId, income.periodId);
  await runExecute(
    `UPDATE Incomes
     SET Status = 2, CancellationReason = @reason, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @incomeId`,
    [
      { name: "reason", type: sql.NVarChar(sql.MAX), value: payload.reason.trim() },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "incomeId", type: sql.UniqueIdentifier, value: incomeId },
    ],
  );
  const items = await listIncomes(householdId, income.periodId, userId);
  return items.find((item) => item.id === incomeId)!;
}

export async function listCategories(householdId: string, userId: string) {
  await getMembership(householdId, userId);
  return runQuery<{
    id: string;
    name: string;
    description: string | null;
    categoryType: number;
    icon: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    isDefault: boolean;
  }>(
    `SELECT Id AS id, Name AS name, Description AS description, CategoryType AS categoryType,
      Icon AS icon, Color AS color, SortOrder AS sortOrder, IsActive AS isActive, IsDefault AS isDefault
     FROM ExpenseCategories
     WHERE HouseholdId = @householdId
     ORDER BY SortOrder ASC`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );
}

export async function createCategory(
  householdId: string,
  userId: string,
  payload: { name: string; description?: string; categoryType: number; icon: string; color: string },
) {
  await requireOwner(householdId, userId);
  const exists = await runQuery<{ id: string }>(
    `SELECT TOP (1) Id AS id FROM ExpenseCategories WHERE HouseholdId = @householdId AND Name = @name`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "name", type: sql.NVarChar(120), value: payload.name.trim() },
    ],
  );
  if (exists.length > 0) {
    throw new ConflictError("Ya existe una categoría con ese nombre.");
  }
  const counts = await runQuery<{ count: number }>(
    `SELECT COUNT(1) AS count FROM ExpenseCategories WHERE HouseholdId = @householdId`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );
  const id = crypto.randomUUID();
  await runExecute(
    `INSERT INTO ExpenseCategories
      (Id, HouseholdId, Name, Description, CategoryType, Icon, Color, SortOrder, IsActive, IsDefault, CreatedAtUtc)
     VALUES
      (@id, @householdId, @name, @description, @categoryType, @icon, @color, @sortOrder, 1, 0, @createdAtUtc)`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: id },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "name", type: sql.NVarChar(120), value: payload.name.trim() },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description?.trim() ?? null },
      { name: "categoryType", type: sql.Int, value: payload.categoryType },
      { name: "icon", type: sql.NVarChar(sql.MAX), value: payload.icon },
      { name: "color", type: sql.NVarChar(sql.MAX), value: payload.color },
      { name: "sortOrder", type: sql.Int, value: (counts[0]?.count ?? 0) + 1 },
      { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  const categories = await listCategories(householdId, userId);
  return categories.find((category) => category.id === id)!;
}

export async function updateCategory(
  householdId: string,
  categoryId: string,
  userId: string,
  payload: { name: string; description?: string; categoryType: number; icon: string; color: string },
) {
  await requireOwner(householdId, userId);
  const exists = await runQuery<{ id: string }>(
    `SELECT TOP (1) Id AS id FROM ExpenseCategories WHERE Id = @categoryId AND HouseholdId = @householdId`,
    [
      { name: "categoryId", type: sql.UniqueIdentifier, value: categoryId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  if (!exists[0]) throw new NotFoundError("Categoría no encontrada.");
  await runExecute(
    `UPDATE ExpenseCategories
     SET Name = @name, Description = @description, CategoryType = @categoryType, Icon = @icon, Color = @color
     WHERE Id = @categoryId`,
    [
      { name: "name", type: sql.NVarChar(120), value: payload.name.trim() },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description?.trim() ?? null },
      { name: "categoryType", type: sql.Int, value: payload.categoryType },
      { name: "icon", type: sql.NVarChar(sql.MAX), value: payload.icon },
      { name: "color", type: sql.NVarChar(sql.MAX), value: payload.color },
      { name: "categoryId", type: sql.UniqueIdentifier, value: categoryId },
    ],
  );
  const categories = await listCategories(householdId, userId);
  return categories.find((category) => category.id === categoryId)!;
}

export async function deactivateCategory(householdId: string, categoryId: string, userId: string) {
  await requireOwner(householdId, userId);
  await runExecute(
    `UPDATE ExpenseCategories SET IsActive = 0 WHERE Id = @categoryId AND HouseholdId = @householdId`,
    [
      { name: "categoryId", type: sql.UniqueIdentifier, value: categoryId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
}

export async function listRecurringExpenses(householdId: string, userId: string) {
  await getMembership(householdId, userId);
  const rows = await runQuery<{
    id: string;
    categoryId: string;
    categoryName: string;
    name: string;
    description: string | null;
    estimatedAmount: number;
    expectedPaymentDay: number;
    frequency: number;
    startDate: Date;
    endDate: Date | null;
    provider: string | null;
    isActive: boolean;
    autoGenerateInBudget: boolean;
  }>(
    `SELECT
      r.Id AS id, r.CategoryId AS categoryId, c.Name AS categoryName, r.Name AS name, r.Description AS description,
      r.EstimatedAmount AS estimatedAmount, r.ExpectedPaymentDay AS expectedPaymentDay, r.Frequency AS frequency,
      r.StartDate AS startDate, r.EndDate AS endDate, r.Provider AS provider, r.IsActive AS isActive,
      r.AutoGenerateInBudget AS autoGenerateInBudget
     FROM RecurringExpenses r
     INNER JOIN ExpenseCategories c ON c.Id = r.CategoryId
     WHERE r.HouseholdId = @householdId
     ORDER BY r.Name ASC`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );
  return rows.map((row) => ({
    ...row,
    startDate: asDateOnly(row.startDate as Date),
    endDate: asDateOnly((row.endDate ?? null) as Date | null),
  }));
}

export async function createRecurringExpense(householdId: string, userId: string, payload: Record<string, unknown>) {
  await requireOwner(householdId, userId);
  requirePositiveAmount(Number(payload.estimatedAmount));
  const id = crypto.randomUUID();
  await runExecute(
    `INSERT INTO RecurringExpenses
      (Id, HouseholdId, CategoryId, Name, Description, EstimatedAmount, ExpectedPaymentDay, Frequency,
       StartDate, EndDate, Provider, IsActive, AutoGenerateInBudget, CreatedAtUtc)
     VALUES
      (@id, @householdId, @categoryId, @name, @description, @estimatedAmount, @expectedPaymentDay, @frequency,
       @startDate, @endDate, @provider, 1, @autoGenerateInBudget, @createdAtUtc)`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: id },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "categoryId", type: sql.UniqueIdentifier, value: String(payload.categoryId) },
      { name: "name", type: sql.NVarChar(200), value: String(payload.name ?? "").trim() },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description ? String(payload.description).trim() : null },
      { name: "estimatedAmount", type: sql.Decimal(18, 2), value: Number(payload.estimatedAmount) },
      { name: "expectedPaymentDay", type: sql.Int, value: Number(payload.expectedPaymentDay ?? 1) },
      { name: "frequency", type: sql.Int, value: Number(payload.frequency ?? 0) },
      { name: "startDate", type: sql.Date, value: new Date(String(payload.startDate)) },
      { name: "endDate", type: sql.Date, value: payload.endDate ? new Date(String(payload.endDate)) : null },
      { name: "provider", type: sql.NVarChar(sql.MAX), value: payload.provider ? String(payload.provider).trim() : null },
      { name: "autoGenerateInBudget", type: sql.Bit, value: Boolean(payload.autoGenerateInBudget ?? true) },
      { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
    ],
  );
  const recurring = await listRecurringExpenses(householdId, userId);
  return recurring.find((item) => item.id === id)!;
}

export async function updateRecurringExpense(householdId: string, recurringExpenseId: string, userId: string, payload: Record<string, unknown>) {
  await requireOwner(householdId, userId);
  await runExecute(
    `UPDATE RecurringExpenses
     SET CategoryId = @categoryId, Name = @name, Description = @description, EstimatedAmount = @estimatedAmount,
      ExpectedPaymentDay = @expectedPaymentDay, Frequency = @frequency, StartDate = @startDate, EndDate = @endDate,
      Provider = @provider, AutoGenerateInBudget = @autoGenerateInBudget
     WHERE Id = @recurringExpenseId AND HouseholdId = @householdId`,
    [
      { name: "categoryId", type: sql.UniqueIdentifier, value: String(payload.categoryId) },
      { name: "name", type: sql.NVarChar(200), value: String(payload.name ?? "").trim() },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description ? String(payload.description).trim() : null },
      { name: "estimatedAmount", type: sql.Decimal(18, 2), value: Number(payload.estimatedAmount ?? 0) },
      { name: "expectedPaymentDay", type: sql.Int, value: Number(payload.expectedPaymentDay ?? 1) },
      { name: "frequency", type: sql.Int, value: Number(payload.frequency ?? 0) },
      { name: "startDate", type: sql.Date, value: new Date(String(payload.startDate)) },
      { name: "endDate", type: sql.Date, value: payload.endDate ? new Date(String(payload.endDate)) : null },
      { name: "provider", type: sql.NVarChar(sql.MAX), value: payload.provider ? String(payload.provider).trim() : null },
      { name: "autoGenerateInBudget", type: sql.Bit, value: Boolean(payload.autoGenerateInBudget ?? true) },
      { name: "recurringExpenseId", type: sql.UniqueIdentifier, value: recurringExpenseId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const recurring = await listRecurringExpenses(householdId, userId);
  const item = recurring.find((entry) => entry.id === recurringExpenseId);
  if (!item) throw new NotFoundError("Gasto recurrente no encontrado.");
  return item;
}

export async function deactivateRecurringExpense(householdId: string, recurringExpenseId: string, userId: string) {
  await requireOwner(householdId, userId);
  await runExecute(
    `UPDATE RecurringExpenses
     SET IsActive = 0
     WHERE Id = @recurringExpenseId AND HouseholdId = @householdId`,
    [
      { name: "recurringExpenseId", type: sql.UniqueIdentifier, value: recurringExpenseId },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
}

export async function getBudgetSummary(householdId: string, periodId: string, userId: string) {
  await getMembership(householdId, userId);
  await requirePeriod(householdId, periodId);

  const [incomes, expenses, categories, budgetRows, lines] = await Promise.all([
    runQuery<{ estimatedAmount: number; receivedAmount: number; status: IncomeStatus }>(
      `SELECT EstimatedAmount AS estimatedAmount, ReceivedAmount AS receivedAmount, Status AS status
       FROM Incomes WHERE PeriodId = @periodId`,
      [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
    ),
    runQuery<{ categoryId: string; amount: number; status: ExpenseStatus }>(
      `SELECT CategoryId AS categoryId, Amount AS amount, Status AS status
       FROM Expenses WHERE PeriodId = @periodId`,
      [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
    ),
    runQuery<{ id: string; name: string; icon: string; color: string }>(
      `SELECT Id AS id, Name AS name, Icon AS icon, Color AS color
       FROM ExpenseCategories
       WHERE HouseholdId = @householdId AND IsActive = 1
       ORDER BY SortOrder ASC`,
      [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
    ),
    runQuery<{ id: string; rowVersion: Buffer | null; exceedsIncomeConfirmed: boolean }>(
      `SELECT TOP (1) Id AS id, RowVersion AS rowVersion, ExceedsIncomeConfirmed AS exceedsIncomeConfirmed
       FROM MonthlyBudgets WHERE PeriodId = @periodId`,
      [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
    ),
    runQuery<{
      id: string;
      categoryId: string;
      budgetedAmount: number;
      committedAmount: number;
      notes: string | null;
    }>(
      `SELECT l.Id AS id, l.CategoryId AS categoryId, l.BudgetedAmount AS budgetedAmount, l.CommittedAmount AS committedAmount, l.Notes AS notes
       FROM BudgetLines l
       INNER JOIN MonthlyBudgets b ON b.Id = l.MonthlyBudgetId
       WHERE b.PeriodId = @periodId`,
      [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
    ),
  ]);

  const totalEstimatedIncome = incomes.filter((item) => item.status !== 2).reduce((acc, item) => acc + Number(item.estimatedAmount), 0);
  const totalReceivedIncome = incomes.filter((item) => item.status === 1).reduce((acc, item) => acc + Number(item.receivedAmount), 0);
  const totalSpent = expenses.filter((item) => item.status === 1).reduce((acc, item) => acc + Number(item.amount), 0);
  const totalPending = expenses.filter((item) => item.status === 0).reduce((acc, item) => acc + Number(item.amount), 0);

  const budget = budgetRows[0];
  const mappedLines = categories.map((category) => {
    const budgetLine = lines.find((line) => line.categoryId === category.id);
    const spentAmount = expenses
      .filter((expense) => expense.categoryId === category.id && expense.status === 1)
      .reduce((acc, expense) => acc + Number(expense.amount), 0);
    const committedAmount =
      expenses
        .filter((expense) => expense.categoryId === category.id && expense.status === 0)
        .reduce((acc, expense) => acc + Number(expense.amount), 0) + Number(budgetLine?.committedAmount ?? 0);
    const budgetedAmount = Number(budgetLine?.budgetedAmount ?? 0);
    return {
      id: budgetLine?.id ?? "00000000-0000-0000-0000-000000000000",
      categoryId: category.id,
      categoryName: category.name,
      icon: category.icon,
      color: category.color,
      budgetedAmount,
      committedAmount,
      spentAmount,
      availableAmount: budgetedAmount - spentAmount,
      consumedPercentage: calcConsumedPercentage(budgetedAmount, spentAmount),
      notes: budgetLine?.notes ?? null,
      hasBudget: Boolean(budgetLine),
    };
  });

  const totalBudgeted = mappedLines.reduce((acc, line) => acc + line.budgetedAmount, 0);
  const assignedPercentage = totalEstimatedIncome <= 0 ? 0 : Math.round((totalBudgeted / totalEstimatedIncome) * 10000) / 100;

  return {
    totalEstimatedIncome,
    totalReceivedIncome,
    totalBudgeted,
    totalSpent,
    totalPending,
    estimatedCashBalance: totalEstimatedIncome - totalSpent,
    realCashBalance: totalReceivedIncome - totalSpent,
    budgetBalance: totalBudgeted - totalSpent,
    assignedPercentage,
    exceedsIncome: totalBudgeted > totalEstimatedIncome,
    exceedsIncomeConfirmed: budget?.exceedsIncomeConfirmed ?? false,
    rowVersion: toBase64(budget?.rowVersion),
    lines: mappedLines,
  };
}

export async function upsertBudget(householdId: string, periodId: string, userId: string, payload: Record<string, unknown>) {
  await requireOwner(householdId, userId);
  await requireOpenPeriod(householdId, periodId);
  const lines = Array.isArray(payload.lines) ? payload.lines : [];
  const confirmExceedsIncome = Boolean(payload.confirmExceedsIncome);
  for (const line of lines as Array<{ budgetedAmount: number }>) {
    if (Number(line.budgetedAmount) < 0) {
      throw new BadRequestError("No se permiten montos negativos.");
    }
  }

  const summary = await getBudgetSummary(householdId, periodId, userId);
  const requestedBudget = (lines as Array<{ budgetedAmount: number }>).reduce((acc, line) => acc + Number(line.budgetedAmount ?? 0), 0);
  if (requestedBudget > summary.totalEstimatedIncome && !confirmExceedsIncome) {
    throw new ConflictError("El presupuesto supera el ingreso estimado.");
  }

  const existingBudgetRows = await runQuery<{ id: string; rowVersion: Buffer }>(
    `SELECT TOP (1) Id AS id, RowVersion AS rowVersion
     FROM MonthlyBudgets
     WHERE PeriodId = @periodId`,
    [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
  );

  let budgetId: string;
  if (existingBudgetRows.length === 0) {
    budgetId = crypto.randomUUID();
    await runExecute(
      `INSERT INTO MonthlyBudgets (Id, PeriodId, ExceedsIncomeConfirmed, CreatedAtUtc, CreatedByUserId)
       VALUES (@id, @periodId, @exceedsIncomeConfirmed, @createdAtUtc, @createdByUserId)`,
      [
        { name: "id", type: sql.UniqueIdentifier, value: budgetId },
        { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
        { name: "exceedsIncomeConfirmed", type: sql.Bit, value: requestedBudget > summary.totalEstimatedIncome && confirmExceedsIncome },
        { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
        { name: "createdByUserId", type: sql.NVarChar(sql.MAX), value: userId },
      ],
    );
  } else {
    budgetId = existingBudgetRows[0].id;
    await runExecute(
      `DELETE FROM BudgetLines WHERE MonthlyBudgetId = @monthlyBudgetId;
       UPDATE MonthlyBudgets
       SET ExceedsIncomeConfirmed = @exceedsIncomeConfirmed, UpdatedAtUtc = @updatedAtUtc
       WHERE Id = @monthlyBudgetId`,
      [
        { name: "monthlyBudgetId", type: sql.UniqueIdentifier, value: budgetId },
        { name: "exceedsIncomeConfirmed", type: sql.Bit, value: requestedBudget > summary.totalEstimatedIncome && confirmExceedsIncome },
        { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      ],
    );
  }

  for (const line of lines as Array<{ categoryId: string; budgetedAmount: number; notes?: string }>) {
    const budgetedAmount = Number(line.budgetedAmount ?? 0);
    if (budgetedAmount <= 0) {
      continue;
    }
    await runExecute(
      `INSERT INTO BudgetLines (Id, MonthlyBudgetId, CategoryId, BudgetedAmount, CommittedAmount, Notes)
       VALUES (@id, @monthlyBudgetId, @categoryId, @budgetedAmount, 0, @notes)`,
      [
        { name: "id", type: sql.UniqueIdentifier, value: crypto.randomUUID() },
        { name: "monthlyBudgetId", type: sql.UniqueIdentifier, value: budgetId },
        { name: "categoryId", type: sql.UniqueIdentifier, value: line.categoryId },
        { name: "budgetedAmount", type: sql.Decimal(18, 2), value: budgetedAmount },
        { name: "notes", type: sql.NVarChar(sql.MAX), value: line.notes?.trim() ?? null },
      ],
    );
  }
  return getBudgetSummary(householdId, periodId, userId);
}

export async function generateBudgetFromRecurring(householdId: string, periodId: string, userId: string) {
  await requireOwner(householdId, userId);
  await requireOpenPeriod(householdId, periodId);
  const recurring = await runQuery<{ id: string; categoryId: string; estimatedAmount: number; name: string }>(
    `SELECT Id AS id, CategoryId AS categoryId, EstimatedAmount AS estimatedAmount, Name AS name
     FROM RecurringExpenses
     WHERE HouseholdId = @householdId AND IsActive = 1 AND AutoGenerateInBudget = 1`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );
  const budgetRows = await runQuery<{ id: string }>(
    `SELECT TOP (1) Id AS id FROM MonthlyBudgets WHERE PeriodId = @periodId`,
    [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
  );
  const budgetId = budgetRows[0]?.id ?? crypto.randomUUID();
  if (budgetRows.length === 0) {
    await runExecute(
      `INSERT INTO MonthlyBudgets (Id, PeriodId, ExceedsIncomeConfirmed, CreatedAtUtc, CreatedByUserId)
       VALUES (@id, @periodId, 0, @createdAtUtc, @createdByUserId)`,
      [
        { name: "id", type: sql.UniqueIdentifier, value: budgetId },
        { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
        { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
        { name: "createdByUserId", type: sql.NVarChar(sql.MAX), value: userId },
      ],
    );
  }

  const existingLines = await runQuery<{ recurringExpenseId: string | null }>(
    `SELECT RecurringExpenseId AS recurringExpenseId
     FROM BudgetLines
     WHERE MonthlyBudgetId = @monthlyBudgetId`,
    [{ name: "monthlyBudgetId", type: sql.UniqueIdentifier, value: budgetId }],
  );
  const existingRecurringIds = new Set(existingLines.map((line) => line.recurringExpenseId).filter(Boolean));
  for (const item of recurring) {
    if (existingRecurringIds.has(item.id)) continue;
    await runExecute(
      `INSERT INTO BudgetLines
        (Id, MonthlyBudgetId, CategoryId, BudgetedAmount, CommittedAmount, Notes, RecurringExpenseId)
       VALUES
        (@id, @monthlyBudgetId, @categoryId, @budgetedAmount, @committedAmount, @notes, @recurringExpenseId)`,
      [
        { name: "id", type: sql.UniqueIdentifier, value: crypto.randomUUID() },
        { name: "monthlyBudgetId", type: sql.UniqueIdentifier, value: budgetId },
        { name: "categoryId", type: sql.UniqueIdentifier, value: item.categoryId },
        { name: "budgetedAmount", type: sql.Decimal(18, 2), value: item.estimatedAmount },
        { name: "committedAmount", type: sql.Decimal(18, 2), value: item.estimatedAmount },
        { name: "notes", type: sql.NVarChar(sql.MAX), value: `Generado desde ${item.name}` },
        { name: "recurringExpenseId", type: sql.UniqueIdentifier, value: item.id },
      ],
    );
  }
  return getBudgetSummary(householdId, periodId, userId);
}

export async function listExpenses(householdId: string, periodId: string, userId: string, filters: URLSearchParams) {
  await getMembership(householdId, userId);
  const pageNumber = Math.max(Number(filters.get("pageNumber") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(filters.get("pageSize") ?? 20), 1), 100);
  const categoryId = filters.get("categoryId");
  const status = filters.get("status");
  const search = filters.get("search")?.trim();

  let where = "WHERE e.HouseholdId = @householdId AND e.PeriodId = @periodId";
  const params: SqlParam[] = [
    { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
  ];
  if (categoryId) {
    where += " AND e.CategoryId = @categoryId";
    params.push({ name: "categoryId", type: sql.UniqueIdentifier, value: categoryId });
  }
  if (status) {
    where += " AND e.Status = @status";
    params.push({ name: "status", type: sql.Int, value: Number(status) });
  }
  if (search) {
    where += " AND e.Description LIKE @search";
    params.push({ name: "search", type: sql.NVarChar(sql.MAX), value: `%${search}%` });
  }
  params.push({ name: "offset", type: sql.Int, value: (pageNumber - 1) * pageSize });
  params.push({ name: "fetch", type: sql.Int, value: pageSize });

  const totalRows = await runQuery<{ total: number }>(
    `SELECT COUNT(1) AS total
     FROM Expenses e
     ${where}`,
    params.filter((item) => item.name !== "offset" && item.name !== "fetch"),
  );

  const rows = await runQuery<{
    id: string;
    categoryId: string;
    categoryName: string;
    movementType: number;
    description: string;
    amount: number;
    movementDate: Date;
    paymentMethod: number;
    merchantOrPayee: string | null;
    referenceNumber: string | null;
    status: number;
    isRelatedToRecurring: boolean;
    recurringExpenseId: string | null;
    notes: string | null;
    createdAtUtc: Date;
    createdByUserId: string;
  }>(
    `SELECT
      e.Id AS id, e.CategoryId AS categoryId, c.Name AS categoryName, e.MovementType AS movementType,
      e.Description AS description, e.Amount AS amount, e.MovementDate AS movementDate, e.PaymentMethod AS paymentMethod,
      e.MerchantOrPayee AS merchantOrPayee, e.ReferenceNumber AS referenceNumber, e.Status AS status,
      e.IsRelatedToRecurring AS isRelatedToRecurring, e.RecurringExpenseId AS recurringExpenseId, e.Notes AS notes,
      e.CreatedAtUtc AS createdAtUtc, e.CreatedByUserId AS createdByUserId
     FROM Expenses e
     INNER JOIN ExpenseCategories c ON c.Id = e.CategoryId
     ${where}
     ORDER BY e.MovementDate DESC
     OFFSET @offset ROWS FETCH NEXT @fetch ROWS ONLY`,
    params,
  );
  const items = rows.map((row) => ({
    ...row,
    movementDate: asDateOnly(row.movementDate as Date),
    createdAtUtc: (row.createdAtUtc as Date).toISOString(),
  }));
  const totalItems = totalRows[0]?.total ?? 0;
  return {
    items,
    pageNumber,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

export async function createExpense(householdId: string, periodId: string, userId: string, payload: Record<string, unknown>) {
  await getMembership(householdId, userId);
  const period = await requireOpenPeriod(householdId, periodId);
  requirePositiveAmount(Number(payload.amount));
  const movementDate = String(payload.movementDate);
  if (movementDate < asDateOnly(period.startDate)! || movementDate > asDateOnly(period.endDate)!) {
    throw new BadRequestError("La fecha debe estar dentro del período.");
  }

  const idempotencyKey = String(payload.idempotencyKey ?? "").trim();
  if (idempotencyKey) {
    const existing = await runQuery<{ id: string }>(
      `SELECT TOP (1) Id AS id
       FROM Expenses
       WHERE HouseholdId = @householdId AND IdempotencyKey = @idempotencyKey`,
      [
        { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
        { name: "idempotencyKey", type: sql.NVarChar(450), value: idempotencyKey },
      ],
    );
    if (existing[0]) {
      const page = await listExpenses(householdId, periodId, userId, new URLSearchParams());
      const item = page.items.find((expense) => expense.id === existing[0].id);
      if (item) {
        return item;
      }
    }
  }

  const id = crypto.randomUUID();
  await runExecute(
    `INSERT INTO Expenses
      (Id, HouseholdId, PeriodId, CategoryId, MovementType, Description, Amount, MovementDate, PaymentMethod,
       MerchantOrPayee, ReferenceNumber, Status, IsRelatedToRecurring, RecurringExpenseId, Notes,
       CreatedByUserId, CreatedAtUtc, IdempotencyKey)
     VALUES
      (@id, @householdId, @periodId, @categoryId, @movementType, @description, @amount, @movementDate, @paymentMethod,
       @merchantOrPayee, @referenceNumber, 1, @isRelatedToRecurring, @recurringExpenseId, @notes,
       @createdByUserId, @createdAtUtc, @idempotencyKey)`,
    [
      { name: "id", type: sql.UniqueIdentifier, value: id },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "periodId", type: sql.UniqueIdentifier, value: periodId },
      { name: "categoryId", type: sql.UniqueIdentifier, value: String(payload.categoryId) },
      { name: "movementType", type: sql.Int, value: Number(payload.movementType ?? 0) },
      { name: "description", type: sql.NVarChar(sql.MAX), value: String(payload.description ?? "").trim() },
      { name: "amount", type: sql.Decimal(18, 2), value: Number(payload.amount) },
      { name: "movementDate", type: sql.Date, value: new Date(movementDate) },
      { name: "paymentMethod", type: sql.Int, value: Number(payload.paymentMethod ?? 0) },
      { name: "merchantOrPayee", type: sql.NVarChar(sql.MAX), value: payload.merchantOrPayee ? String(payload.merchantOrPayee).trim() : null },
      { name: "referenceNumber", type: sql.NVarChar(sql.MAX), value: payload.referenceNumber ? String(payload.referenceNumber).trim() : null },
      { name: "isRelatedToRecurring", type: sql.Bit, value: Boolean(payload.recurringExpenseId) },
      { name: "recurringExpenseId", type: sql.UniqueIdentifier, value: payload.recurringExpenseId ? String(payload.recurringExpenseId) : null },
      { name: "notes", type: sql.NVarChar(sql.MAX), value: payload.notes ? String(payload.notes).trim() : null },
      { name: "createdByUserId", type: sql.NVarChar(sql.MAX), value: userId },
      { name: "createdAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "idempotencyKey", type: sql.NVarChar(450), value: idempotencyKey },
    ],
  );
  const page = await listExpenses(householdId, periodId, userId, new URLSearchParams());
  return page.items.find((expense) => expense.id === id)!;
}

export async function getExpenseById(householdId: string, expenseId: string, userId: string) {
  await getMembership(householdId, userId);
  const rows = await runQuery<{
    id: string;
    categoryId: string;
    categoryName: string;
    movementType: number;
    description: string;
    amount: number;
    movementDate: Date;
    paymentMethod: number;
    merchantOrPayee: string | null;
    referenceNumber: string | null;
    status: number;
    isRelatedToRecurring: boolean;
    recurringExpenseId: string | null;
    notes: string | null;
    createdAtUtc: Date;
    createdByUserId: string;
    periodId: string;
  }>(
    `SELECT TOP (1)
      e.Id AS id, e.CategoryId AS categoryId, c.Name AS categoryName, e.MovementType AS movementType,
      e.Description AS description, e.Amount AS amount, e.MovementDate AS movementDate, e.PaymentMethod AS paymentMethod,
      e.MerchantOrPayee AS merchantOrPayee, e.ReferenceNumber AS referenceNumber, e.Status AS status,
      e.IsRelatedToRecurring AS isRelatedToRecurring, e.RecurringExpenseId AS recurringExpenseId, e.Notes AS notes,
      e.CreatedAtUtc AS createdAtUtc, e.CreatedByUserId AS createdByUserId, e.PeriodId AS periodId
     FROM Expenses e
     INNER JOIN ExpenseCategories c ON c.Id = e.CategoryId
     WHERE e.HouseholdId = @householdId AND e.Id = @expenseId`,
    [
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
      { name: "expenseId", type: sql.UniqueIdentifier, value: expenseId },
    ],
  );
  const expense = rows[0];
  if (!expense) throw new NotFoundError("Gasto no encontrado.");
  return {
    ...expense,
    movementDate: asDateOnly(expense.movementDate),
    createdAtUtc: expense.createdAtUtc.toISOString(),
  };
}

export async function updateExpense(householdId: string, expenseId: string, userId: string, payload: Record<string, unknown>) {
  await getMembership(householdId, userId);
  const expense = await getExpenseById(householdId, expenseId, userId);
  await requireOpenPeriod(householdId, expense.periodId);
  requirePositiveAmount(Number(payload.amount));
  await runExecute(
    `UPDATE Expenses
     SET CategoryId = @categoryId, MovementType = @movementType, Description = @description, Amount = @amount,
      MovementDate = @movementDate, PaymentMethod = @paymentMethod, MerchantOrPayee = @merchantOrPayee,
      ReferenceNumber = @referenceNumber, Notes = @notes, UpdatedAtUtc = @updatedAtUtc
     WHERE Id = @expenseId`,
    [
      { name: "categoryId", type: sql.UniqueIdentifier, value: String(payload.categoryId) },
      { name: "movementType", type: sql.Int, value: Number(payload.movementType ?? 0) },
      { name: "description", type: sql.NVarChar(sql.MAX), value: String(payload.description ?? "").trim() },
      { name: "amount", type: sql.Decimal(18, 2), value: Number(payload.amount) },
      { name: "movementDate", type: sql.Date, value: new Date(String(payload.movementDate)) },
      { name: "paymentMethod", type: sql.Int, value: Number(payload.paymentMethod ?? 0) },
      { name: "merchantOrPayee", type: sql.NVarChar(sql.MAX), value: payload.merchantOrPayee ? String(payload.merchantOrPayee).trim() : null },
      { name: "referenceNumber", type: sql.NVarChar(sql.MAX), value: payload.referenceNumber ? String(payload.referenceNumber).trim() : null },
      { name: "notes", type: sql.NVarChar(sql.MAX), value: payload.notes ? String(payload.notes).trim() : null },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "expenseId", type: sql.UniqueIdentifier, value: expenseId },
    ],
  );
  return getExpenseById(householdId, expenseId, userId);
}

export async function confirmExpense(householdId: string, expenseId: string, userId: string) {
  await getMembership(householdId, userId);
  const expense = await getExpenseById(householdId, expenseId, userId);
  await requireOpenPeriod(householdId, expense.periodId);
  if (Number(expense.status) !== 0) throw new ConflictError("Solo se pueden confirmar gastos pendientes.");
  await runExecute(
    `UPDATE Expenses SET Status = 1, UpdatedAtUtc = @updatedAtUtc WHERE Id = @expenseId`,
    [
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "expenseId", type: sql.UniqueIdentifier, value: expenseId },
    ],
  );
  return getExpenseById(householdId, expenseId, userId);
}

export async function cancelExpense(householdId: string, expenseId: string, userId: string, payload: { reason: string }) {
  await getMembership(householdId, userId);
  if (!payload.reason?.trim()) throw new BadRequestError("Se requiere motivo de anulación.");
  const expense = await getExpenseById(householdId, expenseId, userId);
  await requireOpenPeriod(householdId, expense.periodId);
  await runExecute(
    `UPDATE Expenses SET Status = 2, CancellationReason = @reason, UpdatedAtUtc = @updatedAtUtc WHERE Id = @expenseId`,
    [
      { name: "reason", type: sql.NVarChar(sql.MAX), value: payload.reason.trim() },
      { name: "updatedAtUtc", type: sql.DateTime2, value: toUtcNow() },
      { name: "expenseId", type: sql.UniqueIdentifier, value: expenseId },
    ],
  );
  return getExpenseById(householdId, expenseId, userId);
}

export async function getDashboard(householdId: string, periodId: string, userId: string) {
  await getMembership(householdId, userId);
  const period = await requirePeriod(householdId, periodId);
  const summary = await getBudgetSummary(householdId, periodId, userId);
  const topCategories = summary.lines
    .filter((line) => line.spentAmount > 0)
    .sort((a, b) => b.spentAmount - a.spentAmount)
    .slice(0, 5)
    .map((line) => ({
      categoryId: line.categoryId,
      categoryName: line.categoryName,
      color: line.color,
      budgeted: line.budgetedAmount,
      spent: line.spentAmount,
      percentage: line.consumedPercentage,
    }));
  const exceededCategories = summary.lines
    .filter((line) => line.budgetedAmount > 0 && line.spentAmount > line.budgetedAmount)
    .map((line) => ({
      categoryId: line.categoryId,
      categoryName: line.categoryName,
      color: line.color,
      budgeted: line.budgetedAmount,
      spent: line.spentAmount,
      percentage: line.consumedPercentage,
    }));

  const upcomingPayments = await runQuery(
    `SELECT TOP (5)
      r.Id AS recurringExpenseId, r.Name AS name, r.EstimatedAmount AS amount,
      r.ExpectedPaymentDay AS expectedDay, c.Name AS categoryName
     FROM RecurringExpenses r
     INNER JOIN ExpenseCategories c ON c.Id = r.CategoryId
     WHERE r.HouseholdId = @householdId AND r.IsActive = 1
     ORDER BY r.ExpectedPaymentDay ASC`,
    [{ name: "householdId", type: sql.UniqueIdentifier, value: householdId }],
  );

  const expenses = await runQuery<{ id: string; description: string; amount: number; movementDate: Date; status: number; movementType: number }>(
    `SELECT Id AS id, Description AS description, Amount AS amount, MovementDate AS movementDate, Status AS status, MovementType AS movementType
     FROM Expenses
     WHERE PeriodId = @periodId AND Status <> 2`,
    [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
  );
  const weeklyMap = new Map<number, number>();
  for (const expense of expenses.filter((item) => item.status === 1)) {
    const weekNumber = Math.floor((new Date(expense.movementDate).getUTCDate() - 1) / 7) + 1;
    weeklyMap.set(weekNumber, (weeklyMap.get(weekNumber) ?? 0) + Number(expense.amount));
  }
  const weeklySpending = [...weeklyMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, amount]) => ({ weekNumber, amount }));

  const recentMovements = expenses
    .sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      description: item.description,
      amount: Number(item.amount),
      date: asDateOnly(item.movementDate),
      status: String(item.status),
      type: String(item.movementType),
    }));

  const budgetUtilizationPercentage = summary.totalBudgeted <= 0 ? 0 : Math.round((summary.totalSpent / summary.totalBudgeted) * 10000) / 100;
  return {
    periodId,
    year: period.year,
    month: period.month,
    periodStatus: String(period.status),
    estimatedIncome: summary.totalEstimatedIncome,
    receivedIncome: summary.totalReceivedIncome,
    totalBudgeted: summary.totalBudgeted,
    confirmedExpenses: summary.totalSpent,
    pendingExpenses: summary.totalPending,
    estimatedCashBalance: summary.estimatedCashBalance,
    realCashBalance: summary.realCashBalance,
    budgetUtilizationPercentage,
    topCategories,
    exceededCategories,
    upcomingPayments,
    weeklySpending,
    recentMovements,
    previousMonthComparison: null,
  };
}

export async function reportBudgetVsActual(householdId: string, periodId: string, userId: string) {
  const summary = await getBudgetSummary(householdId, periodId, userId);
  const lines = summary.lines
    .filter((line) => line.hasBudget || line.spentAmount > 0)
    .map((line) => ({
      categoryName: line.categoryName,
      budgeted: line.budgetedAmount,
      spent: line.spentAmount,
      variance: line.budgetedAmount - line.spentAmount,
      percentage: line.consumedPercentage,
    }));
  return {
    lines,
    totalBudgeted: summary.totalBudgeted,
    totalSpent: summary.totalSpent,
    variance: summary.totalBudgeted - summary.totalSpent,
  };
}

export async function reportByCategory(householdId: string, periodId: string, userId: string) {
  const summary = await getBudgetSummary(householdId, periodId, userId);
  const categories = summary.lines
    .filter((line) => line.spentAmount > 0)
    .map((line) => ({
      categoryId: line.categoryId,
      categoryName: line.categoryName,
      color: line.color,
      budgeted: line.budgetedAmount,
      spent: line.spentAmount,
      percentage: line.consumedPercentage,
    }));
  return {
    categories,
    total: categories.reduce((acc, item) => acc + item.spent, 0),
  };
}

export async function reportCashFlow(householdId: string, periodId: string, userId: string) {
  await getMembership(householdId, userId);
  const incomes = await runQuery<{ receivedAmount: number }>(
    `SELECT ReceivedAmount AS receivedAmount
     FROM Incomes
     WHERE PeriodId = @periodId AND Status = 1`,
    [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
  );
  const expenses = await runQuery<{ amount: number }>(
    `SELECT Amount AS amount
     FROM Expenses
     WHERE PeriodId = @periodId AND Status = 1`,
    [{ name: "periodId", type: sql.UniqueIdentifier, value: periodId }],
  );
  const totalIncome = incomes.reduce((acc, item) => acc + Number(item.receivedAmount), 0);
  const totalExpenses = expenses.reduce((acc, item) => acc + Number(item.amount), 0);
  return {
    openingBalance: 0,
    totalIncome,
    totalExpenses,
    closingBalance: totalIncome - totalExpenses,
    items: [],
  };
}

export async function reportMonthlyComparison(householdId: string, userId: string, months: number) {
  await getMembership(householdId, userId);
  const periods = await runQuery<{ id: string; year: number; month: number }>(
    `SELECT TOP (@months) Id AS id, [Year] AS [year], [Month] AS [month]
     FROM FinancialPeriods
     WHERE HouseholdId = @householdId
     ORDER BY [Year] DESC, [Month] DESC`,
    [
      { name: "months", type: sql.Int, value: months },
      { name: "householdId", type: sql.UniqueIdentifier, value: householdId },
    ],
  );
  const ordered = [...periods].sort((a, b) => a.year - b.year || a.month - b.month);
  const result = [];
  for (const period of ordered) {
    const summary = await getBudgetSummary(householdId, period.id, userId);
    result.push({
      year: period.year,
      month: period.month,
      estimatedIncome: summary.totalEstimatedIncome,
      receivedIncome: summary.totalReceivedIncome,
      budgeted: summary.totalBudgeted,
      spent: summary.totalSpent,
    });
  }
  return { months: result };
}
