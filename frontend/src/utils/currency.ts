const currency = import.meta.env.VITE_DEFAULT_CURRENCY ?? 'USD'

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(amount)

export const parseCurrencyInput = (value: string): number => {
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
