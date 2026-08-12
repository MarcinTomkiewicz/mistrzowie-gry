import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_ACTION_APPEARANCES,
  COMMERCIAL_BUTTON_LAYOUTS,
  COMMERCIAL_ICON_KEYS,
  COMMERCIAL_TEXT_ALIGNS,
  commercialIconClass,
} from '../../../../core/configs/commercial-pages.config';
import { createCommercialButtonEditorForm } from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type {
  CommercialButtonEditorForm,
  CommercialButtonsBlockEditorForm,
} from '../../../../core/types/commercial-builder-block-editor-form';
import type { CommercialIconKey } from '../../../../core/types/commercial-page-builder';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';

@Component({
  selector: 'app-commercial-buttons-block-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    CommercialItemEditorActions,
  ],
  templateUrl: './commercial-buttons-block-editor.html',
})
export class CommercialButtonsBlockEditor {
  readonly form = input.required<CommercialButtonsBlockEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly layoutOptions = computed(() => this.options(
    COMMERCIAL_BUTTON_LAYOUTS,
    this.i18n.buttonLayout(),
  ));
  protected readonly alignOptions = computed(() => this.options(
    COMMERCIAL_TEXT_ALIGNS,
    this.i18n.textAlign(),
  ));
  protected readonly appearanceOptions = computed(() => this.options(
    COMMERCIAL_ACTION_APPEARANCES,
    this.i18n.actionAppearance(),
  ));
  protected readonly iconOptions = computed(() => [
    {
      value: null,
      label: this.i18n.buttons().noIcon,
      icon: 'pi pi-ban',
    },
    ...COMMERCIAL_ICON_KEYS.map((value) => ({
      value,
      label: this.i18n.iconKey()[value],
      icon: commercialIconClass(value),
    })),
  ]);

  protected selectIcon(
    button: CommercialButtonEditorForm,
    iconKey: CommercialIconKey | null,
  ): void {
    button.controls.iconKey.setValue(iconKey);
    button.controls.iconKey.markAsDirty();
    button.controls.iconKey.markAsTouched();
  }

  protected addButton(): void {
    const buttons = this.form().controls.buttons;
    buttons.push(createCommercialButtonEditorForm());
    buttons.markAsDirty();
  }

  protected removeButton(index: number): void {
    const buttons = this.form().controls.buttons;
    buttons.removeAt(index);
    buttons.markAsDirty();
  }

  protected moveButton(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.buttons, index, index + offset);
  }

  private options<TValue extends string>(
    values: readonly TValue[],
    labels: Record<TValue, string>,
  ) {
    return values.map((value) => ({ value, label: labels[value] }));
  }
}
