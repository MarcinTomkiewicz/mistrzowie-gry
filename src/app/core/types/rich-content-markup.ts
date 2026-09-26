import type { NumericInterval } from './interval';
import type { RichContentInlineNode } from './rich-content';

export interface RichContentMarkupSpan {
  node: RichContentInlineNode;
  source: NumericInterval;
  content: NumericInterval;
  text: NumericInterval;
}

export interface RichContentMarkupIssue extends NumericInterval {
  messageKey: 'incompleteMarkup' | 'invalidMarkup' | 'invalidDialog' | 'invalidLink';
}

export interface RichContentMarkupResult<TNode = RichContentInlineNode> {
  nodes: TNode[];
  spans: RichContentMarkupSpan[];
  issues: RichContentMarkupIssue[];
}

export interface RichContentInlineHistoryState {
  source: string;
  selection: NumericInterval;
}
