import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Invoice, Supplier } from '../../types';
import { formatCurrency, formatDate, calcSubtotal, calcDiscount, calcTax } from '../../utils/format';

const c = {
  dark: '#111827',
  mid: '#374151',
  muted: '#6b7280',
  light: '#9ca3af',
  border: '#e5e7eb',
  bg: '#f3f4f6',
  paidBg: '#d1fae5',
  paidText: '#065f46',
  red: '#dc2626',
  white: '#ffffff',
};

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: c.dark, paddingTop: 48, paddingBottom: 48, paddingHorizontal: 48, backgroundColor: c.white },

  // Header
  headerRow: { flexDirection: 'row', marginBottom: 24 },
  headerLeft: { flex: 1, paddingRight: 16 },
  headerRight: { width: 190, alignItems: 'flex-end' },
  supplierName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: c.dark, marginBottom: 6 },
  supplierMeta: { color: c.muted, fontSize: 9, marginBottom: 2 },
  invoiceRight: { alignItems: 'flex-end' }, // kept for reference, replaced by headerRight
  invoiceMonthYear: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.light, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  invoiceTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: c.dark, letterSpacing: -0.5, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  metaLabel: { color: c.light, fontSize: 9 },
  metaValue: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: c.dark },
  balanceLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.light, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2, marginTop: 10 },
  balanceValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: c.dark },
  paidStamp: { backgroundColor: c.paidBg, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 10, marginTop: 6, alignSelf: 'flex-end' },
  paidStampText: { color: c.paidText, fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 0.5 },

  divider: { borderBottomWidth: 1, borderBottomColor: c.border, marginBottom: 20 },

  // Bill To
  billToSection: { marginBottom: 22 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.light, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  clientName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: c.dark, marginBottom: 3 },
  clientMeta: { color: c.muted, fontSize: 9, marginBottom: 1 },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: c.bg, borderWidth: 1, borderColor: c.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: c.border },
  th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.4, padding: 7 },
  td: { fontSize: 9, color: c.mid, padding: 7 },
  tdBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.dark, padding: 7 },

  colDesc: { flex: 1 },
  colUnit: { width: 50, alignItems: 'center' },
  colQty: { width: 40, alignItems: 'flex-end' },
  colPrice: { width: 70, alignItems: 'flex-end' },
  colTotal: { width: 75, alignItems: 'flex-end' },

  // Totals
  totalsWrap: { alignItems: 'flex-end', marginTop: 6, marginBottom: 20 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsLabel: { color: c.muted, fontSize: 10 },
  totalsValue: { fontSize: 10, color: c.dark },
  totalsDivider: { borderBottomWidth: 1, borderBottomColor: c.border, marginVertical: 4 },
  grandLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: c.dark },
  grandValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: c.dark },

  // Notes / Bank
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.light, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, marginTop: 16 },
  noteText: { color: c.mid, fontSize: 9, lineHeight: 1.5 },
  bankRow: { color: c.mid, fontSize: 9, marginBottom: 2 },
});

interface Props {
  invoice: Invoice;
  supplier: Supplier;
}

