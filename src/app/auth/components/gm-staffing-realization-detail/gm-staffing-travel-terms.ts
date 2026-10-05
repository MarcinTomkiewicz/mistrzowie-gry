import { Component, computed, input } from '@angular/core';

import type { MyStaffingTravelTerms } from '../../../core/interfaces/my-staffing-realization';
import { formatNumber } from '../../../core/utils/number-format';
import { createGmStaffingTravelTermsI18n } from './gm-staffing-realization-detail.i18n';

@Component({
  selector: 'app-gm-staffing-travel-terms',
  templateUrl: './gm-staffing-travel-terms.html',
})
export class GmStaffingTravelTerms {
  readonly terms = input.required<MyStaffingTravelTerms>();

  protected readonly i18n = createGmStaffingTravelTermsI18n();
  protected readonly groups = computed(() => {
    const terms = this.terms();
    const values = this.i18n.commonValues();
    const yesNo = (value: boolean) => value ? values.yes : values.no;

    const groups = [
      {
        key: 'logistics',
        rows: [
          { key: 'transportMode', value: terms.transportMode === null ? null : this.i18n.transportModes()[terms.transportMode] },
          { key: 'transportNote', value: terms.transportNote },
          { key: 'reimbursementMode', value: terms.reimbursementMode === null ? null : this.i18n.reimbursementModes()[terms.reimbursementMode] },
          { key: 'mileageRatePlnPerKm', value: terms.mileageRatePlnPerKm === null ? null : formatNumber(terms.mileageRatePlnPerKm, 'pl-PL') },
          { key: 'reimbursementNote', value: terms.reimbursementNote },
          { key: 'lodgingProvided', value: yesNo(terms.lodgingProvided) },
          { key: 'lodgingNights', value: terms.lodgingNights === null ? null : formatNumber(terms.lodgingNights, 'pl-PL') },
          { key: 'lodgingNote', value: terms.lodgingNote },
          { key: 'breakfastProvided', value: yesNo(terms.breakfastProvided) },
          { key: 'lunchProvided', value: yesNo(terms.lunchProvided) },
          { key: 'dinnerProvided', value: yesNo(terms.dinnerProvided) },
          { key: 'mealAllowanceApplicable', value: yesNo(terms.mealAllowanceApplicable) },
        ],
      },
      {
        key: 'workTime',
        rows: [
          { key: 'workTimeScope', value: this.i18n.workTimeScopes()[terms.workTimeScope] },
          { key: 'workTimeNote', value: terms.workTimeNote },
        ],
      },
      {
        key: 'additionalNotes',
        rows: [{ key: 'travelNote', value: terms.travelNote }],
      },
    ] as const;

    return groups.map(group => ({
      ...group,
      rows: group.rows.filter(row => {
        switch (row.key) {
          case 'mileageRatePlnPerKm':
            return terms.reimbursementMode === 'mileage';
          case 'lodgingNights':
            return terms.lodgingProvided;
          case 'transportNote':
          case 'reimbursementNote':
          case 'lodgingNote':
          case 'workTimeNote':
          case 'travelNote':
            return Boolean(row.value);
          default:
            return true;
        }
      }),
    })).filter(group => group.rows.length > 0);
  });
}
