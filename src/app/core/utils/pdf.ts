import { from, map, Observable, switchMap } from 'rxjs';

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

export interface IPdfDocumentRenderResult {
  pageCount: number;
}

export function renderPdfPageToCanvas(
  src: string,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth: number,
): Observable<IPdfRenderResult> {
  return from(import('pdfjs-dist')).pipe(
    switchMap((pdfjs) => {
      ensurePdfWorker(pdfjs.GlobalWorkerOptions);

      return from(pdfjs.getDocument(src).promise).pipe(
        switchMap((document) =>
          from(document.getPage(resolvePageNumber(document, pageNumber))).pipe(
            switchMap((page) => {
              const baseViewport = page.getViewport({ scale: 1 });
              const scale = targetWidth > 0 ? targetWidth / baseViewport.width : 1;
              const viewport = page.getViewport({ scale });
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
    }),
  );
}

export function renderPdfDocumentToContainer(
  src: string,
  container: HTMLElement,
  targetWidth: number,
): Observable<IPdfDocumentRenderResult> {
  return from(import('pdfjs-dist')).pipe(
    switchMap((pdfjs) => {
      ensurePdfWorker(pdfjs.GlobalWorkerOptions);

      return from(pdfjs.getDocument(src).promise).pipe(
        switchMap((document) =>
          from(renderAllPages(document, container, targetWidth)).pipe(
            map(() => ({
              pageCount: document.numPages,
            })),
          ),
        ),
      );
    }),
  );
}

function resolvePageNumber(
  document: PDFDocumentProxy,
  pageNumber: number,
): number {
  return Math.min(Math.max(pageNumber, 1), document.numPages);
}

async function renderAllPages(
  document: PDFDocumentProxy,
  container: HTMLElement,
  targetWidth: number,
): Promise<void> {
  container.replaceChildren();

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth > 0 ? targetWidth / baseViewport.width : 1;
    const viewport = page.getViewport({ scale });
    const canvas = globalThis.document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context unavailable.');
    }

    canvas.className = 'pdf-viewer-dialog__canvas';
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    container.append(canvas);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;
  }
}
