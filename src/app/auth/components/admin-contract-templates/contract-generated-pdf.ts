import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractPreparationFacade } from './contract-preparation-facade';

@Component({
  selector: 'app-contract-generated-pdf',
  imports: [ButtonModule, PdfViewerDialog],
  templateUrl: './contract-generated-pdf.html',
})
export class ContractGeneratedPdf {
  protected readonly facade = inject(ContractPreparationFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
}
