import { from, map, Observable, of, switchMap } from 'rxjs';

import type { PDFDocumentProxy } from 'pdfjs-dist';

let workerConfigured = false;

function ensurePdfWorker(GlobalWorkerOptions: { workerSrc: string }): void {
  if (workerConfigured) {
    return;
  }

  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  workerConfigured = true;
}

export interface IPdfRenderResult {
  pageCount: number;
  pageNumber: number;
}

export interface IPdfLoadResult {
  document: PDFDocumentProxy;
  pageCount: number;
}

export function loadPdfDocument(src: string): Observable<IPdfLoadResult> {
  return from(import('pdfjs-dist')).pipe(
    switchMap((pdfjs) => {
      ensurePdfWorker(pdfjs.GlobalWorkerOptions);

      return from(pdfjs.getDocument(src).promise).pipe(
        map((document) => ({
          document,
          pageCount: document.numPages,
        })),
      );
    }),
  );
}

export function renderPdfPageToCanvas(
  srcOrDocument: string | PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight?: number,
  zoom = 1,
): Observable<IPdfRenderResult> {
  const document$ =
    typeof srcOrDocument === 'string'
      ? loadPdfDocument(srcOrDocument).pipe(map((result) => result.document))
      : of(srcOrDocument);

  return document$.pipe(
    switchMap((document) =>
      from(document.getPage(resolvePageNumber(document, pageNumber))).pipe(
        switchMap((page) => {
          const baseViewport = page.getViewport({ scale: 1 });
          const widthScale = targetWidth > 0 ? targetWidth / baseViewport.width : 1;
          const heightScale =
            targetHeight && targetHeight > 0
              ? targetHeight / baseViewport.height
              : widthScale;
          const fitScale =
            targetHeight && targetHeight > 0
              ? Math.min(widthScale, heightScale)
              : widthScale;
          const viewport = page.getViewport({ scale: fitScale * zoom });
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Canvas 2D context unavailable.');
          }

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          return from(
            page.render({
              canvas,
              canvasContext: context,
              viewport,
            }).promise,
          ).pipe(
            map(() => ({
              pageCount: document.numPages,
              pageNumber: resolvePageNumber(document, pageNumber),
            })),
          );
        }),
      ),
    ),
  );
}

function resolvePageNumber(
  document: PDFDocumentProxy,
  pageNumber: number,
): number {
  return Math.min(Math.max(pageNumber, 1), document.numPages);
}
