import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, inject, viewChild } from '@angular/core';

import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';

@Component({
  selector: 'app-confirm-popup-host',
  standalone: true,
  imports: [NgTemplateOutlet, ConfirmDialogModule, ConfirmPopupModule],
  template: `
    <p-confirmpopup />
    <p-confirmdialog
      [key]="confirm.modalDecisionKey"
      [styleClass]="confirm.modalTemplate() ? 'mg-dialog mg-dialog--md mg-confirmdialog' : 'mg-dialog mg-dialog--sm mg-confirmdialog'"
      appendTo="body" [modal]="true" [autoZIndex]="true"
      (onHide)="confirm.modalDialogHidden()"
    >
      <ng-template #message let-decision>
        <div class="flex-col-start-stretch gap-md w-100 min-w-0">
          <p class="p-confirmdialog-message m-0 text-wrap-anywhere">{{ decision.message }}</p>
          <ng-container [ngTemplateOutlet]="confirm.modalTemplate()" />
        </div>
      </ng-template>
    </p-confirmdialog>
  `,
})
export class ConfirmPopupHost {
  private readonly dialog = viewChild.required(ConfirmDialog);
  protected readonly confirm = inject(UiConfirm);

  constructor() {
    const unregister = this.confirm.registerModalDialogCloser(() => this.dialog().hide());
    inject(DestroyRef).onDestroy(unregister);
  }
}
