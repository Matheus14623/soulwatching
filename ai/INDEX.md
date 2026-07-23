---
id: "root.index"
title: "Base de conhecimento do Observatório de Ideias"
scope: "project"
kind: "index"
status: "canonical"
canonical_for:
  - "entrada obrigatória e navegação progressiva da base de conhecimento"
triggers:
  - "início de tarefa"
  - "orientação geral"
  - "onde alterar"
required_context: []
related_context:
  - "root.routing"
  - "project.index"
  - "frontend.index"
  - "domains.index"
  - "quality.index"
  - "infrastructure.index"
  - "maintenance.index"
evidence_sources:
  - "package.json"
  - "index.html"
  - "scripts/public-manifest.mjs"
  - "scripts/build.mjs"
  - "vercel.json"
---

# Base de conhecimento do Observatório de Ideias

O repositório contém um site estático multipágina em HTML, CSS e módulos JavaScript nativos. A home funciona como gateway; Teorias, Mapa, Grandes Nomes, Constelações, Arquivo, Laboratório, Rotas Guiadas e Contribuições possuem rotas próprias, além do executor compartilhado dos simuladores. A navegação comum também oferece busca global sobre os catálogos públicos. Não há backend, banco de dados, CMS ou bundler confirmados.

## Comece pela tarefa

Abra o [mapa de roteamento](ROUTING.md) e leia somente o contexto obrigatório da categoria aplicável.

| Tipo de tarefa | Primeiro escopo |
| --- | --- |
| Estrutura, comandos ou limites do repositório | [Projeto](project/INDEX.md) |
| Página, CSS, JavaScript, interação ou responsividade | [Frontend](frontend/INDEX.md) |
| Conteúdo, teorias, relações ou critérios editoriais | [Domínio editorial](domains/INDEX.md) |
| Revisão, testes, desempenho ou acessibilidade | [Qualidade](quality/INDEX.md) |
| Build, `dist/`, servidor local ou Vercel | [Infraestrutura](infrastructure/INDEX.md) |
| Criar ou manter conhecimento para agentes | [Manutenção](maintenance/INDEX.md) |

## Princípios de leitura

- Confirme fatos no código, na configuração, nos testes ou em documentação coerente com eles.
- Preserve o comportamento existente salvo quando a tarefa autorizar uma mudança funcional.
- Uma regra durável possui um único proprietário canônico; outros documentos criam links.
- Estado atual, recomendação e legado devem permanecer separados.
- `dist/` e `output/` são derivados e nunca são fonte de verdade.
- A pasta histórica `ia/` é evidência legada; não descreve automaticamente o estado atual.
- Dúvidas sem evidência suficiente ficam em `To Verify` com uma ação objetiva.

## Artefatos estruturados

- [Grafo gerado](knowledge-graph.json)
- [Schema do grafo](knowledge.schema.json)
- [Padrão do grafo](maintenance/KNOWLEDGE_GRAPH_STANDARD.md)
- [Cobertura das fontes anteriores](maintenance/SOURCE_COVERAGE_LEDGER.md)

## Conhecimento ainda não incorporado

Descobertas de tarefas comuns entram em [pending-knowledge](pending-knowledge/INDEX.md). Elas não fazem parte do grafo canônico até a incorporação controlada descrita no [workflow correspondente](maintenance/PENDING_KNOWLEDGE_WORKFLOW.md).

## To Verify

- Domínio público canônico e comportamento final das URLs limpas na hospedagem.
