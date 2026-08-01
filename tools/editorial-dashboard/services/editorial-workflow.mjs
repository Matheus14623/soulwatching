import { prefixedCanonicalHash } from '../../../scripts/content/canonical-hash.mjs';
import {
  analyzeEditorialChangeSet,
  analyzeManifestOperations,
  assertEditorialImpactAllowed,
  loadChangeSetManifest,
} from '../../../scripts/content/change-set.mjs';
import { installContentChangeSet } from '../../../scripts/content/install-record.mjs';
import {
  DashboardError,
  sanitizeDiagnostics,
} from './errors.mjs';

const RELATION_DECISIONS = new Set([
  'confirm',
  'defer',
  'deprecate',
  'revise',
]);

function nextRelationRevisionId(relation) {
  const match = relation.revisionId?.match(/-r([1-9][0-9]*)$/);
  if (!match) {
    throw new DashboardError('A relação não possui revisão ordinal válida.', {
      code: 'invalid-relation-revision',
      status: 422,
    });
  }
  return `${relation.id}-r${Number(match[1]) + 1}`;
}

function relationTouches(relation, type, id) {
  return (
    relation.source?.type === type
    && relation.source.id === id
  ) || (
    relation.target?.type === type
    && relation.target.id === id
  );
}

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value
  );
}

function digestInput(workspace, impact) {
  return {
    schemaVersion: 1,
    workspaceId: workspace.id,
    workspaceVersion: workspace.version,
    operations: workspace.records.map(({ changeClass, force, id, recordHash, type }) => ({
      type,
      id,
      changeClass,
      force,
      recordHash,
    })),
    impact,
  };
}

function operationRecord(workspace, type, id) {
  return workspace.records.find((operation) => (
    operation.type === type && operation.id === id
  ))?.record || null;
}

function unusedReviewerPartyOperations(workspace) {
  const reviewedBy = new Set(
    workspace.records
      .filter(({ type }) => type === 'relation')
      .map(({ record }) => record.reviewedAgainst?.reviewedBy)
      .filter(Boolean),
  );
  return workspace.records
    .filter(({ decision, id, type }) => (
      type === 'party'
      && decision?.action === 'authorize-reviewer'
      && !reviewedBy.has(id)
    ))
    .map(({ id, type }) => ({ id, type }));
}

