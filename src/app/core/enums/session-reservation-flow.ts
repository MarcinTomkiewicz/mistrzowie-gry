export enum SessionReservationStepEnum {
  Mode = 'mode',
  Gm = 'gm',
  System = 'system',
  Time = 'time',
  Contact = 'contact',
  ExtraInfo = 'extra_info',
  Summary = 'summary',
}

export enum SessionReservationFallbackModeEnum {
  None = 'none',
  NextSlots = 'next_slots',
  AvailableOtherGms = 'available_other_gms',
}
