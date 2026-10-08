export interface IUniversalCalendarDay {
  date: string;
  hours?: readonly boolean[] | null;
  isBlocked?: boolean;
  availabilityCount?: number;
}

export interface IUniversalCalendarHourVm {
  readonly index: number;
  readonly isActive: boolean;
  readonly label: string;
}

export interface IUniversalCalendarDayVm {
  readonly iso: string;
  readonly label: string;
  readonly dayNumber: number;
  readonly availabilityCount?: number;
  readonly hours: readonly IUniversalCalendarHourVm[];
  readonly isCurrentMonth: boolean;
  readonly isDisabled: boolean;
  readonly isSelected: boolean;
  readonly canInspect: boolean;
  readonly showDetailsHint: boolean;
  readonly canSelect: boolean;
}
