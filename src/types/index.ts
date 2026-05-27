export interface Supplier {
  id: number;
  name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  tax_id: string;
  bank_name: string;
  bank_account: string;
  bank_routing: string;
  iban: string;
  swift: string;
  website: string;
  notes: string;
}

export interface Client {
  id: number;
  name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  tax_id: string;
  contact_person: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
  sort_order: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';
export type DiscountType = 'fixed' | 'percent';

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name?: string;
  client_address?: string;
  client_address2?: string;
  client_city?: string;
  client_state?: string;
  client_zip?: string;
  client_country?: string;
  client_tax_id?: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  tax_rate: number;
  discount_type: DiscountType;
  discount: number;
  notes: string;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  subtotal?: number;
  tax_amount?: number;
  total?: number;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
  sort_order: number;
}

export interface AppSettings {
  last_invoice_number: string;
  default_currency: string;
  default_tax_rate: string;
  invoice_prefix: string;
  default_due_days: string;
}

export interface MonthlyReport {
  year: number;
  month_num: number;
  month_label: string;
  total_invoiced: number;
  total_paid: number;
  invoice_count: number;
  paid_count: number;
}

export interface AnnualReport {
  year: number;
  total_invoiced: number;
  total_paid: number;
  invoice_count: number;
  paid_count: number;
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'BRL', 'CAD', 'AUD', 'JPY'];

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  cancelled: 'red',
};
