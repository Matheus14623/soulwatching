import '../check-node-version.cjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import {
  compileContent,
  rollbackGeneratedRuntime,
} from './compiler.mjs';
import {
  assertEditorialImpactAllowed,
  analyzeEditorialChangeSet,
  analyzeManifestOperations,
  loadChangeSetManifest,
  loadPrivateDraftOperation,
} from './change-set.mjs';
import {
  installContentChangeSet,
} from './install-record.mjs';
import { CONTENT_NEW_TYPES } from './content-contracts.mjs';
import { PROJECT_ROOT, PUBLIC_CONTENT_ROOT } from './paths.mjs';

const [command = 'check', ...args] = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : null;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function draftFor(type, id) {
  const common = {
    schemaVersion: 1,
    entityType: type,
    revisionId: `${id}-r1`,
    id,
    slug: id,
    aliases: [],
  };
  if (type === 'reference') {
    return {
      schemaVersion: 1,
      entityType: type,
      revisionId: `${id}-r1`,
      id,
      aliases: [],
      title: '__PREENCHER__',
      authors: '__PREENCHER__',
      institution: '__PREENCHER__',
      year: '__PREENCHER__',
      kind: '__PREENCHER__',
      url: 'https://__PREENCHER__',
    };
  }
  if (type === 'relation') {
    return {
      schemaVersion: 1,
      entityType: type,
      revisionId: `${id}-r1`,
      id,
      order: null,
      source: { type: '__PREENCHER__', id: '__PREENCHER__' },
      target: { type: '__PREENCHER__', id: '__PREENCHER__' },
      type: '__PREENCHER__',
      label: '__PREENCHER__',
      justification: '__PREENCHER__',
      referenceIds: [],
      reviewState: 'pending',
    };
  }
  if (type === 'theory') {
    return {
      ...common,
      order: null,
      code: '__PREENCHER__',
      title: '__PREENCHER__',
      shortTitle: '__PREENCHER__',
      subtitle: '__PREENCHER__',
      kind: '__PREENCHER__',
      reviewState: '__PREENCHER__',
      independent: true,
      category: '__PREENCHER__',
      filters: [],
      color: '#000000',
      glow: '__PREENCHER__',
      position: { x: 50, y: 50 },
      summary: '__PREENCHER__',
      proposal: '__PREENCHER__',
      questions: [],
      concepts: [],
      nextSteps: [],
      referenceIds: [],
      claimLinks: [],
      objections: [],
      decisionBoundary: { revise: '__PREENCHER__', abandon: '__PREENCHER__' },
      review: {
        assessment: '__PREENCHER__',
        known: '__PREENCHER__',
        focus: '__PREENCHER__',
        limit: '__PREENCHER__',
        test: '__PREENCHER__',
      },
      revisions: [],
    };
  }
  if (type === 'figure') {
    return {
      ...common,
      order: null,
      name: '__PREENCHER__',
      lifespan: '__PREENCHER__',
      area: '__PREENCHER__',
      role: '__PREENCHER__',
      featuredRank: null,
      portrait: {
        src: '__PREENCHER__',
        width: null,
        height: null,
        alt: '__PREENCHER__',
        credit: '__PREENCHER__',
        license: '__PREENCHER__',
        sourceUrl: '__PREENCHER__',
      },
      summary: '__PREENCHER__',
      impact: '__PREENCHER__',
      contributions: [],
      milestones: [],
      referenceIds: [],
    };
  }
  if (type === 'party') {
    return {
      ...common,
      partyType: '__PREENCHER__',
      displayName: '__PREENCHER__',
      publicProfileLinkAuthorized: true,
      publicLinks: [],
      publicDescription: '__PREENCHER__',
    };
  }
  if (type === 'constellation') {
    return {
      ...common,
      order: null,
      name: '__PREENCHER__',
      latinName: '__PREENCHER__',
      abbreviation: 'Abc',
      featuredRank: null,
      seasonId: '__PREENCHER__',
      season: '__PREENCHER__',
      signature: '__PREENCHER__',
      recognition: '__PREENCHER__',
      fact: '__PREENCHER__',
      guideNote: '__PREENCHER__',
      sourceIds: [],
      relatedConstellationIds: [],
      stars: [],
      lines: [],
    };
  }
  if (type === 'experiment') {
    return {
      ...common,
      order: null,
      title: '__PREENCHER__',
      shortTitle: '__PREENCHER__',
      kind: '__PREENCHER__',
      status: 'planned',
      technology: '__PREENCHER__',
      href: '/Laboratorio/laboratorio.html',
      summary: '__PREENCHER__',
      question: '__PREENCHER__',
      boundary: '__PREENCHER__',
      theoryIds: [],
      moduleKey: null,
      visual: '__PREENCHER__',
    };
  }
  if (type === 'path') {
    return {
      ...common,
      order: null,
      title: '__PREENCHER__',
      summary: '__PREENCHER__',
      audience: '__PREENCHER__',
      durationMinutes: null,
      accent: '__PREENCHER__',
      steps: [],
    };
  }
  if (type === 'research-track') {
    return {
      ...common,
      order: null,
      code: 'R-00',
      title: '__PREENCHER__',
      kind: '__PREENCHER__',
      summary: '__PREENCHER__',
      boundary: '__PREENCHER__',
      nextStep: '__PREENCHER__',
    };
  }
  if (type === 'site-page') {
    return {
      schemaVersion: 1,
      entityType: type,
      revisionId: `${id}-r1`,
      order: null,
      id,
      label: '__PREENCHER__',
      functionalLabel: '__PREENCHER__',
      title: '__PREENCHER__',
      description: '__PREENCHER__',
      keywords: [],
      matchPaths: [],
      sections: [],
    };
  }
  return {
    ...common,
    title: '__PREENCHER__',
    summary: '__PREENCHER__',
    body: [],
    publicationType: '__PREENCHER__',
    authorshipOrigin: '__PREENCHER__',
    availabilityState: 'published',
    credits: [],
    textLicense: {
      identifier: '__PREENCHER__',
      label: '__PREENCHER__',
      url: '__PREENCHER__',
      rightsHolder: '__PREENCHER__',
    },
    assetRights: [],
    claimLinks: [],
    publicDeclarations: {
      publicNameAuthorization: '__PREENCHER__',
      finalVersionApproval: '__PREENCHER__',
      conflictOfInterest: { state: '__PREENCHER__' },
      editorialReview: {
        state: '__PREENCHER__',
        description: '__PREENCHER__',
        peerReview: false,
      },
    },
    referenceIds: [],
    revisions: [],
  };
}

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

