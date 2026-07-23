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
  - "Constelacoes/whale-shark-easter-egg.js"
  - "assets/css/constellation-chart.css"
  - "assets/css/constellations-preview.css"
  - "assets/css/notable-figures-preview.css"
  - "Arquivo/arquivo.css"
  - "Laboratorio/laboratorio.css"
  - "Laboratorio/experimento.css"
  - "Rotas/rotas.css"
  - "Contribuicoes/contribuicoes.css"
  - "assets/css/global-search.css"
  - "assets/js/navigation.js"
  - "assets/js/contact.js"
  - "scripts/tests/accessibility-contracts.test.mjs"
  - "index.html"
---

# Design, responsividade e acessibilidade

## Current Confirmed Structure

O sistema visual combina observatório, arquivo técnico e campo cósmico. Tokens globais em `styles.css` definem fundo escuro, acentos ciano/violeta/dourado, tipografia, raios, sombras, container e altura do cabeçalho. Inter, JetBrains Mono e Playfair Display são carregadas pelo Google Fonts, com famílias do sistema como fallback.

Breakpoints recorrentes incluem 1180, 1080, 1040, 960, 760, 460 e 430 px. Eles são responsabilidades de componentes diferentes, não uma única escala global rígida.

O atlas de constelações usa um campo principal, um painel textual e uma faixa horizontal de seletores compactos. Busca e filtros sazonais reduzem o catálogo sem remover o contexto da seleção. No desktop, campo e catálogo permanecem agrupados à esquerda e o detalhe ocupa uma coluna independente à direita, evitando que textos de comprimentos diferentes desloquem o catálogo. Em telas estreitas, a ordem natural é campo, catálogo e detalhe, e a faixa mantém rolagem horizontal controlada.

As estrelas permanecem visíveis sem depender das linhas. Hover e foco oferecem uma prévia temporária no desktop; mouse e teclado alteram a seleção sem fixar implicitamente a guia. Toque e caneta fixam as linhas porque não possuem hover persistente, enquanto o botão textual da guia fornece a ação explícita de fixar ou liberar em qualquer dispositivo. Os estados selecionados, a legenda de magnitude e o detalhe equivalente impedem que cor, brilho, movimento ou posição do ponteiro sejam o único meio de acesso. A faixa adota foco móvel e suporta setas, `Home` e `End`; filtros, campo de busca e controles anterior/próximo continuam na ordem normal de tabulação.

Uma ilustração estelar de tubarão-baleia ocupa o fundo da área superior direita sem participar do catálogo de constelações. O componente usa um único SVG gerado no botão nomeado, com estrelas e linhas próprias, e reduz escala e opacidade nos breakpoints de 900 e 600 px. O retângulo visual permanece sem eventos; paths transparentes limitados à silhueta definem a hit-area para mouse e toque, enquanto foco de teclado e o nome acessível permanecem no botão. Hover, foco, clique e toque revelam o desenho e acionam uma sequência finita que retorna à geometria de repouso. Movimento reduzido mantém a revelação, mas remove qualquer deslocamento das partes da figura.

A busca global usa `dialog`, título associado, campo nomeado, contador em região viva e resultados completos por link. `Ctrl+K` ou `Command+K` abre a superfície; setas percorrem os resultados e o fechamento devolve foco ao gatilho. Rotas Guiadas, comparação, treino e simuladores mantêm ações textuais, estados de progresso e anúncios pequenos em vez de depender de posição, cor ou animação.

No menu compacto fechado, a navegação recebe `inert` e `aria-hidden`; ao cruzar o breakpoint, o controlador sincroniza novamente o estado. O botão de retorno ao topo também permanece `inert`, oculto e fora da ordem de tabulação até se tornar visível. No formulário de contato, cada mensagem possui `id` ligado ao campo por `aria-describedby`, `aria-invalid` só existe durante erro e o foco vai para o primeiro campo inválido. A ressonância oferece seis botões nomeados além de mouse e toque. Esses contratos possuem testes estáticos dedicados, mas ainda exigem conferência com tecnologia assistiva real.

## Canonical Rules

- Reutilize tokens e padrões existentes antes de criar uma nova linguagem.
- Ciano é o acento estrutural; outras cores distinguem conteúdo sem competir pela hierarquia.
- Não comunique estado somente por cor, brilho, movimento ou hover.
- Mantenha foco visível, ordem de headings, nomes acessíveis e controles de teclado.
- Preserve conteúdo equivalente no mobile; adapte layout, não significado.
- Toda animação respeita `prefers-reduced-motion` no CSS e no JavaScript.
- Carrosséis automáticos precisam de pausa visível, alternativa por teclado, estado textual e conteúdo completo fora de hover.
- Diálogos precisam de título associado, fechamento previsível e devolução de foco; atalhos não substituem controles visíveis.
- Elementos visualmente ocultos ou menus fechados não podem permanecer focáveis.
- Não adicione comentários, blocos desativados ou notas de implementação em HTML, CSS ou JavaScript públicos. Orientações pertencem à documentação.
- Evite declarações inline arbitrárias e novas camadas tardias de override. Custom properties derivadas dos dados, como `--accent`, `--accent-glow`, `--status-color`, `--x` e `--y`, são a exceção existente para cards e nós do mapa.

## Validation

Teste teclado, Escape, foco após reconstrução de DOM, zoom de 200%, contraste no fundo real, ausência de overflow horizontal e as larguras 1440, 1024, 768, 430, 390 e 360 px quando a mudança for visual.

## To Verify

- Contraste medido de textos monoespaçados pequenos e estados translúcidos.
- Comportamento com leitor de tela e JavaScript desativado.
- Licença e procedência dos assets visuais existentes.
- Legibilidade e métricas dos fallbacks de sistema caso a política de fontes remotas definida em [Build estático e deploy](../infrastructure/STATIC_BUILD_AND_DEPLOY.md) seja alterada.
