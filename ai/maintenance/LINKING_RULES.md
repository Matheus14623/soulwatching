---
id: "maintenance.linking-rules"
title: "Regras de links e contexto"
scope: "maintenance"
kind: "standard"
status: "canonical"
canonical_for:
  - "links Markdown, relacionamentos estruturados e leitura progressiva"
triggers:
  - "link interno"
  - "required_context"
  - "conditional_context"
  - "related_context"
  - "fragmento"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.graph-standard"
  - "maintenance.node-creation"
evidence_sources:
  - "ai/tools/build-knowledge-graph.mjs"
  - "ai/knowledge.schema.json"
---

# Regras de links e contexto

## Markdown Links

- Use caminhos relativos ao documento e `/` como separador.
- Preserve a capitalização real de cada segmento.
- Não use caminhos absolutos, `file://` ou paths da máquina.
- Fragmentos devem apontar para um heading existente.
- Índices precisam tornar todo Markdown canônico alcançável a partir de `ai/INDEX.md`.

## Structured Relationships

- `required_context`: leitura indispensável e pequena; ciclos são proibidos.
- `conditional_context`: leitura necessária apenas sob condição explícita.
- `related_context`: navegação opcional, nunca carregada automaticamente.
- `supersedes` e `superseded_by`: sucessão de autoridade; não implicam exclusão do arquivo anterior.

Relacionamentos estruturados usam IDs; links do corpo usam paths relativos.

## Canonical Ownership

Quando outro documento precisar de uma regra, resuma apenas o contexto necessário e linke o proprietário. Não copie blocos inteiros. Se dois arquivos parecem proprietários, resolva a precedência antes de regenerar.

## Validation

O modo `--check` valida arquivo, fragmento, caixa, alcance, relacionamentos e ciclos. Links externos recebem apenas validação sintática local; disponibilidade de rede continua manual.

## To Verify

- Convenção de fragmentos pode precisar de ajuste se o renderizador Markdown do repositório mudar.
