import { createCoworkerDocumentDefinitionParser } from "../_shared/coworker-document-edge/coworker-document-definition-parser.ts";
import { createCoworkerOnboardingCaseParser } from "../_shared/coworker-document-edge/coworker-onboarding-case-parser.ts";
import {
  type CoworkerDocumentPortal,
  type CoworkerDocumentPortalAccess,
  type CoworkerDocumentPortalViewer,
  RPC,
} from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
} from "./contract-context.ts";
import {
  parsePortalNotification,
  parsePortalRequirement,
} from "./document-portal-item-parser.ts";

const PORTAL_KEYS = [
  "userId",
  "access",
  "activeOnboardingCase",
  "requirements",
  "documentCatalog",
  "notifications",
  "unreadNotificationCount",
  "viewer",
] as const;
const ACCESS_KEYS = ["enabled", "grantedAt", "grantedViaRole"] as const;
const VIEWER_KEYS = ["actorUserId", "isAdmin"] as const;

const {
  backendArrayValue,
  backendBoolean,
  backendNonNegativeInteger,
  backendNullableTimestamp,
  backendObject,
  backendUuid,
} = coworkerDocumentReaders;
const { parseCoworkerDocumentDefinition } =
  createCoworkerDocumentDefinitionParser(coworkerDocumentReaders);
const { parseCoworkerOnboardingCase } = createCoworkerOnboardingCaseParser(
  coworkerDocumentReaders,
);

export function parsePortalResult(
  value: unknown,
  userId: string,
): CoworkerDocumentPortal {
  const result = backendObject(value, RPC.getPortal, PORTAL_KEYS);
  const requirements = backendArrayValue(result.requirements, RPC.getPortal)
    .map(parsePortalRequirement);
  const documentCatalog = backendArrayValue(
    result.documentCatalog,
    RPC.getPortal,
  ).map((definition) =>
    parseCoworkerDocumentDefinition(definition, RPC.getPortal)
  );
  const notifications = backendArrayValue(
    result.notifications,
    RPC.getPortal,
  ).map(parsePortalNotification);
  const activeOnboardingCase = result.activeOnboardingCase === null
    ? null
    : parseCoworkerOnboardingCase(
      result.activeOnboardingCase,
      RPC.getPortal,
    );
  const portal: CoworkerDocumentPortal = {
    userId: backendUuid(result, "userId", RPC.getPortal),
    access: parseAccess(result.access),
    activeOnboardingCase,
    requirements,
    documentCatalog,
    notifications,
    unreadNotificationCount: backendNonNegativeInteger(
      result,
      "unreadNotificationCount",
      RPC.getPortal,
    ),
    viewer: parseViewer(result.viewer),
  };

  if (
    portal.userId !== userId ||
    portal.viewer.actorUserId !== userId ||
    (activeOnboardingCase !== null &&
      activeOnboardingCase.userId !== portal.userId) ||
    hasDuplicates(requirements.map((requirement) => requirement.id)) ||
    hasDuplicates(documentCatalog.map((definition) => definition.id)) ||
    hasDuplicates(documentCatalog.map((definition) => definition.code)) ||
    hasDuplicates(notifications.map((notification) => notification.id))
  ) {
    throw new BackendContractError(RPC.getPortal);
  }
  return portal;
}

function parseAccess(value: unknown): CoworkerDocumentPortalAccess {
  const result = backendObject(value, RPC.getPortal, ACCESS_KEYS);
  return {
    enabled: backendBoolean(result, "enabled", RPC.getPortal),
    grantedAt: backendNullableTimestamp(result, "grantedAt", RPC.getPortal),
    grantedViaRole: backendBoolean(result, "grantedViaRole", RPC.getPortal),
  };
}

function parseViewer(value: unknown): CoworkerDocumentPortalViewer {
  const result = backendObject(value, RPC.getPortal, VIEWER_KEYS);
  return {
    actorUserId: backendUuid(result, "actorUserId", RPC.getPortal),
    isAdmin: backendBoolean(result, "isAdmin", RPC.getPortal),
  };
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}
