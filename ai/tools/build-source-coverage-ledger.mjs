import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const AI_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const REPOSITORY_ROOT = path.resolve(AI_ROOT, '..');
const DECISIONS_PATH = path.join(
  AI_ROOT,
  'maintenance',
  'source-coverage-decisions.json',
);
const LEDGER_PATH = path.join(
  AI_ROOT,
  'maintenance',
  'SOURCE_COVERAGE_LEDGER.md',
);

const INVENTORY_EXTENSIONS = new Set(['.md', '.docx', '.pdf']);
const EXCLUDED_ROOT_DIRECTORIES = new Set(['ai', 'dist', 'output', '.git']);
const VALID_DECISIONS = new Set([
  'preserve',
  'reference',
  'historical',
  'qa-only',
]);
const VALID_STATES = new Set(['current', 'historical', 'internal', 'qa']);
const VALID_DOCUMENT_TYPES = new Set([
  'operational-guide',
  'architecture-guide',
  'domain-guide',
  'historical-audit',
  'editorial-review',
  'methodology-manual',
  'qa-fixture',
  'qa-render',
]);

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} deve ser um objeto.`);
  }
}

function assertOnlyKeys(value, allowedKeys, label) {
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length) {
    throw new Error(
      `${label} contém campo(s) desconhecido(s): ${unknownKeys.join(', ')}.`,
    );
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} deve ser uma string não vazia.`);
  }
}

function normalizeDeclaredPath(value, label) {
  assertNonEmptyString(value, label);

  if (
    value.includes('\\') ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value)
  ) {
    throw new Error(`${label} deve ser relativo e usar barras '/': ${value}`);
  }

  const normalized = path.posix.normalize(value);
  if (
    normalized !== value ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../')
  ) {
    throw new Error(`${label} não é um caminho relativo canônico: ${value}`);
  }

  return normalized;
}

