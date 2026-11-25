import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import type { ContractTemplateFamily } from '../../../core/configs/admin-contract-templates.config';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractPreparationFacade } from './contract-preparation-facade';

@Component({
  selector: 'app-contract-preparation',
  imports: [ReactiveFormsModule, ButtonModule, IftaLabelModule, SelectModule, LoadingOverlay, PdfViewerDialog],
  templateUrl: './contract-preparation.html',
  providers: [ContractPreparationFacade],
})
export class ContractPreparation {
  protected readonly facade = inject(ContractPreparationFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly family = new FormControl<ContractTemplateFamily | null>(null);

  constructor() {
    this.family.valueChanges.pipe(takeUntilDestroyed()).subscribe((family) => this.facade.load(family));
  }
}
