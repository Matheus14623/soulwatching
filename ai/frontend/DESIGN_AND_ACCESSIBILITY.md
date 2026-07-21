---
id: "frontend.design-accessibility"
title: "Design, responsividade e acessibilidade"
scope: "frontend"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "identidade visual, cascata, breakpoints e requisitos acessíveis do frontend"
triggers:
  - "design"
  - "CSS"
  - "responsividade"
  - "acessibilidade"
  - "ARIA"
  - "movimento reduzido"
required_context:
  - "frontend.index"
related_context:
  - "quality.performance-accessibility"
  - "domains.editorial-model"
  - "infrastructure.static-deploy"
evidence_sources:
  - "assets/css/styles.css"
  - "assets/css/observatory-pages.css"
  - "Teorias/teorias.css"
  - "Mapa/mapa.css"
  - "Arquivo/arquivo.css"
  - "Laboratorio/laboratorio.css"
  - "index.html"
---

# Design, responsividade e acessibilidade

## Current Confirmed Structure

O sistema visual combina observatório, arquivo técnico e campo cósmico. Tokens globais em `styles.css` definem fundo escuro, acentos ciano/violeta/dourado, tipografia, raios, sombras, container e altura do cabeçalho. Inter, JetBrains Mono e Playfair Display são carregadas pelo Google Fonts, com famílias do sistema como fallback.

Breakpoints recorrentes incluem 1180, 1080, 1040, 960, 760, 460 e 430 px. Eles são responsabilidades de componentes diferentes, não uma única escala global rígida.

## Canonical Rules

- Reutilize tokens e padrões existentes antes de criar uma nova linguagem.
- Ciano é o acento estrutural; outras cores distinguem conteúdo sem competir pela hierarquia.
- Não comunique estado somente por cor, brilho, movimento ou hover.
- Mantenha foco visível, ordem de headings, nomes acessíveis e controles de teclado.
- Preserve conteúdo equivalente no mobile; adapte layout, não significado.
- Toda animação respeita `prefers-reduced-motion` no CSS e no JavaScript.
- Não adicione comentários, blocos desativados ou notas de implementação em HTML, CSS ou JavaScript públicos. Orientações pertencem à documentação.
- Evite declarações inline arbitrárias e novas camadas tardias de override. Custom properties derivadas dos dados, como `--accent`, `--accent-glow`, `--status-color`, `--x` e `--y`, são a exceção existente para cards e nós do mapa.

## Validation

Teste teclado, Escape, foco após reconstrução de DOM, zoom de 200%, contraste no fundo real, ausência de overflow horizontal e as larguras 1440, 1024, 768, 430, 390 e 360 px quando a mudança for visual.

## To Verify

- Contraste medido de textos monoespaçados pequenos e estados translúcidos.
- Comportamento com leitor de tela e JavaScript desativado.
- Licença e procedência dos assets visuais existentes.
- Legibilidade e métricas dos fallbacks de sistema caso a política de fontes remotas definida em [Build estático e deploy](../infrastructure/STATIC_BUILD_AND_DEPLOY.md) seja alterada.
