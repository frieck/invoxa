import { getDb } from './index';
import type { TemplateItem } from '../types';

export async function getTemplateItems(): Promise<TemplateItem[]> {
  const db = await getDb();
  return db.select<TemplateItem[]>(
    'SELECT * FROM template_items ORDER BY sort_order ASC, id ASC'
  );
}

export async function createTemplateItem(
  item: Omit<TemplateItem, 'id'>
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO template_items (description, quantity, unit_price, unit, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [item.description, item.quantity, item.unit_price, item.unit, item.sort_order]
  );
  return result.lastInsertId as number;
}

export async function updateTemplateItem(
  id: number,
  item: Omit<TemplateItem, 'id'>
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE template_items SET description=?, quantity=?, unit_price=?, unit=?, sort_order=? WHERE id=?`,
    [item.description, item.quantity, item.unit_price, item.unit, item.sort_order, id]
  );
}

export async function deleteTemplateItem(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM template_items WHERE id = ?', [id]);
}
