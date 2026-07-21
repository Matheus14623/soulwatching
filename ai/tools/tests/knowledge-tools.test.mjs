import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import {
  assertJsonSchema,
  parseYaml,
  runKnowledgeBuild,
  snakeToCamelDeep,
  stableStringify,
  validateJsonSchema,
} from '../lib/knowledge-core.mjs';

const schemaText = await readFile(new URL('../../knowledge.schema.json', import.meta.url), 'utf8');

async function withTempAi(callback) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'observatory-knowledge-'));
  const aiRoot = join(repoRoot, 'ai');
  try {
    await mkdir(aiRoot, { recursive: true });
    await callback({ repoRoot, aiRoot });
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

async function put(root, path, content) {
  const absolute = join(root, ...path.split('/'));
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content, 'utf8');
}

function canonicalDocument({
  id,
  title,
  scope,
  kind = 'canonical-reference',
  requiredContext = [],
  relatedContext = [],
  body = '',
}) {
  return `---
id: "${id}"
title: "${title}"
scope: "${scope}"
kind: "${kind}"
status: "canonical"
canonical_for: ["fixture ${id}"]
triggers: ["fixture"]
required_context: ${JSON.stringify(requiredContext)}
conditional_context: []
related_context: ${JSON.stringify(relatedContext)}
evidence_sources: []
---
# ${title}

${body}
`;
}

function referenceNode({ id, title, path, documentType, sourceFile, headings = [] }) {
  return {
    id,
    title,
    path,
    scope: 'project',
    kind: 'legacy-reference',
    status: 'legacy',
    document_type: documentType,
    canonical_for: [],
    triggers: ['fixture'],
    required_context: [],
    conditional_context: [],
    related_context: [],
    evidence_sources: [path === 'ai/knowledge-graph.json' ? 'ai/knowledge.schema.json' : path],
    supersedes: [],
    superseded_by: [],
    source_files: [sourceFile],
    headings,
    notes: [],
  };
}

async function makeFixture({ repoRoot, aiRoot }, options = {}) {
  await put(aiRoot, 'knowledge.schema.json', schemaText);
  await put(repoRoot, 'README.md', '# Fixture repository\n\nRepository evidence.\n');

  const projectRequired = options.cycle ? ['maintenance.graph-standard'] : ['root.index'];
  const maintenanceRequired = options.cycle ? ['project.index'] : ['root.index'];
  const fragment = options.badFragment ? 'ausente' : 'contrato';

  await put(aiRoot, 'INDEX.md', canonicalDocument({
    id: 'root.index',
    title: 'Knowledge root',
    scope: 'project',
    kind: 'index',
    relatedContext: ['root.routing'],
    body: 'Start with the [generated routing map](ROUTING.md) and the [pending knowledge index](pending-knowledge/INDEX.md).',
  }));
  await put(aiRoot, 'pending-knowledge/INDEX.md', canonicalDocument({
    id: 'pending.index',
    title: 'Pending knowledge',
    scope: 'maintenance',
    kind: 'index',
    body: 'Use the [record template](PENDING_KNOWLEDGE_TEMPLATE.md).',
  }));
  await put(aiRoot, 'pending-knowledge/PENDING_KNOWLEDGE_TEMPLATE.md', `---
pending_id: "YYYY.MM.DD.ABCDEFGHIJKLMNOPQRSTUVWX"
title: "Pending record"
status: "new"
---

# Pending record
`);
  await put(aiRoot, 'pending-knowledge/new/IGNORED.md', 'This intentionally has no heading or canonical frontmatter.\n');
  await put(aiRoot, 'pending-knowledge/incorporated/IGNORED.md', 'This intentionally has no heading or canonical frontmatter.\n');
  await put(aiRoot, 'project/INDEX.md', canonicalDocument({
    id: 'project.index',
    title: 'Project index',
    scope: 'project',
    kind: 'index',
    requiredContext: projectRequired,
    body: `Read the [graph contract](../maintenance/KNOWLEDGE_GRAPH_STANDARD.md#${fragment}).`,
  }));
  await put(aiRoot, 'maintenance/KNOWLEDGE_GRAPH_STANDARD.md', canonicalDocument({
    id: 'maintenance.graph-standard',
    title: 'Knowledge graph standard',
    scope: 'maintenance',
    kind: 'standard',
    requiredContext: maintenanceRequired,
    body: '## Contrato\n\nThe graph contract used by the fixture.',
  }));

  const readmePath = options.badCase ? 'readme.md' : 'README.md';
  await put(aiRoot, 'graph/references/README.json', `${JSON.stringify(referenceNode({
    id: 'external.readme',
    title: 'Repository README',
    path: readmePath,
    documentType: 'project-readme',
    sourceFile: 'ai/graph/references/README.json',
    headings: [{ level: 1, text: 'Fixture repository' }],
  }), null, 2)}\n`);
  await put(aiRoot, 'graph/references/KNOWLEDGE_GRAPH.json', `${JSON.stringify(referenceNode({
    id: 'external.knowledge-graph',
    title: 'Generated knowledge graph',
    path: 'ai/knowledge-graph.json',
    documentType: 'generated-graph',
    sourceFile: 'ai/graph/references/KNOWLEDGE_GRAPH.json',
  }), null, 2)}\n`);
  await put(aiRoot, 'graph/routes/GENERAL.json', `${JSON.stringify({
    id: 'general-orientation',
    description: 'Orient a contributor in the fixture knowledge base.',
    required_context: ['project.index', 'maintenance.graph-standard'],
    conditional_context: [],
    related_context: options.unlinkedReferences ? [] : ['external.readme', 'external.knowledge-graph'],
  }, null, 2)}\n`);

  if (options.orphan) {
    await put(aiRoot, 'domains/ORPHAN.md', canonicalDocument({
      id: 'domains.orphan',
      title: 'Unlinked domain note',
      scope: 'domains',
    }));
  }
}

