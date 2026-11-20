import { Injectable, signal } from '@angular/core';

@Injectable()
export class OnboardingDetailTab {
  readonly current = signal<{ readonly id: string; readonly name?: string } | null>(null);

  setName(name: string): void {
    this.current.update((tab) => tab && { ...tab, name });
  }
}
