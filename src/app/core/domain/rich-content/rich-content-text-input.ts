import type { NumericInterval } from '../../types/interval';
import type {
  RichContentInlineReplacement,
  RichContentTextInput,
} from '../../types/rich-content-editor';

export function resolveRichContentTextInput(
  input: RichContentTextInput,
  value: string,
  caret: number,
): RichContentInlineReplacement {
  const range = resolveTextInputRange(input, value, caret);
  const prefix = input.value.slice(0, range.start);
  const suffix = input.value.slice(range.end);
  const replacementEnd = value.length - suffix.length;

  if (
    replacementEnd < range.start ||
    !value.startsWith(prefix) ||
    !value.endsWith(suffix)
  ) {
    throw new Error(`Unsupported textarea operation: ${input.inputType}`);
  }

  return {
    ...range,
    text: value.slice(range.start, replacementEnd),
  };
}

function resolveTextInputRange(
  input: RichContentTextInput,
  value: string,
  caret: number,
): NumericInterval {
  if (input.start !== input.end || !input.inputType.startsWith('delete')) {
    return { start: input.start, end: input.end };
  }

  if (input.inputType.endsWith('Backward')) {
    return { start: caret, end: input.end };
  }

  if (input.inputType.endsWith('Forward')) {
    const deletedLength = input.value.length - value.length;
    return { start: input.start, end: input.start + deletedLength };
  }

  return { start: input.start, end: input.end };
}
