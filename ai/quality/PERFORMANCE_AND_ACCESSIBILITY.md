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
  - "Constelacoes/whale-shark-easter-egg.js"
  - "assets/js/constellation-chart.js"
  - "assets/js/global-search.js"
  - "assets/data/experiments.js"
  - "Laboratorio/experimento.js"
  - "Laboratorio/simulations/light-cone.js"
  - "Laboratorio/simulations/zero-epsilon.js"
  - "Laboratorio/simulations/finite-recurrence.js"
  - "Laboratorio/simulations/astrobiology.js"
  - "Rotas/rotas.js"
  - "scripts/tests/accessibility-contracts.test.mjs"
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
- O modo treino reutiliza o mesmo catálogo e SVG, mantém uma rodada por vez e não persiste dados; suas oito rodadas não criam outro renderer nem um loop.
- O tubarão-baleia estelar é uma ilustração independente do catálogo e usa um único SVG, sem canvas, biblioteca, timer recorrente ou loop. Ponteiro, foco, clique e toque iniciam somente uma sequência finita; o término ou cancelamento remove o estado transitório e devolve corpo, cauda e nadadeiras à posição original. A hit-area acompanha a silhueta em paths transparentes para não transformar todo o retângulo sobreposto em alvo nem bloquear controles próximos. Em movimento reduzido, brilho e linhas ainda respondem, mas não há deslocamento das partes.
- A busca global só importa os seis catálogos quando o diálogo é aberto, conserva o índice na página e limita a lista a 12 resultados. Não há rede, indexador externo ou busca em cada nó do DOM.
- O catálogo de nove experiências contém apenas metadados leves. O executor carrega dinamicamente um dos quatro simuladores, cada um baseado em HTML/SVG e cálculos pequenos; `pagehide` chama a limpeza retornada pelo módulo.
- Rotas Guiadas resolvem quatro listas de cinco referências em memória e renderizam uma etapa completa por vez. Não há persistência, prefetch de páginas ou dependência de animação.
- Menu móvel e retorno ao topo usam `inert`, `aria-hidden` e `tabindex` para retirar alvos invisíveis do teclado. Formulários ligam mensagens aos campos; a ressonância oferece seis botões nomeados. Há testes de contrato para esses três pontos, não uma auditoria completa com leitor de tela.

## Canonical Rules

- Meça antes de adicionar biblioteca ou aumentar partículas.
- Use uma única instância de cada loop global e limpe frames/listeners quando o recurso desativar.
- Pause trabalho contínuo quando não for percebido.
- Ajuste qualidade por dispositivo sem remover conteúdo essencial.
- Ofereça teclado e texto equivalente a interações por ponteiro; em coleções compostas, prefira foco móvel a dezenas de pontos de tabulação equivalentes.
- Preserve foco após substituir elementos interativos.
- Importe módulos pesados somente na superfície que os usa e forneça limpeza para toda montagem com listeners ou trabalho recorrente.
- Use estados ARIA coerentes e regiões vivas pequenas; não anuncie painéis inteiros repetidamente.
- Movimento reduzido deve ser aplicado tanto no CSS quanto no JavaScript.
- Evite `will-change` permanente, WebGL pesado e efeitos que dominem o conteúdo.

## Scaling Guidance

Se os catálogos crescerem para dezenas de entradas, concentre índices de busca e relações nos modelos compartilhados, aplique debounce onde medido e evite reconstruir filtros sem necessidade. Paginação, virtualização ou divisão de bundles só entram após medição.

## Validation

Teste teclado, foco, leitor de tela quando possível, zoom, movimento reduzido, aba oculta, múltiplas alternâncias e perfil de CPU móvel. Verifique que o número de canvases não cresce, que apenas um simulador é montado e que menu e retorno ao topo ocultos não recebem foco.

## To Verify

- FPS, heap e custo de pintura em aparelhos móveis reais.
- Contraste automatizado dos estados translúcidos.
- Possíveis vazamentos após alternâncias prolongadas; não existe teste automatizado de memória.
