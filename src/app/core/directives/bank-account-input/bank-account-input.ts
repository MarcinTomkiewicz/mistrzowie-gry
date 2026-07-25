import {
  Directive,
  ElementRef,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  formatBankAccount,
  normalizeBankAccount,
} from '../../utils/bank-account';

@Directive({
  selector: 'input[appBankAccountInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BankAccountInput),
      multi: true,
    },
  ],
  host: {
    '(input)': 'onInput()',
    '(blur)': 'onBlur()',
  },
})
export class BankAccountInput implements ControlValueAccessor {
  private readonly element =
    inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private propagateChange: (value: unknown) => void = () => undefined;
  private propagateTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.element.value = formatBankAccount(
      typeof value === 'string' ? value : '',
    );
  }

  registerOnChange(onChange: (value: unknown) => void): void {
    this.propagateChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.propagateTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.element.disabled = disabled;
  }

  protected onInput(): void {
    const input = this.element;
    const selectionStart = input.selectionStart ?? input.value.length;
    const inputCharacters = getBankAccountInputCharacters(input.value);
    const charactersBeforeCaret = getBankAccountInputCharacters(
      input.value.slice(0, selectionStart),
    ).length;
    const normalized = normalizeBankAccount(input.value);
    const formatted = formatBankAccount(normalized);
    const addedPolishPrefix =
      normalized.length === inputCharacters.length + 2 &&
      normalized === `PL${inputCharacters}`;
    const logicalCaretPosition =
      charactersBeforeCaret + (addedPolishPrefix ? 2 : 0);

    input.value = formatted;
    const caretPosition = getFormattedCaretPosition(
      logicalCaretPosition,
      formatted.length,
    );
    input.setSelectionRange(caretPosition, caretPosition);
    this.propagateChange(normalized);
  }

  protected onBlur(): void {
    this.propagateTouched();
  }
}

function getBankAccountInputCharacters(value: string): string {
  return value.toUpperCase().replace(/[ -]/g, '');
}

function getFormattedCaretPosition(
  characterCount: number,
  formattedLength: number,
): number {
  if (characterCount === 0) return 0;

  const precedingSeparators = Math.floor((characterCount - 1) / 4);
  return Math.min(characterCount + precedingSeparators, formattedLength);
}
