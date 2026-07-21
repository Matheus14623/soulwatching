---
id: "maintenance.graph-standard"
title: "Padrão do grafo de conhecimento"
scope: "maintenance"
kind: "standard"
status: "canonical"
canonical_for:
  - "contrato de frontmatter, nós, rotas, referências e grafo gerado"
triggers:
  - "frontmatter"
  - "knowledge-graph.json"
  - "schema"
  - "route shard"
  - "reference shard"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.node-creation"
  - "maintenance.graph-workflow"
  - "external.knowledge-schema"
evidence_sources:
  - "ai/knowledge.schema.json"
  - "ai/graph/routes/GENERAL_ORIENTATION.json"
  - "ai/graph/references/README.json"
  - "ai/tools/build-knowledge-graph.mjs"
---

# Padrão do grafo de conhecimento

## Sources

O grafo é gerado de três fontes:

1. frontmatter dos Markdown canônicos em `ai/`, exceto `pending-knowledge/`;
2. shards de rota em `ai/graph/routes/`;
3. shards de referência em `ai/graph/references/`.

`ai/knowledge.schema.json` define `$defs.node`, `$defs.route` e `$defs.graph`. Cada tipo é validado contra seu subschema.

## Markdown Nodes

Campos obrigatórios: `id`, `title`, `scope`, `kind`, `status`, `canonical_for`, `triggers`, `required_context` e `related_context`. Campos opcionais aplicáveis: `conditional_context`, `evidence_sources`, `supersedes` e `superseded_by`.

O gerador converte nomes `snake_case` para `camelCase`, preserva todos os relacionamentos, coleta headings e deriva `documentType`:

- `ai/INDEX.md` → `root-index`;
- outros `INDEX.md` → `scope-index`;
- `routing-map` e `flow-map` preservam o tipo;
- outros valores usam o próprio `kind`.

## Evidence and Origin

- `evidenceSources` aponta para código, configuração, teste ou documento que comprova os fatos.
- `sourceFiles` aponta somente para o Markdown ou shard que originou o nó.

Não use um campo no lugar do outro.

## Routes

Cada shard contém exatamente `id`, `description`, `requiredContext`, `conditionalContext` e `relatedContext`. As três listas são obrigatórias. IDs físicos usam `UPPER_SNAKE_CASE.json`; IDs internos usam kebab-case.

## External References

Cada shard contém um nó completo em camelCase. `path` aponta para o item referenciado e `sourceFiles` aponta para o próprio shard. A referência resume metadados e roteamento; não copia o conteúdo inteiro.

## Invariants

- IDs são estáveis, minúsculos e únicos.
- Todos os paths são relativos à raiz, usam `/` e preservam a capitalização real.
- Todo relacionamento resolve para um nó.
- `requiredContext` não possui ciclos e permanece pequeno.
- Toda condição informa quando a leitura se torna necessária.
- O grafo é determinístico e não contém timestamp, path absoluto ou ordem do filesystem.
- `pending-knowledge/` nunca entra no grafo.

## To Verify

- Compatibilidade futura com um parser YAML externo se o frontmatter ultrapassar o perfil seguro implementado localmente.
