import { Component, computed, input } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { COMMERCIAL_BUILDER_BLOCK_TYPES } from '../../../../core/configs/commercial-pages.config';
import { createNewCommercialBlockEditorForm } from '../../../../core/factories/commercial-block-editor-form.factory';
import type { CommercialPageBlockEditorForm } from '../../../../core/types/commercial-builder-block-editor-form';
import type { CommercialBlockType } from '../../../../core/types/commercial-page-builder';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialBlockEditor } from './commercial-block-editor';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';

@Component({
  selector: 'app-commercial-blocks-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    CommercialBlockEditor,
    CommercialItemEditorActions,
  ],
  templateUrl: './commercial-blocks-editor.html',
})
export class CommercialBlocksEditor {
  readonly blocks = input.required<FormArray<CommercialPageBlockEditorForm>>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly selectedType = new FormControl<CommercialBlockType | null>(null);
  protected readonly blockTypeOptions = computed(() => {
    const labels = this.i18n.blockType();
    return COMMERCIAL_BUILDER_BLOCK_TYPES.map((value) => ({
      value,
      label: labels[value],
    }));
  });

  protected addBlock(): void {
    const type = this.selectedType.getRawValue();
    if (!type) return;

    const blocks = this.blocks();
    blocks.push(createNewCommercialBlockEditorForm(type));
    blocks.markAsDirty();
    this.selectedType.setValue(null);
  }

  protected removeBlock(index: number): void {
    const blocks = this.blocks();
    blocks.removeAt(index);
    blocks.markAsDirty();
  }

  protected moveBlock(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.blocks(), index, index + offset);
  }
}
