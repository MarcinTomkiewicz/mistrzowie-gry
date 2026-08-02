import { COWORKER_DOCUMENT_ORIGINS } from "../coworker-document-edge/coworker-document-models.ts";
import {
  RETENTION_CLEANUP_BUCKET,
  RETENTION_CLEANUP_CANDIDATE_REASONS,
  RETENTION_CLEANUP_RPC,
  RetentionCleanupBackendContractError,
  type RetentionCleanupClaim,
  retentionCleanupReaders,
} from "./contracts.ts";

const CLAIM_KEYS = [
  "jobId",
  "claimToken",
  "claimExpiresAt",
  "attemptCount",
  "documentVersionId",
  "documentId",
  "userId",
  "origin",
  "candidateReason",
  "versionNumber",
  "recordedSizeBytes",
  "bucket",
  "path",
] as const;

type RetentionCleanupClaimRpcName =
  | typeof RETENTION_CLEANUP_RPC.claim
  | typeof RETENTION_CLEANUP_RPC.claimForDocument;

const {
  backendArrayValue,
  backendEnum,
  backendLiteral,
  backendNullablePositiveInteger,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = retentionCleanupReaders;

export function parseRetentionCleanupClaims(
  value: unknown,
  context: RetentionCleanupClaimRpcName,
): RetentionCleanupClaim[] {
  const claims = backendArrayValue(value, context).map((claim) =>
    parseClaim(claim, context)
  );
  assertUnique(claims.map((claim) => claim.jobId), context);
  assertUnique(claims.map((claim) => claim.claimToken), context);
  assertUnique(claims.map((claim) => claim.documentVersionId), context);
  assertUnique(
    claims.map((claim) => `${claim.bucket}\u0000${claim.path}`),
    context,
  );
  return claims;
}

function parseClaim(
  value: unknown,
  context: RetentionCleanupClaimRpcName,
): RetentionCleanupClaim {
  const source = backendObject(value, context, CLAIM_KEYS);
  return {
    jobId: backendUuid(source, "jobId", context),
    claimToken: backendUuid(source, "claimToken", context),
    claimExpiresAt: backendTimestamp(source, "claimExpiresAt", context),
    attemptCount: backendPositiveInteger(source, "attemptCount", context),
    documentVersionId: backendUuid(source, "documentVersionId", context),
    documentId: backendUuid(source, "documentId", context),
    userId: backendUuid(source, "userId", context),
    origin: backendEnum(source, "origin", COWORKER_DOCUMENT_ORIGINS, context),
    candidateReason: backendEnum(
      source,
      "candidateReason",
      RETENTION_CLEANUP_CANDIDATE_REASONS,
      context,
    ),
    versionNumber: backendPositiveInteger(source, "versionNumber", context),
    recordedSizeBytes: backendNullablePositiveInteger(
      source,
      "recordedSizeBytes",
      context,
    ),
    bucket: backendLiteral(source, "bucket", RETENTION_CLEANUP_BUCKET, context),
    path: parseClaimPath(source, context),
  };
}

function parseClaimPath(
  source: Record<string, unknown>,
  context: RetentionCleanupClaimRpcName,
): string {
  const path = backendString(source, "path", context);
  if (
    path.trim() === "" ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#") ||
    path.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new RetentionCleanupBackendContractError(context);
  }
  return path;
}

function assertUnique(
  values: string[],
  context: RetentionCleanupClaimRpcName,
): void {
  if (new Set(values).size !== values.length) {
    throw new RetentionCleanupBackendContractError(context);
  }
}
