---
id: "maintenance.node-creation"
title: "Criação de nós canônicos"
scope: "maintenance"
kind: "standard"
status: "canonical"
canonical_for:
  - "nomenclatura, frontmatter e conteúdo mínimo de um documento canônico"
triggers:
  - "criar nó"
  - "frontmatter obrigatório"
  - "ID canônico"
  - "novo Markdown"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.graph-standard"
  - "maintenance.linking-rules"
evidence_sources:
  - "ai/knowledge.schema.json"
  - "ai/tools/build-knowledge-graph.mjs"
---

# Criação de nós canônicos

## Naming

- Pastas de escopo: minúsculas.
- Índices: `INDEX.md`.
- Outros documentos: `UPPER_SNAKE_CASE.md`.
- IDs: estáveis, minúsculos e sem data ou número de tarefa.

## Frontmatter Template

```yaml
---
id: "scope.short-name"
title: "Título legível"
scope: "project"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "regra ou conceito possuído por este documento"
triggers:
  - "sinal real de tarefa"
required_context:
  - "scope.index"
conditional_context:
  - id: "other.node"
    condition: "Quando a leitura passa a ser necessária."
related_context:
  - "scope.related-node"
evidence_sources:
  - "path/that/proves-the-claim.ext"
---
```

Use listas vazias nos campos obrigatórios sem itens. Não coloque alternativas, explicações longas ou exemplos literais no frontmatter final.

## Body

Use somente as seções aplicáveis: propósito, quando ler, estrutura confirmada, regras, entrypoints, contratos, dependências, exemplos, evidências, validação, regras de atualização e `To Verify`.

Toda afirmação específica deve ter uma evidência rastreável ou aparecer em `To Verify`. Não espelhe função por função; registre decisões, contratos, fluxos e riscos duráveis.

## Validation

Depois de criar o arquivo, ligue-o a um índice, ajuste rotas e enumerações se necessário e regenere o grafo. O gerador rejeita IDs duplicados, links quebrados, paths com caixa incorreta, relações ausentes e órfãos.

## To Verify

- Nenhum item; este padrão muda somente com o schema e o gerador correspondentes.
