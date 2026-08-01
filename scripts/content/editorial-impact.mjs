import { CHANGE_CLASSES } from './content-contracts.mjs';

export { CHANGE_CLASSES };

export const INVALIDATING_CHANGE_CLASSES = Object.freeze([
  'semantic',
  'structural',
]);

const CHANGE_CLASS_RANK = new Map(
  CHANGE_CLASSES.map((changeClass, index) => [changeClass, index]),
);
const INVALIDATING_CHANGE_CLASS_SET = new Set(INVALIDATING_CHANGE_CLASSES);
const RELATION_REVIEW_STATES = new Set(['pending', 'reviewed', 'deprecated']);

const PRESENTATION_ROOTS = new Set([
  'accent',
  'color',
  'featuredRank',
  'glow',
  'order',
  'portrait',
  'position',
  'visual',
]);
const METADATA_ROOTS = new Set([
  'keywords',
  'searchDescription',
]);
const MECHANICAL_REVISION_ROOTS = new Set([
  'revisionId',
  'revisions',
]);
const SEMANTIC_ROOTS = new Set([
  'body',
  'boundary',
  'concepts',
  'contributions',
  'decisionBoundary',
  'description',
  'impact',
  'justification',
  'label',
  'lifespan',
  'milestones',
  'nextSteps',
  'objections',
  'proposal',
  'question',
  'questions',
  'review',
  'role',
  'shortTitle',
  'subtitle',
  'summary',
  'title',
]);
const STRUCTURAL_ROOTS = new Set([
  'aliases',
  'assetRights',
  'authorshipOrigin',
  'availabilityState',
  'category',
  'claimLinks',
  'credits',
  'entityType',
  'filters',
  'href',
  'id',
  'independent',
  'kind',
  'moduleKey',
  'publicationType',
  'publicDeclarations',
  'publicNotice',
  'referenceIds',
  'relations',
  'reviewState',
  'schemaVersion',
  'slug',
  'source',
  'status',
  'target',
  'textLicense',
  'theoryIds',
  'type',
]);

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function cloneJsonValue(value) {
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneJsonValue(child)]),
    );
  }
  return value;
}

function assertChangeClass(changeClass, label = 'changeClass') {
  if (!CHANGE_CLASS_RANK.has(changeClass)) {
    throw new TypeError(`${label} must be one of: ${CHANGE_CLASSES.join(', ')}`);
  }
  return changeClass;
}

function escapeJsonPointerToken(token) {
  return String(token).replaceAll('~', '~0').replaceAll('/', '~1');
}

function unescapeJsonPointerToken(token) {
  return String(token).replaceAll('~1', '/').replaceAll('~0', '~');
}

function appendPointer(path, token) {
  return `${path}/${escapeJsonPointerToken(token)}`;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function jsonValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length
      && left.every((item, index) => jsonValuesEqual(item, right[index]));
  }
  if (isObject(left) && isObject(right)) {
    const leftKeys = Object.keys(left).sort(compareText);
    const rightKeys = Object.keys(right).sort(compareText);
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => (
        key === rightKeys[index] && jsonValuesEqual(left[key], right[key])
      ));
  }
  return false;
}

function collectDiff(before, after, path, changes) {
  if (jsonValuesEqual(before, after)) return;

  if (Array.isArray(before) && Array.isArray(after)) {
    const sharedLength = Math.min(before.length, after.length);
    for (let index = 0; index < sharedLength; index += 1) {
      collectDiff(before[index], after[index], appendPointer(path, index), changes);
    }
    for (let index = sharedLength; index < before.length; index += 1) {
      changes.push({
        operation: 'remove',
        path: appendPointer(path, index),
        before: cloneJsonValue(before[index]),
      });
    }
    for (let index = sharedLength; index < after.length; index += 1) {
      changes.push({
        operation: 'add',
        path: appendPointer(path, index),
        after: cloneJsonValue(after[index]),
      });
    }
    return;
  }

  if (isObject(before) && isObject(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .sort(compareText);
    for (const key of keys) {
      const childPath = appendPointer(path, key);
      if (!(key in after)) {
        changes.push({
          operation: 'remove',
          path: childPath,
          before: cloneJsonValue(before[key]),
        });
      } else if (!(key in before)) {
        changes.push({
          operation: 'add',
          path: childPath,
          after: cloneJsonValue(after[key]),
        });
      } else {
        collectDiff(before[key], after[key], childPath, changes);
      }
    }
    return;
  }

  changes.push({
    operation: 'replace',
    path,
    before: cloneJsonValue(before),
    after: cloneJsonValue(after),
  });
}

function pointerIsIgnored(path, ignoredPointers) {
  return ignoredPointers.some((ignored) => (
    path === ignored || (ignored && path.startsWith(`${ignored}/`))
  ));
}

export function diffContentRecords(before, after, { ignoredPointers = [] } = {}) {
  if (!Array.isArray(ignoredPointers) || ignoredPointers.some((path) => typeof path !== 'string')) {
    throw new TypeError('ignoredPointers must be an array of JSON Pointer strings');
  }
  const normalizedIgnored = [...new Set(ignoredPointers)].sort(compareText);
  const changes = [];
  collectDiff(before, after, '', changes);
  return deepFreeze(changes
    .filter(({ path }) => !pointerIsIgnored(path, normalizedIgnored))
    .sort((left, right) => (
      compareText(left.path, right.path)
      || compareText(left.operation, right.operation)
    )));
}

function pointerRoot(path) {
  if (path === '') return '';
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError(`Invalid JSON Pointer: ${String(path)}`);
  }
  return unescapeJsonPointerToken(path.slice(1).split('/', 1)[0]);
}

