import { Component, input } from '@angular/core';

import type {
  SummaryByFormat,
  SummaryCopy,
} from '../../../core/types/i18n/join-the-party';

@Component({
  selector: 'app-join-the-party-summary',
  standalone: true,
  templateUrl: './join-the-party-summary.html',
})
export class JoinThePartySummary {
  readonly copy = input.required<SummaryCopy>();
  readonly shared = input.required<SummaryByFormat['shared']>();
  readonly placeHref = input<string | null>(null);
}
