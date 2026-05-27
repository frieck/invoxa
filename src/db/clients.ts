import { getDb } from './index';
import type { Client } from '../types';

export async function getClients(): Promise<Client[]> {
  const db = await getDb();
  return db.select<Client[]>('SELECT * FROM clients ORDER BY name ASC');
}

export async function getClient(id: number): Promise<Client | null> {
  const db = await getDb();
  const rows = await db.select<Client[]>('SELECT * FROM clients WHERE id = ?', [id]);
  return rows[0] ?? null;
}

export async function createClient(c: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO clients (name, address, address2, city, state, zip, country, email, phone, tax_id, contact_person, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.name, c.address, c.address2, c.city, c.state, c.zip, c.country,
     c.email, c.phone, c.tax_id, c.contact_person, c.notes]
  );
  return result.lastInsertId as number;
}

export async function updateClient(id: number, c: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE clients SET
      name=?, address=?, address2=?, city=?, state=?, zip=?, country=?,
      email=?, phone=?, tax_id=?, contact_person=?, notes=?,
      updated_at=datetime('now')
    WHERE id=?`,
    [c.name, c.address, c.address2, c.city, c.state, c.zip, c.country,
     c.email, c.phone, c.tax_id, c.contact_person, c.notes, id]
  );
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM clients WHERE id = ?', [id]);
}
