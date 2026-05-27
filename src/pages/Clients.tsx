import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Group, Button, Card, Text, Modal,
  TextInput, Textarea, Grid, ActionIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { getClients, createClient, updateClient, deleteClient } from '../db/clients';
import type { Client } from '../types';
import { formatDate } from '../utils/format';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const emptyClient = (): Omit<Client, 'id' | 'created_at' | 'updated_at'> => ({
  name: '', address: '', address2: '', city: '', state: '',
  zip: '', country: '', email: '', phone: '', tax_id: '',
  contact_person: '', notes: '',
});

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const form = useForm({ initialValues: emptyClient() });

  const load = useCallback(async () => {
    setClients(await getClients());
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    form.setValues(emptyClient());
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditId(client.id);
    form.setValues({
      name: client.name, address: client.address, address2: client.address2,
      city: client.city, state: client.state, zip: client.zip,
      country: client.country, email: client.email, phone: client.phone,
      tax_id: client.tax_id, contact_person: client.contact_person, notes: client.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.name.trim()) { form.setFieldError('name', t('common.required')); return; }
    if (editId !== null) {
      await updateClient(editId, values);
      notifications.show({ message: t('client.updated'), color: 'green' });
    } else {
      await createClient(values);
      notifications.show({ message: t('client.created'), color: 'green' });
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = (client: Client) => {
    modals.openConfirmModal({
      title: t('client.deleteConfirmTitle'),
      children: (
        <Text size="sm"
          dangerouslySetInnerHTML={{ __html: t('client.deleteConfirmMsg', { name: client.name }) }}
        />
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteClient(client.id);
        notifications.show({ message: t('client.deleted'), color: 'red' });
        load();
      },
    });
  };

  const columnDefs: ColDef<Client>[] = [
    { field: 'name', headerName: t('common.name'), flex: 1, minWidth: 180 },
    {
      headerName: t('common.location'), flex: 1, minWidth: 150,
      valueGetter: (p) =>
        [p.data?.city, p.data?.state, p.data?.country].filter(Boolean).join(', ') || '—',
    },
    { field: 'email', headerName: t('common.email'), flex: 1, minWidth: 180 },
    { field: 'phone', headerName: t('common.phone'), width: 140 },
    {
      field: 'created_at', headerName: t('common.since'), width: 120,
      valueFormatter: (p) => formatDate(p.value),
    },
    {
      headerName: t('common.actions'), width: 100, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Client>) => (
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
        <Title order={2} fw={700}>{t('client.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('client.new')}
        </Button>
      </Group>

      <Card p="md" radius="lg" withBorder>
        <div className="ag-theme-quartz" style={{ height: 520 }}>
          <AgGridReact
            ref={gridRef} rowData={clients} columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            pagination paginationPageSize={20} rowHeight={48} animateRows
          />
        </div>
      </Card>

      <Modal
        opened={modalOpen} onClose={() => setModalOpen(false)}
        title={<Text fw={600}>{editId ? t('client.editTitle') : t('client.newTitle')}</Text>}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label={t('common.name')} required {...form.getInputProps('name')} />
            <Grid gutter="sm">
              <Grid.Col span={6}>
                <TextInput label={t('common.contactPerson')} {...form.getInputProps('contact_person')} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label={t('common.email')} {...form.getInputProps('email')} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label={t('common.phone')} {...form.getInputProps('phone')} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label={t('common.taxId')} {...form.getInputProps('tax_id')} />
              </Grid.Col>
            </Grid>
            <TextInput label={t('common.address')} {...form.getInputProps('address')} />
            <TextInput label={t('common.address2')} {...form.getInputProps('address2')} />
            <Grid gutter="sm">
              <Grid.Col span={4}>
                <TextInput label={t('common.city')} {...form.getInputProps('city')} />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput label={t('common.state')} {...form.getInputProps('state')} />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput label={t('common.zip')} {...form.getInputProps('zip')} />
              </Grid.Col>
            </Grid>
            <TextInput label={t('common.country')} {...form.getInputProps('country')} />
            <Textarea label={t('common.notes')} rows={2} {...form.getInputProps('notes')} />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{editId ? t('common.saveChanges') : t('client.new')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
