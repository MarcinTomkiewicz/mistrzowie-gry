export type QuestionnairePdfHeadingLevel = "section" | "subsection";
export type QuestionnairePdfFieldSpan = "column" | "full";

export interface QuestionnairePdfHeading {
  readonly kind: "heading";
  readonly level: QuestionnairePdfHeadingLevel;
  readonly text: string;
}

export interface QuestionnairePdfField {
  readonly label: string;
  readonly value: string;
  readonly span: QuestionnairePdfFieldSpan;
}

export interface QuestionnairePdfFieldGrid {
  readonly kind: "field-grid";
  readonly fields: readonly QuestionnairePdfField[];
}

export interface QuestionnairePdfFormRow {
  readonly label: string;
  readonly value: string;
  readonly layout: "answer" | "detail" | "text";
}

export interface QuestionnairePdfFormRows {
  readonly kind: "form-rows";
  readonly rows: readonly QuestionnairePdfFormRow[];
}

export interface QuestionnairePdfTextBlock {
  readonly kind: "text";
  readonly paragraphs: readonly string[];
}

export interface QuestionnairePdfSignature {
  readonly kind: "signature";
  readonly placeAndDateLabel: string;
  readonly signatureLabel: string;
}

export type QuestionnairePdfContent =
  | QuestionnairePdfHeading
  | QuestionnairePdfFieldGrid
  | QuestionnairePdfFormRows
  | QuestionnairePdfTextBlock
  | QuestionnairePdfSignature;
