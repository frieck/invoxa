import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Button, Card, Text, TextInput,
  Textarea, Grid, Group, Divider, Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconBuildingStore, IconBuildingBank } from '@tabler/icons-react';
import { getSupplier, saveSupplier } from '../db/supplier';
import type { Supplier } from '../types';

export default function SupplierPage() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const form = useForm<Omit<Supplier, 'id'>>({
    initialValues: {
      name: '', address: '', address2: '', city: '', state: '', zip: '',
      country: '', email: '', phone: '', tax_id: '', bank_name: '',
      bank_account: '', bank_routing: '', iban: '', swift: '', website: '', notes: '',
    },
    validate: {
      name: (v) => v.trim() ? null : t('common.required'),
    },
  });

  useEffect(() => {
    getSupplier().then((s) => {
      form.setValues({
        name: s.name, address: s.address, address2: s.address2,
        city: s.city, state: s.state, zip: s.zip, country: s.country,
        email: s.email, phone: s.phone, tax_id: s.tax_id,
        bank_name: s.bank_name, bank_account: s.bank_account,
        bank_routing: s.bank_routing, iban: s.iban, swift: s.swift,
        website: s.website, notes: s.notes,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setSaving(true);
    await saveSupplier(values);
    notifications.show({ message: t('supplier.saved'), color: 'green' });
    setSaving(false);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} fw={700}>{t('supplier.title')}</Title>
        <Button
          leftSection={<IconDeviceFloppy size={16} />} loading={saving}
          onClick={() => { const v = form.validate(); if (!v.hasErrors) handleSubmit(form.values); }}
        >
          {t('common.save')}
        </Button>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Tabs defaultValue="info">
          <Tabs.List mb="md">
            <Tabs.Tab value="info" leftSection={<IconBuildingStore size={14} />}>
              {t('supplier.companyInfo')}
            </Tabs.Tab>
            <Tabs.Tab value="bank" leftSection={<IconBuildingBank size={14} />}>
              {t('supplier.bankDetails')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="info">
            <Card p="lg" radius="lg" withBorder>
              <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                {t('supplier.companyInfo')}
              </Text>
              <Stack gap="sm">
                <Grid gutter="sm">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t('supplier.companyName')} required {...form.getInputProps('name')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t('common.website')} {...form.getInputProps('website')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t('common.email')} {...form.getInputProps('email')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t('common.phone')} {...form.getInputProps('phone')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t('supplier.taxId')} {...form.getInputProps('tax_id')} />
                  </Grid.Col>
                </Grid>

                <Divider label={t('common.address')} labelPosition="left" my="xs" />

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
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="bank">
            <Card p="lg" radius="lg" withBorder>
              <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                {t('supplier.bankInfo')}
              </Text>
              <Text size="sm" c="dimmed" mb="md">{t('supplier.bankInfoDesc')}</Text>
              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label={t('supplier.bankName')} {...form.getInputProps('bank_name')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label={t('supplier.bankAccount')} {...form.getInputProps('bank_account')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label={t('supplier.bankRouting')} {...form.getInputProps('bank_routing')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label={t('supplier.iban')} {...form.getInputProps('iban')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label={t('supplier.swift')} {...form.getInputProps('swift')} />
                </Grid.Col>
              </Grid>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </form>
    </Stack>
  );
}
