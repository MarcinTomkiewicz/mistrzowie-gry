import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_CARD_ORIENTATIONS,
  COMMERCIAL_MANUAL_CARD_COLUMNS,
} from '../../../../core/configs/commercial-pages.config';
import {
  createCommercialCardEditorForm,
  syncCommercialCardPriceControl,
} from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type { CommercialCardsBlockEditorForm } from '../../../../core/types/commercial-builder-block-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';
import { CommercialPriceEditor } from './commercial-price-editor';
import { CommercialRichContentEditor } from './commercial-rich-content-editor';

@Component({
  selector: 'app-commercial-cards-block-editor',
  imports: [ReactiveFormsModule, ButtonModule, CheckboxModule, IftaLabelModule, InputTextModule, SelectModule, CommercialItemEditorActions, CommercialPriceEditor, CommercialRichContentEditor],
  templateUrl: './commercial-cards-block-editor.html',
})
export class CommercialCardsBlockEditor {
  readonly form = input.required<CommercialCardsBlockEditorForm>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly orientationOptions = computed(() => {
    const labels = this.i18n.cardOrientation();
    return COMMERCIAL_CARD_ORIENTATIONS.map((value) => ({ value, label: labels[value] }));
  });
  protected readonly columnOptions = COMMERCIAL_MANUAL_CARD_COLUMNS.map((value) => ({ value, label: String(value) }));

  protected addCard(): void {
    const cards = this.form().controls.items;
    cards.push(createCommercialCardEditorForm());
    cards.markAsDirty();
  }
  protected removeCard(index: number): void {
    const cards = this.form().controls.items;
    cards.removeAt(index);
    cards.markAsDirty();
  }
  protected moveCard(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.items, index, index + offset);
  }
  protected syncPrice(index: number): void {
    const card = this.form().controls.items.at(index);
    syncCommercialCardPriceControl(card);
  }
}
