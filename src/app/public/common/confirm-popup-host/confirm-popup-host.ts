import { Component } from '@angular/core';

import { ConfirmPopupModule } from 'primeng/confirmpopup';

@Component({
  selector: 'app-confirm-popup-host',
  standalone: true,
  imports: [ConfirmPopupModule],
  template: '<p-confirmpopup />',
})
export class ConfirmPopupHost {}