function inferredClassForPointer(path, pointerClasses) {
  const override = pointerClasses?.[path];
  if (override) return assertChangeClass(override, `pointerClasses[${path}]`);
  const root = pointerRoot(path);
  const rootOverride = pointerClasses?.[`/${escapeJsonPointerToken(root)}`];
  if (rootOverride) return assertChangeClass(rootOverride, `pointerClasses[/${root}]`);
  if (PRESENTATION_ROOTS.has(root)) return 'presentation';
  if (METADATA_ROOTS.has(root)) return 'metadata';
  if (SEMANTIC_ROOTS.has(root)) return 'semantic';
  if (STRUCTURAL_ROOTS.has(root)) return 'structural';
  return 'structural';
}

function highestRiskClass(changeClasses) {
  return changeClasses.reduce((highest, candidate) => (
    CHANGE_CLASS_RANK.get(candidate) > CHANGE_CLASS_RANK.get(highest)
      ? candidate
      : highest
  ), 'editorial');
}

export function classifyContentChange(
  changes,
  {
    declaredClass = null,
    pointerClasses = null,
  } = {},
) {
  if (!Array.isArray(changes)) {
    throw new TypeError('classifyContentChange expects the output of diffContentRecords');
  }
  if (declaredClass !== null) assertChangeClass(declaredClass, 'declaredClass');
  const changedPaths = [...new Set(changes.map(({ path }) => path))].sort(compareText);
  const inferredClasses = changedPaths
    .filter((path) => !MECHANICAL_REVISION_ROOTS.has(pointerRoot(path)))
    .map((path) => inferredClassForPointer(path, pointerClasses));
  const suggestedClass = highestRiskClass(inferredClasses);
  const effectiveClass = highestRiskClass([
    suggestedClass,
    ...(declaredClass ? [declaredClass] : []),
  ]);

  return deepFreeze({
    declaredClass,
    suggestedClass,
    effectiveClass,
    invalidatesRelations: INVALIDATING_CHANGE_CLASS_SET.has(effectiveClass),
    changedPaths,
    inferredClasses: [...new Set(inferredClasses)]
      .sort((left, right) => CHANGE_CLASS_RANK.get(left) - CHANGE_CLASS_RANK.get(right)),
    upgraded: declaredClass !== null && effectiveClass !== declaredClass,
  });
}

function entityKey(entityType, entityId) {
  return `${entityType}:${entityId}`;
}

function revisionOrdinal(revisionId) {
  const match = /-r([1-9][0-9]*)$/.exec(revisionId);
  if (!match) throw new TypeError(`Invalid revisionId: ${String(revisionId)}`);
  return Number(match[1]);
}

function normalizeChangedPaths(paths, label) {
  if (!Array.isArray(paths)) throw new TypeError(`${label}.changedPaths must be an array`);
  const normalized = [...new Set(paths)];
  normalized.forEach((path) => {
    if (typeof path !== 'string' || (path !== '' && !path.startsWith('/'))) {
      throw new TypeError(`${label}.changedPaths contains an invalid JSON Pointer`);
    }
    pointerRoot(path);
  });
  return Object.freeze(normalized.sort(compareText));
}