export function createEditorialWorkflow({
  catalog,
  workspaceStore,
  analyzeOperations = analyzeManifestOperations,
  applyChangeSet = installContentChangeSet,
  analyzeChangeSet = analyzeEditorialChangeSet,
  loadManifest = loadChangeSetManifest,
  previewInvalidator = null,
  previewVerifier = null,
} = {}) {
  if (!catalog || !workspaceStore) {
    throw new TypeError('O workflow exige catálogo e armazenamento de workspaces');
  }

  async function createTheoryWorkspace(theoryId) {
    const theory = await catalog.getRecord('theory', theoryId);
    return workspaceStore.createTheoryWorkspace(theory);
  }

  async function enrichImpact(workspace, impact, {
    unlockedCatalog = false,
  } = {}) {
    const relationIds = new Set([
      ...(impact.changes || []).flatMap((change) => (
        (change.relations || []).map(({ id }) => id)
      )),
      ...(impact.blockers || []).map(({ relationId }) => relationId).filter(Boolean),
    ]);
    const getter = unlockedCatalog ? catalog.getRecordUnlocked : catalog.getRecord;
    const relationDetails = [];
    for (const id of [...relationIds].sort((left, right) => left.localeCompare(right, 'en'))) {
      const staged = operationRecord(workspace, 'relation', id);
      const relation = staged || await getter('relation', id);
      const operation = workspace.records.find((candidate) => (
        candidate.type === 'relation' && candidate.id === id
      ));
      relationDetails.push({
        id: relation.id,
        revisionId: relation.revisionId,
        source: relation.source,
        target: relation.target,
        type: relation.type,
        label: relation.label,
        justification: relation.justification,
        referenceIds: relation.referenceIds,
        reviewState: relation.reviewState,
        reviewedAgainst: relation.reviewedAgainst || null,
        decision: operation?.decision || null,
      });
    }
    const relationById = new Map(relationDetails.map((relation) => [relation.id, relation]));
    const changes = (impact.changes || []).map((change) => ({
      ...change,
      relations: (change.relations || []).map((relation) => ({
        ...relationById.get(relation.id),
        ...relation,
        decision: relationById.get(relation.id)?.decision || null,
      })),
    }));
    return {
      ...impact,
      changes,
      relationDetails,
    };
  }

  async function analyzeWorkspaceUnlocked(workspaceId, {
    persistDigest = true,
  } = {}) {
    try {
      const prepared = await workspaceStore.prepareManifestUnlocked(workspaceId);
      const loaded = await loadManifest(prepared.manifestPath);
      const { impact } = await analyzeOperations(loaded.operations);
      const workspace = await workspaceStore.readWorkspaceUnlocked(workspaceId);
      const enriched = await enrichImpact(workspace, impact);
      const digest = prefixedCanonicalHash(digestInput(workspace, enriched));
      if (persistDigest) {
        await workspaceStore.recordImpactUnlocked(workspaceId, {
          allowed: enriched.allowed,
          digest,
        });
        if (typeof previewInvalidator === 'function') {
          await previewInvalidator(workspaceId);
        }
      }
      return {
        digest,
        impact: enriched,
        workspaceVersion: workspace.version,
      };
    } catch (error) {
      if (error instanceof DashboardError) throw error;
      throw new DashboardError('A análise editorial encontrou problemas.', {
        code: 'editorial-analysis-failed',
        details: sanitizeDiagnostics(error),
        status: 422,
      });
    }
  }

  async function analyzeWorkspace(workspaceId) {
    return workspaceStore.withWorkspaceLock(
      workspaceId,
      () => analyzeWorkspaceUnlocked(workspaceId),
    );
  }

  async function validateWorkspace(workspaceId) {
    try {
      const result = await analyzeWorkspace(workspaceId);
      return {
        valid: true,
        ...result,
      };
    } catch (error) {
      if (error instanceof DashboardError && error.code !== 'editorial-analysis-failed') {
        throw error;
      }
      return {
        valid: false,
        errors: error.details || sanitizeDiagnostics(error),
      };
    }
  }

  async function endpointRevision(workspace, endpoint) {
    const staged = operationRecord(workspace, endpoint.type, endpoint.id);
    if (staged?.revisionId) return staged.revisionId;
    const canonical = await catalog.getRecord(endpoint.type, endpoint.id);
    if (!canonical.revisionId) {
      throw new DashboardError('O extremo da relação não possui revisão rastreável.', {
        code: 'missing-endpoint-revision',
        status: 422,
      });
    }
    return canonical.revisionId;
  }

  async function resolveReviewer(payload, workspace) {
    const reviewer = payload.reviewer || {};
    const authorized = (
      payload.publicIdentityAuthorized === true
      || reviewer.publicIdentityAuthorized === true
    );
    if (!authorized) {
      throw new DashboardError(
        'Confirme explicitamente que a identidade do revisor pode ser publicada.',
        {
          code: 'reviewer-public-identity-required',
          status: 422,
        },
      );
    }
    const partyId = String(reviewer.partyId || payload.reviewerPartyId || '').trim();
    if (!partyId) {
      throw new DashboardError(
        'A revisão exige o ID de uma parte pública autorizada.',
        {
          code: 'reviewer-party-required',
          status: 422,
        },
      );
    }
    const stagedParty = operationRecord(workspace, 'party', partyId);
    if (stagedParty) {
      if (stagedParty.publicProfileLinkAuthorized !== true) {
        throw new DashboardError('A parte em rascunho não possui autorização vigente.', {
          code: 'reviewer-party-not-authorized',
          status: 422,
        });
      }
      return {
        partyId,
        displayName: stagedParty.displayName,
        operation: null,
      };
    }
    try {
      const party = await catalog.getRecord('party', partyId);
      if (party.publicProfileLinkAuthorized !== true) {
        throw new DashboardError('A parte pública não possui autorização vigente.', {
          code: 'reviewer-party-not-authorized',
          status: 422,
        });
      }
      return {
        partyId,
        displayName: party.displayName,
        operation: null,
      };
    } catch (error) {
      if (!(error instanceof DashboardError) || error.status !== 404) throw error;
    }

    const displayName = String(reviewer.displayName || payload.reviewedBy || '').trim();
    if (
      displayName.length < 2
      || !['person', 'organization'].includes(reviewer.partyType)
      || !Array.isArray(reviewer.publicLinks)
    ) {
      throw new DashboardError(
        'Para uma nova parte, informe displayName, partyType e publicLinks.',
        {
          code: 'new-reviewer-party-incomplete',
          status: 422,
        },
      );
    }
    const party = {
      schemaVersion: 1,
      entityType: 'party',
      revisionId: `${partyId}-r1`,
      id: partyId,
      slug: reviewer.slug || partyId,
      aliases: Array.isArray(reviewer.aliases) ? [...reviewer.aliases] : [],
      partyType: reviewer.partyType,
      displayName,
      publicProfileLinkAuthorized: true,
      publicLinks: [...reviewer.publicLinks],
      ...(reviewer.publicDescription
        ? { publicDescription: reviewer.publicDescription }
        : {}),
    };
    return {
      partyId,
      displayName,
      operation: {
        changeClass: 'structural',
        decision: {
          action: 'authorize-reviewer',
          publicIdentityAuthorized: true,
        },
        force: false,
        record: party,
        type: 'party',
      },
    };
  }

  async function stageRelationDecision(workspaceId, relationId, payload) {
    return workspaceStore.withWorkspaceLock(workspaceId, async () => {
      const workspace = await workspaceStore.readWorkspaceUnlocked(workspaceId);
      if (!RELATION_DECISIONS.has(payload.decision)) {
        throw new DashboardError('Decisão de relação inválida.', {
          code: 'invalid-relation-decision',
          status: 422,
        });
      }
      const canonical = await catalog.getRecord('relation', relationId);
      if (!relationTouches(canonical, workspace.entityType, workspace.entityId)) {
        throw new DashboardError('A relação não pertence à teoria deste workspace.', {
          code: 'unrelated-relation',
          status: 422,
        });
      }
      const staged = operationRecord(workspace, 'relation', relationId);
      const next = structuredClone(staged || canonical);
      if (!staged) next.revisionId = nextRelationRevisionId(canonical);

      if (payload.decision === 'revise') {
        for (const field of ['justification', 'label', 'type']) {
          if (payload[field] !== undefined) next[field] = payload[field];
        }
        if (payload.referenceIds !== undefined) {
          if (!Array.isArray(payload.referenceIds)) {
            throw new DashboardError('referenceIds precisa ser uma lista.', {
              code: 'invalid-reference-list',
              status: 422,
            });
          }
          next.referenceIds = [...payload.referenceIds];
        }
      }

      let reviewer = null;
      if (payload.decision === 'confirm' || payload.decision === 'revise') {
        if (!validateDate(payload.reviewedAt)) {
          throw new DashboardError('Informe reviewedAt no formato AAAA-MM-DD.', {
            code: 'invalid-review-date',
            status: 422,
          });
        }
        reviewer = await resolveReviewer(payload, workspace);
        const currentWorkspace = await workspaceStore.readWorkspaceUnlocked(workspaceId);
        next.reviewState = 'reviewed';
        next.reviewedAgainst = {
          mode: 'editorial-review',
          sourceRevisionId: await endpointRevision(currentWorkspace, next.source),
          targetRevisionId: await endpointRevision(currentWorkspace, next.target),
          reviewedAt: payload.reviewedAt,
          reviewedBy: reviewer.partyId,
        };
      } else {
        next.reviewState = payload.decision === 'deprecate' ? 'deprecated' : 'pending';
        delete next.reviewedAgainst;
      }

      let result = await workspaceStore.upsertOperationsUnlocked(workspaceId, {
        operations: [
          ...(reviewer?.operation ? [reviewer.operation] : []),
          {
            changeClass: 'structural',
            decision: {
              action: payload.decision,
              ...(payload.reviewedAt ? { reviewedAt: payload.reviewedAt } : {}),
              ...(reviewer ? {
                reviewedBy: reviewer.partyId,
                reviewerDisplayName: reviewer.displayName,
                publicIdentityAuthorized: true,
              } : {}),
            },
            force: true,
            record: next,
            type: 'relation',
          },
        ],
        version: payload.version,
      });
      const unusedParties = unusedReviewerPartyOperations(result);
      if (
        unusedParties.length
        && typeof workspaceStore.removeOperationsUnlocked === 'function'
      ) {
        result = await workspaceStore.removeOperationsUnlocked(workspaceId, {
          operations: unusedParties,
          version: result.version,
        });
      }
      if (typeof previewInvalidator === 'function') {
        await previewInvalidator(workspaceId);
      }
      return result;
    });
  }

  async function stageOperation(workspaceId, type, entityId, payload) {
    return workspaceStore.withWorkspaceLock(workspaceId, async () => {
      if (payload.record?.id !== entityId) {
        throw new DashboardError('O ID da rota diverge do registro.', {
          code: 'operation-id-mismatch',
          status: 422,
        });
      }
      let force = false;
      try {
        await catalog.getRecord(type, entityId);
        force = true;
      } catch (error) {
        if (!(error instanceof DashboardError) || error.status !== 404) throw error;
      }
      const result = await workspaceStore.upsertOperationUnlocked(workspaceId, {
        changeClass: payload.changeClass || 'structural',
        decision: payload.decision || null,
        force,
        record: payload.record,
        type,
        version: payload.version,
      });
      if (typeof previewInvalidator === 'function') {
        await previewInvalidator(workspaceId);
      }
      return result;
    });
  }

  async function applyWorkspace(workspaceId, {
    confirmation,
    impactDigest,
  }) {
    if (confirmation !== 'APLICAR') {
      throw new DashboardError('A aplicação exige a confirmação explícita APLICAR.', {
        code: 'apply-confirmation-required',
        status: 422,
      });
    }
    return workspaceStore.withWorkspaceLock(workspaceId, async () => {
      const before = await workspaceStore.readWorkspaceUnlocked(workspaceId);
      if (before.applied) {
        throw new DashboardError('Este workspace já foi aplicado.', {
          code: 'workspace-already-applied',
          status: 409,
        });
      }
      if (
        !before.lastImpact
        || before.lastImpact.allowed !== true
        || before.lastImpact.workspaceVersion !== before.version
        || before.lastImpact.digest !== impactDigest
      ) {
        throw new DashboardError('A análise aprovada está ausente ou desatualizada.', {
          code: 'stale-impact',
          status: 409,
        });
      }
      if (!before.lastPreview) {
        throw new DashboardError('Gere um preview aprovado antes de aplicar.', {
          code: 'preview-required',
          status: 409,
        });
      }
      if (
        before.lastPreview.status !== 'ready'
        || before.lastPreview.impactDigest !== impactDigest
        || before.lastPreview.workspaceVersion !== before.version
        || Date.parse(before.lastPreview.expiresAt || '') <= Date.now()
      ) {
        throw new DashboardError('O preview está desatualizado ou expirou.', {
          code: 'stale-preview',
          status: 409,
        });
      }
      if (typeof previewVerifier === 'function') {
        await previewVerifier(workspaceId, before.lastPreview);
      }

      const prepared = await workspaceStore.prepareManifestUnlocked(workspaceId);
      const loaded = await loadManifest(prepared.manifestPath);
      let result;
      try {
        result = await applyChangeSet({
          analyzeImpact: analyzeChangeSet,
          operations: loaded.operations,
          validateImpact: async (impact) => {
            assertEditorialImpactAllowed(impact);
            const current = await workspaceStore.readWorkspaceUnlocked(workspaceId);
            const enriched = await enrichImpact(current, impact, {
              unlockedCatalog: true,
            });
            const currentDigest = prefixedCanonicalHash(digestInput(current, enriched));
            if (currentDigest !== impactDigest) {
              throw new DashboardError(
                'O conteúdo canônico ou o impacto mudou; execute uma nova análise.',
                {
                  code: 'stale-impact',
                  status: 409,
                },
              );
            }
          },
        });
      } catch (error) {
        if (error instanceof DashboardError) throw error;
        throw new DashboardError('A aplicação editorial foi recusada.', {
          code: 'editorial-apply-failed',
          details: sanitizeDiagnostics(error),
          status: 422,
        });
      }
      let stateRecorded = true;
      try {
        await workspaceStore.recordAppliedUnlocked(workspaceId, result.installed);
      } catch {
        stateRecorded = false;
      }
      return {
        installed: result.installed,
        impactDigest,
        stateRecorded,
        ...(stateRecorded ? {} : {
          operationalWarning: {
            code: 'applied-state-recovery-required',
            message:
              'A fonte foi instalada, mas o workspace não registrou a conclusão. Não repita a aplicação antes de verificar a revisão canônica.',
          },
        }),
      };
    });
  }

  return Object.freeze({
    analyzeWorkspace,
    applyWorkspace,
    createTheoryWorkspace,
    enrichImpact,
    stageOperation,
    stageRelationDecision,
    validateWorkspace,
  });
}
