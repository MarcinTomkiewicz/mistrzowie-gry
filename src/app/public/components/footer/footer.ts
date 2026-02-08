import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navigation } from '../../../core/services/navigation/navigation';
import { Theme } from '../../../core/services/theme/theme';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly nav = inject(Navigation);
  readonly theme = inject(Theme);

  readonly year = computed(() => new Date().getFullYear());

  // theme-aware asset
  readonly footerImgSrc = computed(() =>
    this.theme.isLight() ? 'theme/light/footer.png' : 'theme/dark/footer.png',
  );

  track(_label: string): void {}
}
