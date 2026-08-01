---
id: "project.architecture"
title: "Arquitetura atual"
scope: "project"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "stack, rotas, entrypoints e divisão de responsabilidades do produto"
triggers:
  - "nova rota"
  - "entrypoint"
  - "módulo"
  - "stack"
  - "arquitetura multipágina"
required_context:
  - "project.index"
conditional_context:
  - id: "frontend.pages-modules"
    condition: "Quando a tarefa modificar HTML, CSS ou controladores de página."
related_context:
  - "project.boundaries"
  - "infrastructure.static-deploy"
evidence_sources:
  - "package.json"
  - "index.html"
  - "Teorias/teorias.html"
  - "Mapa/mapa.html"
  - "GrandesNomes/grandes-nomes.html"
  - "Constelacoes/constelacoes.html"
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "Laboratorio/experimento.html"
  - "Rotas/rotas.html"
  - "Contribuicoes/contribuicoes.html"
  - "assets/js/main.js"
  - "assets/js/page-shell.js"
  - "assets/js/global-search.js"
  - "assets/js/content-repository.js"
  - "assets/js/content-source.js"
  - "content/schemas/entity.schema.json"
  - "content/schemas/editorial-change-set.schema.json"
  - "content/public/catalogs/editorial-revision-ledger.json"
  - "content/public/taxonomies/experiments.json"
  - "content/public/paths/perder-para-evidencia.json"
  - "scripts/content/change-set.mjs"
  - "scripts/content/compiler.mjs"
  - "scripts/content/editorial-impact.mjs"
  - "scripts/content/install-record.mjs"
  - "scripts/public-manifest.mjs"
  - "tools/editorial-dashboard/server.mjs"
  - "assets/js/notable-figures-model.js"
  - "assets/js/constellation-model.js"
  - "assets/js/constellation-chart.js"
  - "assets/vendor/swiper/LICENSE"
supersedes:
  - "external.current-architecture"
---

# Arquitetura atual

## Purpose

Registrar a estrutura que existe hoje e orientar mudanças sem transformar o site em outra arquitetura por conveniência.

## Current Confirmed Structure

O Observatório é uma aplicação estática multipágina. Cada destino principal é um HTML real; não existe roteador client-side. O navegador executa módulos ES diretamente.

| Superfície | Entry point | Responsabilidade |
| --- | --- | --- |
| Home | `index.html` → `assets/js/main.js` | Gateway, Visão Estelar, recortes de teorias, grandes nomes, constelações e Rotas Guiadas, mapa-resumo, filosofia, ressonância e contato. |
| Teorias | `Teorias/teorias.html` → `Teorias/teorias.js` | Busca, filtros, comparação, dossiê crítico, revisão individual, relações tipadas e URLs diretas. |
| Mapa | `Mapa/mapa.html` → `Mapa/mapa.js` | Relações, eixos, seleção, detalhe e URL direta. |
| Grandes Nomes | `GrandesNomes/grandes-nomes.html` → `GrandesNomes/grandes-nomes.js` | Galeria arrastável, comparação, trilhas temáticas, linha do tempo, dossiês, fontes e URLs diretas. |
| Constelações | `Constelacoes/constelacoes.html` → `Constelacoes/constelacoes.js` | Atlas mestre–detalhe, busca, filtros, linhas-guia, modo treino acessível, fontes e URLs diretas. |
| Arquivo | `Arquivo/arquivo.html` → `assets/js/page-shell.js` | Estado editorial e conteúdo estático. |
| Laboratório | `Laboratorio/laboratorio.html` → `Laboratorio/laboratorio.js` | Catálogo central das nove experiências públicas. |
| Executor de experimento | `Laboratorio/experimento.html` → `Laboratorio/experimento.js` | Shell compartilhado que carrega sob demanda um dos quatro simuladores. |
| Rotas Guiadas | `Rotas/rotas.html` → `Rotas/rotas.js` | Quatro percursos editoriais entre perfis, teorias e experiências, com etapa preservada na URL. |
| Contribuições | `Contribuicoes/contribuicoes.html` → `Contribuicoes/contribuicoes.js` | Política de autoria externa, catálogo ainda vazio e preparação local de proposta por `mailto:`. |
| Compatibilidade | `teorias.html` | Redirecionamento legado para a rota atual. |

