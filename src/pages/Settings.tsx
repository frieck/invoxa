import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Button, Card, Text, TextInput,
  NumberInput, Group, Select, Divider, Alert, SegmentedControl,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconDeviceFloppy, IconDownload, IconAlertCircle } from '@tabler/icons-react';
import { save } from '@tauri-apps/plugin-dialog';
import { copyFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { getSettings, setSetting } from '../db/settings';
import { storeLanguage, type Language, LANGUAGES } from '../i18n';
import type { AppSettings } from '../types';
import { CURRENCIES } from '../types';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const activeScheme = colorScheme ?? 'auto';
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const form = useForm<AppSettings>({
    initialValues: {
      last_invoice_number: '0',
      default_currency: 'USD',
      default_tax_rate: '0',
      invoice_prefix: 'INV',
      default_due_days: '30',
    },
  });

  useEffect(() => {
    getSettings().then(form.setValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const v = form.values;
    await Promise.all([
      setSetting('default_currency', v.default_currency),
      setSetting('default_tax_rate', v.default_tax_rate),
      setSetting('invoice_prefix', v.invoice_prefix),
      setSetting('default_due_days', v.default_due_days),
    ]);
    notifications.show({ message: t('settings.saved'), color: 'green' });
    setSaving(false);
  };

  const handleExportDb = async () => {
    setExporting(true);
    try {
      const dest = await save({
        defaultPath: 'invoices.db',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      });
      if (!dest) { setExporting(false); return; }
      const dataDir = await appDataDir();
      const src = await join(dataDir, 'invoices.db');
      await copyFile(src, dest);
      notifications.show({ message: t('settings.exportSuccess'), color: 'green' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      notifications.show({ message: msg, color: 'red' });
    }
    setExporting(false);
  };

  const handleResetNumber = () => {
    modals.openConfirmModal({
      title: t('settings.counter'),
      children: <Text size="sm">{t('settings.lastNumberDesc')}</Text>,
      labels: { confirm: t('settings.applyCounter'), cancel: t('common.cancel') },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        await setSetting('last_invoice_number', form.values.last_invoice_number);
        notifications.show({ message: t('settings.counterUpdated'), color: 'orange' });
      },
    });
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    storeLanguage(lang as Language);
    notifications.show({ message: t('settings.languageSaved'), color: 'blue' });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} fw={700}>{t('settings.title')}</Title>
        <Button leftSection={<IconDeviceFloppy size={16} />} loading={saving} onClick={handleSave}>
          {t('common.save')}
        </Button>
      </Group>

      {/* Language & Appearance */}
      <Card p="lg" radius="lg" withBorder>
        <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
          {t('settings.language')} &amp; {t('settings.appearance')}
        </Text>
        <Stack gap="lg">
          <Stack gap="xs">
            <Text size="sm" fw={500}>{t('settings.languageLabel')}</Text>
            <Text size="xs" c="dimmed">{t('settings.languageDesc')}</Text>
            <SegmentedControl
              value={i18n.language}
              onChange={handleLanguageChange}
              data={LANGUAGES.map((l) => ({ value: l.value, label: `${l.flag}  ${l.label}` }))}
              size="md"
              w={360}
            />
          </Stack>
          <Divider />
          <Stack gap="xs">
            <Text size="sm" fw={500}>{t('settings.colorScheme')}</Text>
            <Text size="xs" c="dimmed">{t('settings.colorSchemeDesc')}</Text>
            <Button.Group>
              {(
                [
                  { value: 'auto',  label: t('settings.schemeAuto'),  Icon: IconDeviceDesktop },
                  { value: 'light', label: t('settings.schemeLight'), Icon: IconSun },
                  { value: 'dark',  label: t('settings.schemeDark'),  Icon: IconMoon },
                ] as const
              ).map(({ value, label, Icon }) => (
                <Button
                  key={value}
                  variant={activeScheme === value ? 'filled' : 'default'}
                  leftSection={<Icon size={15} />}
                  onClick={() => setColorScheme(value)}
                >
                  {label}
                </Button>
              ))}
            </Button.Group>
          </Stack>
        </Stack>
      </Card>

      {/* Invoice defaults */}
      <Card p="lg" radius="lg" withBorder>
        <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
          {t('settings.invoiceDefaults')}
        </Text>
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label={t('settings.prefix')}
              description={t('settings.prefixDesc')}
              placeholder="INV"
              {...form.getInputProps('invoice_prefix')}
            />
            <Select
              label={t('settings.defaultCurrency')}
              data={CURRENCIES}
              {...form.getInputProps('default_currency')}
            />
          </Group>
          <Group grow>
            <NumberInput
              label={t('settings.defaultTaxRate')} min={0} max={100} suffix="%"
              value={parseFloat(form.values.default_tax_rate) || 0}
              onChange={(v) => form.setFieldValue('default_tax_rate', String(v))}
            />
            <NumberInput
              label={t('settings.defaultDueDays')} min={0} suffix=" dias"
              value={parseInt(form.values.default_due_days, 10) || 30}
              onChange={(v) => form.setFieldValue('default_due_days', String(v))}
            />
          </Group>
        </Stack>
      </Card>

      {/* Invoice counter */}
      <Card p="lg" radius="lg" withBorder>
        <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
          {t('settings.counter')}
        </Text>
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" mb="md" radius="md">
          {t('settings.counterWarning')}
        </Alert>
        <Group align="flex-end">
          <NumberInput
            label={t('settings.lastNumber')}
            description={t('settings.lastNumberDesc')}
            min={0}
            value={parseInt(form.values.last_invoice_number, 10) || 0}
            onChange={(v) => form.setFieldValue('last_invoice_number', String(v))}
            style={{ flex: 1 }}
          />
          <Button variant="light" color="orange" onClick={handleResetNumber}>
            {t('settings.applyCounter')}
          </Button>
        </Group>
      </Card>

      {/* Data management */}
      <Card p="lg" radius="lg" withBorder>
        <Text fw={600} mb="md" size="sm" tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
          {t('settings.dataManagement')}
        </Text>
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text size="sm" fw={500}>{t('settings.exportDb')}</Text>
              <Text size="xs" c="dimmed">{t('settings.exportDbDesc')}</Text>
            </Stack>
            <Button
              variant="light" leftSection={<IconDownload size={16} />}
              loading={exporting} onClick={handleExportDb}
            >
              {t('settings.exportDbBtn')}
            </Button>
          </Group>
          <Divider />
          <Text size="xs" c="dimmed">
            DB: <code>macOS: ~/Library/Application Support/com.invoxa.app/invoices.db</code>
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}
