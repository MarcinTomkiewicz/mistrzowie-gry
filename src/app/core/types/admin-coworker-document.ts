import { FormArray, FormControl, FormGroup } from '@angular/forms';

import {
  CoworkerDocumentMultiplicity,
  CoworkerDocumentOriginPolicy,
} from './coworker-document';

export const ADMIN_COWORKER_DOCUMENT_ACTION = {
  saveDefinition: 'saveDefinition',
  ensureOnboarding: 'ensureOnboarding',
  seedDefaultRequirements: 'seedDefaultRequirements',
  assignRequirement: 'assignRequirement',
} as const;

export const ADMIN_COWORKER_DOCUMENT_ERROR_CODE = {
  resourceNotFound: 'DOCUMENT_RESOURCE_NOT_FOUND',
  documentConflict: 'DOCUMENT_CONFLICT',
  concurrentModification: 'CONCURRENT_MODIFICATION',
} as const;

export type AdminCoworkerDocumentAction =
  (typeof ADMIN_COWORKER_DOCUMENT_ACTION)[keyof typeof ADMIN_COWORKER_DOCUMENT_ACTION];

export type AdminCoworkerDocumentDefinitionPayload = {
  readonly id: string | null;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly originPolicy: CoworkerDocumentOriginPolicy;
  readonly multiplicity: CoworkerDocumentMultiplicity;
  readonly isRequiredByDefault: boolean;
  readonly signaturePolicyCode: string;
  readonly allowedMimeTypes: readonly string[];
  readonly allowedExtensions: readonly string[];
  readonly maxSizeBytes: number;
  readonly retentionDays: number | null;
  readonly isActive: boolean;
  readonly activeFrom: string | null;
  readonly activeUntil: string | null;
};

export type AdminCoworkerRequirementPayload = {
  readonly userId: string;
  readonly onboardingCaseId: string | null;
  readonly documentDefinitionId: string;
  readonly required: boolean;
  readonly dueAt: string | null;
};

export type AdminCoworkerDocumentArrayField =
  | 'allowedMimeTypes'
  | 'allowedExtensions';

export type AdminCoworkerDocumentDefinitionForm = FormGroup<{
  code: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  originPolicy: FormControl<CoworkerDocumentOriginPolicy>;
  multiplicity: FormControl<CoworkerDocumentMultiplicity>;
  isRequiredByDefault: FormControl<boolean>;
  signaturePolicyCode: FormControl<string>;
  allowedMimeTypes: FormArray<FormControl<string>>;
  allowedExtensions: FormArray<FormControl<string>>;
  maxSizeBytes: FormControl<number>;
  retentionDays: FormControl<number | null>;
  isActive: FormControl<boolean>;
  activeFrom: FormControl<Date | null>;
  activeUntil: FormControl<Date | null>;
}>;

export type AdminCoworkerDocumentActionRequest =
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition;
      readonly definition: AdminCoworkerDocumentDefinitionPayload;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding;
      readonly userId: string;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements;
      readonly userId: string;
      readonly onboardingCaseId: string;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement;
      readonly requirement: AdminCoworkerRequirementPayload;
    };
