---
id: "root.routing"
title: "Roteamento da base de conhecimento"
scope: "project"
kind: "routing-map"
status: "canonical"
canonical_for: ["roteamento progressivo de tarefas para contexto obrigatório"]
triggers: ["roteamento","tipo de tarefa","contexto obrigatório"]
required_context: ["root.index"]
conditional_context: []
related_context: ["maintenance.graph-standard"]
evidence_sources: []
supersedes: []
superseded_by: []
notes: ["Arquivo gerado; não editar manualmente."]
---

# Roteamento da base de conhecimento

Arquivo gerado deterministicamente a partir de `ai/graph/routes/*.json` e dos nós validados.

## Como usar

Escolha a rota que corresponde à tarefa, leia primeiro o contexto obrigatório e abra o contexto condicional somente quando sua condição for verdadeira.

## Rotas disponíveis

### build-deploy-change

Alterar servidor local, verificação, allowlist pública, build ou configuração da Vercel.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice de infraestrutura](infrastructure/INDEX.md), [Build estático e deploy](infrastructure/STATIC_BUILD_AND_DEPLOY.md).
- Contexto condicional:
  - [Validação e release](quality/VALIDATION_AND_RELEASE.md): Quando a mudança modificar verificações ou critérios de publicação.
  - [Fronteiras, fontes de verdade e legado](project/REPOSITORY_BOUNDARIES.md): Quando houver risco de incluir documentação, fontes editoriais ou artefatos internos em dist/.
- Contexto relacionado: [Comandos e ambiente](project/COMMANDS_AND_ENVIRONMENT.md), [Configuração de deploy da Vercel](../vercel.json).

### frontend-change

Alterar página, componente, estilo, navegação ou estado de interface.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice do frontend](frontend/INDEX.md), [Páginas e módulos do frontend](frontend/PAGE_AND_MODULE_ARCHITECTURE.md).
- Contexto condicional:
  - [Catálogo de linhas de investigação](domains/THEORY_CATALOG.md): Quando a mudança tocar cards, filtros, dossiês, mapa ou dados de linhas de investigação.
  - [Catálogo de grandes nomes](domains/NOTABLE_FIGURES_CATALOG.md): Quando a mudança tocar perfis, retratos, filtros, dossiês ou conexões da área Grandes Nomes.
  - [Desempenho e acessibilidade](quality/PERFORMANCE_AND_ACCESSIBILITY.md): Quando houver interação, animação, canvas, áudio, responsividade ou mudança semântica.
- Contexto relacionado: [Design, responsividade e acessibilidade](frontend/DESIGN_AND_ACCESSIBILITY.md), [Fluxos do usuário e estado](frontend/USER_FLOWS.md).

### general-orientation

Entender o repositório, localizar responsabilidades ou preparar uma tarefa ainda sem escopo definido.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice do projeto](project/INDEX.md).
- Contexto condicional: nenhum.
- Contexto relacionado: [Arquitetura atual](project/ARCHITECTURE.md), [Fronteiras, fontes de verdade e legado](project/REPOSITORY_BOUNDARIES.md).

### interactive-experiment-change

Alterar Visão Estelar, ressonância, movimento, canvas, áudio ou criar um experimento visual.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Sistemas interativos](frontend/INTERACTIVE_SYSTEMS.md), [Desempenho e acessibilidade](quality/PERFORMANCE_AND_ACCESSIBILITY.md).
- Contexto condicional:
  - [Modelo editorial e publicação](domains/EDITORIAL_MODEL.md): Quando o experimento introduzir texto público ou uma nova promessa editorial.
  - [Build estático e deploy](infrastructure/STATIC_BUILD_AND_DEPLOY.md): Quando novos assets ou módulos precisarem entrar no artefato público.
- Contexto relacionado: [Design, responsividade e acessibilidade](frontend/DESIGN_AND_ACCESSIBILITY.md), [Validação e release](quality/VALIDATION_AND_RELEASE.md).

### knowledge-base-update

Criar, corrigir, expandir ou incorporar conhecimento na base ai/.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice de manutenção da base](maintenance/INDEX.md), [Guia de expansão da base](maintenance/EXPANSION_GUIDE.md).
- Contexto condicional:
  - [Workflow de conhecimento pendente](maintenance/PENDING_KNOWLEDGE_WORKFLOW.md): Quando a tarefa registrar uma descoberta ou incorporar arquivos de pending-knowledge.
  - [Cobertura das fontes documentais](maintenance/SOURCE_COVERAGE_LEDGER.md): Quando uma fonte anterior for preservada, migrada, substituída ou mudar de proprietário canônico.
- Contexto relacionado: [Padrão do grafo de conhecimento](maintenance/KNOWLEDGE_GRAPH_STANDARD.md), [Workflow de geração e validação](maintenance/GRAPH_GENERATION_WORKFLOW.md), [Criação de nós canônicos](maintenance/KNOWLEDGE_NODE_CREATION.md), [Regras de links e contexto](maintenance/LINKING_RULES.md).

### publication-change

Criar ou revisar ensaio, registro, fragmento, página de leitura ou o catálogo do Arquivo.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice do domínio editorial](domains/INDEX.md), [Modelo editorial e publicação](domains/EDITORIAL_MODEL.md).
- Contexto condicional:
  - [Arquitetura atual](project/ARCHITECTURE.md): Quando a primeira publicação exigir nova rota, catálogo ou decisão estrutural.
  - [Build estático e deploy](infrastructure/STATIC_BUILD_AND_DEPLOY.md): Quando novos HTML, dados ou assets precisarem entrar no artefato público.
  - [Validação e release](quality/VALIDATION_AND_RELEASE.md): Antes de considerar o conteúdo pronto para publicação.
- Contexto relacionado: [Fronteiras, fontes de verdade e legado](project/REPOSITORY_BOUNDARIES.md), [Design, responsividade e acessibilidade](frontend/DESIGN_AND_ACCESSIBILITY.md).

### testing-review

Executar revisão, diagnóstico, validação, QA responsiva ou auditoria de publicação.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice de qualidade](quality/INDEX.md), [Validação e release](quality/VALIDATION_AND_RELEASE.md).
- Contexto condicional:
  - [Desempenho e acessibilidade](quality/PERFORMANCE_AND_ACCESSIBILITY.md): Quando a revisão envolver interface, movimento, teclado, canvas ou desempenho.
- Contexto relacionado: [Comandos e ambiente](project/COMMANDS_AND_ENVIRONMENT.md), [Fluxos do usuário e estado](frontend/USER_FLOWS.md).

### theory-content-change

Adicionar, revisar, reclassificar ou relacionar uma linha de investigação.

- Contexto obrigatório: [Base de conhecimento do Observatório de Ideias](INDEX.md), [Índice do domínio editorial](domains/INDEX.md), [Catálogo de linhas de investigação](domains/THEORY_CATALOG.md).
- Contexto condicional:
  - [Fluxos do usuário e estado](frontend/USER_FLOWS.md): Quando a mudança alterar busca, filtros, URL, seleção ou navegação entre superfícies.
  - [Catálogo de grandes nomes](domains/NOTABLE_FIGURES_CATALOG.md): Quando a linha receber ou revisar uma conexão pública com um perfil histórico.
  - [Validação e release](quality/VALIDATION_AND_RELEASE.md): Antes de considerar a alteração pronta para publicação.
- Contexto relacionado: [Modelo editorial e publicação](domains/EDITORIAL_MODEL.md), [Integração e escala das linhas de investigação](../docs/INTEGRACAO_TEORIAS.md).
