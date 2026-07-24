import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";
import type { OperationalAssignment } from "../_shared/coworker-document-edge/operational-assignment-models.ts";
import { createOperationalAssignmentParser } from "../_shared/coworker-document-edge/operational-assignment-parser.ts";
import {
  BackendContractError,
  RequestValidationError,
  RPC,
  type RpcName,
  TARGET_KINDS,
  type TargetKind,
} from "./contracts.ts";

const APP_ROLES = [
  "user",
  "gm",
  "marketing_manager",
  "customer_manager",
  "lead_coordinator",
  "admin",
] as const;

const LIST_ITEM_KEYS = ["user", "assignment", "targetProvenance"] as const;
const USER_KEYS = [
  "userId",
  "email",
  "firstName",
  "appRole",
  "accessEnabled",
] as const;
const TARGET_PROVENANCE_KEYS = [
  "targetId",
  "targetKind",
  "appRole",
  "userId",
  "eventDefinitionId",
] as const;

type AppRole = typeof APP_ROLES[number];

export interface AdminOperationalAssignmentUser {
  userId: string;
  email: string;
  firstName: string | null;
  appRole: AppRole;
  accessEnabled: boolean;
}

type TargetProvenanceBase = {
  targetId: string;
};

export type AdminOperationalTargetProvenance =
  & TargetProvenanceBase
  & (
    | {
      targetKind: "all_active_coworkers";
      appRole: null;
      userId: null;
      eventDefinitionId: null;
    }
    | {
      targetKind: "app_role";
      appRole: AppRole;
      userId: null;
      eventDefinitionId: null;
    }
    | {
      targetKind: "user";
      appRole: null;
      userId: string;
      eventDefinitionId: null;
    }
    | {
      targetKind: "event_definition";
      appRole: null;
      userId: null;
      eventDefinitionId: string;
    }
  );

export interface AdminOperationalAssignmentListItem {
  user: AdminOperationalAssignmentUser;
  assignment: OperationalAssignment;
  targetProvenance: AdminOperationalTargetProvenance[];
}

const readers = createContractReaders<RpcName>({
  createRequestError: (fieldErrors) => new RequestValidationError(fieldErrors),
  createBackendError: (rpcName) => new BackendContractError(rpcName),
});

const {
  backendArrayValue,
  backendBoolean,
  backendEnum,
  backendNullableEnum,
  backendNullableString,
  backendNullableUuid,
  backendObject,
  backendString,
  backendUuid,
} = readers;

const { parseOperationalAssignment } = createOperationalAssignmentParser(
  readers,
  (rpcName) => new BackendContractError(rpcName),
);

export function parseAssignmentList(
  value: unknown,
  documentVersionId: string,
): AdminOperationalAssignmentListItem[] {
  const assignmentIds = new Set<string>();
  return backendArrayValue(value, RPC.getAssignmentList).map((item) => {
    const parsed = parseAssignmentListItem(item, documentVersionId);
    if (assignmentIds.has(parsed.assignment.id)) {
      throw new BackendContractError(RPC.getAssignmentList);
    }
    assignmentIds.add(parsed.assignment.id);
    return parsed;
  });
}

export function parseWaivedAssignment(
  value: unknown,
  assignmentId: string,
): OperationalAssignment {
  const assignment = parseOperationalAssignment(value, RPC.waiveAssignment);
  if (
    assignment.id !== assignmentId ||
    assignment.status !== "waived" ||
    assignment.waivedAt === null ||
    assignment.waiverReason === null ||
    assignment.waiverReason.trim() === ""
  ) {
    throw new BackendContractError(RPC.waiveAssignment);
  }
  return assignment;
}

function parseAssignmentListItem(
  value: unknown,
  documentVersionId: string,
): AdminOperationalAssignmentListItem {
  const source = backendObject(value, RPC.getAssignmentList, LIST_ITEM_KEYS);
  const user = parseUser(source.user);
  const assignment = parseOperationalAssignment(
    source.assignment,
    RPC.getAssignmentList,
  );
  const targetProvenance = parseTargetProvenance(source.targetProvenance);
  if (
    assignment.documentVersionId !== documentVersionId ||
    assignment.userId !== user.userId
  ) {
    throw new BackendContractError(RPC.getAssignmentList);
  }
  return { user, assignment, targetProvenance };
}

function parseUser(value: unknown): AdminOperationalAssignmentUser {
  const source = backendObject(value, RPC.getAssignmentList, USER_KEYS);
  return {
    userId: backendUuid(source, "userId", RPC.getAssignmentList),
    email: backendString(source, "email", RPC.getAssignmentList),
    firstName: backendNullableString(
      source,
      "firstName",
      RPC.getAssignmentList,
    ),
    appRole: backendEnum(
      source,
      "appRole",
      APP_ROLES,
      RPC.getAssignmentList,
    ),
    accessEnabled: backendBoolean(
      source,
      "accessEnabled",
      RPC.getAssignmentList,
    ),
  };
}

function parseTargetProvenance(
  value: unknown,
): AdminOperationalTargetProvenance[] {
  const targetIds = new Set<string>();
  return backendArrayValue(value, RPC.getAssignmentList).map((target) => {
    const parsed = parseTarget(target);
    if (targetIds.has(parsed.targetId)) {
      throw new BackendContractError(RPC.getAssignmentList);
    }
    targetIds.add(parsed.targetId);
    return parsed;
  });
}

function parseTarget(value: unknown): AdminOperationalTargetProvenance {
  const source = backendObject(
    value,
    RPC.getAssignmentList,
    TARGET_PROVENANCE_KEYS,
  );
  return toTargetVariant(
    backendUuid(source, "targetId", RPC.getAssignmentList),
    backendEnum(
      source,
      "targetKind",
      TARGET_KINDS,
      RPC.getAssignmentList,
    ),
    backendNullableEnum(
      source,
      "appRole",
      APP_ROLES,
      RPC.getAssignmentList,
    ),
    backendNullableUuid(source, "userId", RPC.getAssignmentList),
    backendNullableUuid(
      source,
      "eventDefinitionId",
      RPC.getAssignmentList,
    ),
  );
}

function toTargetVariant(
  targetId: string,
  targetKind: TargetKind,
  appRole: AppRole | null,
  userId: string | null,
  eventDefinitionId: string | null,
): AdminOperationalTargetProvenance {
  if (
    targetKind === "all_active_coworkers" &&
    appRole === null &&
    userId === null &&
    eventDefinitionId === null
  ) {
    return { targetId, targetKind, appRole, userId, eventDefinitionId };
  }
  if (
    targetKind === "app_role" &&
    appRole !== null &&
    userId === null &&
    eventDefinitionId === null
  ) {
    return { targetId, targetKind, appRole, userId, eventDefinitionId };
  }
  if (
    targetKind === "user" &&
    appRole === null &&
    userId !== null &&
    eventDefinitionId === null
  ) {
    return { targetId, targetKind, appRole, userId, eventDefinitionId };
  }
  if (
    targetKind === "event_definition" &&
    appRole === null &&
    userId === null &&
    eventDefinitionId !== null
  ) {
    return { targetId, targetKind, appRole, userId, eventDefinitionId };
  }
  throw new BackendContractError(RPC.getAssignmentList);
}
