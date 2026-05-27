import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Group, Button, Card, Text, Modal,
  TextInput, NumberInput, ActionIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  getTemplateItems, createTemplateItem, updateTemplateItem, deleteTemplateItem,
} from '../db/templates';
import type { TemplateItem } from '../types';
import { formatCurrency } from '../utils/format';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const emptyItem = (): Omit<TemplateItem, 'id'> => ({
  description: '', quantity: 1, unit_price: 0, unit: 'hrs', sort_order: 0,
});

export default function Templates() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const form = useForm<Omit<TemplateItem, 'id'>>({
    initialValues: emptyItem(),
    validate: {
      description: (v) => v.trim() ? null : t('common.required'),
      unit_price: (v) => v >= 0 ? null : '≥ 0',
    },
  });

  const load = useCallback(async () => {
    setItems(await getTemplateItems());
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    form.setValues({ ...emptyItem(), sort_order: items.length });
    setModalOpen(true);
  };

  const openEdit = (item: TemplateItem) => {
    setEditId(item.id);
    form.setValues({
      description: item.description, quantity: item.quantity,
      unit_price: item.unit_price, unit: item.unit, sort_order: item.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (editId !== null) {
      await updateTemplateItem(editId, values);
      notifications.show({ message: t('template.updated'), color: 'green' });
    } else {
      await createTemplateItem(values);
      notifications.show({ message: t('template.created'), color: 'green' });
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = (item: TemplateItem) => {
    modals.openConfirmModal({
      title: t('template.deleteConfirmTitle'),
      children: (
        <Text size="sm"
          dangerouslySetInnerHTML={{ __html: t('template.deleteConfirmMsg', { description: item.description }) }}
        />
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteTemplateItem(item.id);
        notifications.show({ message: t('template.deleted'), color: 'red' });
        load();
      },
    });
  };

  const columnDefs: ColDef<TemplateItem>[] = [
    { field: 'sort_order', headerName: '#', width: 60 },
    { field: 'description', headerName: t('invoice.item.description'), flex: 1, minWidth: 200 },
    { field: 'unit', headerName: t('invoice.item.unit'), width: 100 },
    { field: 'quantity', headerName: t('invoice.item.qty'), width: 90, type: 'rightAligned' },
    {
      field: 'unit_price', headerName: t('invoice.item.unitPrice'), width: 140, type: 'rightAligned',
      valueFormatter: (p) => formatCurrency(p.value ?? 0),
    },
    {
      headerName: t('invoice.item.total'), width: 140, type: 'rightAligned',
      valueGetter: (p) => (p.data?.quantity ?? 0) * (p.data?.unit_price ?? 0),
      valueFormatter: (p) => formatCurrency(p.value ?? 0),
      cellStyle: { fontWeight: 500 },
    },
    {
      headerName: t('common.actions'), width: 100, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<TemplateItem>) => (
        <Group gap={4}>
          <ActionIcon variant="subtle" size="sm" onClick={() => openEdit(p.data!)}>
            <IconEdit size={14} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDelete(p.data!)}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={2} fw={700}>{t('template.title')}</Title>
          <Text size="sm" c="dimmed">{t('template.subtitle')}</Text>
        </Stack>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('template.new')}
        </Button>
      </Group>

      <Card p="md" radius="lg" withBorder>
        <div className="ag-theme-quartz" style={{ height: 440 }}>
          <AgGridReact
            ref={gridRef} rowData={items} columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: false, resizable: true }}
            rowHeight={48} animateRows
          />
        </div>
      </Card>

      <Modal
        opened={modalOpen} onClose={() => setModalOpen(false)}
        title={<Text fw={600}>{editId ? t('template.editTitle') : t('template.addTitle')}</Text>}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label={t('invoice.item.description')} required {...form.getInputProps('description')} />
            <Group grow>
              <NumberInput label={t('invoice.item.qty')} min={0} decimalScale={2} {...form.getInputProps('quantity')} />
              <TextInput
                label={t('invoice.item.unit')}
                placeholder={t('template.unitPlaceholder')}
                {...form.getInputProps('unit')}
              />
            </Group>
            <NumberInput
              label={t('invoice.item.unitPrice')} min={0} decimalScale={2} prefix="$"
              {...form.getInputProps('unit_price')}
            />
            <NumberInput label={t('template.sortOrder')} min={0} {...form.getInputProps('sort_order')} />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{editId ? t('common.saveChanges') : t('common.addItem')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
