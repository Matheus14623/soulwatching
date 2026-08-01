import { prefixedCanonicalHash } from './canonical-hash.mjs';

export const LEGACY_RELATION_BASELINE_HASHES = Object.freeze({
  'figure--albert-einstein--conceptual-context--er-epr-sondas': 'sha256:56860f6b6e16984b8011db4d33a78fcf778c586e742d84c0f99a6e399d1833a0',
  'figure--david-hume--methodological-context--backend-existencia': 'sha256:9328d758820ba64c14adc82f227f45d91e12d4b3b78129e9b58db84471add9ff',
  'figure--emmy-noether--methodological-context--backend-existencia': 'sha256:5f8e76d910af09fd1ac77bbfd78ffaed855b08f87b001abe83d87fd27a538e0a',
  'figure--francis-bacon--methodological-context--backend-existencia': 'sha256:d7c580d958de835ce4c3703347aa2a9e7d7715aec635b6dab0485b1620b70e60',
  'figure--francis-bacon--methodological-context--horizonte-sentidos': 'sha256:111de99b98fafd8babf8cf9ef8b1dd45abf4346358464d96ca996fd2943a32de',
  'figure--galileo-galilei--methodological-context--observacao-nao-linear': 'sha256:da4da20eea1b5e16c33e24d442b10262b4e27b9df252d869704534e6c0b90b19',
  'figure--imre-lakatos--methodological-context--backend-existencia': 'sha256:3a559259a5eef09e1bc081adbbbabea8edf46a9d38ca8bb1e7fe402ced3c06a2',
  'figure--imre-lakatos--methodological-context--zero-epsilon': 'sha256:5b0eb74da19c1c1f8b8378bd8188a3fe977244eb3fdc66962ac6466afdc4532d',
  'figure--jocelyn-bell-burnell--methodological-context--observacao-nao-linear': 'sha256:5d9a514998418009fc61e66a585efde41da30aa15e61bf6d7ae9fe4d70ddfee7',
  'figure--johannes-kepler--methodological-context--horizonte-sentidos': 'sha256:d54daa2f17a6591e2ec0d10da54cc91e66f1df7d87c4514b50ea570214601e62',
  'figure--juan-maldacena--conceptual-context--universo-buraco-negro': 'sha256:b27363172028144283b8397a9d0a6c6039ca57d0bf6a3fbc7411412ff7061b2a',
  'figure--karl-popper--methodological-context--backend-existencia': 'sha256:0354b361532bf0b1616779efc915fd3f0299238a09ba4fb10b64b9804f42f314',
  'figure--roger-penrose--conceptual-context--contentor-finito': 'sha256:24e1d833985605197d39cfcc1be8a9cc840ce799f9515bb72a1a2f149043b45b',
  'figure--stephen-hawking--conceptual-context--er-epr-sondas': 'sha256:e9f168de55be1deabf24acea6e5f8249786b920cab6105f5cf5fcd9c6629b108',
  'figure--subrahmanyan-chandrasekhar--methodological-context--horizonte-sentidos': 'sha256:62ee6cab155a603e2355256924824e8c73f3721d6a8421ab4c6960706880c7c1',
  'figure--thomas-kuhn--methodological-context--backend-existencia': 'sha256:2241274c15fa8840f22a5c46fb2a99fd10ab3f731bba66f3279e6972d27668e0',
  'figure--vera-rubin--methodological-context--observacao-nao-linear': 'sha256:44c03d3a2bc5c382fc2cd6461a43e129742208e6e7cc2370d6a68e6d5a7ab1e0',
  'theory--backend-existencia--contexto-metodologico--vacuo-genese': 'sha256:c0ecabd8e7d28861750c7ede4a97d1c633e0b9f8ea5517f5ef96c5dc458e37e9',
  'theory--backend-existencia--contexto-metodologico--zero-epsilon': 'sha256:f1bfc1be08128c02e72e4a92e9fe0bad182af7958ba6c2983a9fdb3dbfe4c8d6',
  'theory--backend-existencia--ponte-operacional--horizonte-sentidos': 'sha256:3610a56690cf332c8a32cc254395d55975ccf0b387e1917e92d6bd8018d75141',
  'theory--ciclagem-eterna--afinidade-conceitual--universo-buraco-negro': 'sha256:6a4e487dfeb79c691e393892d9f071600a78f890ef14de22d85529e1f7aa38bf',
  'theory--ciclagem-eterna--afinidade-conceitual--vacuo-genese': 'sha256:0606e977059713e853cc6744ba5023d31335febdb9252a2ab3f3055649518adb',
  'theory--ciclagem-eterna--dependencia-metodologica--contentor-finito': 'sha256:938c8a4ad02189fa743bee3a29142cfa952d6ddae2ff8d8e94a42af8b6d079ff',
  'theory--ciclagem-eterna--dependencia-metodologica--instabilidade-vazio': 'sha256:b568812960640350cedc0502c4edb9290f1f3bd9dc1bc53f343d0cadf11755b3',
  'theory--contentor-finito--afinidade-conceitual--zero-epsilon': 'sha256:b8478d190b7c7bf8456b83ec36e04e6188dd62cc2c8c03c241b80bf43cf3ae91',
  'theory--contentor-finito--contexto-metodologico--backend-existencia': 'sha256:df66e8b3d5aa075a7f78839d99021f85dcc5bc714d801b192a8fae4a8e07e19d',
  'theory--er-epr-sondas--ponte-operacional--horizonte-sentidos': 'sha256:af0b909b792c52a979490969ca05ee31a4d304cd2744abf4efaaac019392ff05',
  'theory--instabilidade-vazio--afinidade-conceitual--contentor-finito': 'sha256:eb52afb96b751347c85dcedf53538e29db88444dcf46b08c32d3b3982aeb428e',
  'theory--instabilidade-vazio--contexto-metodologico--backend-existencia': 'sha256:04409eb37eb6f46a1e84554b4d08d4a0d1a941d8fcf5583e0446e9f2f9f34152',
  'theory--instabilidade-vazio--derivacao--vacuo-genese': 'sha256:12e438ebde2d261188567f74f29aaa956156776ffa19151d16905d6aa4b4d40c',
  'theory--observacao-nao-linear--afinidade-conceitual--contentor-finito': 'sha256:ccb6be62d3170e268e1b39aff47d777b2f731cd9a12b3fe1fffff57463cc1457',
  'theory--observacao-nao-linear--ponte-operacional--horizonte-sentidos': 'sha256:ff423be0e3d48ed6091f713ebac729b07b37d2657ac9b650f6b2500465f28083',
});

