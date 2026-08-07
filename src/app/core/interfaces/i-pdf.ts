import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface IPdfRenderResult {
  pageCount: number;
  pageNumber: number;
}

export interface IPdfLoadResult {
  document: PDFDocumentProxy;
  pageCount: number;
}

export interface IPdfPreview {
  readonly title: string;
  readonly url: string;
}

export interface IPdfPointerPosition {
  readonly x: number;
  readonly y: number;
}

export interface IPdfViewportAnchor {
  readonly contentLeft: number;
  readonly contentTop: number;
  readonly viewportLeft: number;
  readonly viewportTop: number;
}

export interface IPdfPinchGesture {
  readonly anchor: IPdfViewportAnchor;
  readonly distance: number;
  readonly zoom: number;
}
