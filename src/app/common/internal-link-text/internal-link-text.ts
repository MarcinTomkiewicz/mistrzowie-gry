import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { parseInternalLinkText } from '../../core/domain/internal-link/internal-link-markup';

@Component({
  selector: 'app-internal-link-text',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './internal-link-text.html',
})
export class InternalLinkText {
  private readonly router = inject(Router);

  readonly text = input.required<string>();

  protected readonly nodes = computed(() =>
    parseInternalLinkText(this.text()).map((node) =>
      node.type === 'link'
        ? { ...node, href: this.router.parseUrl(node.href) }
        : node,
    ),
  );
}
