import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-section-base-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './commercial-section-base-editor.html',
})
export class CommercialSectionBaseEditor {
  readonly heading = input.required<FormControl<string>>();
  readonly lead = input.required<FormControl<string>>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
}
