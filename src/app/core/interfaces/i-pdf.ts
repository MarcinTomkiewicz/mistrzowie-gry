import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface IPdfRenderResult {
  pageCount: number;
  pageNumber: number;
}

export interface IPdfLoadResult {
  document: PDFDocumentProxy;
  pageCount: number;
}
