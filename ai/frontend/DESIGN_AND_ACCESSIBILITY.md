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
  - "GrandesNomes/grandes-nomes.css"
  - "Constelacoes/constelacoes.css"
  - "assets/css/constellation-chart.css"
  - "assets/css/constellations-preview.css"
  - "assets/css/notable-figures-preview.css"
  - "Arquivo/arquivo.css"
  - "Laboratorio/laboratorio.css"
  - "index.html"
---

# Design, responsividade e acessibilidade

## Current Confirmed Structure

O sistema visual combina observatório, arquivo técnico e campo cósmico. Tokens globais em `styles.css` definem fundo escuro, acentos ciano/violeta/dourado, tipografia, raios, sombras, container e altura do cabeçalho. Inter, JetBrains Mono e Playfair Display são carregadas pelo Google Fonts, com famílias do sistema como fallback.

Breakpoints recorrentes incluem 1180, 1080, 1040, 960, 760, 460 e 430 px. Eles são responsabilidades de componentes diferentes, não uma única escala global rígida.

O atlas de constelações usa um campo principal, um painel textual e uma faixa horizontal de seletores compactos. Busca e filtros sazonais reduzem o catálogo sem remover o contexto da seleção. No desktop, campo e catálogo permanecem agrupados à esquerda e o detalhe ocupa uma coluna independente à direita, evitando que textos de comprimentos diferentes desloquem o catálogo. Em telas estreitas, a ordem natural é campo, catálogo e detalhe, e a faixa mantém rolagem horizontal controlada.

As estrelas permanecem visíveis sem depender das linhas. Hover e foco oferecem uma prévia temporária no desktop; mouse e teclado alteram a seleção sem fixar implicitamente a guia. Toque e caneta fixam as linhas porque não possuem hover persistente, enquanto o botão textual da guia fornece a ação explícita de fixar ou liberar em qualquer dispositivo. Os estados selecionados, a legenda de magnitude e o detalhe equivalente impedem que cor, brilho, movimento ou posição do ponteiro sejam o único meio de acesso. A faixa adota foco móvel e suporta setas, `Home` e `End`; filtros, campo de busca e controles anterior/próximo continuam na ordem normal de tabulação.

## Canonical Rules

- Reutilize tokens e padrões existentes antes de criar uma nova linguagem.
- Ciano é o acento estrutural; outras cores distinguem conteúdo sem competir pela hierarquia.
- Não comunique estado somente por cor, brilho, movimento ou hover.
- Mantenha foco visível, ordem de headings, nomes acessíveis e controles de teclado.
- Preserve conteúdo equivalente no mobile; adapte layout, não significado.
- Toda animação respeita `prefers-reduced-motion` no CSS e no JavaScript.
- Carrosséis automáticos precisam de pausa visível, alternativa por teclado, estado textual e conteúdo completo fora de hover.
- Não adicione comentários, blocos desativados ou notas de implementação em HTML, CSS ou JavaScript públicos. Orientações pertencem à documentação.
- Evite declarações inline arbitrárias e novas camadas tardias de override. Custom properties derivadas dos dados, como `--accent`, `--accent-glow`, `--status-color`, `--x` e `--y`, são a exceção existente para cards e nós do mapa.

## Validation

Teste teclado, Escape, foco após reconstrução de DOM, zoom de 200%, contraste no fundo real, ausência de overflow horizontal e as larguras 1440, 1024, 768, 430, 390 e 360 px quando a mudança for visual.

## To Verify

- Contraste medido de textos monoespaçados pequenos e estados translúcidos.
- Comportamento com leitor de tela e JavaScript desativado.
- Licença e procedência dos assets visuais existentes.
- Legibilidade e métricas dos fallbacks de sistema caso a política de fontes remotas definida em [Build estático e deploy](../infrastructure/STATIC_BUILD_AND_DEPLOY.md) seja alterada.
