import type { RichContentInlineHistoryState } from '../../types/rich-content-markup';

export class RichContentInlineHistory {
  private readonly undoStack: RichContentInlineHistoryState[] = [];
  private readonly redoStack: RichContentInlineHistoryState[] = [];

  record(
    source: string,
    selection: RichContentInlineHistoryState['selection'],
  ): void {
    this.undoStack.push(this.createHistoryState(source, selection));
    this.redoStack.length = 0;
  }

  private undo(
    source: string,
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState | null {
    const state = this.undoStack.pop();
    if (!state) return null;

    this.redoStack.push(this.createHistoryState(source, selection));
    return state;
  }

  private redo(
    source: string,
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState | null {
    const state = this.redoStack.pop();
    if (!state) return null;

    this.undoStack.push(this.createHistoryState(source, selection));
    return state;
  }

  restore(
    inputType: 'historyUndo' | 'historyRedo',
    source: string,
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState | null {
    return inputType === 'historyUndo'
      ? this.undo(source, selection)
      : this.redo(source, selection);
  }

  private createHistoryState(
    source: string,
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState {
    return {
      source,
      selection: { ...selection },
    };
  }
}
