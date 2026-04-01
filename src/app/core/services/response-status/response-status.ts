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
}
