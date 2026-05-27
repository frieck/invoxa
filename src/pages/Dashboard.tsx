import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Grid, Card, Text, Group, Stack, Title, Box,
  RingProgress, SimpleGrid, Skeleton, ThemeIcon,
} from '@mantine/core';
import {
  IconFileInvoice, IconCash, IconChartBar, IconAlertCircle,
} from '@tabler/icons-react';
import { BarChart } from '@mantine/charts';
import { getDashboardStats, getMonthlyReport } from '../db/reports';
import { formatCurrency, MONTH_NAMES } from '../utils/format';
import dayjs from 'dayjs';

interface Stats {
  total_invoices: number;
  total_paid: number;
  total_unpaid: number;
  revenue_month: number;
  revenue_year: number;
  overdue_count: number;
}

function StatCard({
  title, value, icon: Icon, color, sub,
}: {
  title: string; value: string; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <Card p="lg" radius="lg" withBorder>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: 1 }}>
            {title}
          </Text>
          <Text fw={800} size="xl" style={{ fontSize: 28, lineHeight: 1 }}>{value}</Text>
          {sub && <Text size="xs" c="dimmed">{sub}</Text>}
        </Stack>
        <ThemeIcon size={48} radius="lg" color={color} variant="light">
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ month: string; [key: string]: string | number }[]>([]);
  const currentYear = dayjs().year();

  useEffect(() => {
    getDashboardStats().then(setStats);
    getMonthlyReport(currentYear).then((rows) => {
      const byMonth = Object.fromEntries(rows.map((r) => [r.month_num, r]));
      const invoicedLabel = t('dashboard.invoiced');
      const paidLabel = t('dashboard.paid');
      const data = MONTH_NAMES.map((m, i) => ({
        month: m,
        [invoicedLabel]: byMonth[i + 1]?.total_invoiced ?? 0,
        [paidLabel]: byMonth[i + 1]?.total_paid ?? 0,
      }));
      setChartData(data);
    });
  }, [currentYear, t]);

  const paidPct = stats
    ? stats.total_invoices > 0
      ? Math.round((stats.total_paid / stats.total_invoices) * 100)
      : 0
    : 0;

  return (
    <Stack gap="lg">
      <Title order={2} fw={700}>{t('dashboard.title')}</Title>

      {!stats ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={110} radius="lg" />)}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatCard
            title={t('dashboard.totalInvoices')} value={String(stats.total_invoices)}
            icon={IconFileInvoice} color="brand"
          />
          <StatCard
            title={t('dashboard.revenueMonth')} value={formatCurrency(stats.revenue_month)}
            icon={IconCash} color="green"
          />
          <StatCard
            title={t('dashboard.revenueYear')} value={formatCurrency(stats.revenue_year)}
            icon={IconCash} color="teal"
          />
          <StatCard
            title={t('dashboard.overdue')} value={String(stats.overdue_count)}
            icon={IconAlertCircle} color="red"
            sub={t('dashboard.unpaidTotal', { count: stats.total_unpaid })}
          />
        </SimpleGrid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card p="lg" radius="lg" withBorder>
            <Text fw={600} mb="md">
              {t('dashboard.monthlyOverview', { year: currentYear })}
            </Text>
            <BarChart
              h={280} data={chartData} dataKey="month"
              series={[
                { name: t('dashboard.invoiced'), color: 'brand.4' },
                { name: t('dashboard.paid'), color: 'green.5' },
              ]}
              tickLine="xy" gridAxis="y"
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="lg" radius="lg" withBorder h="100%">
            <Text fw={600} mb="lg">{t('dashboard.paymentRate')}</Text>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <RingProgress
                size={200} thickness={20} roundCaps
                sections={[
                  { value: paidPct, color: 'green' },
                  { value: 100 - paidPct, color: 'gray.2' },
                ]}
                label={
                  <Stack gap={0} style={{ textAlign: 'center' }}>
                    <Text fw={800} size="xl">{paidPct}%</Text>
                    <Text size="xs" c="dimmed">{t('dashboard.paid')}</Text>
                  </Stack>
                }
              />
            </Box>
            {stats && (
              <Stack gap="xs" mt="md">
                {[
                  { label: t('dashboard.paid'), value: stats.total_paid, color: 'var(--mantine-color-green-5)' },
                  { label: t('dashboard.unpaid'), value: stats.total_unpaid, color: 'var(--mantine-color-gray-3)' },
                  { label: t('dashboard.overdue'), value: stats.overdue_count, color: 'var(--mantine-color-red-5)' },
                ].map(({ label, value, color }) => (
                  <Group key={label} justify="space-between">
                    <Group gap="xs">
                      <Box w={10} h={10} style={{ borderRadius: '50%', background: color }} />
                      <Text size="sm">{label}</Text>
                    </Group>
                    <Text size="sm" fw={600}>{value}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card p="lg" radius="lg" withBorder>
        <Text fw={600} mb="md">{t('dashboard.quickActions')}</Text>
        <Group>
          {[
            {
              label: t('invoice.new'), icon: IconFileInvoice,
              bg: 'var(--mantine-color-brand-0)', border: 'var(--mantine-color-brand-2)',
              color: 'var(--mantine-color-brand-6)', textColor: 'brand.7',
              onClick: () => navigate('/invoices/new'),
            },
            {
              label: t('dashboard.viewReports'), icon: IconChartBar,
              bg: 'var(--mantine-color-green-0)', border: 'var(--mantine-color-green-2)',
              color: 'var(--mantine-color-green-6)', textColor: 'green.7',
              onClick: () => navigate('/reports'),
            },
          ].map(({ label, icon: Icon, bg, border, color, textColor, onClick }) => (
            <Box
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                background: bg, border: `1px solid ${border}`,
              }}
              onClick={onClick}
            >
              <Icon size={18} color={color} />
              <Text size="sm" fw={500} c={textColor}>{label}</Text>
            </Box>
          ))}
        </Group>
      </Card>
    </Stack>
  );
}
