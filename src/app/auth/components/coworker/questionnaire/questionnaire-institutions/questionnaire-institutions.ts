import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { NFZ_BRANCH_CATALOG } from '../../../../../core/configs/reference-catalogs/nfz-branches.config';
import { TAX_OFFICE_CATALOG } from '../../../../../core/configs/reference-catalogs/tax-offices.config';
import { ICoworkerQuestionnaireCatalogReference } from '../../../../../core/interfaces/i-coworker-questionnaire-reference';
import { CoworkerQuestionnaireInstitutionsForm } from '../../../../../core/types/coworker-questionnaire-form';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';

@Component({
  selector: 'app-questionnaire-institutions',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    MessageModule,
    SelectModule,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-institutions.html',
})
export class QuestionnaireInstitutions {
  readonly form = input.required<CoworkerQuestionnaireInstitutionsForm>();

  protected readonly i18n = createQuestionnaireI18n();
  protected readonly taxOfficeOptions: ICoworkerQuestionnaireCatalogReference[] =
    TAX_OFFICE_CATALOG.taxOffices.map(({ code, name }) => ({
      kind: 'catalog',
      code,
      name,
    }));
  protected readonly nfzBranchOptions: ICoworkerQuestionnaireCatalogReference[] =
    NFZ_BRANCH_CATALOG.branches.map(({ code, officialName }) => ({
      kind: 'catalog',
      code,
      name: officialName,
    }));
}
