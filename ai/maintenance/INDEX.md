---
id: "maintenance.index"
title: "Índice de manutenção da base"
scope: "maintenance"
kind: "index"
status: "canonical"
canonical_for:
  - "roteamento de criação, geração, cobertura e evolução da base ai/"
triggers:
  - "manutenção da base"
  - "novo documento canônico"
  - "grafo"
  - "ledger"
  - "conhecimento pendente"
required_context:
  - "root.index"
related_context:
  - "maintenance.graph-standard"
  - "maintenance.expansion-guide"
  - "maintenance.node-creation"
  - "maintenance.linking-rules"
  - "maintenance.graph-workflow"
  - "maintenance.pending-workflow"
  - "maintenance.source-coverage"
evidence_sources:
  - "ai/knowledge.schema.json"
  - "ai/tools/build-knowledge-graph.mjs"
  - "ai/tools/build-source-coverage-ledger.mjs"
---

# Índice de manutenção da base

Este escopo pertence à própria base de conhecimento. Leia somente os documentos necessários ao tipo de manutenção.

## Navegação

- [Padrão do grafo](KNOWLEDGE_GRAPH_STANDARD.md)
- [Guia de expansão](EXPANSION_GUIDE.md)
- [Criação de nós](KNOWLEDGE_NODE_CREATION.md)
- [Regras de links](LINKING_RULES.md)
- [Geração e validação](GRAPH_GENERATION_WORKFLOW.md)
- [Conhecimento pendente](PENDING_KNOWLEDGE_WORKFLOW.md)
- [Cobertura das fontes](SOURCE_COVERAGE_LEDGER.md)

## Regra de propriedade

O Markdown é canônico para explicações e decisões. Shards JSON são canônicos para rotas e referências externas. `ROUTING.md`, `SOURCE_COVERAGE_LEDGER.md` e `knowledge-graph.json` são derivados e nunca devem ser corrigidos manualmente.

## Quando atualizar

Atualize o proprietário da regra, índices afetados, frontmatter, shards e decisões de cobertura. Em seguida, regenere e execute o modo `--check`.

## To Verify

- Necessidade futura de extrair os validadores para um pacote reutilizável; a escala atual não justifica isso.
