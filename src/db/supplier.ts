import { getDb } from './index';
import type { Supplier } from '../types';

export async function getSupplier(): Promise<Supplier> {
  const db = await getDb();
  const rows = await db.select<Supplier[]>('SELECT * FROM supplier WHERE id = 1');
  if (rows.length === 0) {
    await db.execute('INSERT OR IGNORE INTO supplier (id, name) VALUES (1, ?)' , ['']);
    return {
      id: 1, name: '', address: '', address2: '', city: '', state: '',
      zip: '', country: '', email: '', phone: '', tax_id: '',
      bank_name: '', bank_account: '', bank_routing: '', iban: '',
      swift: '', website: '', notes: '',
    };
  }
  return rows[0];
}

export async function saveSupplier(s: Omit<Supplier, 'id'>): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE supplier SET
      name=?, address=?, address2=?, city=?, state=?, zip=?, country=?,
      email=?, phone=?, tax_id=?, bank_name=?, bank_account=?, bank_routing=?,
      iban=?, swift=?, website=?, notes=?
    WHERE id=1`,
    [
      s.name, s.address, s.address2, s.city, s.state, s.zip, s.country,
      s.email, s.phone, s.tax_id, s.bank_name, s.bank_account, s.bank_routing,
      s.iban, s.swift, s.website, s.notes,
    ]
  );
}