export default function InvoiceDocument({ invoice, supplier }: Props) {
  const monthYear = invoice.issue_date
    ? new Date(invoice.issue_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

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

  const supplierLines = [
    supplier.address,
    supplier.address2,
    [supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', '),
    supplier.country,
    supplier.email,
    supplier.phone,
    supplier.website,
    supplier.tax_id ? `Tax ID: ${supplier.tax_id}` : null,
  ].filter(Boolean) as string[];

  const hasBankDetails = !!(supplier.payment_provider || supplier.bank_name || supplier.bank_address || supplier.bank_account || supplier.bank_routing || supplier.iban || supplier.swift);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.supplierName}>{supplier.name || 'Your Company'}</Text>
            {supplierLines.map((line, i) => <Text key={i} style={s.supplierMeta}>{line}</Text>)}
          </View>

          <View style={s.headerRight}>
            {!!monthYear && <Text style={s.invoiceMonthYear}>{monthYear}</Text>}
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice #</Text>
              <Text style={s.metaValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Issue Date</Text>
              <Text style={s.metaValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            {invoice.due_date && (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Due Date</Text>
                <Text style={s.metaValue}>{formatDate(invoice.due_date)}</Text>
              </View>
            )}
            <Text style={s.balanceLabel}>{invoice.status === 'paid' ? 'Amount Paid' : 'Balance Due'}</Text>
            <Text style={s.balanceValue}>{formatCurrency(total, currency)}</Text>
            {invoice.status === 'paid' && (
              <View style={s.paidStamp}>
                <Text style={s.paidStampText}>
                  PAID{invoice.payment_date ? ` · ${formatDate(invoice.payment_date)}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Bill To ── */}
        <View style={s.billToSection}>
          <Text style={s.sectionLabel}>Bill To</Text>
          <Text style={s.clientName}>{invoice.client_name}</Text>
          {clientLines.map((line, i) => <Text key={i} style={s.clientMeta}>{line}</Text>)}
        </View>

        {/* ── Items Table ── */}
        <View style={s.tableHeader}>
          <View style={s.colDesc}><Text style={s.th}>Description</Text></View>
          {showUnit && <View style={s.colUnit}><Text style={[s.th, { textAlign: 'center' }]}>Unit</Text></View>}
          <View style={s.colQty}><Text style={[s.th, { textAlign: 'right' }]}>Qty</Text></View>
          <View style={s.colPrice}><Text style={[s.th, { textAlign: 'right' }]}>Unit Price</Text></View>
          <View style={s.colTotal}><Text style={[s.th, { textAlign: 'right' }]}>Total</Text></View>
        </View>

        {items.map((item, i) => (
          <View key={i} style={s.tableRow} wrap={false}>
            <View style={s.colDesc}><Text style={s.td}>{item.description}</Text></View>
            {showUnit && <View style={s.colUnit}><Text style={[s.td, { textAlign: 'center' }]}>{item.unit}</Text></View>}
            <View style={s.colQty}><Text style={[s.td, { textAlign: 'right' }]}>{item.quantity}</Text></View>
            <View style={s.colPrice}><Text style={[s.td, { textAlign: 'right' }]}>{formatCurrency(item.unit_price, currency)}</Text></View>
            <View style={s.colTotal}><Text style={[s.tdBold, { textAlign: 'right' }]}>{formatCurrency(item.quantity * item.unit_price, currency)}</Text></View>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{formatCurrency(subtotal, currency)}</Text>
            </View>
            {discountAmt > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>
                  Discount{invoice.discount_type === 'percent' ? ` (${invoice.discount}%)` : ''}
                </Text>
                <Text style={[s.totalsValue, { color: c.red }]}>−{formatCurrency(discountAmt, currency)}</Text>
              </View>
            )}
            {invoice.tax_rate > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Tax ({invoice.tax_rate}%)</Text>
                <Text style={s.totalsValue}>{formatCurrency(taxAmt, currency)}</Text>
              </View>
            )}
            <View style={s.totalsDivider} />
            <View style={s.totalsRow}>
              <Text style={s.grandLabel}>Total</Text>
              <Text style={s.grandValue}>{formatCurrency(total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ── */}
        {invoice.notes && (
          <View>
            <View style={s.divider} />
            <Text style={s.sectionTitle}>Notes</Text>
            <Text style={s.noteText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Payment Details ── */}
        {hasBankDetails && (
          <View>
            <View style={[s.divider, { marginTop: 16 }]} />
            <Text style={s.sectionTitle}>Payment Details</Text>
            {!!supplier.name           && <Text style={s.bankRow}>Account Holder: {supplier.name}</Text>}
            {!!supplier.payment_provider && <Text style={s.bankRow}>Payment Provider: {supplier.payment_provider}</Text>}
            {!!supplier.bank_name      && <Text style={s.bankRow}>Receiving Bank: {supplier.bank_name}</Text>}
            {!!supplier.bank_address   && <Text style={s.bankRow}>Bank Address: {supplier.bank_address}</Text>}
            {!!supplier.bank_account   && <Text style={s.bankRow}>Account Number: {supplier.bank_account}</Text>}
            {!!supplier.bank_routing   && <Text style={s.bankRow}>Routing Number (ACH/Wire): {supplier.bank_routing}</Text>}
            {!!supplier.iban           && <Text style={s.bankRow}>IBAN: {supplier.iban}</Text>}
            {!!supplier.swift          && <Text style={s.bankRow}>SWIFT / BIC: {supplier.swift}</Text>}
            {!!invoice.currency        && <Text style={s.bankRow}>Currency: {invoice.currency}</Text>}
          </View>
        )}

      </Page>
    </Document>
  );
}
