import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { householdsApi, periodsApi } from '../api/households.api'
import type { FinancialPeriod, Household } from '../types/domain'
import { useAuth } from './AuthContext'

const HOUSEHOLD_KEY = 'hf_active_household'
const PERIOD_KEY = 'hf_active_period'

interface AppContextValue {
  households: Household[]
  activeHousehold: Household | null
  periods: FinancialPeriod[]
  activePeriod: FinancialPeriod | null
  loading: boolean
  refreshHouseholds: () => Promise<void>
  setActiveHousehold: (household: Household | null) => void
  refreshPeriods: () => Promise<void>
  setActivePeriod: (period: FinancialPeriod | null) => void
  createHousehold: (name: string, description?: string) => Promise<Household>
  createPeriod: (year: number, month: number) => Promise<FinancialPeriod>
  closePeriod: () => Promise<void>
  reopenPeriod: () => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [activeHousehold, setActiveHouseholdState] = useState<Household | null>(null)
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [activePeriod, setActivePeriodState] = useState<FinancialPeriod | null>(null)
  const [loading, setLoading] = useState(false)

  const setActiveHousehold = useCallback((household: Household | null) => {
    setActiveHouseholdState(household)
    if (household) localStorage.setItem(HOUSEHOLD_KEY, household.id)
    else localStorage.removeItem(HOUSEHOLD_KEY)
    setActivePeriodState(null)
    localStorage.removeItem(PERIOD_KEY)
  }, [])

  const setActivePeriod = useCallback((period: FinancialPeriod | null) => {
    setActivePeriodState(period)
    if (period) localStorage.setItem(PERIOD_KEY, period.id)
    else localStorage.removeItem(PERIOD_KEY)
  }, [])

  const refreshHouseholds = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await householdsApi.list()
      setHouseholds(list)
      const savedId = localStorage.getItem(HOUSEHOLD_KEY)
      const selected = list.find((h) => h.id === savedId) ?? list[0] ?? null
      setActiveHousehold(selected)
    } finally {
      setLoading(false)
    }
  }, [user, setActiveHousehold])

  const refreshPeriods = useCallback(async () => {
    if (!activeHousehold) {
      setPeriods([])
      setActivePeriod(null)
      return
    }
    const list = await periodsApi.list(activeHousehold.id)
    setPeriods(list)
    const savedId = localStorage.getItem(PERIOD_KEY)
    const selected = list.find((p) => p.id === savedId) ?? list[0] ?? null
    setActivePeriod(selected)
  }, [activeHousehold, setActivePeriod])

  useEffect(() => {
    if (user) void refreshHouseholds()
    else {
      setHouseholds([])
      setActiveHousehold(null)
    }
  }, [user, refreshHouseholds, setActiveHousehold])

  useEffect(() => {
    if (activeHousehold) void refreshPeriods()
  }, [activeHousehold, refreshPeriods])

  const createHousehold = useCallback(async (name: string, description?: string) => {
    const household = await householdsApi.create(name, description)
    await refreshHouseholds()
    setActiveHousehold(household)
    return household
  }, [refreshHouseholds, setActiveHousehold])

  const createPeriod = useCallback(async (year: number, month: number) => {
    if (!activeHousehold) throw new Error('Seleccione un hogar')
    const period = await periodsApi.create(activeHousehold.id, year, month)
    await refreshPeriods()
    setActivePeriod(period)
    return period
  }, [activeHousehold, refreshPeriods, setActivePeriod])

  const closePeriod = useCallback(async () => {
    if (!activeHousehold || !activePeriod) return
    const period = await periodsApi.close(activeHousehold.id, activePeriod.id)
    setActivePeriod(period)
    await refreshPeriods()
  }, [activeHousehold, activePeriod, refreshPeriods, setActivePeriod])

  const reopenPeriod = useCallback(async () => {
    if (!activeHousehold || !activePeriod) return
    const period = await periodsApi.reopen(activeHousehold.id, activePeriod.id)
    setActivePeriod(period)
    await refreshPeriods()
  }, [activeHousehold, activePeriod, refreshPeriods, setActivePeriod])

  const value = useMemo(
    () => ({
      households,
      activeHousehold,
      periods,
      activePeriod,
      loading,
      refreshHouseholds,
      setActiveHousehold,
      refreshPeriods,
      setActivePeriod,
      createHousehold,
      createPeriod,
      closePeriod,
      reopenPeriod,
    }),
    [
      households,
      activeHousehold,
      periods,
      activePeriod,
      loading,
      refreshHouseholds,
      setActiveHousehold,
      refreshPeriods,
      setActivePeriod,
      createHousehold,
      createPeriod,
      closePeriod,
      reopenPeriod,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider')
  return ctx
}
