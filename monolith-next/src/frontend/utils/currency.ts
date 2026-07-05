const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "USD";

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency }).format(amount);
