import { mapEventPolicyRules } from '../../../../core/factories/event-policy-form.factory';
import type { AdminGlobalCalendarResult, GlobalTimeBlockInput } from '../../../../core/interfaces/i-admin-global-event';
import type { EventGlobalSaveController } from './event-global-save-controller';
import { sameScheduleBlocks } from './event-global-schedule-state';

// Presentation of local form values, never a persisted draft or a canonical Calendar DTO.
export function readEventGlobalSummaryChanges(save: EventGlobalSaveController) {
  const sections = save.changed();
  const policy = save.policy.sourceDocument();
  const source = sections.includes('policy') && policy ? mapEventPolicyRules(save.policy.form.controls.rules, policy) : null;
  const scheduleReadback = /-(uncertain|readback)$/.test(save.schedule.state());
  const scheduleChanged = sections.includes('schedule') || scheduleReadback;
  const preview = save.schedule.preview();
  const fullPreview = save.schedule.error() === null && preview && preview.status !== 'invalid' ? preview : null;
  const pending = save.schedule.state() === 'draft' ? save.schedule.calendar()?.pendingDraft : null;
  return {
    sections,
    invalid: sections.filter(key => save.forms[key].invalid),
    core: sections.includes('core') ? save.metadata.coreForm.getRawValue() : null,
    edition: sections.includes('edition') ? save.metadata.editionForm.getRawValue() : null,
    base: sections.includes('base') ? save.base.form.controls.timeBlocks.getRawValue() : null,
    dated: sections.includes('dated') ? { date: save.dated.date(), editionId: save.dated.editionId(),
      timeBlocks: save.dated.form.controls.override.value ? save.dated.form.controls.timeBlocks.getRawValue() : null } : null,
    scheduleChanged,
    scheduleReadback,
    scheduleProposal: !scheduleChanged ? null : pending ? { dates: pending.candidateDates, impact: null, blocked: false }
      : fullPreview ? { dates: fullPreview.candidateDates, impact: fullPreview.impact, blocked: !fullPreview.valid } : null,
    policy: source ? { global: { ...source.global, price: save.policy.form.controls.price.getRawValue() },
      cityOverrides: source.cityOverrides } : null,
  };
}

export type EventGlobalSummaryChanges = ReturnType<typeof readEventGlobalSummaryChanges>;

export function projectEventGlobalSummaryDates(calendar: AdminGlobalCalendarResult, changes: EventGlobalSummaryChanges | null) {
  const baseEdit = changes?.base ?? null;
  const baseline = baseEdit ?? calendar.timeBlocks;
  const datedBlocks = new Map(calendar.datedTimeBlocks.map(day => [day.globalOccurrenceId, day]));
  const edit = changes?.dated;
  const savedDates = new Map(calendar.globalDates.map(day => {
    const saved = datedBlocks.get(day.globalOccurrenceId);
    const dateEdit = edit?.date === day.date && !edit.editionId ? edit : null;
    const dateFrozen = saved?.source === 'published_snapshot';
    const source = !dateFrozen && dateEdit ? (dateEdit.timeBlocks ? 'date_specific' : 'core_baseline') : saved?.source;
    const inheritsBase = saved?.source === 'core_baseline';
    const inheritedDateChanged = !dateFrozen && (!!dateEdit || inheritsBase && baseEdit !== null);
    const timeBlocks = dateFrozen ? saved.timeBlocks : dateEdit ? dateEdit.timeBlocks ?? baseline
      : inheritsBase && baseEdit ? baseline : saved?.timeBlocks ?? baseline;
    return [day.date, {
      ...day,
      source,
      changed: !dateFrozen && (!!dateEdit || saved !== undefined && !sameScheduleBlocks(timeBlocks, saved.timeBlocks)),
      timeBlocks,
      showBlockDetails: !sameScheduleBlocks(timeBlocks, baseline),
      cities: day.cityOccurrences.map(city => {
        const local = saved?.cities.find(row => row.editionId === city.editionId);
        const cityEdit = edit?.date === day.date && edit.editionId === city.editionId ? edit : null;
        const frozen = local?.publishedSnapshot === true;
        const isOverride = !frozen && cityEdit ? cityEdit.timeBlocks !== null : local?.isOverride === true;
        const inheritsDate = !local?.isOverride && inheritedDateChanged;
        const effective: GlobalTimeBlockInput[] = frozen ? local.timeBlocks : cityEdit ? cityEdit.timeBlocks ?? timeBlocks
          : inheritsDate ? timeBlocks : local?.timeBlocks ?? timeBlocks;
        return { ...city, hasBlocks: local !== undefined, isOverride, publishedSnapshot: frozen, timeBlocks: effective,
          changed: !frozen && (!!cityEdit || local !== undefined && !sameScheduleBlocks(effective, local.timeBlocks)),
          showBlockDetails: !sameScheduleBlocks(effective, timeBlocks) };
      }),
    }] as const;
  }));
  const proposal = changes?.scheduleProposal;
  const proposedDates = proposal ? new Set(proposal.dates) : null;
  const retired = new Set(proposal?.impact?.retirableUnprotectedDates);
  const historical = new Set(proposal?.impact?.preservedHistoricalDates);
  // Proposed dates have no invented GlobalDate, Occurrence, city state or frozen blocks.
  return [...new Set([...savedDates.keys(), ...(proposedDates ?? [])])].sort().map(date => {
    const saved = savedDates.get(date) ?? null;
    const state: 'saved' | 'added' | 'retained' | 'removed' | 'outside' = !proposedDates ? 'saved'
      : proposedDates.has(date) ? saved ? 'retained' : 'added' : retired.has(date) ? 'removed' : 'outside';
    return { date, state, saved,
      protected: historical.has(date) || saved?.source === 'published_snapshot' ||
        saved?.cities.some(city => city.protected || city.publishedAt !== null || city.publishedSnapshot) === true };
  });
}
