import { getDb } from './index';
import type { Invoice, InvoiceItem, InvoiceStatus } from '../types';
import { extractNumericFromInvoiceNumber } from '../utils/format';
import { updateLastInvoiceNumber } from './settings';

export async function getInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  return db.select<Invoice[]>(`
    SELECT i.*, c.name as client_name,
      c.address as client_address, c.address2 as client_address2,
      c.city as client_city, c.state as client_state,
      c.zip as client_zip, c.country as client_country,
      c.tax_id as client_tax_id,
      (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id) as subtotal
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
  `);
}

export async function getInvoice(id: number): Promise<Invoice | null> {
  const db = await getDb();
  const rows = await db.select<Invoice[]>(`
    SELECT i.*, c.name as client_name,
      c.address as client_address, c.address2 as client_address2,
      c.city as client_city, c.state as client_state,
      c.zip as client_zip, c.country as client_country,
      c.tax_id as client_tax_id
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `, [id]);
  if (!rows[0]) return null;
  const invoice = rows[0];
  invoice.items = await getInvoiceItems(id);
  const subtotal = invoice.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const discountAmt = invoice.discount_type === 'percent'
    ? subtotal * (invoice.discount / 100)
    : invoice.discount;
  const taxAmt = (subtotal - discountAmt) * (invoice.tax_rate / 100);
  invoice.subtotal = subtotal;
  invoice.tax_amount = taxAmt;
  invoice.total = subtotal - discountAmt + taxAmt;
  return invoice;
}

export async function getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
  const db = await getDb();
  return db.select<InvoiceItem[]>(
    'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC',
    [invoiceId]
  );
}

export async function createInvoice(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'subtotal' | 'tax_amount' | 'total'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO invoices
      (invoice_number, client_id, issue_date, due_date, status, currency, tax_rate, discount_type, discount, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice.invoice_number, invoice.client_id, invoice.issue_date, invoice.due_date,
      invoice.status, invoice.currency, invoice.tax_rate, invoice.discount_type,
      invoice.discount, invoice.notes,
    ]
  );
  const invoiceId = result.lastInsertId as number;
  await replaceInvoiceItems(invoiceId, items);

  const numericPart = extractNumericFromInvoiceNumber(invoice.invoice_number);
  if (numericPart > 0) {
    await updateLastInvoiceNumber(numericPart);
  }

  return invoiceId;
}

export async function updateInvoice(
  id: number,
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'subtotal' | 'tax_amount' | 'total'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE invoices SET
      invoice_number=?, client_id=?, issue_date=?, due_date=?, status=?,
      currency=?, tax_rate=?, discount_type=?, discount=?, notes=?,
      updated_at=datetime('now')
    WHERE id=?`,
    [
      invoice.invoice_number, invoice.client_id, invoice.issue_date, invoice.due_date,
      invoice.status, invoice.currency, invoice.tax_rate, invoice.discount_type,
      invoice.discount, invoice.notes, id,
    ]
  );
  await replaceInvoiceItems(id, items);
}

async function replaceInvoiceItems(
  invoiceId: number,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.execute(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, unit, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.description, item.quantity, item.unit_price, item.unit, i]
    );
  }
}

export async function markAsPaid(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE invoices SET status='paid', payment_date=date('now'), updated_at=datetime('now') WHERE id=?`,
    [id]
  );
}

export async function updateStatus(id: number, status: InvoiceStatus): Promise<void> {
  const db = await getDb();
  const paymentDate = status === 'paid' ? "date('now')" : 'NULL';
  await db.execute(
    `UPDATE invoices SET status=?, payment_date=${paymentDate}, updated_at=datetime('now') WHERE id=?`,
    [status, id]
  );
}

export async function deleteInvoice(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM invoices WHERE id = ?', [id]);
}
