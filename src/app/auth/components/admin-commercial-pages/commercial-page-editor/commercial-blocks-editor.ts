import { Component, computed, input, model } from '@angular/core';
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
import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';

@Component({
  selector: 'app-commercial-blocks-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    CommercialBlockEditor,
    ItemEditorActions,
  ],
  templateUrl: './commercial-blocks-editor.html',
})
export class CommercialBlocksEditor {
  readonly blocks = input.required<FormArray<CommercialPageBlockEditorForm>>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);
  readonly activeBlockId = model<string | null>(null);

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
    this.activeBlockId.set(
      blocks.at(blocks.length - 1).controls.id.getRawValue(),
    );
  }

  protected removeBlock(index: number): void {
    const blocks = this.blocks();
    const blockId = blocks.at(index).controls.id.getRawValue();
    blocks.removeAt(index);
    blocks.markAsDirty();

    if (this.activeBlockId() === blockId) {
      this.activeBlockId.set(null);
    }
  }

  protected moveBlock(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.blocks(), index, index + offset);
  }

  protected editBlock(index: number): void {
    this.activeBlockId.set(
      this.blocks().at(index).controls.id.getRawValue(),
    );
  }

  protected closeBlock(): void {
    this.activeBlockId.set(null);
  }
}
