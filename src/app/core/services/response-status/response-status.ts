import { Injectable, RESPONSE_INIT, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ResponseStatus {
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  set(status: number): void {
    if (!this.responseInit) {
      return;
    }

    this.responseInit.status = status;
  }

  permanentRedirect(location: string): void {
    if (!this.responseInit) {
      return;
    }

    const headers = new Headers(this.responseInit.headers ?? {});
    headers.set('Location', location);

    this.responseInit.status = 301;
    this.responseInit.headers = headers;
  }
}
