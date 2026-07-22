---
id: "frontend.user-flows"
title: "Fluxos do usuário e estado"
scope: "frontend"
kind: "flow-map"
status: "canonical"
canonical_for:
  - "sequência de estado, URL e atualização visual nas jornadas principais"
triggers:
  - "fluxo"
  - "URL direta"
  - "query string"
  - "seleção de teoria"
  - "filtros"
  - "toggle"
required_context:
  - "frontend.index"
conditional_context:
  - id: "domains.theory-catalog"
    condition: "Quando o fluxo envolve linhas de investigação."
related_context:
  - "frontend.interactive-systems"
evidence_sources:
  - "assets/js/theory-lab.js"
  - "Teorias/teorias.js"
  - "Mapa/mapa.js"
  - "assets/js/theory-model.js"
  - "assets/js/observer.js"
  - "assets/js/contact.js"
  - "assets/js/notable-figures-model.js"
  - "assets/js/notable-figures-preview.js"
  - "GrandesNomes/grandes-nomes.js"
  - "Constelacoes/constelacoes.js"
  - "assets/js/constellations-preview.js"
---

# Fluxos do usuário e estado

## Seleção de uma linha de investigação

```text
THEORIES
  -> filtro e busca no controlador da superfície
  -> teoria ativa localizada por theory-model.js
  -> cards, dossiê ou detalhe renderizados
  -> relações simétricas calculadas pelo modelo
  -> seleção explícita atualiza ?teoria=<slug> em Teorias e Mapa
  -> link permite alternar entre dossiê e mapa preservando o slug
```

Contratos: `id` é o vínculo interno; `slug` é o vínculo de URL. Uma relação declarada por qualquer ponta deve aparecer para ambas. Seleções explícitas atualizam a URL. No catálogo, porém, um filtro pode substituir internamente uma seleção que deixou de aparecer sem atualizar imediatamente `?teoria=`; essa é uma limitação confirmada, não o comportamento desejado.

## Ativação da Visão Estelar

```text
botão data-observer-toggle
  -> alterna estado em memória
  -> sincroniza aria-pressed, rótulo, status e data-mode do body
  -> inicia ou para o renderer compartilhado
  -> ao parar, cancela o frame e remove listeners de resize e visibilitychange
```

O estado não é persistido entre páginas ou recarregamentos.

O botão de ajuda adjacente abre um diálogo explicativo independente do toggle. O diálogo fecha por botão, `Escape` ou backdrop e devolve o foco ao controle que o abriu, sem ligar ou desligar o renderer.

## Seleção de um grande nome

```text
NOTABLE_FIGURES
  -> recorte da home ou busca e área na página completa
  -> perfil ativo resolvido por notable-figures-model.js
  -> card central e dossiê usam a mesma entrada
  -> fontes e IDs de teoria são resolvidos pelos catálogos centrais
  -> seleção explícita atualiza ?perfil=<slug>
  -> índice e links da home abrem a galeria preservando o slug
```

Arraste, botões anterior/próximo, clique em card, setas, Home e End compartilham o mesmo estado ativo. O filtro preserva o perfil quando ele continua visível e escolhe a primeira opção válida quando ele deixa de pertencer ao recorte. A pausa manual da rotação permanece durante reconstruções de busca ou filtro na mesma sessão da página.

## Identificação de uma constelação

```text
CONSTELLATIONS
  -> prévia da home, URL direta ou atlas completo
  -> busca e estação definem o conjunto visível
  -> uma entrada alimenta campo principal, detalhe e faixa de seleção
  -> hover e foco mostram temporariamente sua linha-guia
  -> mouse, teclado ou controles adjacentes mudam a seleção sem fixar implicitamente a guia
  -> toque ou caneta selecionam e fixam a guia por não oferecerem hover persistente
  -> campo, detalhe, opção ativa e estados ARIA usam a mesma entrada
  -> seleção explícita atualiza ?constelacao=<slug>
  -> botão da guia fixa ou libera explicitamente as linhas da seleção atual
```

No desktop, afastar o ponteiro ou o foco encerra a prévia e restaura a constelação selecionada com a visibilidade definida pelo estado explícito da guia. Em telas compactas, o conteúdo segue a ordem campo, catálogo e detalhe; a faixa de seletores usa rolagem horizontal, e tocar fixa a seleção e a mantém visível. No desktop, campo e catálogo formam a coluna esquerda e não mudam de posição quando o detalhe independente à direita cresce. A navegação da faixa usa foco móvel para oferecer um único ponto de tabulação, e as setas percorrem apenas o recorte resultante da busca e da estação. Se um filtro remover a seleção atual, a primeira entrada visível torna-se ativa e a URL permanece coerente. O SVG é decorativo, enquanto botões, texto, legenda e fontes fornecem o conteúdo equivalente.

## Contato

```text
formulário local
  -> validação nativa com mensagens acessíveis
  -> corpo da mensagem montado no navegador
  -> abertura de mailto:
  -> nenhum request HTTP ou persistência
```

## Validation

Teste URLs diretas válidas e inválidas de teoria, perfil e constelação, mudança de filtro que remove a seleção, busca sem resultado, navegação Teorias ↔ Mapa, seleções Home → Grandes Nomes e Home → Constelações, foco após re-render, toque, setas, `Home` e `End` no atlas, múltiplas alternâncias da Visão Estelar e formulário com campos inválidos.

## To Verify

- Sincronizar a URL quando filtros do catálogo trocarem automaticamente a teoria ativa.
- Estratégia de aliases ou redirects se um slug precisar mudar.
- Persistência de conjuntos de filtros em URL ainda não existe.
