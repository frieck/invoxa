import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Group, Button, TextInput, NumberInput,
  Select, Textarea, Card, Text, Grid, Divider, ActionIcon,
  Box, Badge, Tabs, SegmentedControl,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { agTheme } from '../utils/agTheme';
import {
  IconArrowLeft, IconDeviceFloppy, IconPlus, IconTrash,
  IconCheck, IconFileTypePdf, IconCopy,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getInvoice, createInvoice, updateInvoice, markAsPaid } from '../db/invoices';
import { getClients } from '../db/clients';
import { getTemplateItems } from '../db/templates';
import { getSettings } from '../db/settings';
import { getSupplier } from '../db/supplier';
import type { Invoice, InvoiceItem, Client, Supplier } from '../types';
import { CURRENCIES } from '../types';
import {
  formatCurrency, formatDate, nextInvoiceNumber,
  calcSubtotal, calcDiscount, calcTax, formatDateISO, parseDate,
} from '../utils/format';
import StatusBadge from '../components/Invoice/StatusBadge';
import InvoicePrint from '../components/Invoice/InvoicePrint';
import { exportToPdf } from '../utils/pdf';

type ItemRow = InvoiceItem & { _id: string };

function newRow(sort_order = 0): ItemRow {
  return {
    _id: Math.random().toString(36).slice(2),
    description: '', quantity: 1, unit_price: 0, unit: 'hrs', sort_order,
  };
}

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const printRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<AgGridReact>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<ItemRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('edit');
  const isPaid = invoice?.status === 'paid';
  const isCancelled = invoice?.status === 'cancelled';
  const readonly = !isNew && (isPaid || isCancelled);

  const form = useForm({
    initialValues: {
      invoice_number: '',
      client_id: '',
      issue_date: new Date(),
      due_date: null as Date | null,
      status: 'draft' as Invoice['status'],
      currency: 'USD',
      tax_rate: 0,
      discount_type: 'fixed' as 'fixed' | 'percent',
      discount: 0,
      notes: '',
    },
    validate: {
      invoice_number: (v: string) => v ? null : t('common.required'),
      client_id: (v: string) => v ? null : t('common.required'),
    },
  });

  const loadData = useCallback(async () => {
    const [clientList, supplierData, settings] = await Promise.all([
      getClients(),
      getSupplier(),
      getSettings(),
    ]);
    setClients(clientList);
    setSupplier(supplierData);

    if (!isNew && id) {
      const inv = await getInvoice(Number(id));
      if (!inv) { navigate('/invoices'); return; }
      setInvoice(inv);
      form.setValues({
        invoice_number: inv.invoice_number,
        client_id: String(inv.client_id),
        issue_date: parseDate(inv.issue_date) ?? new Date(),
        due_date: parseDate(inv.due_date),
        status: inv.status,
        currency: inv.currency,
        tax_rate: inv.tax_rate,
        discount_type: inv.discount_type,
        discount: inv.discount,
        notes: inv.notes,
      });
      setItems((inv.items ?? []).map((it) => ({ ...it, _id: Math.random().toString(36).slice(2) })));
    } else {
      const nextNum = nextInvoiceNumber(settings.last_invoice_number, settings.invoice_prefix);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(settings.default_due_days, 10));
      form.setValues({
        invoice_number: nextNum,
        currency: settings.default_currency,
        tax_rate: parseFloat(settings.default_tax_rate) || 0,
        issue_date: new Date(),
        due_date: dueDate,
        status: 'draft',
        discount_type: 'fixed',
        discount: 0,
        notes: '',
        client_id: '',
      });
      const templateItems = await getTemplateItems();
      if (templateItems.length > 0) {
        setItems(templateItems.map((t, i) => ({
          _id: Math.random().toString(36).slice(2),
          description: t.description,
          quantity: t.quantity,
          unit_price: t.unit_price,
          unit: t.unit,
          sort_order: i,
        })));
      } else {
        setItems([newRow()]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (searchParams.get('print') === '1' && tab !== 'print') setTab('print');
  }, [searchParams, tab]);

  const subtotal = calcSubtotal(items);
  const discountAmt = calcDiscount(subtotal, form.values.discount, form.values.discount_type);
  const taxAmt = calcTax(subtotal, discountAmt, form.values.tax_rate);
  const total = subtotal - discountAmt + taxAmt;

  const handleSave = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;
    if (items.every((it) => !it.description)) {
      notifications.show({ message: t('invoice.addAtLeastOneItem'), color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const v = form.values;
      const payload: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'subtotal' | 'tax_amount' | 'total'> = {
        invoice_number: v.invoice_number,
        client_id: Number(v.client_id),
        issue_date: formatDateISO(v.issue_date),
        due_date: formatDateISO(v.due_date),
        status: v.status,
        currency: v.currency,
        tax_rate: v.tax_rate,
        discount_type: v.discount_type,
        discount: v.discount,
        notes: v.notes,
        payment_date: null,
      };
      const cleanItems = items.filter((it) => it.description.trim()).map(({ _id, ...rest }) => rest);
      if (isNew) {
        const newId = await createInvoice(payload, cleanItems);
        notifications.show({ message: t('invoice.created'), color: 'green' });
        navigate(`/invoices/${newId}`);
      } else {
        await updateInvoice(Number(id), payload, cleanItems);
        notifications.show({ message: t('invoice.saved'), color: 'green' });
        loadData();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      notifications.show({ message: msg, color: 'red' });
    }
    setSaving(false);
  };

  const handleMarkPaid = () => {
    let paymentDate = new Date();
    modals.open({
      title: t('invoice.markPaidConfirmTitle'),
      children: (
        <Stack gap="md">
          <Text size="sm">{t('invoice.markPaidConfirmMsg')}</Text>
          <DatePickerInput
            label={t('invoice.paymentDate')}
            defaultValue={paymentDate}
            onChange={(v) => { if (v) paymentDate = v; }}
            valueFormat="DD/MM/YYYY"
            maxDate={new Date()}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => modals.closeAll()}>
              {t('common.cancel')}
            </Button>
            <Button color="green" onClick={async () => {
              modals.closeAll();
              await markAsPaid(Number(id), formatDateISO(paymentDate));
              notifications.show({ message: t('invoice.markedPaid'), color: 'green' });
              loadData();
            }}>
              {t('invoice.markAsPaid')}
            </Button>
          </Group>
        </Stack>
      ),
    });
  };

  const addRow = () => setItems((prev) => [...prev, newRow(prev.length)]);
  const removeRow = (rowId: string) => setItems((prev) => prev.filter((r) => r._id !== rowId));

  const updateRow = useCallback((rowId: string, field: keyof InvoiceItem, value: unknown) => {
    setItems((prev) => prev.map((r) => r._id === rowId ? { ...r, [field]: value } : r));
  }, []);

  const columnDefs: ColDef<ItemRow>[] = [
    {
      field: 'description', headerName: t('invoice.item.description'), flex: 1, minWidth: 200,
      editable: !readonly, cellEditor: 'agTextCellEditor',
      onCellValueChanged: (p) => updateRow(p.data._id, 'description', p.newValue),
    },
    {
      field: 'unit', headerName: t('invoice.item.unit'), width: 90,
      editable: !readonly, cellEditor: 'agTextCellEditor',
      onCellValueChanged: (p) => updateRow(p.data._id, 'unit', p.newValue),
    },
    {
      field: 'quantity', headerName: t('invoice.item.qty'), width: 90, type: 'rightAligned',
      editable: !readonly, cellEditor: 'agNumberCellEditor',
      onCellValueChanged: (p) => updateRow(p.data._id, 'quantity', Number(p.newValue)),
    },
    {
      field: 'unit_price', headerName: t('invoice.item.unitPrice'), width: 140, type: 'rightAligned',
      editable: !readonly, cellEditor: 'agNumberCellEditor',
      valueFormatter: (p) => formatCurrency(p.value ?? 0, form.values.currency),
      onCellValueChanged: (p) => updateRow(p.data._id, 'unit_price', Number(p.newValue)),
    },
    {
      headerName: t('invoice.item.total'), width: 140, type: 'rightAligned',
      valueGetter: (p) => (p.data?.quantity ?? 0) * (p.data?.unit_price ?? 0),
      valueFormatter: (p) => formatCurrency(p.value ?? 0, form.values.currency),
      cellStyle: { fontWeight: 600 },
    },
    {
      headerName: '', width: 50, sortable: false, filter: false, hide: readonly,
      cellRenderer: (p: ICellRendererParams<ItemRow>) => (
        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeRow(p.data!._id)}>
          <IconTrash size={14} />
        </ActionIcon>
      ),
    },
  ];

  const previewInvoice: Invoice | null = invoice
    ? {
        ...invoice, ...form.values,
        client_id: Number(form.values.client_id),
        issue_date: formatDateISO(form.values.issue_date),
        due_date: formatDateISO(form.values.due_date),
        client_name: clients.find((c) => String(c.id) === form.values.client_id)?.name ?? invoice.client_name,
        items: items.filter((it) => it.description.trim()),
      }
    : null;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" onClick={() => navigate('/invoices')}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2} fw={700}>
            {isNew ? t('invoice.new') : `${t('invoice.number')}${form.values.invoice_number}`}
          </Title>
          {invoice && <StatusBadge status={invoice.status} size="lg" />}
        </Group>
        <Group>
          {!isNew && !readonly && (
            <Button variant="light" color="green" leftSection={<IconCheck size={16} />} onClick={handleMarkPaid}>
              {t('invoice.markAsPaid')}
            </Button>
          )}
          {!readonly && (
            <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
              {isNew ? t('invoice.new') : t('common.saveChanges')}
            </Button>
          )}
        </Group>
      </Group>

      <Tabs value={tab} onChange={(v) => setTab(v ?? 'edit')}>
        <Tabs.List mb="md">
          <Tabs.Tab value="edit">
            {readonly ? t('invoice.viewInvoice') : t('invoice.editInvoice')}
          </Tabs.Tab>
          <Tabs.Tab value="print" leftSection={<IconFileTypePdf size={14} />}>
            {t('invoice.exportPdf')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="edit">
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="md">
                <Card p="lg" radius="lg" withBorder>
                  <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                    {t('invoice.invoiceDetails')}
                  </Text>
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <TextInput
                        label={t('invoice.invoiceNumber')} required
                        {...form.getInputProps('invoice_number')} disabled={readonly}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        label={t('invoice.client')} required
                        placeholder={t('invoice.selectClient')}
                        data={clients.map((c) => ({ value: String(c.id), label: c.name }))}
                        {...form.getInputProps('client_id')} disabled={readonly} searchable
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <DatePickerInput
                        label={t('invoice.issueDate')} placeholder="DD/MM/YYYY"
                        {...form.getInputProps('issue_date')} disabled={readonly}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <DatePickerInput
                        label={t('invoice.dueDate')} placeholder="DD/MM/YYYY"
                        clearable {...form.getInputProps('due_date')} disabled={readonly}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select label={t('invoice.currency')} data={CURRENCIES} {...form.getInputProps('currency')} disabled={readonly} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      {!isNew && (
                        <Select
                          label={t('invoice.status')}
                          data={[
                            { value: 'draft', label: t('status.draft') },
                            { value: 'sent', label: t('status.sent') },
                            { value: 'cancelled', label: t('status.cancelled') },
                          ]}
                          {...form.getInputProps('status')} disabled={readonly}
                        />
                      )}
                    </Grid.Col>
                  </Grid>
                </Card>

                <Card p="lg" radius="lg" withBorder>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                      {t('invoice.lineItems')}
                    </Text>
                    {!readonly && (
                      <Group gap="xs">
                        <Button
                          size="xs" variant="light" leftSection={<IconCopy size={14} />}
                          onClick={async () => {
                            const tItems = await getTemplateItems();
                            if (tItems.length === 0) {
                              notifications.show({ message: t('invoice.noTemplateItems'), color: 'yellow' });
                              return;
                            }
                            setItems(tItems.map((ti, i) => ({
                              _id: Math.random().toString(36).slice(2),
                              description: ti.description, quantity: ti.quantity,
                              unit_price: ti.unit_price, unit: ti.unit, sort_order: i,
                            })));
                          }}
                        >
                          {t('invoice.loadTemplate')}
                        </Button>
                        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={addRow}>
                          {t('invoice.addRow')}
                        </Button>
                      </Group>
                    )}
                  </Group>
                  <div style={{ height: 280 }}>
                    <AgGridReact
                      ref={gridRef} theme={agTheme} rowData={items} columnDefs={columnDefs}
                      defaultColDef={{ resizable: true, cellStyle: { display: 'flex', alignItems: 'center' } }}
                      columnTypes={{ rightAligned: { cellStyle: { justifyContent: 'flex-end' } } }}
                      rowHeight={42}
                      singleClickEdit stopEditingWhenCellsLoseFocus
                      suppressCellFocus={readonly} getRowId={(p) => p.data._id}
                    />
                  </div>
                </Card>

                <Card p="lg" radius="lg" withBorder>
                  <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                    {t('invoice.notes')}
                  </Text>
                  <Textarea
                    placeholder={t('invoice.notesPlaceholder')} rows={3}
                    {...form.getInputProps('notes')} disabled={readonly}
                  />
                </Card>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="lg" radius="lg" withBorder style={{ position: 'sticky', top: 20 }}>
                <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                  {t('invoice.summary')}
                </Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('invoice.subtotal')}</Text>
                    <Text size="sm" fw={500}>{formatCurrency(subtotal, form.values.currency)}</Text>
                  </Group>
                  <Grid gutter="xs">
                    <Grid.Col span={7}>
                      <NumberInput
                        label={t('invoice.discount')} min={0}
                        value={form.values.discount}
                        onChange={(v) => form.setFieldValue('discount', Number(v))}
                        disabled={readonly} size="xs"
                      />
                    </Grid.Col>
                    <Grid.Col span={5}>
                      <Box mt={22}>
                        <SegmentedControl
                          size="xs"
                          data={[{ label: '$', value: 'fixed' }, { label: '%', value: 'percent' }]}
                          value={form.values.discount_type}
                          onChange={(v) => form.setFieldValue('discount_type', v as 'fixed' | 'percent')}
                          disabled={readonly}
                        />
                      </Box>
                    </Grid.Col>
                  </Grid>
                  {discountAmt > 0 && (
                    <Group justify="space-between">
                      <Text size="sm" c="red">{t('invoice.discount')}</Text>
                      <Text size="sm" c="red">-{formatCurrency(discountAmt, form.values.currency)}</Text>
                    </Group>
                  )}
                  <NumberInput
                    label={t('invoice.taxRate')} min={0} max={100}
                    value={form.values.tax_rate}
                    onChange={(v) => form.setFieldValue('tax_rate', Number(v))}
                    disabled={readonly} size="xs" suffix="%"
                  />
                  {taxAmt > 0 && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('invoice.taxRate').replace(' (%)', '')} ({form.values.tax_rate}%)</Text>
                      <Text size="sm">{formatCurrency(taxAmt, form.values.currency)}</Text>
                    </Group>
                  )}
                  <Divider />
                  <Group justify="space-between">
                    <Text fw={700}>{t('invoice.total')}</Text>
                    <Text fw={800} size="lg" c="brand.7">
                      {formatCurrency(total, form.values.currency)}
                    </Text>
                  </Group>
                  {invoice?.status === 'paid' && invoice.payment_date && (
                    <Badge color="green" variant="light" fullWidth mt="xs">
                      {t('invoice.paidOn', { date: formatDate(invoice.payment_date) })}
                    </Badge>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="print">
          {(invoice || isNew) && supplier && (
            <Stack gap="md">
              <Group>
                <Button
                  leftSection={<IconFileTypePdf size={16} />} variant="light" color="red"
                  onClick={async () => {
                    if (!invoice || !supplier) return;
                    const month = dayjs(form.values.issue_date).format('MMM-YYYY');
                    const name = supplier?.name?.trim() || 'Invoice';
                    await exportToPdf(invoice, supplier, `Invoice ${name} ${month}.pdf`);
                  }}
                >
                  {t('invoice.exportPdf')}
                </Button>
              </Group>
              <Card p={0} radius="lg" withBorder className="invoice-preview" style={{ overflow: 'auto', height: 'calc(100vh - 280px)' }}>
                <InvoicePrint
                  ref={printRef}
                  invoice={
                    previewInvoice ?? {
                      id: 0,
                      invoice_number: form.values.invoice_number,
                      client_id: Number(form.values.client_id),
                      client_name: clients.find((c) => String(c.id) === form.values.client_id)?.name ?? '',
                      issue_date: formatDateISO(form.values.issue_date),
                      due_date: formatDateISO(form.values.due_date),
                      status: form.values.status,
                      currency: form.values.currency,
                      tax_rate: form.values.tax_rate,
                      discount_type: form.values.discount_type,
                      discount: form.values.discount,
                      notes: form.values.notes,
                      payment_date: null,
                      created_at: '', updated_at: '',
                      items: items.filter((it) => it.description.trim()),
                    }
                  }
                  supplier={supplier}
                />
              </Card>
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
