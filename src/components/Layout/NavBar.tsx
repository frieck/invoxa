import { Stack, Text, Box, Group, Divider, UnstyledButton, Tooltip, Button } from '@mantine/core';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconLayoutDashboard, IconFileInvoice, IconUsers,
  IconBuildingStore, IconTemplate, IconChartBar,
  IconSettings, IconPlus, IconSun, IconMoon, IconDeviceDesktop,
} from '@tabler/icons-react';

type ColorSchemeValue = 'auto' | 'light' | 'dark';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ElementType;
}

const mainItems: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: IconLayoutDashboard },
  { path: '/invoices', labelKey: 'nav.invoices', icon: IconFileInvoice },
  { path: '/clients', labelKey: 'nav.clients', icon: IconUsers },
];

const configItems: NavItem[] = [
  { path: '/templates', labelKey: 'nav.templates', icon: IconTemplate },
  { path: '/supplier', labelKey: 'nav.supplier', icon: IconBuildingStore },
  { path: '/reports', labelKey: 'nav.reports', icon: IconChartBar },
  { path: '/settings', labelKey: 'nav.settings', icon: IconSettings },
];

function NavItemButton({ item, active }: { item: NavItem; active: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const Icon = item.icon;

  return (
    <UnstyledButton
      onClick={() => navigate(item.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 10, width: '100%',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.65)',
        background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        fontWeight: active ? 600 : 400, fontSize: 14,
        transition: 'all 0.15s ease', cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
          (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
        }
      }}
    >
      <Icon size={18} />
      <span>{t(item.labelKey)}</span>
    </UnstyledButton>
  );
}

export default function NavBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');

  const currentScheme = (colorScheme as ColorSchemeValue) ?? 'auto';

  const isActive = (path: string) =>
    path === '/invoices'
      ? pathname === '/invoices' || (pathname.startsWith('/invoices') && !pathname.includes('/dashboard'))
      : pathname === path;

  return (
    <Box
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
        padding: 16,
      }}
    >
      {/* Logo */}
      <Group mb={28} mt={8} px={4}>
        <Box
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <IconFileInvoice size={22} color="white" />
        </Box>
        <Stack gap={0}>
          <Text fw={700} size="sm" c="white" style={{ lineHeight: 1.2, letterSpacing: -0.2 }}>
            Invoxa
          </Text>
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.2 }}>
            Invoice Generator
          </Text>
        </Stack>
      </Group>

      {/* New Invoice */}
      <UnstyledButton
        onClick={() => navigate('/invoices/new')}
        mb={20}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '10px 14px',
          color: 'white', fontWeight: 600, fontSize: 14,
          width: '100%', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
        }}
      >
        <IconPlus size={16} />
        <span>{t('nav.newInvoice')}</span>
      </UnstyledButton>

      {/* Main nav */}
      <Stack gap={2} style={{ flex: 1 }}>
        {mainItems.map((item) => (
          <NavItemButton key={item.path} item={item} active={isActive(item.path)} />
        ))}

        <Divider color="rgba(255,255,255,0.12)" my="sm" />

        <Text
          size="xs" px={12} mb={4} tt="uppercase"
          style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontWeight: 600 }}
        >
          {t('nav.config')}
        </Text>

        {configItems.map((item) => (
          <NavItemButton key={item.path} item={item} active={isActive(item.path)} />
        ))}
      </Stack>

      {/* Color scheme toggle */}
      <Divider color="rgba(255,255,255,0.12)" mb="sm" />
      <Button.Group style={{ width: '100%' }}>
        {(
          [
            { value: 'auto',  Icon: IconDeviceDesktop, tip: t('settings.schemeAuto') },
            { value: 'light', Icon: IconSun,           tip: t('settings.schemeLight') },
            { value: 'dark',  Icon: IconMoon,          tip: t('settings.schemeDark') },
          ] as const
        ).map(({ value, Icon, tip }) => (
          <Tooltip key={value} label={tip} position="top" withArrow>
            <Button
              flex={1}
              size="xs"
              variant={currentScheme === value ? 'white' : 'subtle'}
              color={currentScheme === value ? 'brand' : 'gray'}
              onClick={() => setColorScheme(value)}
              styles={{
                root: {
                  color: currentScheme === value ? undefined : 'rgba(255,255,255,0.55)',
                  borderColor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              <Icon size={15} />
            </Button>
          </Tooltip>
        ))}
      </Button.Group>
    </Box>
  );
}
