import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { ReactElement, JSXElementConstructor } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import InvoiceDocument from '../components/Invoice/InvoiceDocument';
import type { Invoice, Supplier } from '../types';

export async function exportToPdf(invoice: Invoice, supplier: Supplier, defaultFilename: string): Promise<void> {
  const destPath = await save({
    defaultPath: defaultFilename,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!destPath) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(InvoiceDocument, { invoice, supplier }) as unknown as ReactElement<DocumentProps, JSXElementConstructor<any>>;
  const blob = await pdf(element).toBlob();
  const buffer = await blob.arrayBuffer();
  await writeFile(destPath, new Uint8Array(buffer));
}
