---
id: "quality.performance-accessibility"
title: "Desempenho e acessibilidade"
scope: "quality"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "budgets qualitativos, movimento, ciclo de vida e critérios acessíveis"
triggers:
  - "performance"
  - "memória"
  - "canvas"
  - "movimento reduzido"
  - "teclado"
  - "foco"
  - "ARIA"
required_context:
  - "quality.index"
related_context:
  - "frontend.interactive-systems"
  - "frontend.design-accessibility"
evidence_sources:
  - "assets/js/observer.js"
  - "assets/js/resonance.js"
  - "assets/js/smooth-scroll.js"
  - "assets/css/styles.css"
  - "Teorias/teorias.css"
  - "Mapa/mapa.css"
  - "GrandesNomes/grandes-nomes.js"
  - "GrandesNomes/grandes-nomes.css"
  - "Constelacoes/constelacoes.js"
  - "Constelacoes/constelacoes.css"
  - "assets/js/constellation-chart.js"
---

# Desempenho e acessibilidade

## Current Confirmed Structure

- A Visão Estelar limita partículas e DPR por perfil; movimento reduzido remove trilhas e relações e desenha um campo estático.
- O renderer cancela frames ao desligar e quando a aba fica oculta.
- A ressonância limita DPR a 2, exige ação explícita para áudio e pausa fora da viewport quando `IntersectionObserver` está disponível.
- A rolagem suave é cancelável e usa fallback imediato para movimento reduzido.
- Teorias e Mapa reconstroem partes do DOM no cliente; o custo atual é pequeno para o catálogo existente.
- Grandes Nomes usa retratos WebP locais, imagens preguiçosas após os primeiros cards e uma única instância de carrossel. Autoplay pausa quando não é percebido; filtros destroem a instância anterior e movimento reduzido remove rotação, profundidade e transições.
- Constelações usa um campo principal e uma faixa de miniaturas SVG produzidos pelo mesmo renderizador, sem canvas, timers, loop de animação ou dependência nova. Busca e filtros operam sobre as 12 entradas em memória; a interface não mantém 12 painéis detalhados simultâneos. Hover e foco pré-visualizam as linhas; mouse e teclado mudam a seleção sem fixá-las implicitamente, toque e caneta fixam a guia por não possuírem hover persistente, e o botão da guia controla a fixação explícita. Campo e catálogo compartilham a coluna principal, independente da altura do detalhe, e no mobile seguem antes do detalhe na ordem natural. Movimento reduzido remove transições e o desenho progressivo das linhas.

## Canonical Rules

- Meça antes de adicionar biblioteca ou aumentar partículas.
- Use uma única instância de cada loop global e limpe frames/listeners quando o recurso desativar.
- Pause trabalho contínuo quando não for percebido.
- Ajuste qualidade por dispositivo sem remover conteúdo essencial.
- Ofereça teclado e texto equivalente a interações por ponteiro; em coleções compostas, prefira foco móvel a dezenas de pontos de tabulação equivalentes.
- Preserve foco após substituir elementos interativos.
- Use estados ARIA coerentes e regiões vivas pequenas; não anuncie painéis inteiros repetidamente.
- Movimento reduzido deve ser aplicado tanto no CSS quanto no JavaScript.
- Evite `will-change` permanente, WebGL pesado e efeitos que dominem o conteúdo.

## Scaling Guidance

Se os catálogos crescerem para dezenas de entradas, concentre índices de busca e relações nos modelos compartilhados, aplique debounce onde medido e evite reconstruir filtros sem necessidade. Paginação, virtualização ou divisão de bundles só entram após medição.

## Validation

Teste teclado, foco, leitor de tela quando possível, zoom, movimento reduzido, aba oculta, múltiplas alternâncias e perfil de CPU móvel. Verifique que o número de canvases não cresce.

## To Verify

- FPS, heap e custo de pintura em aparelhos móveis reais.
- Contraste automatizado dos estados translúcidos.
- Possíveis vazamentos após alternâncias prolongadas; não existe teste automatizado de memória.
