import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  AdminStaffingFinalPlan,
  StaffingFinalPlanSaveItem,
  StaffingFinalSessionDifficultyLevel,
  StaffingFinalSessionOverride,
  StaffingFinalSessionOverrideInput,
} from '../interfaces/admin-staffing-final-plan';
import type { StaffingFinalPlanForm, StaffingFinalPlanItemForm, StaffingFinalSessionOverrideForm } from '../types/staffing-final-plan-form';
import { normalizeText } from '../utils/normalize-text';
import { integerValidator } from '../validators/form-value.validator';

export function createStaffingFinalPlanForm(): StaffingFinalPlanForm {
  const items = new FormArray<StaffingFinalPlanItemForm>([]);
  items.setValidators(() => {
    const assignments = items.getRawValue()
      .filter(item => item.candidateId !== null)
      .map(item => `${item.slotId}:${item.candidateId}`);
    return new Set(assignments).size === assignments.length ? null : { duplicateSlotCandidate: true };
  });
  return new FormGroup({ items });
}

export function createStaffingFinalPlanItemForm(
  slotId: string,
  position: number,
  item?: StaffingFinalPlanSaveItem,
): StaffingFinalPlanItemForm {
  return new FormGroup({
    id: new FormControl(item?.id ?? null),
    slotId: new FormControl(slotId, { nonNullable: true }),
    candidateId: new FormControl(item?.candidateId ?? null, { validators: [Validators.required] }),
    sourceKind: new FormControl(item?.sourceKind ?? 'template', { nonNullable: true }),
    sessionId: new FormControl(item?.sessionId ?? null, { validators: [Validators.required] }),
    position: new FormControl(item?.position ?? position, {
      nonNullable: true, validators: [integerValidator(), Validators.min(1)],
    }),
    sessionOverride: createStaffingFinalSessionOverrideForm(item?.sessionOverride ?? {}),
  });
}

export function populateStaffingFinalPlanForm(form: StaffingFinalPlanForm, plan: AdminStaffingFinalPlan): void {
  const items = form.controls.items;
  items.clear({ emitEvent: false });
  for (const day of plan.days) {
    for (const slot of day.slots) {
      for (const assignment of slot.assignments) {
        items.push(createStaffingFinalPlanItemForm(slot.slotId, assignment.position, {
          id: assignment.id,
          slotId: slot.slotId,
          candidateId: assignment.candidateId,
          sourceKind: assignment.sourceKind,
          sessionId: assignment.sessionId,
          position: assignment.position,
          sessionOverride: assignment.sessionOverride,
        }), { emitEvent: false });
      }
    }
  }
  form.markAsPristine();
  form.markAsUntouched();
  form.updateValueAndValidity();
}

export function mapStaffingFinalPlanFormToInput(form: StaffingFinalPlanForm): StaffingFinalPlanSaveItem[] {
  return form.controls.items.controls.map(item => {
    const { id, slotId, candidateId, sourceKind, sessionId, position } = item.getRawValue();
    if (candidateId === null || sessionId === null) throw new Error('[STAFFING_FINAL_PLAN] Assignment is incomplete.');
    return {
      ...(id === null ? {} : { id }),
      slotId, candidateId, sourceKind, sessionId, position,
      sessionOverride: mapStaffingFinalSessionOverrideToInput(item.controls.sessionOverride),
    };
  });
}

export function mapStaffingFinalSessionOverrideToInput(form: StaffingFinalSessionOverrideForm): StaffingFinalSessionOverride {
  const value = form.getRawValue();
  const title = normalizeText(value.title);
  const description = normalizeText(value.description);
  const image = normalizeText(value.image);
  return {
    ...(title === null ? {} : { title }),
    ...(description === null ? {} : { description }),
    ...(image === null ? {} : { image }),
    ...(value.difficultyLevel === null ? {} : { difficultyLevel: value.difficultyLevel }),
    ...(value.minPlayers === null ? {} : { minPlayers: value.minPlayers }),
    ...(value.maxPlayers === null ? {} : { maxPlayers: value.maxPlayers }),
    ...(value.minAge === null ? {} : { minAge: value.minAge }),
    ...(value.hasReadyCharacterSheets === null ? {} : { hasReadyCharacterSheets: value.hasReadyCharacterSheets }),
    ...(value.allowsScenarioCustomization === null ? {} : { allowsScenarioCustomization: value.allowsScenarioCustomization }),
  };
}

function createStaffingFinalSessionOverrideForm(value: StaffingFinalSessionOverrideInput): StaffingFinalSessionOverrideForm {
  return new FormGroup({
    title: new FormControl(value.title ?? null),
    description: new FormControl(value.description ?? null),
    image: new FormControl(value.image ?? null),
    difficultyLevel: new FormControl<StaffingFinalSessionDifficultyLevel | null>(value.difficultyLevel ?? null),
    minPlayers: new FormControl(value.minPlayers ?? null, { validators: [integerValidator(), Validators.min(1)] }),
    maxPlayers: new FormControl(value.maxPlayers ?? null, { validators: [integerValidator(), Validators.min(1), Validators.max(5)] }),
    minAge: new FormControl(value.minAge ?? null, { validators: [integerValidator(), Validators.min(0)] }),
    hasReadyCharacterSheets: new FormControl<boolean | null>(value.hasReadyCharacterSheets ?? null),
    allowsScenarioCustomization: new FormControl<boolean | null>(value.allowsScenarioCustomization ?? null),
  });
}
