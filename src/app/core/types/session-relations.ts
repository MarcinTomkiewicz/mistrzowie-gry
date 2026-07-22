import type {
  ICustomSessionLanguageRow,
  ICustomSessionStyleRow,
  ICustomSessionTriggerRow,
  IGmSessionTemplateLanguageRow,
  IGmSessionTemplateStyleRow,
  IGmSessionTemplateTriggerRow,
} from '../interfaces/i-session';

export type SessionStyleRow =
  | IGmSessionTemplateStyleRow
  | ICustomSessionStyleRow;

export type SessionTriggerRow =
  | IGmSessionTemplateTriggerRow
  | ICustomSessionTriggerRow;

export type SessionLanguageRow =
  | IGmSessionTemplateLanguageRow
  | ICustomSessionLanguageRow;

export type SessionRelationRow = {
  createdAt: string | null;
};

export type SessionRelationIdKey<TRow extends SessionRelationRow> = {
  [TKey in keyof TRow]-?: TRow[TKey] extends string ? TKey : never;
}[keyof TRow];
