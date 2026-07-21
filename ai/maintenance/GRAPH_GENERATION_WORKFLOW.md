---
id: "maintenance.graph-workflow"
title: "Workflow de geração e validação"
scope: "maintenance"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "ordem de geração, comandos, modo check e tratamento de falhas"
triggers:
  - "gerar grafo"
  - "--check"
  - "ROUTING.md"
  - "SOURCE_COVERAGE_LEDGER.md"
  - "knowledge-graph.json"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.graph-standard"
  - "maintenance.source-coverage"
  - "external.knowledge-graph"
evidence_sources:
  - "ai/tools/build-source-coverage-ledger.mjs"
  - "ai/tools/build-knowledge-graph.mjs"
  - "package.json"
---

# Workflow de geração e validação

## Generated Artifacts

- `ai/maintenance/SOURCE_COVERAGE_LEDGER.md` vem do inventário e de `source-coverage-decisions.json`.
- `ai/ROUTING.md` vem dos shards de rota.
- `ai/knowledge-graph.json` vem do frontmatter, rotas e referências.

Não edite esses três arquivos manualmente.

## Commands

```text
npm run knowledge:build
npm run knowledge:check
npm run knowledge:test
npm run verify
```

O build de conhecimento executa o ledger primeiro, porque ele próprio é um nó Markdown do grafo. O modo `--check` é somente leitura e falha se qualquer saída estiver ausente, desatualizada ou inválida.

## Validation Order

1. Inventariar fontes anteriores e conferir decisões deliberadas.
2. Gerar ou conferir o ledger.
3. Gerar `ROUTING.md` a partir das rotas.
4. Ler e validar todo frontmatter canônico.
5. Validar shards contra seus subschemas.
6. Resolver caminhos, links, fragmentos e IDs.
7. Detectar ciclos obrigatórios e documentos órfãos.
8. Gerar o grafo em ordem estável e validar contra o schema.
9. Reexecutar tudo em `--check`.

## Failure Handling

Corrija a fonte, não o artefato derivado. Um erro de schema, link, decisão de cobertura ou contexto obrigatório torna a base incompleta até ser resolvido. Não enfraqueça o validador para fazer uma saída inválida passar.

## To Verify

- Nenhum; novas etapas devem ser adicionadas aqui junto com seus validadores.