async function scaffold() {
  const type = option('type');
  const id = option('id');
  const source = option('source');
  if (!CONTENT_NEW_TYPES.includes(type)) {
    throw new Error(`content:new aceita --type ${CONTENT_NEW_TYPES.join(', ')}`);
  }
  if (
    type === 'relation'
    ? !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)+$/.test(id || '')
    : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '')
  ) {
    throw new Error('Informe --id compatível com o schema da entidade');
  }

  if (!source) {
    const requestedDraftRoot = option('draft-dir');
    const draftRoot = requestedDraftRoot
      ? resolve(PROJECT_ROOT, requestedDraftRoot)
      : resolve(PROJECT_ROOT, '.content-drafts');
    if (!isInside(PROJECT_ROOT, draftRoot)) {
      throw new Error('--draft-dir precisa permanecer dentro do projeto');
    }
    if (isInside(PUBLIC_CONTENT_ROOT, draftRoot)) {
      throw new Error('--draft-dir deve ficar fora de content/public');
    }
    const draftDirectory = type === 'party' ? 'parties' : `${type}s`;
    const destination = resolve(draftRoot, draftDirectory, `${id}.json`);
    if (!isInside(draftRoot, destination)) throw new Error('Destino de rascunho inválido');
    const existing = await readFile(destination, 'utf8').catch(() => null);
    if (existing !== null && !hasFlag('force')) {
      throw new Error(`O rascunho ${type}:${id} já existe; use --force para substituí-lo`);
    }
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, `${JSON.stringify(draftFor(type, id), null, 2)}\n`, 'utf8');
    console.log(
      `Esqueleto não publicável criado em ${destination.replace(PROJECT_ROOT, '.').replaceAll('\\', '/')}. `
      + 'Preencha todos os marcadores e use content:new novamente com --source para instalar.',
    );
    return;
  }

  const operation = await loadPrivateDraftOperation({
    allowedTypes: CONTENT_NEW_TYPES,
    changeClass: option('change-class'),
    force: hasFlag('force'),
    id,
    label: 'content:new --source',
    source,
    sourceBase: PROJECT_ROOT,
    type,
  });
  await installContentChangeSet({
    analyzeImpact: analyzeEditorialChangeSet,
    operations: [operation],
    validateImpact: assertEditorialImpactAllowed,
  });
  console.log(
    `Registro instalado em ${operation.destination
      .replace(PROJECT_ROOT, '.')
      .replaceAll('\\', '/')}`,
  );
}

async function reportChangeSetImpact() {
  const manifest = option('manifest');
  if (!manifest) throw new Error('Informe --manifest <arquivo.json>');
  const prepared = await loadChangeSetManifest(manifest);
  const { impact } = await analyzeManifestOperations(prepared.operations);
  console.log(JSON.stringify(impact, null, 2));
}

async function applyChangeSet() {
  const manifest = option('manifest');
  if (!manifest) throw new Error('Informe --manifest <arquivo.json>');
  const prepared = await loadChangeSetManifest(manifest);
  const result = await installContentChangeSet({
    analyzeImpact: analyzeEditorialChangeSet,
    operations: prepared.operations,
    validateImpact: assertEditorialImpactAllowed,
  });
  console.log(
    `Change set instalado: ${result.installed
      .map(({ id, type }) => `${type}:${id}`)
      .join(', ')}.`,
  );
}

if (command === 'check') {
  const result = await compileContent();
  console.log(`Conteúdo válido (${result.fingerprint.slice(0, 12)}): ${result.metrics.theories} teorias, ${result.metrics.figures} perfis e ${result.metrics.relations} relações.`);
} else if (command === 'build') {
  const result = await compileContent({
    writeRuntime: !hasFlag('check'),
    checkRuntime: hasFlag('check'),
    writeIntegrityReport: true,
  });
  const action = hasFlag('check') ? 'Runtime conferido' : 'Runtime gerado';
  console.log(`${action} (${result.fingerprint.slice(0, 12)}): ${result.metrics.searchEntries} entradas indexáveis.`);
} else if (command === 'report') {
  const result = await compileContent({ writeIntegrityReport: true });
  console.log(
    `Relatório privado atualizado: ${result.report.warnings.length} alerta(s), `
    + `${result.report.orphanReferenceIds.length} referência(s) órfã(s).`,
  );
} else if (command === 'new') {
  await scaffold();
} else if (command === 'impact') {
  await reportChangeSetImpact();
} else if (command === 'apply') {
  await applyChangeSet();
} else if (command === 'rollback') {
  await rollbackGeneratedRuntime();
  console.log(
    'Runtime anterior restaurado para contingência. Antes de publicar, reconcilie a fonte e execute '
    + '`npm run content:build -- --check`; o próximo build normal recompilará a fonte canônica.',
  );
} else {
  throw new Error(
    `Comando desconhecido "${command}". Use check, build, report, new, impact, apply ou rollback.`,
  );
}