export function buildRevisionIndex(ledger) {
  if (!ledger || !Array.isArray(ledger.entries)) {
    throw new TypeError('Revision ledger must contain an entries array');
  }
  const index = new Map();
  const seenRevisionKeys = new Set();
  for (const [entryIndex, entry] of ledger.entries.entries()) {
    const label = `entries[${entryIndex}]`;
    if (!entry || typeof entry.entityType !== 'string' || typeof entry.entityId !== 'string') {
      throw new TypeError(`${label} must declare entityType and entityId`);
    }
    if (!Array.isArray(entry.revisions) || !entry.revisions.length) {
      throw new TypeError(`${label}.revisions must contain at least one revision`);
    }
    const key = entityKey(entry.entityType, entry.entityId);
    if (index.has(key)) throw new TypeError(`Duplicate revision ledger entry: ${key}`);

    const revisions = entry.revisions.map((revision, revisionIndex) => {
      const revisionLabel = `${label}.revisions[${revisionIndex}]`;
      if (!revision || typeof revision.revisionId !== 'string') {
        throw new TypeError(`${revisionLabel}.revisionId is required`);
      }
      if (!revision.revisionId.startsWith(`${entry.entityId}-r`)) {
        throw new TypeError(`${revisionLabel}.revisionId does not belong to ${key}`);
      }
      const compositeRevisionKey = `${key}:${revision.revisionId}`;
      if (seenRevisionKeys.has(compositeRevisionKey)) {
        throw new TypeError(`Duplicate revisionId in ${key}: ${revision.revisionId}`);
      }
      seenRevisionKeys.add(compositeRevisionKey);
      return {
        revisionId: revision.revisionId,
        ordinal: revisionOrdinal(revision.revisionId),
        changeClass: assertChangeClass(
          revision.changeClass,
          `${revisionLabel}.changeClass`,
        ),
        changedPaths: normalizeChangedPaths(revision.changedPaths, revisionLabel),
      };
    }).sort((left, right) => left.ordinal - right.ordinal);

    revisions.forEach((revision, revisionIndex) => {
      if (revision.ordinal !== revisionIndex + 1) {
        throw new TypeError(`${key} revision ledger must be complete and start at r1`);
      }
    });
    index.set(key, deepFreeze({
      entityType: entry.entityType,
      entityId: entry.entityId,
      revisions,
    }));
  }
  return index;
}

function normalizeEntityRef(ref, label) {
  if (!ref || typeof ref.type !== 'string' || typeof ref.id !== 'string') {
    throw new TypeError(`${label} must declare type and id`);
  }
  return Object.freeze({ type: ref.type, id: ref.id });
}

function endpointReviewStatus({
  baselineRevisionId,
  endpoint,
  endpointName,
  revisionIndex,
}) {
  const ledgerEntry = revisionIndex.get(entityKey(endpoint.type, endpoint.id));
  if (!ledgerEntry) {
    return {
      currentRevisionId: null,
      reasons: [{
        code: 'missing-revision-ledger-entry',
        endpoint: endpointName,
        entity: endpoint,
        reviewedRevisionId: baselineRevisionId || null,
      }],
    };
  }

  const currentRevision = ledgerEntry.revisions[ledgerEntry.revisions.length - 1];
  const baselineIndex = ledgerEntry.revisions.findIndex(
    ({ revisionId }) => revisionId === baselineRevisionId,
  );
  if (baselineIndex < 0) {
    return {
      currentRevisionId: currentRevision.revisionId,
      reasons: [{
        code: 'reviewed-revision-not-found',
        endpoint: endpointName,
        entity: endpoint,
        reviewedRevisionId: baselineRevisionId || null,
        currentRevisionId: currentRevision.revisionId,
      }],
    };
  }

  const reasons = ledgerEntry.revisions
    .slice(baselineIndex + 1)
    .filter(({ changeClass }) => INVALIDATING_CHANGE_CLASS_SET.has(changeClass))
    .map((revision) => ({
      code: 'invalidating-change-after-review',
      endpoint: endpointName,
      entity: endpoint,
      reviewedRevisionId: baselineRevisionId,
      currentRevisionId: currentRevision.revisionId,
      revisionId: revision.revisionId,
      changeClass: revision.changeClass,
      changedPaths: revision.changedPaths,
    }));
  return {
    currentRevisionId: currentRevision.revisionId,
    reasons,
  };
}