test('restricted YAML parser accepts structural blocks and flow values', () => {
  const parsed = parseYaml(`
name: "Observatory # 1"
enabled: true
items:
  - id: first
    tags: [alpha, 'beta:2']
  - id: second
message: |-
  line 1
  line 2
`.trimStart(), { source: 'fixture.yaml' });
  assert.equal(parsed.name, 'Observatory # 1');
  assert.equal(parsed.enabled, true);
  assert.deepEqual([...parsed.items[0].tags], ['alpha', 'beta:2']);
  assert.equal(parsed.message, 'line 1\nline 2');
});

test('restricted YAML parser rejects duplicates, bad indentation, and unsupported syntax', () => {
  assert.throws(() => parseYaml('id: one\nid: two\n'), { code: 'YAML_PARSE_ERROR' });
  assert.throws(() => parseYaml('root:\n   child: value\n'), { code: 'YAML_PARSE_ERROR' });
  assert.throws(() => parseYaml('value: &anchor test\n'), { code: 'YAML_PARSE_ERROR' });
  assert.throws(() => parseYaml('value: !tag test\n'), { code: 'YAML_PARSE_ERROR' });
});

test('JSON Schema validator executes supported keywords and rejects unknown ones', () => {
  const schema = {
    $defs: { id: { type: 'string', pattern: '^[a-z]+$' } },
    type: 'object',
    required: ['id', 'values'],
    additionalProperties: false,
    properties: {
      id: { $ref: '#/$defs/id' },
      values: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'integer', minimum: 1 } },
    },
  };
  assertJsonSchema({ id: 'alpha', values: [1, 2] }, schema);
  assert.equal(validateJsonSchema({ id: 'Alpha', values: [0, 0], extra: true }, schema).length >= 3, true);
  assert.throws(() => validateJsonSchema({}, { type: 'object', madeUpKeyword: false }), { code: 'SCHEMA_INVALID' });
});

test('snake_case conversion is deep and detects collisions', () => {
  const converted = snakeToCamelDeep({ required_context: [{ source_id: 'a' }] });
  assert.equal(converted.requiredContext[0].sourceId, 'a');
  assert.throws(() => snakeToCamelDeep({ source_id: 'a', sourceId: 'b' }), { code: 'KEY_COLLISION' });
});

test('pending knowledge index is canonical while its template and records stay outside the graph', async () => {
  await withTempAi(async (fixture) => {
    await makeFixture(fixture);
    const result = await runKnowledgeBuild({ aiRoot: fixture.aiRoot });
    assert.equal(result.model.nodes['pending.index'].path, 'ai/pending-knowledge/INDEX.md');
    const graphPaths = Object.values(result.model.nodes).map((node) => node.path);
    assert.equal(graphPaths.includes('ai/pending-knowledge/PENDING_KNOWLEDGE_TEMPLATE.md'), false);
    assert.equal(graphPaths.some((path) => path.startsWith('ai/pending-knowledge/new/')), false);
    assert.equal(graphPaths.some((path) => path.startsWith('ai/pending-knowledge/incorporated/')), false);
  });
});