Tecnologias confirmadas no produto público: HTML5, CSS, JavaScript ES Modules, SVG, Canvas 2D, Web Audio API, History API e IntersectionObserver. Não há framework, TypeScript, backend, banco ou CMS no site servido pela Vercel. A galeria usa Swiper 14.0.6, fixado e servido localmente como dependência de interface sem requisição de runtime a CDN. A operação editorial possui uma dashboard local em Node.js e módulos nativos, mantida fora do artefato público.

## Canonical Rules

- Preserve a arquitetura multipágina enquanto a escala não justificar outra decisão explícita.
- Compartilhe regras de domínio e dados; mantenha controladores de apresentação por rota.
- Use módulos pequenos com inicialização defensiva quando um elemento não existir.
- Uma nova rota recebe HTML real, CSS específico apenas quando necessário e `page-shell.js` se precisar somente da navegação comum.
- Cadastre rotas, arquivos obrigatórios e caminhos de build em `scripts/public-manifest.mjs`; os consumidores não mantêm listas paralelas.
- Não adicione uma dependência para substituir uma API nativa suficiente.
- Dependências vendorizadas precisam de versão fixa, licença preservada, arquivos explícitos no build e fallback que mantenha o conteúdo acessível.

## Dependencies

`content/public/` é a fonte autoral pública e `content/schemas/` define seus contratos. O compilador gera módulos imutáveis em `assets/data/generated/`; os arquivos históricos em `assets/data/` preservam exports compatíveis e não são fonte de autoria. `ContentRepository` consulta o snapshot sem conhecer o armazenamento, `StaticContentSource` é ativo e `HttpContentSource` permanece disponível para uma origem HTTP futura.

O núcleo editorial local permanece separado do frontend público. `editorial-impact.mjs` calcula diff, classe efetiva, vigência e impacto direto; `change-set.mjs` valida manifestos privados e monta o overlay; `install-record.mjs` aplica registros e ledgers sob um único lock; o compilador fornece a única integridade cruzada, executa o gate e projeta `needs-review` no runtime. `content/public/catalogs/editorial-revision-ledger.json` mantém a sequência e o hash canônico das revisões de teorias, perfis, publicações e experimentos, sem armazenar snapshots antigos. Relações revisadas fixam os extremos em `reviewedAgainst`; o histórico próprio das relações ainda é o Git.

A dashboard local em `tools/editorial-dashboard/` é um adaptador privado sobre essa camada, não uma segunda fonte de verdade. Ela cria workspaces fora de `content/public/`, monta o mesmo manifesto, chama a análise e a instalação existentes e gera preview em workspace-sombra. Seu servidor aceita somente loopback e IDs allowlisted; caminhos de arquivos nunca são fornecidos pelo navegador. A ferramenta não é API pública, CMS remoto nem rota da Vercel, e o site permanece independente dela.

`theory-model.js` concentra localização e relações tipadas; `theory-figure-model.js` deriva relações inversas dos mesmos registros centrais. Modelos de perfis, constelações, experiências, publicações e Rotas Guiadas consomem projeções geradas específicas para evitar download indiscriminado do snapshot completo. O executor de laboratório importa somente o módulo allowlisted do simulador solicitado. Navegação, busca global, métricas e rolagem são compartilhadas por `navigation.js`, `global-search.js`, `site-metrics.js` e `smooth-scroll.js`.

## Validation

Execute `npm run content:check` e `npm run content:build -- --check` ao alterar a plataforma de conteúdo. Mudanças no contrato editorial também precisam cobrir ledger, classificação, `reviewedAgainst`, gate, manifesto e rollback nos testes de conteúdo. Execute `npm run verify` depois de alterar entrypoints, imports, rotas ou arquivos obrigatórios. Execute `npm test` para comprovar build, composição pública e smoke das rotas; confirme se o teste de navegador foi executado ou ignorado.

## To Verify

- Matriz oficial de navegadores suportados.
- Critério de escala que justificaria Vite, outro gerador estático ou páginas individuais por slug.
