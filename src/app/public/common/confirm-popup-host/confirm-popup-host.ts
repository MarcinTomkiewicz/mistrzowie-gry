import { Component, DestroyRef, inject, viewChild } from '@angular/core';

import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';

@Component({
  selector: 'app-confirm-popup-host',
  standalone: true,
  imports: [ConfirmDialogModule, ConfirmPopupModule],
  template: `
    <p-confirmpopup />
    <p-confirmdialog
      [key]="confirm.modalDecisionKey"
      styleClass="mg-dialog mg-dialog--sm mg-confirmdialog"
      appendTo="body" [modal]="true" [autoZIndex]="true"
      (onHide)="confirm.modalDialogHidden()"
    />
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
