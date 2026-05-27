import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function AppLayout() {
  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="lg"
      styles={{
        main: { background: 'light-dark(#f8f7ff, var(--mantine-color-dark-8))', minHeight: '100vh' },
        navbar: { border: 'none', background: 'transparent' },
      }}
    >
      <AppShell.Navbar>
        <NavBar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
