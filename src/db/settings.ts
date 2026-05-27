import { getDb } from './index';
import type { AppSettings } from '../types';

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.select<{ key: string; value: string }[]>(
    'SELECT key, value FROM settings'
  );
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.key] = r.value));
  return {
    last_invoice_number: map.last_invoice_number ?? '0',
    default_currency: map.default_currency ?? 'USD',
    default_tax_rate: map.default_tax_rate ?? '0',
    invoice_prefix: map.invoice_prefix ?? 'INV',
    default_due_days: map.default_due_days ?? '30',
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function updateLastInvoiceNumber(num: number): Promise<void> {
  await setSetting('last_invoice_number', String(num));
}
