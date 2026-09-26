import { Component, input } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import type { CommercialPagePublicationIssueIndex } from '../../../../core/domain/commercial-pages/commercial-page-publication-issues';
import { createCommercialFaqEntryEditorForm } from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type { CommercialFaqBlockEditorForm } from '../../../../core/types/commercial-builder-block-editor-form';
import { moveFormArrayControl, setControlValue } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';
import { RichContentEditor } from '../../../../common/rich-content-editor/rich-content-editor';
import { RichContentInlineEditor } from '../../../../common/rich-content-editor/rich-content-inline-editor';
import { CommercialPublicationIssueMessages } from './commercial-publication-issue-messages';

@Component({
  selector: 'app-commercial-faq-block-editor',
  imports: [
    ButtonModule,
    ItemEditorActions,
    RichContentEditor,
    RichContentInlineEditor,
    CommercialPublicationIssueMessages,
  ],
  templateUrl: './commercial-faq-block-editor.html',
})
export class CommercialFaqBlockEditor {
  readonly form = input.required<CommercialFaqBlockEditorForm>();
  readonly diagnostics = input.required<CommercialPagePublicationIssueIndex>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);
  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly updateQuestion = setControlValue;

  protected addItem(): void {
    const items = this.form().controls.items;
    items.push(createCommercialFaqEntryEditorForm());
    items.markAsDirty();
  }
  protected removeItem(index: number): void {
    const items = this.form().controls.items;
    items.removeAt(index);
    items.markAsDirty();
  }
  protected moveItem(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.items, index, index + offset);
  }
}
