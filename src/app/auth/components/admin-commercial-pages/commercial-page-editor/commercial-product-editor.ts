import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_EDITOR_DURATION_MODES,
  COMMERCIAL_EDITOR_PARTICIPANTS_MODES,
  COMMERCIAL_PRODUCT_KINDS,
  COMMERCIAL_SESSION_MODES,
} from '../../../../core/configs/commercial-pages.config';
import {
  syncCommercialProductEditorControls,
  syncCommercialProductKind,
} from '../../../../core/factories/commercial-product-editor-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { PriceEditor } from '../../../../common/price-editor/price-editor';
import { RichContentEditor } from '../../../../common/rich-content-editor/rich-content-editor';

@Component({
  selector: 'app-commercial-product-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    PriceEditor,
    RichContentEditor,
  ],
  templateUrl: './commercial-product-editor.html',
})
export class CommercialProductEditor {
  readonly form = input.required<CommercialProductEditorForm>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);
  readonly addonOptions = input<ISelectOption<string>[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly kindOptions = computed(() => {
    const labels = this.i18n.productKind();
    return COMMERCIAL_PRODUCT_KINDS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly durationModeOptions = computed(() => {
    const labels = this.i18n.durationMode();
    return COMMERCIAL_EDITOR_DURATION_MODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly participantsModeOptions = computed(() => {
    const labels = this.i18n.participantsMode();
    return COMMERCIAL_EDITOR_PARTICIPANTS_MODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly sessionModeOptions = computed(() => {
    const labels = this.i18n.sessionMode();
    return COMMERCIAL_SESSION_MODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });

  protected syncKind(): void {
    syncCommercialProductKind(this.form());
  }

  protected syncModes(): void {
    syncCommercialProductEditorControls(this.form());
  }
}
