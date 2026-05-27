import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Invoice, Supplier } from '../../types';
import { formatCurrency, formatDate, calcSubtotal, calcDiscount, calcTax } from '../../utils/format';

// This component renders with 100% inline styles — no Mantine, no theme leaking.
// The invoice document is always in English (international standard).

interface Props {
  invoice: Invoice;
  supplier: Supplier;
}

const s = {
  page: {
    background: '#ffffff',
    color: '#111827',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 13,
    lineHeight: 1.5,
    padding: '48px 56px',
    maxWidth: 800,
    margin: '0 auto',
  } as React.CSSProperties,

  // Header row
  headerGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
    marginBottom: 32,
    alignItems: 'flex-start',
  } as React.CSSProperties,

  supplierName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
    lineHeight: 1.25,
  } as React.CSSProperties,

  supplierMeta: {
    color: '#6b7280',
    fontSize: 12.5,
    margin: '2px 0',
  } as React.CSSProperties,

  invoiceMeta: {
    textAlign: 'right' as const,
  },

  invoiceTitle: {
    fontSize: 38,
    fontWeight: 800,
    color: '#111827',
    letterSpacing: -1,
    lineHeight: 1,
    marginBottom: 12,
  } as React.CSSProperties,

  invoiceMetaRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    fontSize: 12.5,
  } as React.CSSProperties,

  invoiceMetaLabel: { color: '#9ca3af' } as React.CSSProperties,
  invoiceMetaValue: { fontWeight: 600, color: '#111827' } as React.CSSProperties,

  paidStamp: {
    display: 'inline-block',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: 6,
    padding: '4px 14px',
    fontWeight: 700,
    fontSize: 12,
    marginTop: 10,
    letterSpacing: 0.5,
  } as React.CSSProperties,

  divider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '0 0 24px 0',
  } as React.CSSProperties,

  // Bill To
  billToGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
    marginBottom: 28,
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
  } as React.CSSProperties,

  clientName: {
    fontWeight: 700,
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  } as React.CSSProperties,

  clientMeta: {
    color: '#6b7280',
    fontSize: 12.5,
    margin: '1px 0',
  } as React.CSSProperties,

  // Table — all inline, no external CSS classes
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: 24,
    fontSize: 12.5,
  } as React.CSSProperties,

  th: {
    background: '#f3f4f6',
    color: '#4b5563',
    fontWeight: 600,
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    textAlign: 'left' as const,
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as React.CSSProperties,

  thRight: {
    background: '#f3f4f6',
    color: '#4b5563',
    fontWeight: 600,
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    textAlign: 'right' as const,
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as React.CSSProperties,

  thCenter: {
    background: '#f3f4f6',
    color: '#4b5563',
    fontWeight: 600,
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    textAlign: 'center' as const,
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as React.CSSProperties,

  td: {
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    color: '#374151',
    background: '#ffffff',
  } as React.CSSProperties,

  tdRight: {
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    color: '#374151',
    textAlign: 'right' as const,
    background: '#ffffff',
  } as React.CSSProperties,

  tdCenter: {
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    color: '#374151',
    textAlign: 'center' as const,
    background: '#ffffff',
  } as React.CSSProperties,

  tdTotalRight: {
    padding: '9px 12px',
    border: '1px solid #e5e7eb',
    color: '#111827',
    textAlign: 'right' as const,
    fontWeight: 600,
    background: '#ffffff',
  } as React.CSSProperties,

  // Totals
  totalsWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 24,
  } as React.CSSProperties,

  totalsBox: {
    minWidth: 280,
  } as React.CSSProperties,

  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    fontSize: 13,
  } as React.CSSProperties,

  totalsLabel: { color: '#6b7280' } as React.CSSProperties,
  totalsValue: { fontWeight: 500, color: '#111827' } as React.CSSProperties,

  totalsDivider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '6px 0',
  } as React.CSSProperties,

  grandTotalLabel: { fontWeight: 700, fontSize: 15, color: '#111827' } as React.CSSProperties,
  grandTotalValue: { fontWeight: 800, fontSize: 15, color: '#111827' } as React.CSSProperties,

  // Notes / Bank
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 20,
  } as React.CSSProperties,

  noteText: {
    color: '#374151',
    fontSize: 12.5,
    whiteSpace: 'pre-wrap' as const,
  } as React.CSSProperties,

  bankRow: {
    color: '#374151',
    fontSize: 12.5,
    margin: '2px 0',
  } as React.CSSProperties,
};

