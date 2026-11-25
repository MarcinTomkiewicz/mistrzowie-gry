import { Component, inject } from '@angular/core';
import { provideTranslocoScope } from '@jsverse/transloco';
import { TabsModule } from 'primeng/tabs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { ADMIN_CONTRACT_TEMPLATES_SCOPE, createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractPreparation } from './contract-preparation';
import { ContractTemplateCatalog } from './contract-template-catalog';
import { ContractTemplatesFacade } from './contract-templates-facade';

@Component({
  selector: 'app-admin-contracts',
  imports: [TabsModule, LoadingOverlay, ContractTemplateCatalog, ContractPreparation],
  templateUrl: './admin-contracts.html',
  providers: [ContractTemplatesFacade, provideTranslocoScope(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'common')],
})
export class AdminContracts {
  protected readonly catalog = inject(ContractTemplatesFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
}
