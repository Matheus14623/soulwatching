---
id: "frontend.interactive-systems"
title: "Sistemas interativos"
scope: "frontend"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "ciclo de vida da Visão Estelar, galeria, ressonância, filosofia, navegação e rolagem"
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
  - "assets/js/resonance.js"
  - "assets/js/philosophy.js"
  - "assets/js/navigation.js"
  - "assets/js/smooth-scroll.js"
  - "assets/js/contact.js"
  - "GrandesNomes/grandes-nomes.js"
  - "assets/vendor/swiper/LICENSE"
  - "index.html"
---

# Sistemas interativos

## Visão Estelar

A Visão Estelar começa desligada. Durante o boot, `observer.js` cria ou reutiliza um único overlay ainda oculto, instancia `StellarDriftRenderer` e prepara o perfil de qualidade e o conjunto de estrelas. A ativação torna o overlay visível e inicia o loop, ou desenha o campo estático quando há preferência por movimento reduzido.

Ao desligar, o renderer cancela o frame e remove seus listeners de `resize` e `visibilitychange`. Os controles e o listener da preferência de movimento permanecem durante o ciclo de vida da página. Quando o modo está ativo, o loop pausa se a aba fica oculta.

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

A rotação usa intervalo de 30 segundos e pode ser pausada manualmente. Ela também para durante foco, ponteiro, arraste, aba oculta ou galeria fora da viewport. Em movimento reduzido, autoplay e coverflow são desativados, a velocidade cai para zero e o conteúdo permanece navegável. Se a biblioteca não carregar, o fallback estático preserva cards, detalhe e botões.

## Navegação e rolagem

`navigation.js` controla menu, seção ativa, cabeçalho e retorno ao topo. `smooth-scroll.js` centraliza âncoras, compensa o cabeçalho, permite cancelamento por interação e cai para rolagem imediata com movimento reduzido.

## Filosofia e contato

`philosophy.js` controla tabs e devolve conteúdo associado. `contact.js` valida campos e prepara uma mensagem via `mailto:`; não existe envio para backend. Se o e-mail não estiver configurado, usa clipboard ou download local como fallback.

## Validation

Teste inicialização única, alternâncias repetidas, visibilidade da aba, redução de movimento, teclado, áudio desligado e console sem erros.

## To Verify

- Métricas reais de FPS e memória em dispositivos móveis.
- Necessidade de pausar a Visão Estelar quando a seção de origem estiver fora da viewport.
- Benefício de adiar a criação das estrelas e a alocação do canvas até a primeira ativação.
- Necessidade de um fallback de visibilidade para a ressonância em navegadores sem `IntersectionObserver`.
