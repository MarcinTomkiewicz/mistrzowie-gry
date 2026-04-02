import { Injectable, inject } from '@angular/core';

import { Platform } from '../platform/platform';

const CHUNK_ERROR_PATTERN =
  /chunkloaderror|loading chunk [\w-]+ failed|failed to fetch dynamically imported module|importing a module script failed/i;

@Injectable({ providedIn: 'root' })
export class DeployUpdate {
  private readonly platform = inject(Platform);

  constructor() {
    if (!this.platform.isBrowser) {
      return;
    }

    this.platform.onWindow('error', (event) => {
      this.handlePotentialChunkError(event.error ?? event.message);
    });

    this.platform.onWindow('unhandledrejection', (event) => {
      this.handlePotentialChunkError(event.reason);
    });
  }

  private handlePotentialChunkError(error: unknown): void {
    if (!this.isChunkLoadError(error)) {
      return;
    }

    const reloadKey = this.getReloadKey();

    try {
      if (window.sessionStorage.getItem(reloadKey) === '1') {
        return;
      }

      window.sessionStorage.setItem(reloadKey, '1');
    } catch {
      // Ignore storage failures and still try a hard reload.
    }

    window.location.reload();
  }

  private isChunkLoadError(error: unknown): boolean {
    if (typeof error === 'string') {
      return CHUNK_ERROR_PATTERN.test(error);
    }

    if (error instanceof Error) {
      return CHUNK_ERROR_PATTERN.test(`${error.name} ${error.message}`);
    }

    return false;
  }

  private getReloadKey(): string {
    return `mg:chunk-reload:${window.location.pathname}`;
  }
}
