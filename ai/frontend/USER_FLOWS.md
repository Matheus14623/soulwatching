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

## Contato

```text
formulário local
  -> validação nativa com mensagens acessíveis
  -> corpo da mensagem montado no navegador
  -> abertura de mailto:
  -> nenhum request HTTP ou persistência
```

## Validation

Teste uma URL direta válida e inválida, mudança de filtro que remove a seleção, navegação Teorias ↔ Mapa, foco após re-render, múltiplas alternâncias da Visão Estelar e formulário com campos inválidos.

## To Verify

- Sincronizar a URL quando filtros do catálogo trocarem automaticamente a teoria ativa.
- Estratégia de aliases ou redirects se um slug precisar mudar.
- Persistência de conjuntos de filtros em URL ainda não existe.
