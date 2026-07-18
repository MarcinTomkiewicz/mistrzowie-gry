import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { createCoworkerShellI18n } from './coworker-shell.i18n';

@Component({
  selector: 'app-coworker-shell',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './coworker-shell.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class CoworkerShell {
  protected readonly i18n = createCoworkerShellI18n();
}
