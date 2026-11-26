import type { PDFPage } from 'pdf-lib';

import { isContractPages, type ContractArea } from '../types/contract-template-configuration';

export async function openStaticContractPdf(bytes: ArrayBuffer) {
  const { PDFDocument, PDFName, PDFNumber } = await import('pdf-lib');
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
  const form = pdf.catalog.getAcroForm();
  if (form && (form.dict.has(PDFName.of('XFA')) || (form.Fields()?.size() ?? 0) > 0)) {
    throw new Error('Interactive PDF.');
  }

  const pages = pdf.getPages();
  const areas = pages.map((page) => {
    const userUnit = page.node.lookupMaybe(PDFName.of('UserUnit'), PDFNumber)?.asNumber() ?? 1;
    if (page.getRotation().angle % 360 !== 0 || userUnit !== 1) throw new Error('Unsupported PDF page.');
    return contractPdfPageArea(page);
  });
  if (!areas.length || !isContractPages(areas.map(({ width, height }) => ({ width, height })))) {
    throw new Error('Invalid PDF page geometry.');
  }
  return { pdf, pages, areas };
}

function contractPdfPageArea(page: PDFPage): ContractArea {
  const crop = page.getCropBox();
  const media = page.getMediaBox();
  const x = Math.max(crop.x, media.x);
  const y = Math.max(crop.y, media.y);
  const width = Math.min(crop.x + crop.width, media.x + media.width) - x;
  const height = Math.min(crop.y + crop.height, media.y + media.height) - y;
  return { x, y, width, height };
}