test('generation is deterministic and --check never writes', async () => {
  await withTempAi(async (fixture) => {
    await makeFixture(fixture);
    const { aiRoot } = fixture;
    const first = await runKnowledgeBuild({ aiRoot });
    assert.deepEqual(first.written.sort(), ['ROUTING.md', 'knowledge-graph.json']);

    const routing = await readFile(join(aiRoot, 'ROUTING.md'), 'utf8');
    const graphText = await readFile(join(aiRoot, 'knowledge-graph.json'), 'utf8');
    const graph = JSON.parse(graphText);
    assert.deepEqual(Object.keys(graph).sort(), ['generated', 'nodes', 'routes', 'schemaVersion']);
    assert.equal(graph.schemaVersion, '1.0.0');
    assert.equal(graph.generated, true);
    assert.equal(graph.nodes['root.index'].documentType, 'root-index');
    assert.equal(graph.nodes['project.index'].documentType, 'scope-index');
    assert.equal(graph.nodes['maintenance.graph-standard'].documentType, 'standard');
    assert.equal(stableStringify(graph, 2) + '\n', graphText);
    const routingFrontMatter = routing.split('\n---\n', 1)[0].replace(/^---\n/, '');
    const routingMetadata = snakeToCamelDeep(parseYaml(routingFrontMatter, { source: 'ROUTING.md' }));
    assert.equal(routingMetadata.id, 'root.routing');
    assert.equal(routingMetadata.title, 'Roteamento da base de conhecimento');
    assert.match(routing, /# Roteamento da base de conhecimento/);
    assert.match(routing, /\]\(\.\.\/README\.md\)/);

    const before = {
      routing: (await stat(join(aiRoot, 'ROUTING.md'))).mtimeMs,
      graph: (await stat(join(aiRoot, 'knowledge-graph.json'))).mtimeMs,
    };
    const checked = await runKnowledgeBuild({ aiRoot, check: true });
    assert.equal(checked.written.length, 0);
    assert.deepEqual(before, {
      routing: (await stat(join(aiRoot, 'ROUTING.md'))).mtimeMs,
      graph: (await stat(join(aiRoot, 'knowledge-graph.json'))).mtimeMs,
    });

    await writeFile(join(aiRoot, 'ROUTING.md'), 'stale\n', 'utf8');
    const staleRouting = await readFile(join(aiRoot, 'ROUTING.md'), 'utf8');
    const unchangedGraph = await readFile(join(aiRoot, 'knowledge-graph.json'), 'utf8');
    await assert.rejects(() => runKnowledgeBuild({ aiRoot, check: true }), { code: 'KNOWLEDGE_OUTDATED' });
    assert.equal(await readFile(join(aiRoot, 'ROUTING.md'), 'utf8'), staleRouting);
    assert.equal(await readFile(join(aiRoot, 'knowledge-graph.json'), 'utf8'), unchangedGraph);

    await rm(join(aiRoot, 'ROUTING.md'));
    await rm(join(aiRoot, 'knowledge-graph.json'));
    await runKnowledgeBuild({ aiRoot });
    assert.equal(await readFile(join(aiRoot, 'ROUTING.md'), 'utf8'), routing);
    assert.equal(await readFile(join(aiRoot, 'knowledge-graph.json'), 'utf8'), graphText);
  });
});

test('--check does not bootstrap the generated graph', async () => {
  await withTempAi(async (fixture) => {
    await makeFixture(fixture);
    await assert.rejects(() => runKnowledgeBuild({ aiRoot: fixture.aiRoot, check: true }), { code: 'PATH_MISSING' });
    await assert.rejects(() => stat(join(fixture.aiRoot, 'knowledge-graph.json')), { code: 'ENOENT' });
    await assert.rejects(() => stat(join(fixture.aiRoot, 'ROUTING.md')), { code: 'ENOENT' });
  });
});

test('required_context cycles and missing Markdown fragments fail', async () => {
  await withTempAi(async (fixture) => {
    await makeFixture(fixture, { cycle: true });
    await assert.rejects(() => runKnowledgeBuild({ aiRoot: fixture.aiRoot }), { code: 'REQUIRED_CONTEXT_CYCLE' });
  });
  await withTempAi(async (fixture) => {
    await makeFixture(fixture, { badFragment: true });
    await assert.rejects(() => runKnowledgeBuild({ aiRoot: fixture.aiRoot }), { code: 'LINK_FRAGMENT_MISSING' });
  });
});

test('path case mismatches and nodes unreachable by links fail', async () => {
  await withTempAi(async (fixture) => {
    await makeFixture(fixture, { badCase: true });
    await assert.rejects(() => runKnowledgeBuild({ aiRoot: fixture.aiRoot }), { code: 'PATH_CASE_MISMATCH' });
  });
  await withTempAi(async (fixture) => {
    await makeFixture(fixture, { unlinkedReferences: true });
    const result = await runKnowledgeBuild({ aiRoot: fixture.aiRoot });
    assert.ok(result.model.nodes['external.readme']);
    assert.ok(result.model.nodes['external.knowledge-graph']);
  });
  await withTempAi(async (fixture) => {
    await makeFixture(fixture, { orphan: true });
    await assert.rejects(() => runKnowledgeBuild({ aiRoot: fixture.aiRoot }), { code: 'ORPHAN_NODE' });
  });
});
