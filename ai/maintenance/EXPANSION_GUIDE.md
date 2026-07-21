---
id: "maintenance.expansion-guide"
title: "Guia de expansão da base"
scope: "maintenance"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "decisão sobre atualizar, criar ou relacionar conhecimento canônico"
triggers:
  - "expandir ai/"
  - "novo escopo"
  - "novo documento"
  - "incorporar conhecimento"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.node-creation"
  - "maintenance.linking-rules"
  - "maintenance.pending-workflow"
evidence_sources:
  - "ai/INDEX.md"
  - "ai/knowledge.schema.json"
  - "ai/maintenance/source-coverage-decisions.json"
  - "ai/tools/build-source-coverage-ledger.mjs"
---

# Guia de expansão da base

## Before Writing

1. Leia o índice raiz e a rota da tarefa.
2. Confirme o fato em fontes ativas.
3. Identifique o menor escopo que naturalmente possui a regra.
4. Procure um proprietário canônico existente.
5. Separe estado atual, recomendação e legado.

## Update or Create

Atualize um documento quando a informação apenas esclarece ou amplia a mesma responsabilidade. Crie outro quando o tema tiver proprietário, gatilhos, dependências, histórico ou frequência de mudança próprios, ou quando cruzar uma fronteira que merece um fluxo específico.

Evite um documento gigante e evite shards Markdown de uma frase. Índices roteiam; eles não acumulam regras detalhadas.

## New Scope

Crie um escopo apenas quando a camada existir no repositório. Adicione:

- pasta minúscula e `INDEX.md`;
- enum de `scope` no schema;
- link no índice raiz;
- rotas aplicáveis;
- pelo menos um documento específico quando o índice sozinho não for suficiente.

Não crie `backend`, `database`, `security` ou `integrations` enquanto essas camadas não existirem de forma relevante.

## Existing Sources

Quando uma fonte anterior for preservada, migrada, dividida, unida, substituída ou reclassificada, atualize `source-coverage-decisions.json` e regenere o ledger. Nenhum documento anterior desaparece semanticamente sem destino ou decisão explícita.

O inventário de cobertura é deliberadamente documental: inclui `.md`, `.docx` e `.pdf`, formatos capazes de carregar conhecimento narrativo anterior. Builders `.py` e `.cjs` são tratados como implementação ativa ou ferramenta de proveniência, não como documentação a migrar; renders de imagem sem autoridade semântica própria também ficam fora. Se uma tarefa declarar explicitamente que um desses arquivos é fonte de conhecimento, amplie a política ou registre uma decisão específica antes de afirmar cobertura completa.

## Completion

Atualize índices e links, regenere ledger/roteamento/grafo, execute testes dos geradores, rode `npm run knowledge:check` e finalize com `npm run verify`.

## To Verify

- Criação de escopos adicionais somente após evidência de nova camada real.