export function deriveRelationReviewStatus(relation, revisionIndex) {
  if (!relation || typeof relation !== 'object') {
    throw new TypeError('deriveRelationReviewStatus expects a relation');
  }
  if (!(revisionIndex instanceof Map)) {
    throw new TypeError('deriveRelationReviewStatus expects buildRevisionIndex output');
  }
  if (!RELATION_REVIEW_STATES.has(relation.reviewState)) {
    throw new TypeError(`Unknown relation reviewState: ${String(relation.reviewState)}`);
  }
  const source = normalizeEntityRef(relation.source, 'relation.source');
  const target = normalizeEntityRef(relation.target, 'relation.target');
  const sourceLedger = revisionIndex.get(entityKey(source.type, source.id));
  const targetLedger = revisionIndex.get(entityKey(target.type, target.id));
  const currentRevisions = {
    sourceRevisionId: sourceLedger?.revisions.at(-1)?.revisionId || null,
    targetRevisionId: targetLedger?.revisions.at(-1)?.revisionId || null,
  };

  if (relation.reviewState !== 'reviewed') {
    return deepFreeze({
      reviewState: relation.reviewState,
      needsReview: false,
      blocksPublication: false,
      reviewedAgainst: relation.reviewedAgainst
        ? cloneJsonValue(relation.reviewedAgainst)
        : null,
      currentRevisions,
      reasons: [],
    });
  }

  if (!relation.reviewedAgainst) {
    return deepFreeze({
      reviewState: relation.reviewState,
      needsReview: true,
      blocksPublication: true,
      reviewedAgainst: null,
      currentRevisions,
      reasons: [{
        code: 'missing-reviewed-against',
        endpoint: null,
      }],
    });
  }

  const sourceStatus = endpointReviewStatus({
    baselineRevisionId: relation.reviewedAgainst.sourceRevisionId,
    endpoint: source,
    endpointName: 'source',
    revisionIndex,
  });
  const targetStatus = endpointReviewStatus({
    baselineRevisionId: relation.reviewedAgainst.targetRevisionId,
    endpoint: target,
    endpointName: 'target',
    revisionIndex,
  });
  const reasons = [...sourceStatus.reasons, ...targetStatus.reasons]
    .sort((left, right) => (
      compareText(left.endpoint || '', right.endpoint || '')
      || compareText(left.revisionId || '', right.revisionId || '')
      || compareText(left.code, right.code)
    ));

  return deepFreeze({
    reviewState: relation.reviewState,
    needsReview: reasons.length > 0,
    blocksPublication: reasons.length > 0,
    reviewedAgainst: cloneJsonValue(relation.reviewedAgainst),
    currentRevisions: {
      sourceRevisionId: sourceStatus.currentRevisionId,
      targetRevisionId: targetStatus.currentRevisionId,
    },
    reasons,
  });
}

function sameEntity(ref, entity) {
  return ref?.type === entity.type && ref?.id === entity.id;
}

function relationImpactEntry(relation, revisionIndex) {
  return deepFreeze({
    relation: cloneJsonValue(relation),
    review: deriveRelationReviewStatus(relation, revisionIndex),
  });
}

export function calculateDirectImpact({
  changeClass,
  changedPaths = null,
  entity = null,
  entityId = null,
  entityType = null,
  relations = [],
  revisionIndex,
} = {}) {
  const normalizedEntity = normalizeEntityRef(
    entity || { type: entityType, id: entityId },
    'impact.entity',
  );
  if (!Array.isArray(relations)) throw new TypeError('impact.relations must be an array');
  if (!(revisionIndex instanceof Map)) {
    throw new TypeError('impact.revisionIndex must be buildRevisionIndex output');
  }
  const ledgerEntry = revisionIndex.get(entityKey(normalizedEntity.type, normalizedEntity.id));
  const currentRevision = ledgerEntry?.revisions.at(-1) || null;
  const effectiveClass = assertChangeClass(
    changeClass || currentRevision?.changeClass,
    'impact.changeClass',
  );
  const effectivePaths = normalizeChangedPaths(
    changedPaths || currentRevision?.changedPaths || [],
    'impact',
  );
  const directRelations = relations
    .filter((relation) => (
      sameEntity(relation.source, normalizedEntity)
      || sameEntity(relation.target, normalizedEntity)
    ))
    .sort((left, right) => compareText(left.id || '', right.id || ''))
    .map((relation) => relationImpactEntry(relation, revisionIndex));
  const blockers = directRelations
    .filter(({ relation, review }) => (
      relation.reviewState === 'reviewed' && review.blocksPublication
    ))
    .map(({ relation, review }) => deepFreeze({
      code: 'stale-reviewed-relation',
      relationId: relation.id,
      reasons: review.reasons,
    }));
  const pendingRelations = directRelations
    .filter(({ relation }) => relation.reviewState === 'pending');
  const deprecatedRelations = directRelations
    .filter(({ relation }) => relation.reviewState === 'deprecated');

  return deepFreeze({
    entity: normalizedEntity,
    currentRevisionId: currentRevision?.revisionId || null,
    changeClass: effectiveClass,
    changedPaths: effectivePaths,
    invalidatesRelations: INVALIDATING_CHANGE_CLASS_SET.has(effectiveClass),
    relations: directRelations,
    blockers,
    pendingRelations,
    deprecatedRelations,
    hasBlockers: blockers.length > 0,
  });
}

export function validatePublicationGate(impact) {
  if (!impact || !Array.isArray(impact.blockers) || !Array.isArray(impact.pendingRelations)) {
    throw new TypeError('validatePublicationGate expects calculateDirectImpact output');
  }
  const warnings = impact.pendingRelations.map(({ relation }) => deepFreeze({
    code: 'pending-relation',
    relationId: relation.id,
  }));
  return deepFreeze({
    allowed: impact.blockers.length === 0,
    blockers: [...impact.blockers],
    warnings,
  });
}