function assertStringArray(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} deve ser uma lista${allowEmpty ? '' : ' não vazia'}.`);
  }

  value.forEach((item, index) => {
    assertNonEmptyString(item, `${label}[${index}]`);
  });
}

function assertUniqueStrings(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`${label} contém valor duplicado: ${value}`);
    }
    seen.add(value);
  }
}

async function collectDocumentationInventory() {
  const files = [];

  async function visit(absoluteDirectory, relativeDirectory = '') {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));

    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const absolutePath = path.join(absoluteDirectory, entry.name);

      if (entry.isSymbolicLink()) {
        throw new Error(`Link simbólico não suportado no inventário: ${relativePath}`);
      }

      if (entry.isDirectory()) {
        if (!relativeDirectory && EXCLUDED_ROOT_DIRECTORIES.has(entry.name)) {
          continue;
        }
        await visit(absolutePath, relativePath);
        continue;
      }

      if (
        entry.isFile() &&
        INVENTORY_EXTENSIONS.has(path.posix.extname(entry.name).toLowerCase())
      ) {
        files.push(relativePath);
      }
    }
  }

  await visit(REPOSITORY_ROOT);
  return files.sort(compareText);
}

function buildCaseIndex(paths) {
  const index = new Map();
  for (const filePath of paths) {
    const key = filePath.toLocaleLowerCase('en-US');
    const existing = index.get(key);
    if (existing && existing !== filePath) {
      throw new Error(
        `O inventário contém caminhos que diferem apenas por caixa: ${existing} e ${filePath}.`,
      );
    }
    index.set(key, filePath);
  }
  return index;
}

function parseFrontmatterNode(content, relativePath) {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== '---') return null;

  const closingIndex = lines.indexOf('---', 1);
  if (closingIndex === -1) {
    throw new Error(`Frontmatter não finalizado em ${relativePath}.`);
  }

  const frontmatterLines = lines.slice(1, closingIndex);
  const idLines = frontmatterLines.filter((line) => /^id\s*:/.test(line));
  if (idLines.length > 1) {
    throw new Error(`Frontmatter contém mais de um id em ${relativePath}.`);
  }
  if (!idLines.length) return null;

  const rawId = idLines[0].replace(/^id\s*:\s*/, '').trim();
  const id = rawId.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2');
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(id)) {
    throw new Error(`ID canônico inválido em ${relativePath}: ${id}`);
  }

  const statusLines = frontmatterLines.filter((line) => /^status\s*:/.test(line));
  if (statusLines.length !== 1) {
    throw new Error(
      `Frontmatter deve conter exatamente um status em ${relativePath}.`,
    );
  }
  const rawStatus = statusLines[0].replace(/^status\s*:\s*/, '').trim();
  const status = rawStatus.replace(
    /^(?:"([\s\S]*)"|'([\s\S]*)')$/,
    '$1$2',
  );

  return { id, status };
}

async function collectCanonicalNodes() {
  const nodes = new Map();
  const caseIndex = new Map();

  async function visit(absoluteDirectory, relativeDirectory = 'ai') {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));

    for (const entry of entries) {
      const relativePath = `${relativeDirectory}/${entry.name}`;
      const absolutePath = path.join(absoluteDirectory, entry.name);

      if (entry.isSymbolicLink()) {
        throw new Error(`Link simbólico não suportado em ai/: ${relativePath}`);
      }
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.md') {
        continue;
      }

      const content = await readFile(absolutePath, 'utf8');
      const node = parseFrontmatterNode(content, relativePath);
      if (!node) continue;
      const { id } = node;

      if (nodes.has(id)) {
        throw new Error(
          `ID canônico duplicado: ${id} em ${nodes.get(id).path} e ${relativePath}.`,
        );
      }
      const caseKey = id.toLocaleLowerCase('en-US');
      const caseConflict = caseIndex.get(caseKey);
      if (caseConflict && caseConflict !== id) {
        throw new Error(
          `IDs canônicos diferem apenas por caixa: ${caseConflict} e ${id}.`,
        );
      }

      nodes.set(id, {
        path: relativePath,
        status: node.status,
        graphEligible: !relativePath.startsWith('ai/pending-knowledge/'),
      });
      caseIndex.set(caseKey, id);
    }
  }

  await visit(AI_ROOT);
  return { nodes, caseIndex };
}

async function assertExactExistingFile(relativePath, label) {
  const segments = relativePath.split('/');
  let currentDirectory = REPOSITORY_ROOT;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    const exact = entries.find((entry) => entry.name === segment);

    if (!exact) {
      const caseInsensitive = entries.find(
        (entry) =>
          entry.name.toLocaleLowerCase('en-US') ===
          segment.toLocaleLowerCase('en-US'),
      );

      if (caseInsensitive) {
        throw new Error(
          `${label} usa caixa incorreta: ${relativePath}. Encontrado: ${[
            ...segments.slice(0, index),
            caseInsensitive.name,
            ...segments.slice(index + 1),
          ].join('/')}.`,
        );
      }

      throw new Error(`${label} aponta para arquivo inexistente: ${relativePath}`);
    }

    const isLast = index === segments.length - 1;
    if (!isLast && !exact.isDirectory()) {
      throw new Error(`${label} atravessa um arquivo: ${relativePath}`);
    }
    if (isLast && !exact.isFile()) {
      throw new Error(`${label} deve apontar para um arquivo: ${relativePath}`);
    }

    currentDirectory = path.join(currentDirectory, exact.name);
  }

  return currentDirectory;
}

function validateHeadingConfiguration(source, extension, label) {
  assertPlainObject(source.headings, `${label}.headings`);
  const markdown = extension === '.md';

  if (markdown) {
    assertOnlyKeys(
      source.headings,
      new Set(['mode', 'stripH1Attribution', 'omitNumberedSections']),
      `${label}.headings`,
    );
    if (source.headings.mode !== 'auto') {
      throw new Error(`${label}.headings.mode deve ser "auto" para Markdown.`);
    }
    if (
      source.headings.stripH1Attribution !== undefined &&
      typeof source.headings.stripH1Attribution !== 'boolean'
    ) {
      throw new Error(`${label}.headings.stripH1Attribution deve ser booleano.`);
    }
    if (source.headings.omitNumberedSections !== undefined) {
      assertStringArray(
        source.headings.omitNumberedSections,
        `${label}.headings.omitNumberedSections`,
      );
      assertUniqueStrings(
        source.headings.omitNumberedSections,
        `${label}.headings.omitNumberedSections`,
      );
      for (const section of source.headings.omitNumberedSections) {
        if (!/^\d+(?:\.\d+)*$/.test(section)) {
          throw new Error(
            `${label}.headings.omitNumberedSections contém seção inválida: ${section}`,
          );
        }
      }
    }
    return;
  }

  assertOnlyKeys(
    source.headings,
    new Set(['mode', 'items', 'omissions']),
    `${label}.headings`,
  );
  if (source.headings.mode !== 'manual') {
    throw new Error(`${label}.headings.mode deve ser "manual" para binários.`);
  }
  assertStringArray(source.headings.items, `${label}.headings.items`);
  if (source.headings.omissions !== undefined) {
    if (!Array.isArray(source.headings.omissions)) {
      throw new Error(`${label}.headings.omissions deve ser uma lista.`);
    }
    const locators = [];
    source.headings.omissions.forEach((omission, index) => {
      const omissionLabel = `${label}.headings.omissions[${index}]`;
      assertPlainObject(omission, omissionLabel);
      assertOnlyKeys(omission, new Set(['locator', 'reason']), omissionLabel);
      assertNonEmptyString(omission.locator, `${omissionLabel}.locator`);
      assertNonEmptyString(omission.reason, `${omissionLabel}.reason`);
      locators.push(omission.locator);
    });
    assertUniqueStrings(locators, `${label}.headings.omissions[].locator`);
  }
}

async function loadAndValidateDecisions(inventory, canonicalNodeIndex) {
  let raw;
  try {
    raw = await readFile(DECISIONS_PATH, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Arquivo de decisões inexistente: ${toPosix(path.relative(REPOSITORY_ROOT, DECISIONS_PATH))}`,
      );
    }
    throw error;
  }

  let decisions;
  try {
    decisions = JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON de decisões inválido: ${error.message}`);
  }

  assertPlainObject(decisions, 'decisões');
  assertOnlyKeys(decisions, new Set(['version', 'sources', 'exclusions']), 'decisões');
  if (decisions.version !== 1) {
    throw new Error('decisões.version deve ser 1.');
  }
  if (!Array.isArray(decisions.sources)) {
    throw new Error('decisões.sources deve ser uma lista.');
  }
  if (!Array.isArray(decisions.exclusions)) {
    throw new Error('decisões.exclusions deve ser uma lista.');
  }

  const inventorySet = new Set(inventory);
  const inventoryCaseIndex = buildCaseIndex(inventory);
  const classifiedPaths = new Set();

  const sources = decisions.sources.map((source, index) => {
    const label = `decisões.sources[${index}]`;
    assertPlainObject(source, label);
    assertOnlyKeys(
      source,
      new Set([
        'path',
        'documentType',
        'state',
        'decision',
        'summary',
        'canonicalNodes',
        'headings',
        'notes',
      ]),
      label,
    );

    const declaredPath = normalizeDeclaredPath(source.path, `${label}.path`);
    const actualPath = inventoryCaseIndex.get(
      declaredPath.toLocaleLowerCase('en-US'),
    );
    if (!actualPath) {
      throw new Error(`${label}.path não existe no inventário: ${declaredPath}`);
    }
    if (actualPath !== declaredPath) {
      throw new Error(
        `${label}.path usa caixa incorreta: ${declaredPath}. Encontrado: ${actualPath}.`,
      );
    }
    if (classifiedPaths.has(declaredPath)) {
      throw new Error(`Fonte classificada mais de uma vez: ${declaredPath}`);
    }

    assertNonEmptyString(source.documentType, `${label}.documentType`);
    if (!VALID_DOCUMENT_TYPES.has(source.documentType)) {
      throw new Error(
        `${label}.documentType inválido: ${source.documentType}.`,
      );
    }
    assertNonEmptyString(source.state, `${label}.state`);
    if (!VALID_STATES.has(source.state)) {
      throw new Error(`${label}.state inválido: ${source.state}.`);
    }
    assertNonEmptyString(source.decision, `${label}.decision`);
    if (!VALID_DECISIONS.has(source.decision)) {
      throw new Error(`${label}.decision inválido: ${source.decision}.`);
    }
    assertNonEmptyString(source.summary, `${label}.summary`);
    assertStringArray(source.canonicalNodes, `${label}.canonicalNodes`, {
      allowEmpty: false,
    });
    assertUniqueStrings(source.canonicalNodes, `${label}.canonicalNodes`);

    const canonicalNodes = source.canonicalNodes.map((nodeId, nodeIndex) => {
      const nodeLabel = `${label}.canonicalNodes[${nodeIndex}]`;
      if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(nodeId)) {
        throw new Error(`${nodeLabel} contém ID inválido: ${nodeId}`);
      }

      const actualId = canonicalNodeIndex.caseIndex.get(
        nodeId.toLocaleLowerCase('en-US'),
      );
      if (!actualId) {
        throw new Error(`${nodeLabel} aponta para nó canônico inexistente: ${nodeId}`);
      }
      if (actualId !== nodeId) {
        throw new Error(
          `${nodeLabel} usa caixa incorreta: ${nodeId}. Encontrado: ${actualId}.`,
        );
      }

      const canonicalNode = canonicalNodeIndex.nodes.get(nodeId);
      if (
        canonicalNode.status !== 'canonical' ||
        !canonicalNode.graphEligible
      ) {
        throw new Error(
          `${nodeLabel} não aponta para um nó canônico ativo: ${nodeId}.`,
        );
      }

      return {
        id: nodeId,
        path: canonicalNode.path,
      };
    });

    if (source.notes !== undefined) {
      assertStringArray(source.notes, `${label}.notes`);
    }

    const extension = path.posix.extname(declaredPath).toLowerCase();
    validateHeadingConfiguration(source, extension, label);
    classifiedPaths.add(declaredPath);

    return {
      ...source,
      path: declaredPath,
      canonicalNodes,
      notes: source.notes ?? [],
    };
  });

  const exclusions = decisions.exclusions.map((exclusion, index) => {
    const label = `decisões.exclusions[${index}]`;
    assertPlainObject(exclusion, label);
    assertOnlyKeys(exclusion, new Set(['path', 'decision', 'reason']), label);

    const declaredPath = normalizeDeclaredPath(exclusion.path, `${label}.path`);
    const actualPath = inventoryCaseIndex.get(
      declaredPath.toLocaleLowerCase('en-US'),
    );
    if (!actualPath) {
      throw new Error(`${label}.path não existe no inventário: ${declaredPath}`);
    }
    if (actualPath !== declaredPath) {
      throw new Error(
        `${label}.path usa caixa incorreta: ${declaredPath}. Encontrado: ${actualPath}.`,
      );
    }
    if (classifiedPaths.has(declaredPath)) {
      throw new Error(`Fonte classificada mais de uma vez: ${declaredPath}`);
    }
    if (exclusion.decision !== 'exclude') {
      throw new Error(`${label}.decision deve ser "exclude".`);
    }
    assertNonEmptyString(exclusion.reason, `${label}.reason`);
    classifiedPaths.add(declaredPath);

    return { ...exclusion, path: declaredPath };
  });

  const uncovered = inventory.filter((filePath) => !classifiedPaths.has(filePath));
  if (uncovered.length) {
    throw new Error(
      `Fonte(s) sem decisão deliberada:\n- ${uncovered.join('\n- ')}`,
    );
  }

  const decisionsOutsideInventory = [...classifiedPaths].filter(
    (filePath) => !inventorySet.has(filePath),
  );
  if (decisionsOutsideInventory.length) {
    throw new Error(
      `Decisão(ões) sem fonte inventariada:\n- ${decisionsOutsideInventory.join('\n- ')}`,
    );
  }

  for (const source of sources) {
    for (const node of source.canonicalNodes) {
      await assertExactExistingFile(
        node.path,
        `Destino canônico de ${source.path}`,
      );
    }
  }

  return {
    sources: sources.sort((left, right) => compareText(left.path, right.path)),
    exclusions: exclusions.sort((left, right) =>
      compareText(left.path, right.path),
    ),
  };
}

function sectionIsOmitted(sectionId, omittedSections) {
  return omittedSections.some(
    (omitted) => sectionId === omitted || sectionId.startsWith(`${omitted}.`),
  );
}

function extractMarkdownHeadings(content, configuration) {
  const headings = [];
  const omittedSections = configuration.omitNumberedSections ?? [];
  let fence = null;
  let skippedLevel = null;

  for (const line of content.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) {
        fence = { character: marker[0], length: marker.length };
      } else if (
        marker[0] === fence.character &&
        marker.length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }
    if (fence) continue;

    const match = line.match(/^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (!match) continue;

    const level = match[1].length;
    let text = match[2].trim();

    if (skippedLevel !== null) {
      if (level > skippedLevel) continue;
      skippedLevel = null;
    }

    const sectionMatch = text.match(/^(\d+(?:\.\d+)*)\.?(?:\s+|$)/);
    if (
      sectionMatch &&
      sectionIsOmitted(sectionMatch[1], omittedSections)
    ) {
      skippedLevel = level;
      continue;
    }

    if (level === 1 && configuration.stripH1Attribution) {
      text = text.split(/\s+[—–]\s+/, 1)[0].trim();
    }

    if (text) headings.push({ level, text });
  }

  return headings;
}

async function resolveSourceRecord(source) {
  const absolutePath = await assertExactExistingFile(
    source.path,
    `Fonte ${source.path}`,
  );
  const fileBuffer = await readFile(absolutePath);
  const extension = path.posix.extname(source.path).toLowerCase();
  const canonicalBuffer = extension === '.md'
    ? Buffer.from(fileBuffer.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8')
    : fileBuffer;
  const headings =
    source.headings.mode === 'auto'
      ? extractMarkdownHeadings(canonicalBuffer.toString('utf8'), source.headings)
      : source.headings.items.map((text) => ({ level: null, text }));
  const headingOmissions =
    source.headings.mode === 'auto'
      ? (source.headings.omitNumberedSections ?? []).map((locator) => ({
          locator: `seção-${locator}`,
          reason: 'conteúdo pessoal ou interno omitido deliberadamente',
        }))
      : (source.headings.omissions ?? []);

  return {
    ...source,
    bytes: canonicalBuffer.length,
    sha256: createHash('sha256').update(canonicalBuffer).digest('hex'),
    extension: extension.slice(1),
    headingMode: source.headings.mode,
    headings,
    headingOmissions,
  };
}

function relativeMarkdownTarget(fromFile, repositoryRelativeTarget) {
  const fromDirectory = path.dirname(fromFile);
  const target = path.resolve(REPOSITORY_ROOT, ...repositoryRelativeTarget.split('/'));
  const relativeTarget = toPosix(path.relative(fromDirectory, target));
  return relativeTarget
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function escapeMarkdownText(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
}

function markdownLink(label, targetPath) {
  return `[${escapeMarkdownText(label)}](${relativeMarkdownTarget(
    LEDGER_PATH,
    targetPath,
  )})`;
}

function renderLedger(records, exclusions, inventoryCount) {
  const lines = [
    '---',
    'id: "maintenance.source-coverage"',
    'title: "Cobertura das fontes documentais"',
    'scope: "maintenance"',
    'kind: "migration-ledger"',
    'status: "canonical"',
    'canonical_for:',
    '  - "inventário e decisão deliberada sobre documentação anterior à base canônica"',
    'triggers:',
    '  - "nova documentação fora de ai"',
    '  - "migração de fonte"',
    '  - "auditoria de cobertura"',
    'required_context:',
    '  - "maintenance.index"',
    'related_context:',
    '  - "maintenance.graph-standard"',
    '  - "maintenance.expansion-guide"',
    '  - "project.boundaries"',
    'evidence_sources:',
    '  - "ai/maintenance/source-coverage-decisions.json"',
    '  - "ai/tools/build-source-coverage-ledger.mjs"',
    '---',
    '',
    '# Cobertura das fontes documentais',
    '',
    'Este arquivo é gerado deterministicamente. Não o edite diretamente.',
    '',
    `Decisões: ${markdownLink(
      'source-coverage-decisions.json',
      'ai/maintenance/source-coverage-decisions.json',
    )}. Gerador: ${markdownLink(
      'build-source-coverage-ledger.mjs',
      'ai/tools/build-source-coverage-ledger.mjs',
    )}.`,
    '',
    '## Política de cobertura',
    '',
    '- O inventário inclui `.md`, `.docx` e `.pdf` fora de `ai/`, `dist/`, `output/` e `.git/`.',
    '- Toda fonte inventariada exige uma decisão deliberada ou uma exclusão explícita.',
    '- Headings Markdown são extraídos automaticamente; binários usam uma lista manual deliberada, inclusive quando vazia.',
    '- Markdown é normalizado para `LF` antes do cálculo de tamanho e SHA-256; `.docx` e `.pdf` preservam os bytes originais.',
    '- Destinos canônicos são validados com o casing real do filesystem.',
    '- O ledger não reproduz conteúdo pessoal, fontes editoriais brutas ou bastidores.',
    '',
    '## Resumo',
    '',
    `- Fontes documentais inventariadas: **${inventoryCount}**`,
    `- Fontes cobertas: **${records.length}**`,
    `- Exclusões explícitas: **${exclusions.length}**`,
    '',
    '| Fonte | Tipo | Estado | Decisão | Headings | Destinos |',
    '| --- | --- | --- | --- | ---: | ---: |',
  ];

  for (const record of records) {
    lines.push(
      `| ${markdownLink(record.path, record.path)} | ${record.documentType} | ${record.state} | ${record.decision} | ${record.headings.length} | ${record.canonicalNodes.length} |`,
    );
  }

  lines.push('', '## Fontes cobertas', '');

  for (const record of records) {
    lines.push(
      `### ${escapeMarkdownText(record.path)}`,
      '',
      `- Fonte: ${markdownLink(record.path, record.path)}`,
      `- Formato: \`${record.extension}\``,
      `- Tipo: \`${record.documentType}\``,
      `- Estado: \`${record.state}\``,
      `- Decisão: \`${record.decision}\``,
      `- Tamanho: \`${record.bytes}\` bytes`,
      `- SHA-256: \`${record.sha256}\``,
      `- Síntese: ${escapeMarkdownText(record.summary)}`,
      '- Destinos canônicos:',
    );

    for (const node of record.canonicalNodes) {
      lines.push(`  - \`${node.id}\` — ${markdownLink(node.path, node.path)}`);
    }

    if (record.notes.length) {
      lines.push('- Decisões complementares:');
      for (const note of record.notes) {
        lines.push(`  - ${escapeMarkdownText(note)}`);
      }
    }

    lines.push(
      `- Headings: ${
        record.headings.length
          ? record.headings[0].level === null
            ? 'lista manual'
            : 'extração automática'
          : record.headingMode === 'manual'
            ? 'lista manual deliberadamente vazia'
            : 'nenhum heading encontrado automaticamente'
      }`,
    );

    for (const heading of record.headings) {
      const prefix = heading.level === null ? 'Manual' : `H${heading.level}`;
      lines.push(`  - \`${prefix}\` ${escapeMarkdownText(heading.text)}`);
    }

    if (record.headingOmissions.length) {
      lines.push('- Omissões deliberadas de headings:');
      for (const omission of record.headingOmissions) {
        lines.push(
          `  - \`${escapeMarkdownText(omission.locator)}\` — ${escapeMarkdownText(
            omission.reason,
          )}`,
        );
      }
    }

    lines.push('');
  }

  lines.push('## Exclusões explícitas', '');
  if (!exclusions.length) {
    lines.push('Nenhuma exclusão explícita.', '');
  } else {
    for (const exclusion of exclusions) {
      lines.push(
        `- ${markdownLink(exclusion.path, exclusion.path)} — ${escapeMarkdownText(
          exclusion.reason,
        )}.`,
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function readExistingLedger() {
  try {
    return await readFile(LEDGER_PATH, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((argument) => argument !== '--check');
  if (unknownArgs.length || args.filter((argument) => argument === '--check').length > 1) {
    throw new Error(`Argumento(s) inválido(s): ${unknownArgs.join(', ') || args.join(', ')}`);
  }
  const checkOnly = args.includes('--check');

  const inventory = await collectDocumentationInventory();
  const canonicalNodeIndex = await collectCanonicalNodes();
  const decisions = await loadAndValidateDecisions(
    inventory,
    canonicalNodeIndex,
  );
  const records = [];
  for (const source of decisions.sources) {
    records.push(await resolveSourceRecord(source));
  }
  const expectedLedger = renderLedger(
    records,
    decisions.exclusions,
    inventory.length,
  );
  const existingLedger = await readExistingLedger();

  if (checkOnly) {
    if (existingLedger === null) {
      throw new Error('SOURCE_COVERAGE_LEDGER.md ainda não foi gerado.');
    }
    if (existingLedger !== expectedLedger) {
      throw new Error(
        'SOURCE_COVERAGE_LEDGER.md está desatualizado. Execute o gerador sem --check.',
      );
    }
    process.stdout.write('Source coverage ledger está atualizado.\n');
    return;
  }

  if (existingLedger === expectedLedger) {
    process.stdout.write('Source coverage ledger já estava atualizado.\n');
    return;
  }

  await mkdir(path.dirname(LEDGER_PATH), { recursive: true });
  await writeFile(LEDGER_PATH, expectedLedger, 'utf8');
  process.stdout.write('Source coverage ledger gerado.\n');
}

main().catch((error) => {
  process.stderr.write(`Erro: ${error.message}\n`);
  process.exitCode = 1;
});
