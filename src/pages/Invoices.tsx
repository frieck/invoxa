import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Group, Button, TextInput, Select, Card, Text, Badge,
  ActionIcon, Menu, Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { agTheme } from '../utils/agTheme';
import {
  IconPlus, IconSearch, IconDots, IconEye, IconEdit,
  IconCheck, IconTrash, IconFileExport, IconFileTypePdf, IconRefresh,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { getInvoices, markAsPaid, deleteInvoice, updateStatus } from '../db/invoices';
import type { Invoice, InvoiceStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

type YearGroupRow = { _yearGroup: string };

function YearGroupRenderer({ data }: ICellRendererParams) {
  return (
    <Group
      px="md"
      gap="xs"
      align="center"
      style={{
        height: '100%',
        background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
        borderBottom: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
      }}
    >
      <Text size="sm" fw={700} c="dimmed">{(data as YearGroupRow)._yearGroup}</Text>
    </Group>
  );
}

export default function Invoices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<AgGridReact>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.client_name ?? '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  }), [invoices, search, statusFilter]);

  const groupedRows = useMemo(() => {
    const sorted = [...filtered].sort((a, b) =>
      (b.issue_date ?? '').localeCompare(a.issue_date ?? '')
    );
    const rows: (Invoice | YearGroupRow)[] = [];
    let lastYear = '';
    for (const inv of sorted) {
      const year = inv.issue_date?.slice(0, 4) ?? '—';
      if (year !== lastYear) {
        rows.push({ _yearGroup: year });
        lastYear = year;
      }
      rows.push(inv);
    }
    return rows;
  }, [filtered]);

  const handleMarkPaid = useCallback((id: number) => {
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
              await markAsPaid(id, paymentDate.toISOString().slice(0, 10));
              notifications.show({ message: t('invoice.markedPaid'), color: 'green' });
              load();
            }}>
              {t('invoice.markAsPaid')}
            </Button>
          </Group>
        </Stack>
      ),
    });
  }, [load, t]);

  const handleDelete = useCallback((id: number, num: string) => {
    modals.openConfirmModal({
      title: t('invoice.deleteConfirmTitle'),
      children: (
        <Text size="sm"
          dangerouslySetInnerHTML={{ __html: t('invoice.deleteConfirmMsg', { number: num }) }}
        />
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteInvoice(id);
        notifications.show({ message: t('invoice.deleted'), color: 'red' });
        load();
      },
    });
  }, [load, t]);

  const handleStatusChange = useCallback(async (id: number, status: InvoiceStatus) => {
    await updateStatus(id, status);
    notifications.show({
      message: t('invoice.statusUpdated', { status: t(`status.${status}`) }),
      color: 'blue',
    });
    load();
  }, [load, t]);

  const columnDefs: ColDef<Invoice>[] = [
    {
      field: 'invoice_number', headerName: t('invoice.number'), width: 140,
      cellRenderer: (p: ICellRendererParams<Invoice>) => (
        <Text size="sm" fw={600} c="brand.4" style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/invoices/${p.data?.id}`)}>
          #{p.value}
        </Text>
      ),
    },
    { field: 'client_name', headerName: t('invoice.client'), flex: 1, minWidth: 150 },
    {
      field: 'issue_date', headerName: t('invoice.issueDate'), width: 140,
      valueFormatter: (p) => formatDate(p.value),
    },
    {
      field: 'due_date', headerName: t('invoice.dueDate'), width: 140,
      valueFormatter: (p) => formatDate(p.value),
      cellStyle: (p) => {
        if (p.data?.status === 'sent' && p.value && p.value < new Date().toISOString().slice(0, 10)) {
          return { color: 'var(--mantine-color-red-6)', fontWeight: 600 };
        }
        return null;
      },
    },
    {
      field: 'status', headerName: t('invoice.status'), width: 120,
      cellRenderer: (p: ICellRendererParams<Invoice>) => (
        <Badge color={STATUS_COLORS[p.value as InvoiceStatus]} variant="light" size="sm" radius="sm">
          {t(`status.${p.value as InvoiceStatus}`)}
        </Badge>
      ),
    },
    {
      field: 'subtotal', headerName: t('invoice.item.total'), width: 140,
      valueFormatter: (p) => formatCurrency(p.value ?? 0, p.data?.currency),
      type: 'rightAligned', cellStyle: { fontWeight: 500 },
    },
    {
      headerName: t('common.actions'), width: 90, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Invoice>) => {
        const inv = p.data!;
        const isPaid = inv.status === 'paid';
        const isCancelled = inv.status === 'cancelled';
        return (
          <Menu shadow="md" width={190}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEye size={14} />}
                onClick={() => navigate(`/invoices/${inv.id}`)}>
                {t('common.view')}
              </Menu.Item>
              {!isPaid && !isCancelled && (
                <Menu.Item leftSection={<IconEdit size={14} />}
                  onClick={() => navigate(`/invoices/${inv.id}`)}>
                  {t('common.edit')}
                </Menu.Item>
              )}
              {!isPaid && !isCancelled && (
                <Menu.Item leftSection={<IconCheck size={14} />} color="green"
                  onClick={() => handleMarkPaid(inv.id)}>
                  {t('invoice.markAsPaid')}
                </Menu.Item>
              )}
              {!isPaid && inv.status === 'draft' && (
                <Menu.Item leftSection={<IconFileExport size={14} />}
                  onClick={() => handleStatusChange(inv.id, 'sent')}>
                  {t('invoice.markAsSent')}
                </Menu.Item>
              )}
              <Menu.Item leftSection={<IconFileTypePdf size={14} />}
                onClick={() => navigate(`/invoices/${inv.id}?print=1`)}>
                {t('invoice.exportPdf')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red"
                onClick={() => handleDelete(inv.id, inv.invoice_number)}>
                {t('common.delete')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        );
      },
    },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} fw={700}>{t('invoice.titlePlural')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/invoices/new')}>
          {t('invoice.new')}
        </Button>
      </Group>

      <Card p="md" radius="lg" withBorder>
        <Group mb="md">
          <TextInput
            placeholder={`${t('invoice.number')}, ${t('invoice.client')}...`}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t('status.allStatuses')}
            clearable value={statusFilter} onChange={setStatusFilter}
            data={[
              { value: 'draft', label: t('status.draft') },
              { value: 'sent', label: t('status.sent') },
              { value: 'paid', label: t('status.paid') },
              { value: 'cancelled', label: t('status.cancelled') },
            ]}
            w={180}
          />
          <Tooltip label={t('common.refresh')}>
            <ActionIcon variant="light" onClick={load} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <div style={{ height: 480 }}>
          <AgGridReact
            ref={gridRef}
            theme={agTheme}
            rowData={groupedRows as Invoice[]}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true, cellStyle: { display: 'flex', alignItems: 'center' } }}
            columnTypes={{ rightAligned: { cellStyle: { justifyContent: 'flex-end' } } }}
            pagination paginationPageSize={15}
            getRowHeight={(params) => (params.data as any)?._yearGroup ? 34 : 48}
            getRowId={(params) =>
              (params.data as any)?._yearGroup
                ? `year-${(params.data as any)._yearGroup}`
                : String((params.data as Invoice).id)
            }
            isFullWidthRow={(params) => !!(params.rowNode.data as any)?._yearGroup}
            fullWidthCellRenderer={YearGroupRenderer}
            animateRows suppressCellFocus
          />
        </div>
      </Card>
    </Stack>
  );
}
