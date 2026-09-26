import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_PRODUCT_KINDS,
} from '../../../../core/configs/commercial-pages.config';
import type { CommercialPagePublicationIssueIndex } from '../../../../core/domain/commercial-pages/commercial-page-publication-issues';
import { syncCommercialProductKind } from '../../../../core/factories/commercial-product-editor-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { RichContentEditor } from '../../../../common/rich-content-editor/rich-content-editor';
import { CommercialProductCooperationEditor } from './commercial-product-cooperation-editor';
import { CommercialProductDetailsEditor } from './commercial-product-details-editor';
import { CommercialProductPricesEditor } from './commercial-product-prices-editor';
import { CommercialPublicationIssueMessages } from './commercial-publication-issue-messages';

@Component({
  selector: 'app-commercial-product-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    CommercialProductCooperationEditor,
    CommercialProductDetailsEditor,
    CommercialProductPricesEditor,
    RichContentEditor,
    CommercialPublicationIssueMessages,
  ],
  templateUrl: './commercial-product-editor.html',
})
export class CommercialProductEditor {
  readonly form = input.required<CommercialProductEditorForm>();
  readonly diagnostics = input.required<CommercialPagePublicationIssueIndex>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);
  readonly addonOptions = input<ISelectOption<string>[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly commercialI18n = createCommercialPageI18n();
  protected readonly kindOptions = computed(() => {
    const labels = this.i18n.productKind();
    return COMMERCIAL_PRODUCT_KINDS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected syncKind(): void {
    syncCommercialProductKind(this.form());
  }
}
