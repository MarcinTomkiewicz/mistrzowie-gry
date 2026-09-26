import type { CommercialPagePublicationIssue } from '../../types/commercial-page-admin';
import type { CommercialPageEditorDocument } from '../../types/commercial-page-editor';
import type { RichContentEditorIssue } from '../../types/rich-content-editor';

export type CommercialPagePublicationIssueLocation = {
  sectionId?: string;
  blockId?: string;
  productId?: string;
  itemId?: string;
  field?: string;
};

type ResolvedIssue = {
  issue: CommercialPagePublicationIssue;
  sectionId?: string;
  blockId?: string;
  productId?: string;
  itemIds: readonly string[];
  field?: string;
};

export type UnresolvedCommercialPagePublicationIssue = {
  issue: CommercialPagePublicationIssue;
  rawPath: string;
};

export interface CommercialPagePublicationIssueIndex {
  readonly totalIssueCount: number;
  readonly rootIssues: readonly CommercialPagePublicationIssue[];
  readonly unresolvedIssues: readonly UnresolvedCommercialPagePublicationIssue[];
  sectionIssueCount(sectionId: string): number;
  blockIssueCount(blockId: string): number;
  issuesAt(
    location: CommercialPagePublicationIssueLocation,
  ): readonly CommercialPagePublicationIssue[];
  issuesWithin(
    location: CommercialPagePublicationIssueLocation,
  ): readonly CommercialPagePublicationIssue[];
  richContentIssues(
    location: CommercialPagePublicationIssueLocation,
  ): readonly RichContentEditorIssue[];
}

class ResolvedCommercialPagePublicationIssueIndex
  implements CommercialPagePublicationIssueIndex {
  readonly totalIssueCount: number;
  readonly rootIssues: readonly CommercialPagePublicationIssue[];
  readonly unresolvedIssues: readonly UnresolvedCommercialPagePublicationIssue[];

  private readonly resolvedIssues: readonly ResolvedIssue[];
  private readonly sectionCounts = new Map<string, number>();
  private readonly blockCounts = new Map<string, number>();

  constructor(
    resolvedIssues: readonly ResolvedIssue[],
    unresolvedIssues: readonly UnresolvedCommercialPagePublicationIssue[],
  ) {
    this.resolvedIssues = resolvedIssues;
    this.unresolvedIssues = unresolvedIssues;
    this.totalIssueCount = resolvedIssues.length + unresolvedIssues.length;
    this.rootIssues = resolvedIssues
      .filter((entry) => !hasStableLocation(entry) && !entry.field)
      .map(({ issue }) => issue);

    for (const entry of resolvedIssues) {
      incrementCount(this.sectionCounts, entry.sectionId);
      incrementCount(this.blockCounts, entry.blockId);
    }
  }

  sectionIssueCount(sectionId: string): number {
    return this.sectionCounts.get(sectionId) ?? 0;
  }

  blockIssueCount(blockId: string): number {
    return this.blockCounts.get(blockId) ?? 0;
  }

  issuesAt(
    location: CommercialPagePublicationIssueLocation,
  ): readonly CommercialPagePublicationIssue[] {
    return this.resolvedIssues
      .filter((entry) => matchesLocation(entry, location, true))
      .map(({ issue }) => issue);
  }

  issuesWithin(
    location: CommercialPagePublicationIssueLocation,
  ): readonly CommercialPagePublicationIssue[] {
    return this.resolvedIssues
      .filter((entry) => matchesLocation(entry, location, false))
      .map(({ issue }) => issue);
  }

  richContentIssues(
    location: CommercialPagePublicationIssueLocation,
  ): readonly RichContentEditorIssue[] {
    const prefix = location.field;
    if (!prefix) return [];

    return this.resolvedIssues
      .filter((entry) => matchesLocation(entry, location, false))
      .map((entry) => ({
        messageKey: entry.issue.messageKey,
        path: entry.field === prefix
          ? []
          : entry.field?.slice(prefix.length + 1).split('.') ?? [],
      }));
  }
}

export const EMPTY_COMMERCIAL_PAGE_PUBLICATION_ISSUE_INDEX:
  CommercialPagePublicationIssueIndex =
  new ResolvedCommercialPagePublicationIssueIndex([], []);

export function resolveCommercialPagePublicationIssues(
  issues: readonly CommercialPagePublicationIssue[],
  draft: CommercialPageEditorDocument,
): CommercialPagePublicationIssueIndex {
  const resolved: ResolvedIssue[] = [];
  const unresolved: UnresolvedCommercialPagePublicationIssue[] = [];

  for (const issue of issues) {
    const location = resolveIssue(issue, draft);
    if (location) resolved.push(location);
    else unresolved.push({ issue, rawPath: issue.path });
  }

  return new ResolvedCommercialPagePublicationIssueIndex(resolved, unresolved);
}

