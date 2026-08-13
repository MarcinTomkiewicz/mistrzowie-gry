import type {
  RichContentInlineHistoryState,
} from '../../types/rich-content-editor';
import type { RichContentInlineNode } from '../../types/rich-content';

export class RichContentInlineHistory {
  private readonly undoStack: RichContentInlineHistoryState[] = [];
  private readonly redoStack: RichContentInlineHistoryState[] = [];

  record(
    nodes: readonly RichContentInlineNode[],
    selection: RichContentInlineHistoryState['selection'],
  ): void {
    this.undoStack.push(this.createHistoryState(nodes, selection));
    this.redoStack.length = 0;
  }

  private undo(
    nodes: readonly RichContentInlineNode[],
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState | null {
    const state = this.undoStack.pop();
    if (!state) return null;

    this.redoStack.push(this.createHistoryState(nodes, selection));
    return state;
  }

  private redo(
    nodes: readonly RichContentInlineNode[],
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState | null {
    const state = this.redoStack.pop();
    if (!state) return null;

    this.undoStack.push(this.createHistoryState(nodes, selection));
    return state;
  }

  restore(
    inputType: 'historyUndo' | 'historyRedo',
    nodes: readonly RichContentInlineNode[],
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState | null {
    return inputType === 'historyUndo'
      ? this.undo(nodes, selection)
      : this.redo(nodes, selection);
  }

  private createHistoryState(
    nodes: readonly RichContentInlineNode[],
    selection: RichContentInlineHistoryState['selection'],
  ): RichContentInlineHistoryState {
    return {
      nodes: nodes.map((node) => ({ ...node })),
      selection: { ...selection },
    };
  }
}
