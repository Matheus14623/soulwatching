---
id: "frontend.pages-modules"
title: "Páginas e módulos do frontend"
scope: "frontend"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "composição de páginas, ordem de CSS e responsabilidade de controladores"
triggers:
  - "nova página"
  - "controlador de rota"
  - "main.js"
  - "page-shell.js"
  - "CSS específico"
required_context:
  - "frontend.index"
conditional_context:
  - id: "domains.theory-catalog"
    condition: "Quando a página consumir ou apresentar linhas de investigação."
  - id: "domains.notable-figures"
    condition: "Quando a página consumir ou apresentar perfis históricos e suas conexões."
related_context:
  - "project.architecture"
  - "quality.validation-release"
evidence_sources:
  - "index.html"
  - "Teorias/teorias.html"
  - "Teorias/teorias.js"
  - "Mapa/mapa.html"
  - "Mapa/mapa.js"
  - "GrandesNomes/grandes-nomes.html"
  - "GrandesNomes/grandes-nomes.js"
  - "Constelacoes/constelacoes.html"
  - "Constelacoes/constelacoes.js"
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "assets/js/main.js"
  - "assets/js/stellar-vision-info.js"
  - "assets/js/page-shell.js"
  - "assets/js/notable-figures-preview.js"
  - "assets/js/notable-figures-model.js"
  - "assets/js/constellation-model.js"
  - "assets/js/constellation-chart.js"
  - "assets/js/constellations-preview.js"
---

# Páginas e módulos do frontend

## Current Confirmed Structure

`assets/js/main.js` inicializa os sistemas da home uma única vez, incluindo os recortes de Grandes Nomes e Constelações e o diálogo explicativo da Visão Estelar. `assets/js/page-shell.js` inicializa somente a navegação nas páginas estáticas. Teorias, Mapa, Grandes Nomes e Constelações importam navegação, modelos compartilhados e dados, mas controlam seus próprios estados e renderização.

Ordem de estilos nas páginas internas:

1. `assets/css/styles.css` para tokens e componentes globais;
2. `assets/css/observatory-pages.css` para padrões de páginas internas;
3. CSS da rota para diferenças locais.

## Canonical Rules

- Não duplique dados de teorias no HTML.
- Não mova regras específicas de uma rota para o CSS global sem reutilização comprovada.
- Preserve um único `h1`, landmarks semânticos, título e descrição próprios por página.
- Um módulo compartilhado deve possuir responsabilidade transversal real; estado visual específico permanece no controlador da rota.
- Use `textContent` ou escape explícito ao renderizar dados em HTML.
- Mantenha paths e capitalização exatos para Linux, especialmente `Teorias`, `Mapa`, `GrandesNomes`, `Constelacoes`, `Arquivo` e `Laboratorio`.

## Entry Points

- Navegação e rolagem: `assets/js/navigation.js` e `assets/js/smooth-scroll.js`.
- Explicação da Visão Estelar: `assets/js/stellar-vision-info.js`.
- Domínio de teorias: `assets/js/theory-model.js`.
- Domínio de perfis históricos: `assets/js/notable-figures-model.js`.
- Recorte de perfis na home: `assets/js/notable-figures-preview.js`.
- Domínio de constelações: `assets/js/constellation-model.js`.
- Renderização SVG compartilhada do atlas e da home: `assets/js/constellation-chart.js`.
- Recorte de constelações na home: `assets/js/constellations-preview.js`.
- Utilitários genéricos: `assets/js/utils.js`.
- Dados editoriais: `assets/data/`.

## Validation

Depois de uma nova página, atualize navegação, rodapé, arquivos obrigatórios e allowlist do build quando aplicável. Teste a rota partindo da raiz e de diretórios internos.

## To Verify

- `assets/js/theories.js` é um reexport publicado e exigido pelo verificador, mas não possui consumidor interno confirmado.