function resolveIssue(
  issue: CommercialPagePublicationIssue,
  draft: CommercialPageEditorDocument,
): ResolvedIssue | null {
  const segments = parsePath(issue.path);
  if (!segments) return null;
  const location: Omit<ResolvedIssue, 'issue' | 'field'> = {
    itemIds: [],
  };
  const fieldSegments: string[] = [];
  let current: unknown = draft;
  let collection: string | undefined;

  for (const segment of segments) {
    const next = readSegment(current, segment);
    if (!next.found) return null;

    if (Array.isArray(current)) {
      const id = objectId(next.value);
      if (id) {
        assignStableId(location, collection, id);
        fieldSegments.length = 0;
      } else {
        fieldSegments.push(segment);
      }
      collection = undefined;
    } else {
      fieldSegments.push(segment);
      collection = segment;
    }

    current = next.value;
  }

  const field = normalizeField(fieldSegments);
  return field ? { issue, ...location, field } : { issue, ...location };
}

function parsePath(path: string): string[] | null {
  if (!/^\$(?:\.[A-Za-z_]\w*|\[(?:0|[1-9]\d*)\])*$/.test(path)) return null;
  return [...path.matchAll(/\.([A-Za-z_]\w*)|\[(\d+)\]/g)]
    .map((match) => match[1] ?? match[2]);
}

function readSegment(
  value: unknown,
  segment: string,
): { found: true; value: unknown } | { found: false } {
  if (Array.isArray(value)) {
    const index = Number(segment);
    const item = Number.isInteger(index) ? value[index] : undefined;

    return item === undefined ? { found: false } : { found: true, value: item };
  }

  if (!isRecord(value) || !(segment in value)) return { found: false };
  return { found: true, value: value[segment] };
}

function assignStableId(
  location: Omit<ResolvedIssue, 'issue' | 'field'>,
  collection: string | undefined,
  id: string,
): void {
  if (
    collection === 'sections' &&
    !location.sectionId &&
    !location.blockId &&
    !location.productId
  ) {
    location.sectionId = id;
  } else if (
    collection === 'blocks' &&
    Boolean(location.sectionId) &&
    !location.blockId
  ) {
    location.blockId = id;
  } else if (
    collection === 'products' &&
    !location.sectionId &&
    !location.blockId &&
    !location.productId
  ) {
    location.productId = id;
  } else {
    location.itemIds = [...location.itemIds, id];
  }
}

function normalizeField(segments: readonly string[]): string | undefined {
  const field = segments.join('.');
  return field && !['id', 'position', 'type'].includes(field)
    ? field
    : undefined;
}

function matchesLocation(
  entry: ResolvedIssue,
  location: CommercialPagePublicationIssueLocation,
  exact: boolean,
): boolean {
  if (location.sectionId && entry.sectionId !== location.sectionId) return false;
  if (location.blockId && entry.blockId !== location.blockId) return false;
  if (location.productId && entry.productId !== location.productId) return false;
  if (location.itemId) {
    const itemMatches = exact
      ? entry.itemIds.at(-1) === location.itemId
      : entry.itemIds.includes(location.itemId);
    if (!itemMatches) return false;
  }

  if (exact && !matchesExactHierarchy(entry, location)) return false;

  if (location.field === undefined) {
    return exact ? entry.field === undefined : true;
  }

  return exact
    ? entry.field === location.field
    : entry.field === location.field || entry.field?.startsWith(`${location.field}.`) === true;
}

function matchesExactHierarchy(
  entry: ResolvedIssue,
  location: CommercialPagePublicationIssueLocation,
): boolean {
  const hasRequestedStableLocation = Boolean(
    location.sectionId ||
    location.blockId ||
    location.productId ||
    location.itemId,
  );

  if (!hasRequestedStableLocation) return !hasStableLocation(entry);
  if (location.itemId) return true;
  if (location.blockId) return entry.itemIds.length === 0;
  if (location.productId) return entry.itemIds.length === 0;
  if (location.sectionId) {
    return !entry.blockId && entry.itemIds.length === 0;
  }

  return true;
}

function hasStableLocation(entry: ResolvedIssue): boolean {
  return Boolean(
    entry.sectionId ||
    entry.blockId ||
    entry.productId ||
    entry.itemIds.length,
  );
}

function objectId(value: unknown): string | undefined {
  return isRecord(value) && typeof value['id'] === 'string'
    ? value['id']
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function incrementCount(
  counts: Map<string, number>,
  id: string | undefined,
): void {
  if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
}
