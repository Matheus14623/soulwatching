---
id: "maintenance.pending-workflow"
title: "Workflow de conhecimento pendente"
scope: "maintenance"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "registro não conflitante e incorporação controlada de descobertas futuras"
triggers:
  - "conhecimento pendente"
  - "descoberta durável"
  - "incorporar base"
  - "pending-knowledge"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.expansion-guide"
evidence_sources:
  - "ai/pending-knowledge/INDEX.md"
  - "ai/pending-knowledge/PENDING_KNOWLEDGE_TEMPLATE.md"
---

# Workflow de conhecimento pendente

## Normal Development

Quando uma feature, correção ou investigação revelar conhecimento durável, crie um arquivo novo em `ai/pending-knowledge/new/`. Não edite documentos canônicos apenas por causa dessa descoberta durante uma tarefa comum.

Nome obrigatório:

```text
YYYY.MM.DD.ABCDEFGHIJKLMNOPQRSTUVWX.md
```

O identificador possui exatamente 24 caracteres alfanuméricos maiúsculos. Confirme ausência do nome em `new/` e `incorporated/`; nunca sobrescreva um registro.

Use o [template](../pending-knowledge/PENDING_KNOWLEDGE_TEMPLATE.md). Arquivos pendentes não entram no grafo nem no ledger canônico.

## Controlled Incorporation

O comando canônico exato é:

```text
incorpore a base de conhecimento pendente aos arquivos markdown canônicos do projeto
```

Somente esse comando autoriza a incorporação em lote. Nesse modo:

1. leia todos os arquivos em `new/`;
2. compare duplicidades, conflitos e proprietários atuais;
3. incorpore apenas a síntese durável e sustentada;
4. atualize índices, frontmatter, shards e cobertura quando necessário;
5. regenere e valide ledger, roteamento e grafo;
6. mova os registros tratados para `incorporated/`, sem apagá-los.

## To Verify

- Nenhum arquivo pendente existe na criação inicial da base.
