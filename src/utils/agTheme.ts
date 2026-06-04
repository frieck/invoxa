import { themeQuartz } from 'ag-grid-community';

export const agTheme = themeQuartz.withParams(
  {
    backgroundColor: '#1A1B1E',       // Mantine dark[7] — linhas
    headerBackgroundColor: '#212226', // Mantine dark[6] — header
    foregroundColor: '#C1C2C5',       // Mantine dark[0] — texto
    borderColor: '#373A40',           // Mantine dark[4] — bordas
    rowHoverColor: 'rgba(255, 255, 255, 0.04)',
    selectedRowBackgroundColor: 'rgba(99, 102, 241, 0.15)',
    cardShadow: '0 1px 20px 1px rgba(0,0,0,0.5)',
    popupShadow: '0 0 20px rgba(0, 0, 0, 0.4)',
    browserColorScheme: 'dark',
  },
  'dark',
);
