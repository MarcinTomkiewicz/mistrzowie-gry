import { ParticipantSignupKind } from '../../../core/enums/event';
import { ISelectOption } from '../../../core/interfaces/i-select-option';
import { ParticipantKindCopy } from '../../../core/types/i18n/admin-events';

export function createParticipantSignupKindOptions(
  copy: ParticipantKindCopy,
): ISelectOption<ParticipantSignupKind>[] {
  return Object.values(ParticipantSignupKind).map((value) => ({
    value,
    label: resolveParticipantSignupKindLabel(value, copy),
  }));
}

export function resolveParticipantSignupKindLabel(
  kind: ParticipantSignupKind,
  copy: ParticipantKindCopy,
): string {
  switch (kind) {
    case ParticipantSignupKind.WholeEvent:
      return copy.wholeEvent;
    case ParticipantSignupKind.ProgramItem:
      return copy.programItem;
    case ParticipantSignupKind.Both:
      return copy.both;
  }
}
