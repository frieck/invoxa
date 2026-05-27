import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Title, Group, Select, Card, Text, SimpleGrid,
  Tabs, Table, Badge,
} from '@mantine/core';
import { BarChart, LineChart } from '@mantine/charts';
import { IconChartBar, IconChartLine, IconTable } from '@tabler/icons-react';
import { getMonthlyReport, getAnnualReport } from '../db/reports';
import type { MonthlyReport, AnnualReport } from '../types';
import { formatCurrency, MONTH_NAMES } from '../utils/format';
import dayjs from 'dayjs';

export default function Reports() {
  const { t } = useTranslation();
  const currentYear = dayjs().year();
  const [year, setYear] = useState(String(currentYear));
  const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
  const [annual, setAnnual] = useState<AnnualReport[]>([]);

  useEffect(() => {
    getMonthlyReport(Number(year)).then(setMonthly);
    getAnnualReport().then(setAnnual);
  }, [year]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const invoicedLabel = t('reports.invoiced');
  const paidLabel = t('reports.paid');

  const allMonths = MONTH_NAMES.map((m, i) => {
    const found = monthly.find((r) => r.month_num === i + 1);
    return {
      month: m,
      [invoicedLabel]: found?.total_invoiced ?? 0,
      [paidLabel]: found?.total_paid ?? 0,
    };
  });

  const totalInvoiced = monthly.reduce((s, r) => s + r.total_invoiced, 0);
  const totalPaid = monthly.reduce((s, r) => s + r.total_paid, 0);
  const totalCount = monthly.reduce((s, r) => s + r.invoice_count, 0);
  const totalPaidCount = monthly.reduce((s, r) => s + r.paid_count, 0);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2} fw={700}>{t('reports.title')}</Title>
        <Select value={year} onChange={(v) => setYear(v ?? String(currentYear))} data={yearOptions} w={120} />
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        {[
          { label: t('reports.totalInvoiced', { year }), value: formatCurrency(totalInvoiced) },
          { label: t('reports.totalPaid', { year }), value: formatCurrency(totalPaid), color: 'green' },
          { label: t('reports.invoicesCount', { year }), value: String(totalCount) },
          { label: t('reports.paidCount', { year }), value: String(totalPaidCount), color: 'green' },
        ].map(({ label, value, color }) => (
          <Card key={label} p="md" radius="lg" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4} style={{ letterSpacing: 1 }}>
              {label}
            </Text>
            <Text fw={800} size="lg" c={color}>{value}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Tabs defaultValue="bar">
        <Tabs.List mb="md">
          <Tabs.Tab value="bar" leftSection={<IconChartBar size={14} />}>{t('reports.barChart')}</Tabs.Tab>
          <Tabs.Tab value="line" leftSection={<IconChartLine size={14} />}>{t('reports.lineChart')}</Tabs.Tab>
          <Tabs.Tab value="table" leftSection={<IconTable size={14} />}>{t('reports.monthlyTable')}</Tabs.Tab>
          <Tabs.Tab value="annual" leftSection={<IconTable size={14} />}>{t('reports.annual')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="bar">
          <Card p="lg" radius="lg" withBorder>
            <Text fw={600} mb="md">{t('reports.monthlyRevenue', { year })}</Text>
            <BarChart
              h={360} data={allMonths} dataKey="month"
              series={[
                { name: invoicedLabel, color: 'brand.4' },
                { name: paidLabel, color: 'green.5' },
              ]}
              tickLine="xy" gridAxis="y" withLegend
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="line">
          <Card p="lg" radius="lg" withBorder>
            <Text fw={600} mb="md">{t('reports.monthlyTrend', { year })}</Text>
            <LineChart
              h={360} data={allMonths} dataKey="month"
              series={[
                { name: invoicedLabel, color: 'brand.4' },
                { name: paidLabel, color: 'green.5' },
              ]}
              withLegend curveType="monotone"
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="table">
          <Card p={0} radius="lg" withBorder style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('reports.month')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.invoicesCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.paidCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.invoicedCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.paidAmtCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.outstandingCol')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {allMonths.map((m, i) => {
                  const row = monthly.find((r) => r.month_num === i + 1);
                  const outstanding = (row?.total_invoiced ?? 0) - (row?.total_paid ?? 0);
                  return (
                    <Table.Tr key={m.month}>
                      <Table.Td fw={500}>{m.month}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{row?.invoice_count ?? 0}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{row?.paid_count ?? 0}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(row?.total_invoiced ?? 0)}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-green-7)' }}>
                        {formatCurrency(row?.total_paid ?? 0)}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {outstanding > 0 && (
                          <Badge color="orange" variant="light" size="sm">
                            {formatCurrency(outstanding)}
                          </Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                <Table.Tr style={{ background: 'var(--mantine-color-brand-0)', fontWeight: 700 }}>
                  <Table.Td fw={700}>{t('reports.totalRow')}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{totalCount}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{totalPaidCount}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(totalInvoiced)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-green-7)' }}>
                    {formatCurrency(totalPaid)}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Badge color="orange" variant="light" size="sm">
                      {formatCurrency(totalInvoiced - totalPaid)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="annual">
          <Card p="lg" radius="lg" withBorder>
            <Text fw={600} mb="md">{t('reports.annualSummary')}</Text>
            <BarChart
              h={300}
              data={annual.map((r) => ({
                [t('reports.year')]: String(r.year),
                [invoicedLabel]: r.total_invoiced,
                [paidLabel]: r.total_paid,
              })).reverse()}
              dataKey={t('reports.year')}
              series={[
                { name: invoicedLabel, color: 'brand.4' },
                { name: paidLabel, color: 'green.5' },
              ]}
              withLegend mb="xl"
            />
            <Table striped highlightOnHover mt="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('reports.year')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.invoicesCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.paidCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.invoicedCol')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('reports.paidAmtCol')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {annual.map((r) => (
                  <Table.Tr key={r.year}>
                    <Table.Td fw={600}>{r.year}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{r.invoice_count}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{r.paid_count}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(r.total_invoiced)}</Table.Td>
                    <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-green-7)' }}>
                      {formatCurrency(r.total_paid)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
