import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navigation } from '../../../core/services/navigation/navigation';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly nav = inject(Navigation);

  readonly year = computed(() => new Date().getFullYear());

  /**
   * Placeholder na przyszłość: np. tracking kliknięć w footer.
   * Na razie nie robimy tu nic (public site).
   */
  track(_label: string): void {}
}
