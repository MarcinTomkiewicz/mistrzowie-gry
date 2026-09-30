import { FormControl, FormGroup } from '@angular/forms';

import { StaffingRealizationType } from './staffing-realization';

export type StaffingRealizationCoreForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  operationalNotes: FormControl<string>;
  city: FormControl<string>;
  venueName: FormControl<string>;
  venueAddress: FormControl<string>;
  timezone: FormControl<string>;
  type: FormControl<StaffingRealizationType>;
  eventId: FormControl<string | null>;
}>;
