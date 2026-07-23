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
  - "comparação"
  - "busca global"
  - "rota guiada"
  - "modo treino"
  - "experimento"
  - "contribuição"
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
  - "assets/js/global-search.js"
  - "Rotas/rotas.js"
  - "Laboratorio/experimento.js"
  - "Contribuicoes/contribuicoes.js"
---

# Fluxos do usuário e estado

## Seleção de uma linha de investigação

```text
THEORIES
  -> filtro e busca no controlador da superfície
  -> teoria ativa localizada por theory-model.js
  -> cards, dossiê ou detalhe renderizados
  -> relações tipadas e simétricas calculadas pelo modelo
  -> relações inversas com perfis derivadas de notable-figures.js
  -> seleção explícita atualiza ?teoria=<slug> em Teorias e Mapa
  -> link permite alternar entre dossiê e mapa preservando o slug
```

Contratos: `id` é o vínculo interno; `slug` é o vínculo de URL. Uma relação tipada liga um par no catálogo central e deve aparecer para ambas as pontas com a mesma justificativa. Seleções explícitas atualizam a URL. No catálogo, porém, um filtro pode substituir internamente uma seleção que deixou de aparecer sem atualizar imediatamente `?teoria=`; essa é uma limitação confirmada, não o comportamento desejado.

`?comparar=<slug>,<slug>` abre a comparação compartilhável de duas entradas. Ela mostra os mesmos critérios editoriais, eventual relação entre as linhas e perfis históricos associados; não cria relação nem nota de maturidade. `?teoria=<slug>&versao=<versão>` identifica a revisão pública atual. Se a URL pedir uma versão anterior, a interface informa que o conteúdo histórico não está preservado e mostra a versão atual; o parâmetro não funciona como arquivo de snapshots.

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

Comparação e trilhas possuem estados independentes do carrossel. `?comparar=<slug>,<slug>` resolve dois dos 22 perfis e atualiza a comparação; `?trilha=<id>` escolhe uma das quatro sequências temáticas. Abrir um passo da trilha leva o respectivo perfil para a galeria. A linha do tempo filtra eventos por método, sem alterar esses parâmetros.

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

## Treino de constelações

```text
?modo=treino
  -> cria sessão local de oito rodadas
  -> escolhe uma constelação do catálogo e três alternativas
  -> mantém estrelas e oculta linhas e nomes
  -> resposta revela padrão, nome e feedback imediato
  -> próxima ação avança rodada e atualiza pontuação anunciada
  -> encerramento permite repetir ou voltar ao atlas
```

O treino não persiste progresso. A URL representa apenas que o modo está ativo, e sair dele restaura a navegação normal do atlas.

## Busca global

```text
botão Buscar ou Ctrl/Command + K
  -> abre diálogo e carrega seis catálogos sob demanda
  -> consulta normalizada classifica título e texto
  -> até 12 links atualizam a cada entrada
  -> setas percorrem resultados
  -> Escape, botão ou backdrop fecham e devolvem foco
```

Sem texto, a busca sugere até oito Rotas Guiadas e experiências. Ela não consulta o conteúdo completo dos HTML nem mantém histórico entre páginas.

## Rota Guiada

```text
LEARNING_PATHS
  -> escolha de uma das quatro rotas
  -> cinco referências resolvidas nos catálogos centrais
  -> etapa mostra contexto, motivo da passagem e link de origem
  -> anterior, próxima ou índice alteram a etapa
  -> ?rota=<slug>&etapa=<n> preserva a posição compartilhável
```

O progresso não é persistido e abrir o conteúdo completo troca de página. A rota orienta leitura; não certifica conclusão nem mistura o nível de evidência de perfil, teoria e experimento.

## Experimento do Laboratório

```text
?experimento=<slug>
  -> entrada localizada em EXPERIMENTS
  -> metadados, pergunta, limite e teorias relacionadas renderizados
  -> moduleKey escolhe um dos quatro imports dinâmicos
  -> mountSimulation monta controles e resultado
  -> pagehide chama a limpeza devolvida pelo módulo
```

Slugs sem simulador carregável mostram estado de erro e retorno ao Laboratório. Visualizações e treino que vivem em outras páginas usam diretamente o `href` do catálogo, sem duplicação no executor.

## Proposta de contribuição externa

```text
formulário local
  -> validação de contato, crédito, formato, título, resumo, fontes e permissão
  -> corpo estruturado montado no navegador
  -> abertura de mailto: para revisão e envio pelo visitante
  -> nenhuma gravação, upload, conta ou publicação automática
```

O catálogo público de contribuições permanece vazio até existir autorização e revisão editorial. Enviar a proposta não garante publicação nem transfere autoria.

## Contato

```text
formulário local
  -> validação nativa com mensagens acessíveis
  -> corpo da mensagem montado no navegador
  -> abertura de mailto:
  -> nenhum request HTTP ou persistência
```

## Validation

Teste URLs diretas válidas e inválidas de teoria, versão, comparação, perfil, trilha, constelação, treino, rota, etapa e experimento. Cubra mudança de filtro que remove a seleção, busca global sem resultado, navegação Teorias ↔ Mapa, foco após re-render, toque, setas, `Home` e `End`, oito rodadas do treino, limites dos quatro simuladores, múltiplas alternâncias da Visão Estelar e os dois formulários com campos inválidos.

## To Verify

- Sincronizar a URL quando filtros do catálogo trocarem automaticamente a teoria ativa.
- Estratégia de aliases ou redirects se um slug precisar mudar.
- Persistência de conjuntos de filtros em URL ainda não existe.
