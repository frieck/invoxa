import dayjs from 'dayjs';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('MMM DD, YYYY');
}

export function formatDateISO(date: Date | null): string {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
}

export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  return d.isValid() ? d.toDate() : null;
}

export function calcSubtotal(items: { quantity: number; unit_price: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function calcDiscount(subtotal: number, discount: number, type: 'fixed' | 'percent'): number {
  if (type === 'percent') return subtotal * (discount / 100);
  return discount;
}

export function calcTax(subtotal: number, discountAmt: number, taxRate: number): number {
  return (subtotal - discountAmt) * (taxRate / 100);
}

export function calcTotal(
  subtotal: number,
  discountAmt: number,
  taxAmt: number
): number {
  return subtotal - discountAmt + taxAmt;
}

export function nextInvoiceNumber(lastNumber: string, prefix: string): string {
  const num = parseInt(lastNumber, 10) || 0;
  const next = num + 1;
  if (!prefix.trim()) return String(next);
  return `${prefix.trim()}-${String(next).padStart(4, '0')}`;
}

export function extractNumericFromInvoiceNumber(invoiceNumber: string): number {
  const match = invoiceNumber.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
