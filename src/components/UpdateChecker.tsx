import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { Button, Text, Progress, Stack, Group } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

function UpdateProgress({ update }: { update: Update }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let downloaded = 0;
    let total = 0;

    update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        total = event.data.contentLength ?? 0;
        notifications.show({ id: 'upd-dbg-start', title: '[debug] download started', message: `size: ${total} bytes`, color: 'gray', autoClose: 8000 });
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        if (total > 0) setProgress(Math.round((downloaded / total) * 100));
      } else if (event.event === 'Finished') {
        notifications.show({ id: 'upd-dbg-done', title: '[debug] download finished', message: 'setDone(true) called', color: 'gray', autoClose: 8000 });
        setDone(true);
      }
    }).catch((err) => {
      notifications.show({ id: 'upd-dbg-err', title: '[debug] downloadAndInstall error', message: String(err), color: 'red', autoClose: false });
      setDone(true);
    });
  }, [update]);

  return (
    <Stack gap="md" pb="xs">
      {!done ? (
        <>
          <Text size="sm">{t('update.downloading')}</Text>
          <Progress value={progress} animated size="sm" />
          <Text size="xs" c="dimmed">{progress}%</Text>
        </>
      ) : (
        <>
          <Text size="sm">{t('update.readyToInstall')}</Text>
          <Group justify="flex-end">
            <Button leftSection={<IconRefresh size={14} />} onClick={() => relaunch()}>
              {t('update.restartAndInstall')}
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}

export default function UpdateChecker() {
  const { t } = useTranslation();

  const openInstallModal = useCallback((update: Update) => {
    notifications.hide('update-available');
    modals.open({
      title: `${t('update.installing')} v${update.version}`,
      closeOnClickOutside: false,
      closeOnEscape: false,
      withCloseButton: false,
      children: <UpdateProgress update={update} />,
    });
  }, [t]);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    getVersion().then((currentVersion) => {
      notifications.show({ id: 'upd-dbg-ver', title: '[debug] app version', message: `installed: ${currentVersion}`, color: 'gray', autoClose: 10000 });
    });

    check().then((update) => {
      if (!update) {
        notifications.show({ id: 'upd-dbg-noupdate', title: '[debug] no update', message: 'check() returned null', color: 'gray', autoClose: 8000 });
        return;
      }

      notifications.show({ id: 'upd-dbg-found', title: '[debug] update found', message: `remote: ${update.version} | current: ${update.currentVersion}`, color: 'orange', autoClose: false });

      notifications.show({
        id: 'update-available',
        title: t('update.available'),
        message: (
          <Stack gap="xs" mt={4}>
            <Text size="sm">{t('update.availableMsg', { version: update.version })}</Text>
            <Button
              size="xs"
              leftSection={<IconDownload size={12} />}
              onClick={() => openInstallModal(update)}
            >
              {t('update.install')}
            </Button>
          </Stack>
        ),
        color: 'blue',
        autoClose: false,
        withCloseButton: true,
      });
    }).catch(() => {});
  }, [openInstallModal, t]);

  return null;
}
