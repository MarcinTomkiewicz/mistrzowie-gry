import { Component, inject } from '@angular/core';

import { DeployUpdate } from './core/services/deploy-update/deploy-update';
import { AppShell } from './public/components/app-shell/app-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShell],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly deployUpdate = inject(DeployUpdate);
}
