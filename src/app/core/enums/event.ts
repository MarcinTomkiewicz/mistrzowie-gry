export enum ParticipantSignupKind {
  WholeEvent = 'whole_event',
  ProgramItem = 'program_item',
  Both = 'both',
}

export enum EventOccurrenceStatus {
  Planned = 'planned',
  HostSignupOpen = 'host_signup_open',
  HostSignupClosed = 'host_signup_closed',
  Published = 'published',
  ParticipantSignupOpen = 'participant_signup_open',
  ParticipantSignupClosed = 'participant_signup_closed',
  Archived = 'archived',
}

export enum EventProgramItemStatus {
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Withdrawn = 'withdrawn',
  Published = 'published',
}

export enum EventProgramItemSourceKind {
  GmSessionTemplate = 'gm_session_template',
  CustomSession = 'custom_session',
}