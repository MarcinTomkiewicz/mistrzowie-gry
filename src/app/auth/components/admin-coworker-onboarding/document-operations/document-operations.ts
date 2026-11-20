import { Component, input } from '@angular/core';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-document-operations',
  imports: [ButtonModule, MenuModule],
  template: `
    <p-menu #menu appendTo="body" styleClass="mg-operation-menu" [popup]="true"
      [model]="items()" [ariaLabel]="label()" />
    <button pButton type="button" size="small" severity="secondary" [outlined]="true"
      aria-haspopup="menu" [attr.aria-expanded]="menu.visible"
      [attr.aria-label]="label()" [disabled]="disabled()" (click)="menu.toggle($event)">
      <i pButtonIcon class="pi pi-ellipsis-v" aria-hidden="true"></i>
    </button>
  `,
})
export class DocumentOperations {
  readonly items = input.required<MenuItem[]>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
}
