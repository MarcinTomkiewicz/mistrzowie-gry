import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Platform } from '../../../core/services/platform/platform';

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, ToastModule, Navbar, Footer, ConfirmPopupModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
    private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);

  readonly toastEnabled = signal(false);

  constructor() {
    const cleanup = this.platform.onIdle(() => {
      this.toastEnabled.set(true);
    });

    this.destroyRef.onDestroy(cleanup);
  }
}