export const LEGACY_RELATION_BASELINE_IDS = Object.freeze(
  Object.keys(LEGACY_RELATION_BASELINE_HASHES),
);

const LEGACY_RELATION_BASELINE_ID_SET = new Set(
  LEGACY_RELATION_BASELINE_IDS,
);

export function hashLegacyRelationBaseline(relation) {
  const {
    reviewStatus: _reviewStatus,
    needsReview: _needsReview,
    reviewReasons: _reviewReasons,
    currentRevisions: _currentRevisions,
    ...canonicalRelation
  } = relation;
  return prefixedCanonicalHash(canonicalRelation);
}

function relationRevisionOrdinal(relation) {
  const prefix = `${relation.id}-r`;
  if (!relation.revisionId?.startsWith(prefix)) return null;
  const ordinalText = relation.revisionId.slice(prefix.length);
  if (!/^[1-9][0-9]*$/.test(ordinalText)) return null;
  const ordinal = Number(ordinalText);
  return Number.isSafeInteger(ordinal) && ordinal >= 1 ? ordinal : null;
}

export function validateLegacyRelationBaselines(relations) {
  const errors = [];
  const relationById = new Map(relations.map((relation) => [relation.id, relation]));

  for (const id of LEGACY_RELATION_BASELINE_IDS) {
    const relation = relationById.get(id);
    if (!relation) {
      errors.push(`Baseline legado protegido: a relação histórica "${id}" não pode ser removida`);
      continue;
    }

    const ordinal = relationRevisionOrdinal(relation);
    if (ordinal === null) {
      errors.push(
        `Baseline legado protegido ${id}: revisionId precisa pertencer à relação e terminar em uma revisão ordinal válida`,
      );
      continue;
    }

    const baseline = relation.reviewedAgainst;
    if (ordinal === 1) {
      if (relation.reviewState !== 'reviewed' || baseline?.mode !== 'legacy-baseline') {
        errors.push(
          `Baseline legado protegido ${id}: o registro r1 só pode permanecer reviewed com legacy-baseline`,
        );
        continue;
      }
      const actualHash = hashLegacyRelationBaseline(relation);
      const expectedHash = LEGACY_RELATION_BASELINE_HASHES[id];
      if (actualHash !== expectedHash) {
        errors.push(
          `Baseline legado protegido ${id}: o conteúdo canônico r1 é imutável; crie r2 com editorial-review ou deprecated`,
        );
      }
      continue;
    }

    if (baseline?.mode === 'legacy-baseline') {
      errors.push(
        `Baseline legado protegido ${id}: legacy-baseline não pode continuar após r1`,
      );
      continue;
    }
    if (
      relation.reviewState !== 'deprecated'
      && !(relation.reviewState === 'reviewed' && baseline?.mode === 'editorial-review')
    ) {
      errors.push(
        `Baseline legado protegido ${id}: revisões após r1 exigem editorial-review ou estado deprecated`,
      );
    }
  }

  for (const relation of relations) {
    if (
      relation.reviewedAgainst?.mode === 'legacy-baseline'
      && !LEGACY_RELATION_BASELINE_ID_SET.has(relation.id)
    ) {
      errors.push(
        `Baseline legado não autorizado em ${relation.id}; novas revisões exigem editorial-review`,
      );
    }
  }
  return errors;
}
