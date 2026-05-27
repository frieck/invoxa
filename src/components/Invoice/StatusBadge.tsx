import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { InvoiceStatus } from '../../types';
import { STATUS_COLORS } from '../../types';

interface Props {
  status: InvoiceStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { t } = useTranslation();
  return (
    <Badge color={STATUS_COLORS[status]} variant="light" size={size} radius="sm">
      {t(`status.${status}`)}
    </Badge>
  );
}
