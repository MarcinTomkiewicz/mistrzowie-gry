import { IGmPublicProfile } from './i-gm-public-profile';

export interface ISessionReservationAvailableSlot {
  gmProfileId: string;
  startsAt: string;
  endsAt: string;
  date: string;
  startTime: string;
  durationHours: number;
}

export interface ISessionReservationGmSlot
  extends ISessionReservationAvailableSlot {
  gm: IGmPublicProfile;
}
