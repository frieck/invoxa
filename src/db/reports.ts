import { getDb } from './index';
import type { MonthlyReport, AnnualReport } from '../types';
import { MONTH_NAMES } from '../utils/format';

export async function getMonthlyReport(year: number): Promise<MonthlyReport[]> {
  const db = await getDb();
  const rows = await db.select<{
    month_num: number;
    total_invoiced: number;
    total_paid: number;
    invoice_count: number;
    paid_count: number;
  }[]>(`
    SELECT
      CAST(strftime('%m', issue_date) AS INTEGER) as month_num,
      SUM(
        (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        - CASE WHEN i.discount_type='percent'
            THEN (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id) * i.discount / 100
            ELSE i.discount END
        + (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
          * i.tax_rate / 100
      ) as total_invoiced,
      SUM(CASE WHEN i.status='paid' THEN
        (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        - CASE WHEN i.discount_type='percent'
            THEN (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id) * i.discount / 100
            ELSE i.discount END
        + (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
          * i.tax_rate / 100
        ELSE 0 END) as total_paid,
      COUNT(*) as invoice_count,
      SUM(CASE WHEN i.status='paid' THEN 1 ELSE 0 END) as paid_count
    FROM invoices i
    WHERE strftime('%Y', issue_date) = ?
      AND i.status != 'cancelled'
    GROUP BY month_num
    ORDER BY month_num ASC
  `, [String(year)]);

  return rows.map((r) => ({
    year,
    month_num: r.month_num,
    month_label: MONTH_NAMES[r.month_num - 1] ?? String(r.month_num),
    total_invoiced: r.total_invoiced ?? 0,
    total_paid: r.total_paid ?? 0,
    invoice_count: r.invoice_count ?? 0,
    paid_count: r.paid_count ?? 0,
  }));
}

export async function getAnnualReport(): Promise<AnnualReport[]> {
  const db = await getDb();
  return db.select<AnnualReport[]>(`
    SELECT
      CAST(strftime('%Y', issue_date) AS INTEGER) as year,
      SUM(
        (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        - CASE WHEN i.discount_type='percent'
            THEN (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id) * i.discount / 100
            ELSE i.discount END
        + (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
          * i.tax_rate / 100
      ) as total_invoiced,
      SUM(CASE WHEN i.status='paid' THEN
        (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        - CASE WHEN i.discount_type='percent'
            THEN (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id) * i.discount / 100
            ELSE i.discount END
        + (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
          * i.tax_rate / 100
        ELSE 0 END) as total_paid,
      COUNT(*) as invoice_count,
      SUM(CASE WHEN i.status='paid' THEN 1 ELSE 0 END) as paid_count
    FROM invoices i
    WHERE i.status != 'cancelled'
    GROUP BY year
    ORDER BY year DESC
  `);
}

export async function getDashboardStats(): Promise<{
  total_invoices: number;
  total_paid: number;
  total_unpaid: number;
  revenue_month: number;
  revenue_year: number;
  overdue_count: number;
}> {
  const db = await getDb();
  const rows = await db.select<{
    total_invoices: number;
    total_paid: number;
    total_unpaid: number;
    revenue_month: number;
    revenue_year: number;
    overdue_count: number;
  }[]>(`
    SELECT
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) as total_paid,
      SUM(CASE WHEN status IN ('draft','sent') THEN 1 ELSE 0 END) as total_unpaid,
      SUM(CASE WHEN status='paid' AND strftime('%Y-%m', payment_date)=strftime('%Y-%m','now') THEN
        (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        ELSE 0 END) as revenue_month,
      SUM(CASE WHEN status='paid' AND strftime('%Y', payment_date)=strftime('%Y','now') THEN
        (SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        ELSE 0 END) as revenue_year,
      SUM(CASE WHEN status='sent' AND due_date < date('now') AND due_date != '' THEN 1 ELSE 0 END) as overdue_count
    FROM invoices i
    WHERE status != 'cancelled'
  `);
  return rows[0] ?? {
    total_invoices: 0, total_paid: 0, total_unpaid: 0,
    revenue_month: 0, revenue_year: 0, overdue_count: 0,
  };
}
