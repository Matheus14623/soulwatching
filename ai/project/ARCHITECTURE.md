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
  - "assets/data/experiments.js"
  - "assets/data/learning-paths.js"
  - "scripts/public-manifest.mjs"
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

Tecnologias confirmadas: HTML5, CSS, JavaScript ES Modules, SVG, Canvas 2D, Web Audio API, History API e IntersectionObserver. Não há framework, TypeScript, backend, banco ou CMS. A galeria usa Swiper 14.0.6, fixado e servido localmente como dependência de interface sem requisição de runtime a CDN.

## Canonical Rules

- Preserve a arquitetura multipágina enquanto a escala não justificar outra decisão explícita.
- Compartilhe regras de domínio e dados; mantenha controladores de apresentação por rota.
- Use módulos pequenos com inicialização defensiva quando um elemento não existir.
- Uma nova rota recebe HTML real, CSS específico apenas quando necessário e `page-shell.js` se precisar somente da navegação comum.
- Cadastre rotas, arquivos obrigatórios e caminhos de build em `scripts/public-manifest.mjs`; os consumidores não mantêm listas paralelas.
- Não adicione uma dependência para substituir uma API nativa suficiente.
- Dependências vendorizadas precisam de versão fixa, licença preservada, arquivos explícitos no build e fallback que mantenha o conteúdo acessível.

## Dependencies

`assets/data/theories.js` alimenta home, Teorias e Mapa. `assets/js/theory-model.js` concentra localização e relações tipadas simétricas; `assets/js/theory-figure-model.js` deriva, dos perfis, as relações inversas exibidas nos dossiês. `assets/data/notable-figures.js` alimenta destaques, 22 perfis, comparação, quatro trilhas e linha do tempo. `assets/data/constellations.js` alimenta o recorte da home, o atlas e seu treino; `constellation-chart.js` produz o SVG compartilhado.

`assets/data/experiments.js` é o catálogo central das nove experiências e seus limites; o executor importa somente o módulo do simulador solicitado. `assets/data/learning-paths.js` e `learning-paths-model.js` ligam as quatro Rotas Guiadas aos catálogos existentes, sem copiar títulos ou slugs. `assets/data/contributions.js` separa formatos, política e publicações externas. Navegação, busca global, métricas e rolagem são compartilhadas por `navigation.js`, `global-search.js`, `site-metrics.js` e `smooth-scroll.js`.

## Validation

Execute `npm run verify` depois de alterar entrypoints, imports, rotas ou arquivos obrigatórios. Execute `npm test` para comprovar build, composição pública e smoke das rotas; confirme se o teste de navegador foi executado ou ignorado.

## To Verify

- Matriz oficial de navegadores suportados.
- Critério de escala que justificaria Vite, outro gerador estático ou páginas individuais por slug.
