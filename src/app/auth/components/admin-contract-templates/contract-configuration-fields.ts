import type { ContractField, ContractPlacement, ContractTemplateConfiguration } from '../../../core/types/contract-template-configuration';
import type { CommonValuesTranslations } from '../../../core/types/i18n/common';

export function contractConditionOptions(
  field: ContractField | undefined,
  labels: Pick<CommonValuesTranslations, 'yes' | 'no' | 'notProvided'>,
): { value: string | boolean; label: string }[] {
  if (field?.kind === 'checkbox') return [{ value: true, label: labels.yes }, { value: false, label: labels.no }];
  return field?.kind === 'select'
    ? field.options.map(({ value, label }) => ({ value, label: label.trim() ? label : labels.notProvided })) : [];
}

export function contractDependencyLabels(
  fields: readonly ContractField[], names: Record<string, string>, labels: CommonValuesTranslations,
): Partial<Record<string, string>> {
  const byId = new Map(fields.map((field) => [field.id, field]));
  return Object.fromEntries(fields.flatMap(({ id, visibleWhen }) => {
    if (!visibleWhen) return [];
    const options = contractConditionOptions(byId.get(visibleWhen.fieldId), labels);
    const value = options.find((option) => option.value === visibleWhen.equals);
    return value ? [[id, `${names[visibleWhen.fieldId]} = ${value.label}`]] : [];
  }));
}

export function contractPlacementRows(
  placements: readonly ContractPlacement[], fields: readonly ContractField[], names: Record<string, string>, notProvided: string,
) {
  const byId = new Map(fields.map((field) => [field.id, field]));
  return placements.map((placement, index) => {
    const option = placement.kind === 'checkbox' && placement.optionValue !== null
      ? byId.get(placement.fieldId)?.options.find(({ value }) => value === placement.optionValue) : undefined;
    return {
      index, page: placement.page, fieldLabel: names[placement.fieldId],
      optionLabel: option && (option.label.trim() ? option.label : notProvided),
    };
  });
}

export function updateContractFields(draft: ContractTemplateConfiguration, fields: ContractField[]) {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const retainedIndices: number[] = [];
  const placements = draft.placements.flatMap<ContractPlacement>((placement, index) => {
    const field = byId.get(placement.fieldId);
    if (!field) return [];
    if (placement.kind === 'text') {
      if (field.kind === 'checkbox') return [];
      retainedIndices.push(index);
      return [{ ...placement, multiline: field.kind === 'multiline' || placement.multiline }];
    }
    const matches = field.kind === 'checkbox' && placement.optionValue === null ||
      field.kind === 'select' && field.options.some(({ value }) => value === placement.optionValue);
    if (!matches) return [];
    retainedIndices.push(index);
    return [placement];
  });
  const updatedFields = fields.map((field) => {
    const condition = field.visibleWhen;
    const source = condition && byId.get(condition.fieldId);
    if (!condition || (source?.kind === 'checkbox' && typeof condition.equals === 'boolean') ||
        (source?.kind === 'select' && source.options.some(({ value }) => value === condition.equals))) return field;
    return { ...field, visibleWhen: null };
  });
  return { configuration: { ...draft, fields: updatedFields, placements }, retainedIndices };
}
