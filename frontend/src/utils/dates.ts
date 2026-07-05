import { DateTime } from 'luxon'

const zone = import.meta.env.VITE_DEFAULT_TIME_ZONE ?? 'America/El_Salvador'

export const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  return DateTime.fromISO(value, { zone: 'utc' }).setZone(zone).toFormat('dd/MM/yyyy')
}

export const formatMonthYear = (year: number, month: number): string =>
  DateTime.fromObject({ year, month, day: 1 }, { zone }).setLocale('es').toFormat('LLLL yyyy')

export const todayIso = (): string => DateTime.now().setZone(zone).toISODate() ?? ''

export const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