const InvoicePrint = forwardRef<HTMLDivElement, Props>(({ invoice, supplier }, ref) => {
  const { i18n } = useTranslation();
  const t = i18n.getFixedT('en');

  const items = invoice.items ?? [];
  const subtotal = calcSubtotal(items);
  const discountAmt = calcDiscount(subtotal, invoice.discount, invoice.discount_type);
  const taxAmt = calcTax(subtotal, discountAmt, invoice.tax_rate);
  const total = subtotal - discountAmt + taxAmt;
  const currency = invoice.currency ?? 'USD';

  const showUnit = items.some((item) => item.unit?.trim());

  const clientLines = [
    invoice.client_address,
    invoice.client_address2,
    [invoice.client_city, invoice.client_state, invoice.client_zip].filter(Boolean).join(', '),
    invoice.client_country,
    invoice.client_tax_id ? `Tax ID: ${invoice.client_tax_id}` : null,
  ].filter(Boolean) as string[];

  return (
    <div ref={ref} style={s.page}>

      {/* ── Header: supplier left | invoice right ── */}
      <div style={s.headerGrid}>
        {/* Supplier */}
        <div>
          <div style={s.supplierName}>{supplier.name || 'Your Company'}</div>
          {supplier.address   && <p style={s.supplierMeta}>{supplier.address}</p>}
          {supplier.address2  && <p style={s.supplierMeta}>{supplier.address2}</p>}
          {(supplier.city || supplier.state || supplier.zip) && (
            <p style={s.supplierMeta}>
              {[supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', ')}
            </p>
          )}
          {supplier.country   && <p style={s.supplierMeta}>{supplier.country}</p>}
          {supplier.email     && <p style={s.supplierMeta}>{supplier.email}</p>}
          {supplier.phone     && <p style={s.supplierMeta}>{supplier.phone}</p>}
          {supplier.website   && <p style={s.supplierMeta}>{supplier.website}</p>}
          {supplier.tax_id    && <p style={s.supplierMeta}>Tax ID: {supplier.tax_id}</p>}
        </div>

        {/* Invoice meta */}
        <div style={s.invoiceMeta}>
          <div style={s.invoiceTitle}>INVOICE</div>
          {[
            { label: 'Invoice #', value: invoice.invoice_number },
            { label: 'Issue Date', value: formatDate(invoice.issue_date) },
            ...(invoice.due_date ? [{ label: 'Due Date', value: formatDate(invoice.due_date) }] : []),
          ].map(({ label, value }) => (
            <div key={label} style={s.invoiceMetaRow}>
              <span style={s.invoiceMetaLabel}>{label}</span>
              <span style={s.invoiceMetaValue}>{value}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>
              {invoice.status === 'paid' ? 'Amount Paid' : 'Balance Due'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>
              {formatCurrency(total, currency)}
            </div>
          </div>
          {invoice.status === 'paid' && (
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <span style={s.paidStamp}>
                PAID{invoice.payment_date ? ` · ${formatDate(invoice.payment_date)}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <hr style={s.divider} />

      {/* ── Bill To ── */}
      <div style={s.billToGrid}>
        <div>
          <div style={s.sectionLabel}>Bill To</div>
          <div style={s.clientName}>{invoice.client_name}</div>
          {clientLines.map((line, i) => (
            <p key={i} style={s.clientMeta}>{line}</p>
          ))}
        </div>
      </div>

      {/* ── Items table ── */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: showUnit ? '45%' : '55%' }}>Description</th>
            {showUnit && <th style={{ ...s.thCenter, width: '10%' }}>Unit</th>}
            <th style={{ ...s.thRight, width: '10%' }}>Qty</th>
            <th style={{ ...s.thRight, width: '17%' }}>Unit Price</th>
            <th style={{ ...s.thRight, width: '18%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={s.td}>{item.description}</td>
              {showUnit && <td style={s.tdCenter}>{item.unit}</td>}
              <td style={s.tdRight}>{item.quantity}</td>
              <td style={s.tdRight}>{formatCurrency(item.unit_price, currency)}</td>
              <td style={s.tdTotalRight}>{formatCurrency(item.quantity * item.unit_price, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals ── */}
      <div style={s.totalsWrap}>
        <div style={s.totalsBox}>
          <div style={s.totalsRow}>
            <span style={s.totalsLabel}>Subtotal</span>
            <span style={s.totalsValue}>{formatCurrency(subtotal, currency)}</span>
          </div>

          {discountAmt > 0 && (
            <div style={s.totalsRow}>
              <span style={s.totalsLabel}>
                Discount{invoice.discount_type === 'percent' ? ` (${invoice.discount}%)` : ''}
              </span>
              <span style={{ ...s.totalsValue, color: '#dc2626' }}>
                −{formatCurrency(discountAmt, currency)}
              </span>
            </div>
          )}

          {invoice.tax_rate > 0 && (
            <div style={s.totalsRow}>
              <span style={s.totalsLabel}>Tax ({invoice.tax_rate}%)</span>
              <span style={s.totalsValue}>{formatCurrency(taxAmt, currency)}</span>
            </div>
          )}

          <hr style={s.totalsDivider} />

          <div style={s.totalsRow}>
            <span style={s.grandTotalLabel}>Total</span>
            <span style={s.grandTotalValue}>{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      {invoice.notes && (
        <>
          <hr style={s.divider} />
          <div style={s.sectionTitle}>Notes</div>
          <p style={s.noteText}>{invoice.notes}</p>
        </>
      )}

      {/* ── Bank / Payment details ── */}
      {(supplier.bank_name || supplier.iban || supplier.bank_account) && (
        <>
          <hr style={{ ...s.divider, marginTop: 20 }} />
          <div style={s.sectionTitle}>Payment Details</div>
          {supplier.bank_name    && <p style={s.bankRow}>Bank: {supplier.bank_name}</p>}
          {supplier.bank_account && <p style={s.bankRow}>Account: {supplier.bank_account}</p>}
          {supplier.bank_routing && <p style={s.bankRow}>Routing / Agency: {supplier.bank_routing}</p>}
          {supplier.iban         && <p style={s.bankRow}>IBAN: {supplier.iban}</p>}
          {supplier.swift        && <p style={s.bankRow}>SWIFT / BIC: {supplier.swift}</p>}
        </>
      )}
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
export default InvoicePrint;
