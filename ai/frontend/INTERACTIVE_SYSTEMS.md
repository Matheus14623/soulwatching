---
id: "frontend.interactive-systems"
title: "Sistemas interativos"
scope: "frontend"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "ciclo de vida da Visão Estelar, atlas de constelações, galeria, ressonância, filosofia, navegação e rolagem"
triggers:
  - "Visão Estelar"
  - "observer"
  - "canvas"
  - "ressonância"
  - "áudio"
  - "smooth scroll"
  - "efeito cósmico"
  - "carrossel"
  - "Grandes Nomes"
  - "Constelações"
required_context:
  - "frontend.index"
conditional_context:
  - id: "quality.performance-accessibility"
    condition: "Sempre que movimento, canvas, áudio ou interação por teclado for alterado."
related_context:
  - "frontend.design-accessibility"
  - "frontend.user-flows"
evidence_sources:
  - "assets/js/observer.js"
  - "assets/js/stellar-vision-info.js"
  - "assets/js/resonance.js"
  - "assets/js/philosophy.js"
  - "assets/js/navigation.js"
  - "assets/js/smooth-scroll.js"
  - "assets/js/contact.js"
  - "GrandesNomes/grandes-nomes.js"
  - "Constelacoes/constelacoes.js"
  - "assets/js/constellation-chart.js"
  - "assets/data/constellations.js"
  - "assets/vendor/swiper/LICENSE"
  - "index.html"
---

# Sistemas interativos

## Visão Estelar

A Visão Estelar começa desligada. Durante o boot, `observer.js` cria ou reutiliza um único overlay ainda oculto, instancia `StellarDriftRenderer` e prepara o perfil de qualidade e o conjunto de estrelas. A ativação torna o overlay visível e inicia o loop, ou desenha o campo estático quando há preferência por movimento reduzido.

Ao desligar, o renderer cancela o frame e remove seus listeners de `resize` e `visibilitychange`. Os controles e o listener da preferência de movimento permanecem durante o ciclo de vida da página. Quando o modo está ativo, o loop pausa se a aba fica oculta.

O controle de ajuda ao lado do toggle abre um `dialog` nativo em desktop e mobile sem alterar o estado da Visão Estelar. `stellar-vision-info.js` controla abertura, fechamento por botão, `Escape` ou backdrop e devolução de foco. O texto público separa o movimento próprio medido por astrometria da representação acelerada do site: as estrelas do canvas possuem posições e velocidades visuais geradas localmente e não reproduzem trajetórias do Gaia ou Hipparcos.

Contratos:

- Não criar overlays ou canvases duplicados após alternâncias repetidas.
- Manter o estado desligado por padrão.
- Preservar o perfil leve em telas compactas e o campo estático com movimento reduzido.
- Efeitos futuros precisam ter função conceitual, custo proporcional, ciclo de vida controlado e fallback acessível.
- O efeito visual de buraco negro foi rejeitado pelo usuário e não deve ser reintroduzido. Menções conceituais no catálogo não autorizam um efeito visual.

## Ressonância

`resonance.js` mantém seis cordas em Canvas 2D. O DPR é limitado e movimento reduzido usa desenho estático. Quando `IntersectionObserver` está disponível, o loop pausa fora da viewport; sem essa API, o fallback atual mantém o canvas ativo. O áudio só inicia depois de ação explícita; os seis botões fornecem alternativa ao ponteiro.

## Galeria de Grandes Nomes

`GrandesNomes/grandes-nomes.js` constrói os cards e dossiês a partir do catálogo compartilhado e mantém uma única instância de Swiper. O perfil central pode mudar por arraste, clique, botões, teclado, índice ou `?perfil=<slug>`. Busca e filtros destroem a instância anterior antes de reconstruir o conjunto visível.

A rotação usa intervalo de 30 segundos e pode ser pausada manualmente. Ela também para durante foco, ponteiro, arraste, aba oculta ou galeria fora da viewport. Em ponteiros de alta precisão, o arraste usa limiar menor, resposta levemente ampliada e encaixe mais rápido; o arraste nativo dos retratos fica desativado para não disputar o gesto com o carrossel. A configuração tátil permanece independente. Em movimento reduzido, autoplay e coverflow são desativados, a velocidade cai para zero e o conteúdo permanece navegável. Se a biblioteca não carregar, o fallback estático preserva cards, detalhe e botões.

## Atlas de Constelações

`Constelacoes/constelacoes.js` organiza 12 entradas de `assets/data/constellations.js` em uma superfície mestre–detalhe e usa o mesmo renderizador SVG da prévia da home. Uma constelação ocupa o campo principal; a faixa horizontal mantém o catálogo navegável sem repetir 12 painéis completos. Busca textual e filtros sazonais produzem o conjunto visível, preservam a seleção quando possível e escolhem uma opção válida quando ela deixa o recorte. No desktop, campo e catálogo formam a coluna principal à esquerda, enquanto o detalhe ocupa uma coluna independente à direita; assim, diferenças no tamanho do texto não deslocam o catálogo. Em telas estreitas, a ordem natural é campo, catálogo e detalhe.

As estrelas permanecem visíveis sem depender das linhas. Hover ou foco sobre uma opção pré-visualizam temporariamente sua guia no campo principal. Seleções por mouse ou teclado — inclusive clique, controles anterior/próximo, opção relacionada e foco móvel da faixa — mudam a constelação ativa e atualizam `?constelacao=<slug>` sem fixar implicitamente as linhas; ao terminar a prévia, a visibilidade volta ao estado explícito da guia. Toque ou caneta fixam a guia porque esses dispositivos não oferecem hover persistente. O botão da guia é o controle explícito para fixar ou liberar as linhas da seleção atual. A faixa usa foco móvel: setas esquerda e direita, `Home` e `End` deslocam a opção ativa sem transformar todas as entradas em uma sequência redundante de tabulação, e a entrada selecionada é mantida visível.

O atlas é educativo e não calcula local, data, hora ou projeção do céu em tempo real. Cada campo mantém uma forma relativa simplificada, mas a posição entre campos é composição de interface. As linhas são guias convencionais: a IAU define 88 regiões e seus limites, não uma figura de palitos oficial. Asterismos como Três Marias e Bule de Chá permanecem identificados como padrões internos, não como constelações independentes.

Não existe loop contínuo, canvas ou biblioteca para o atlas. A interação substitui o campo principal, atualiza detalhes textuais e alterna estados de SVG; não há simulação física, rastreamento do ponteiro ou animação temporal do céu.

## Navegação e rolagem

`navigation.js` controla menu, seção ativa, cabeçalho e retorno ao topo. `smooth-scroll.js` centraliza âncoras, compensa o cabeçalho, permite cancelamento por interação e cai para rolagem imediata com movimento reduzido.

## Filosofia e contato

`philosophy.js` controla tabs e devolve conteúdo associado. `contact.js` valida campos e prepara uma mensagem via `mailto:`; não existe envio para backend. Se o e-mail não estiver configurado, usa clipboard ou download local como fallback.

## Validation

Teste inicialização única, alternâncias repetidas, visibilidade da aba, redução de movimento, teclado, toque, seleção direta por slug, áudio desligado e console sem erros.

## To Verify

- Métricas reais de FPS e memória em dispositivos móveis.
- Necessidade de pausar a Visão Estelar quando a seção de origem estiver fora da viewport.
- Benefício de adiar a criação das estrelas e a alocação do canvas até a primeira ativação.
- Necessidade de um fallback de visibilidade para a ressonância em navegadores sem `IntersectionObserver`.
