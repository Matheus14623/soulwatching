export const PUBLICATION_FIXTURE_ID = 'ensaio-de-teste';
export const PUBLICATION_FIXTURE_SLUG = 'ensaio-de-teste';
export const PUBLICATION_FIXTURE_ALIAS = 'ensaio-antigo';
export const PUBLICATION_FIXTURE_REVISION = 'ensaio-de-teste-r1';

export function publicationFixture({
  availabilityState = 'published',
} = {}) {
  const fixture = {
    id: PUBLICATION_FIXTURE_ID,
    slug: PUBLICATION_FIXTURE_SLUG,
    aliases: [PUBLICATION_FIXTURE_ALIAS],
    title: 'Ensaio de teste',
    summary: 'Uma publicação fictícia usada somente para validar projeções e resolução de aliases.',
    publicationType: 'ensaio',
    authorshipOrigin: 'external',
    availabilityState,
    credits: [
      {
        displayName: 'Revisora',
        order: 2,
        roles: ['reviewer'],
        authorizedLinks: [],
      },
      {
        displayName: 'Autora',
        order: 1,
        roles: ['author'],
        authorizedLinks: [],
      },
    ],
    textLicense: {
      identifier: 'CC-BY-4.0',
      label: 'Creative Commons Atribuição 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      rightsHolder: 'Autora',
    },
    assetRights: [
      {
        assetId: 'grafico-teste',
        kind: 'graphic',
        publicPath: '/assets/images/og-observatorio.jpg',
        rightsBasis: 'licensed',
        licenseIdentifier: 'CC-BY-4.0',
        credit: 'Gráfico da Autora',
      },
    ],
    claimLinks: [
      {
        claimId: 'afirmacao-teste',
        contentBlockId: 'argumento',
        sources: [
          {
            referenceId: 'fonte-teste',
            role: 'supports',
            locator: 'seção 2',
          },
        ],
      },
    ],
    publicDeclarations: {
      publicNameAuthorization: 'confirmed',
      finalVersionApproval: 'confirmed',
      conflictOfInterest: { state: 'none-declared' },
      editorialReview: {
        state: 'completed',
        description: 'Revisão editorial concluída com escopo público declarado.',
        peerReview: false,
      },
    },
    referenceIds: ['fonte-teste'],
    revisions: [
      {
        revisionId: PUBLICATION_FIXTURE_REVISION,
        ordinal: 1,
        revisionEventType: 'initial-publication',
        publishedAt: '2026-07-01',
        changeSummary: 'Publicação inicial.',
        publicSnapshot: {
          title: 'Ensaio de teste',
          summary: 'Uma publicação fictícia usada para validar o snapshot público imutável.',
          body: [
            {
              id: 'argumento',
              heading: 'Argumento central',
              paragraphs: ['Texto preservado no snapshot público.'],
            },
          ],
          referenceIds: ['fonte-teste'],
          claimIds: ['afirmacao-teste'],
          textLicenseIdentifier: 'CC-BY-4.0',
          assetIds: ['grafico-teste'],
        },
        creditSnapshot: [],
        contentHash: `sha256:${'a'.repeat(64)}`,
      },
    ],
    body: [
      {
        id: 'argumento',
        heading: 'Argumento central',
        paragraphs: ['Texto público com <caracteres> que precisam ser escapados.'],
      },
    ],
    publicNotice: null,
  };

  if (availabilityState === 'withdrawn') {
    fixture.publicNotice = {
      type: 'withdrawn',
      effectiveAt: '2026-07-20',
      affectedRevisionId: PUBLICATION_FIXTURE_REVISION,
      reason: 'A autoria solicitou a retirada enquanto revisa o argumento publicado.',
      decisionAuthority: 'author-request',
      contest: {
        channelPath: '/Contribuicoes/contribuicoes.html',
        responseWindowDays: 30,
        instructions: 'Envie uma contestação identificando a publicação e a revisão.',
      },
    };
  }

  return fixture;
}

export function publicationContextFixture() {
  return {
    publicationTypes: [{ id: 'ensaio', label: 'Ensaio' }],
    creditRoles: [
      { id: 'author', label: 'Autoria' },
      { id: 'reviewer', label: 'Revisão editorial' },
    ],
    snapshot: {
      entities: {
        publication: [],
        theory: [
          {
            id: 'zero-epsilon',
            slug: 'zero-epsilon',
            title: 'Linha de teste',
          },
        ],
      },
      references: [
        {
          id: 'fonte-teste',
          aliases: [],
          title: 'Fonte de teste',
          authors: 'Pesquisadora Exemplo',
          year: '2025',
          url: 'https://example.com/fonte',
        },
      ],
      relations: [
        {
          id: 'publication--ensaio-de-teste--examines-theory--zero-epsilon',
          source: { type: 'publication', id: PUBLICATION_FIXTURE_ID },
          target: { type: 'theory', id: 'zero-epsilon' },
          type: 'examines-theory',
          label: 'Examina a linha',
          justification: 'A publicação discute explicitamente os limites da linha de teste.',
          reviewState: 'reviewed',
        },
      ],
      relationTypes: [
        {
          id: 'examines-theory',
          sourceType: 'publication',
          targetType: 'theory',
          label: 'Examina a linha',
          inverseLabel: 'É examinada pela publicação',
        },
      ],
    },
  };
}
