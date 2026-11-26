import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractGeneratedPdf } from './contract-generated-pdf';
import { ContractPreparationFacade } from './contract-preparation-facade';
import { ContractTemplatesFacade } from './contract-templates-facade';
import { ContractValuesForm } from './contract-values-form';

@Component({
  selector: 'app-contract-preparation',
  imports: [ReactiveFormsModule, ButtonModule, IftaLabelModule, SelectModule, LoadingOverlay, ContractValuesForm, ContractGeneratedPdf],
  templateUrl: './contract-preparation.html',
  providers: [ContractPreparationFacade],
})
export class ContractPreparation {
  protected readonly facade = inject(ContractPreparationFacade);
  protected readonly catalog = inject(ContractTemplatesFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly family = new FormControl<string | null>(null);

  constructor() {
    this.family.valueChanges.pipe(takeUntilDestroyed()).subscribe((family) => this.facade.load(family));
  }
}
