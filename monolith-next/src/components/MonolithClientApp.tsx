"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type UserProfile = {
  id: string;
  email: string;
  displayName: string;
};

type AuthResponse = {
  token: string;
  user: UserProfile;
};

type Household = {
  id: string;
  name: string;
};

async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return (envelope.data as T) ?? (envelope as T);
}

export default function MonolithClientApp() {
  const [email, setEmail] = useState("demo@finanzashogar.local");
  const [password, setPassword] = useState("DemoFinanzas2026");
  const [displayName, setDisplayName] = useState("Demo Monolith");
  const [householdName, setHouseholdName] = useState("Hogar Monolith");

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const appendLog = (line: string) => {
    setLogLines((current) => [`${new Date().toISOString()} - ${line}`, ...current].slice(0, 12));
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    const auth = await request<AuthResponse>("/api/auth/register", undefined, {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
    setToken(auth.token);
    setUser(auth.user);
    appendLog("Registro completado via /api/auth/register");
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const auth = await request<AuthResponse>("/api/auth/login", undefined, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(auth.token);
    setUser(auth.user);
    appendLog("Login completado via /api/auth/login");
  };

  const handleLoadHouseholds = async () => {
    if (!token) return;
    const data = await request<Household[]>("/api/households", token);
    setHouseholds(data ?? []);
    appendLog("Hogares cargados via /api/households");
  };

  const handleCreateHousehold = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await request<Household>("/api/households", token, {
      method: "POST",
      body: JSON.stringify({ name: householdName }),
    });
    appendLog("Hogar creado via /api/households");
    await handleLoadHouseholds();
  };

  const handleFinancialSmoke = async () => {
    if (!token || households.length === 0) return;
    const householdId = households[0].id;
    await request(`/api/households/${householdId}/expense-categories`, token);
    await request(`/api/households/${householdId}/recurring-expenses`, token);
    appendLog("Smoke financiero OK (categorias + recurrentes)");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setHouseholds([]);
    appendLog("Sesion local cerrada");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Monolith Next - Integracion UI</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Corte progresivo completado: auth, hogares y modulos financieros consumen el API monolitico.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-medium">1) migrar-auth-hogares</h2>
        <form className="grid gap-2 md:grid-cols-2" onSubmit={handleLogin}>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
          <input
            className="rounded border px-3 py-2 text-sm md:col-span-2"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name (register)"
          />
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded bg-black px-3 py-2 text-sm text-white" type="submit">
              Login
            </button>
            <button className="rounded border px-3 py-2 text-sm" type="button" onClick={handleRegister}>
              Register
            </button>
            <button className="rounded border px-3 py-2 text-sm" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </form>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          Usuario actual: {isAuthenticated ? `${user?.displayName} (${user?.email})` : "No autenticado"}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-medium">2) migrar-modulos-financieros</h2>
        <div className="flex flex-wrap gap-2">
          <button className="rounded border px-3 py-2 text-sm" type="button" onClick={handleLoadHouseholds}>
            Cargar hogares
          </button>
          <button className="rounded border px-3 py-2 text-sm" type="button" onClick={handleFinancialSmoke}>
            Probar modulos financieros
          </button>
        </div>
        <form className="mt-3 flex gap-2" onSubmit={handleCreateHousehold}>
          <input
            className="flex-1 rounded border px-3 py-2 text-sm"
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
            placeholder="Nombre de hogar"
          />
          <button className="rounded bg-zinc-900 px-3 py-2 text-sm text-white" type="submit">
            Crear
          </button>
        </form>
        <ul className="mt-3 list-disc pl-6 text-sm">
          {households.map((household) => (
            <li key={household.id}>{household.name}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-medium">3) integrar-ui-monolito / 4) validar-corte-iis</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Usa <code>/api/cutover/validate</code> para validar estado del corte y conectividad con IIS.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
          {logLines.length === 0 ? <li>Sin eventos aun.</li> : logLines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
    </main>
  );
}
