---
id: "frontend.interactive-systems"
title: "Sistemas interativos"
scope: "frontend"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "ciclo de vida da Visão Estelar, atlas, treino, galeria, busca global, Rotas Guiadas, Laboratório, ressonância, filosofia, navegação e rolagem"
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
  - "busca global"
  - "Rotas Guiadas"
  - "simulador"
  - "modo treino"
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
  - "content/public/figures/albert-einstein.json"
  - "Constelacoes/constelacoes.js"
  - "Constelacoes/whale-shark-easter-egg.js"
  - "Constelacoes/constelacoes.css"
  - "assets/js/constellation-chart.js"
  - "content/public/constellations/orion.json"
  - "assets/js/global-search.js"
  - "content/public/taxonomies/experiments.json"
  - "Laboratorio/laboratorio.js"
  - "Laboratorio/experimento.js"
  - "Laboratorio/simulations/light-cone.js"
  - "Laboratorio/simulations/zero-epsilon.js"
  - "Laboratorio/simulations/finite-recurrence.js"
  - "Laboratorio/simulations/astrobiology.js"
  - "content/public/paths/perder-para-evidencia.json"
  - "assets/js/learning-paths-model.js"
  - "Rotas/rotas.js"
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

A comparação recebe duas trajetórias por `?comparar=<slug>,<slug>`, usa os mesmos perfis e mostra contribuições e relações editoriais lado a lado sem produzir uma classificação. As quatro trilhas temáticas usam `?trilha=<id>` e resolvem seus passos contra o catálogo; a linha do tempo reúne métodos e descobertas, pode ser filtrada por observar, medir, modelar e testar e não altera o perfil ativo. Comparação, trilhas e linha do tempo não duplicam dossiês nem transformam ordem cronológica em hierarquia de importância.

## Atlas de Constelações

`Constelacoes/constelacoes.js` organiza a projeção gerada de `content/public/constellations/` em uma superfície mestre–detalhe e usa o mesmo renderizador SVG da prévia da home. Uma constelação ocupa o campo principal; a faixa horizontal mantém o catálogo navegável sem repetir todos os painéis completos. Busca textual e filtros sazonais produzem o conjunto visível, preservam a seleção quando possível e escolhem uma opção válida quando ela deixa o recorte. No desktop, campo e catálogo formam a coluna principal à esquerda, enquanto o detalhe ocupa uma coluna independente à direita; assim, diferenças no tamanho do texto não deslocam o catálogo. Em telas estreitas, a ordem natural é campo, catálogo e detalhe.

As estrelas permanecem visíveis sem depender das linhas. Hover ou foco sobre uma opção pré-visualizam temporariamente sua guia no campo principal. Seleções por mouse ou teclado — inclusive clique, controles anterior/próximo, opção relacionada e foco móvel da faixa — mudam a constelação ativa e atualizam `?constelacao=<slug>` sem fixar implicitamente as linhas; ao terminar a prévia, a visibilidade volta ao estado explícito da guia. Toque ou caneta fixam a guia porque esses dispositivos não oferecem hover persistente. O botão da guia é o controle explícito para fixar ou liberar as linhas da seleção atual. A faixa usa foco móvel: setas esquerda e direita, `Home` e `End` deslocam a opção ativa sem transformar todas as entradas em uma sequência redundante de tabulação, e a entrada selecionada é mantida visível.

O atlas é educativo e não calcula local, data, hora ou projeção do céu em tempo real. Cada campo mantém uma forma relativa simplificada, mas a posição entre campos é composição de interface. As linhas são guias convencionais: a IAU define 88 regiões e seus limites, não uma figura de palitos oficial. Asterismos como Três Marias e Bule de Chá permanecem identificados como padrões internos, não como constelações independentes.

Separadamente do catálogo científico, `Constelacoes/whale-shark-easter-egg.js` injeta um único SVG de tubarão-baleia no botão acessível da área superior direita. A figura é uma ilustração estelar independente: não pertence a `CONSTELLATIONS`, não altera a contagem, a busca, os filtros, o detalhe ou `?constelacao=`. O SVG permanece oculto da árvore de acessibilidade porque o botão fornece o nome da ação.

Entrada do ponteiro sem toque, foco, clique ou toque iniciam uma interação finita. Corpo, cauda, nadadeiras e pontos executam uma única sequência; o quadro final usa a transformação original, e `animationend` ou `animationcancel` remove o estado temporário. Hover e foco visível mantêm brilho e linhas enquanto a interação correspondente continuar, mas não criam movimento contínuo. A área retangular do botão e o SVG não recebem eventos diretamente; somente os paths transparentes que acompanham a silhueta funcionam como hit-area, evitando bloquear os controles vizinhos.

Com `prefers-reduced-motion`, o módulo marca o perfil reduzido antes da ativação e o CSS preserva apenas a revelação visual, sem deslocar corpo, cauda ou nadadeiras. A sequência reduzida ainda termina e limpa o estado temporário.

Não existe loop contínuo, canvas ou biblioteca para o atlas. A interação substitui o campo principal, atualiza detalhes textuais e alterna estados de SVG; não há simulação física, rastreamento do ponteiro ou animação temporal do céu.

### Modo treino do Atlas

`?modo=treino` abre uma sessão de oito rodadas sobre as mesmas 12 entradas do atlas. Cada rodada preserva as estrelas, oculta nomes e linhas e oferece quatro respostas; depois da escolha, a interface revela o padrão, informa o resultado e permite avançar. Pontuação, rodada e feedback são anunciados por uma região viva, e o foco segue para a próxima ação relevante.

O treino não persiste pontuação, não cria perfil de usuário e não substitui observação real. Ao sair, o controlador restaura o atlas normal e sua seleção. Movimento reduzido mantém a revelação e remove transições não essenciais.

## Busca global

`global-search.js` injeta um único botão na navegação e um `dialog` sob demanda. A abertura por botão ou `Ctrl+K`/`Command+K` importa em paralelo teorias, 22 perfis, 12 constelações, nove experiências, quatro Rotas Guiadas e contribuições publicadas. O índice permanece em memória apenas durante a página; títulos recebem maior peso, todos os termos precisam aparecer no texto normalizado e no máximo 12 resultados são mostrados. Com consulta vazia, até oito Rotas Guiadas e experiências são sugeridas.

Setas percorrem os resultados, `Escape` fecha o diálogo pelo comportamento nativo e o foco retorna ao gatilho. A busca é client-side: não consulta servidor, não registra histórico e não encontra texto livre fora dos seis catálogos.

## Rotas Guiadas

`content/public/paths/` declara os percursos e suas etapas. O compilador gera a projeção consumida por `learning-paths-model.js`, que resolve cada referência para um perfil, uma linha de investigação ou uma experiência e descarta referências inexistentes; `Rotas/rotas.js` apresenta catálogo, justificativa da passagem, progresso e controles anterior/próximo. A URL `?rota=<slug>&etapa=<n>` permite compartilhar a posição atual.

O avanço representa navegação, não conclusão certificada. Não há conta, persistência ou sincronização entre páginas: abrir o conteúdo de uma etapa e voltar não marca automaticamente leitura. As rotas organizam níveis de evidência distintos sem declarar que um perfil histórico valida uma linha autoral.

## Laboratório

`content/public/experiments/` é a fonte canônica das experiências e `content/public/taxonomies/experiments.json` governa suas naturezas. Home, Arquivo, Laboratório, busca, métricas e Rotas Guiadas consomem projeções geradas desse catálogo. `Laboratorio/experimento.js` aceita `?experimento=<slug>`, apresenta pergunta, tecnologia, limite e linhas autorais relacionadas e importa somente o simulador pedido. Uma seleção inválida recebe estado de erro e retorno ao índice; `pagehide` executa a limpeza fornecida pelo módulo.

Os quatro simuladores e seus limites são:

- **Cone de luz e referenciais:** transformação de Lorentz em uma dimensão espacial, unidades com `c = 1` e referenciais inerciais; classifica a separação causal e preserva o intervalo, sem gravidade ou aceleração.
- **Zero vs. Epsilon:** heurística transparente que combina chance, benefício, custo, dano, aprendizado e reversibilidade em escalas escolhidas pelo visitante. Tetos separados de custo e dano residual funcionam como critérios explícitos de parada: não alteram o saldo e, quando excedidos, impedem uma leitura favorável; o modelo não é previsão nem aconselhamento profissional.
- **Modelo finito de recorrência:** sistema determinístico `próximo = (a × estado + b) mod N`, com transiente e ciclo; repetição no modelo finito não demonstra recorrência cosmológica nem visita a todos os estados.
- **Astrobiologia probabilística:** cenário de potências de dez para mundos candidatos, abiogênese, complexidade, inteligência tecnológica, detectabilidade e sobreposição temporal. As cinco etapas são probabilidades condicionais multiplicadas pela regra da cadeia; a chance de ao menos um sinal assume candidatos independentes com a mesma probabilidade combinada. O modelo não estima frequências reais.

Controles, fórmulas, hipóteses e resultados devem permanecer visíveis. Um simulador didático demonstra consequências de premissas escolhidas; não converte o resultado em evidência para as linhas relacionadas.

## Navegação e rolagem

`navigation.js` controla menu, seção ativa, cabeçalho e retorno ao topo. `smooth-scroll.js` centraliza âncoras, compensa o cabeçalho, permite cancelamento por interação e cai para rolagem imediata com movimento reduzido.

## Filosofia e contato

`philosophy.js` controla tabs e devolve conteúdo associado. `contact.js` valida campos e prepara uma mensagem via `mailto:`; não existe envio para backend. Se o e-mail não estiver configurado, usa clipboard ou download local como fallback.

## Validation

Teste inicialização única, alternâncias repetidas, visibilidade da aba, redução de movimento, teclado, toque, busca global, URLs de comparação e trilha, oito rodadas do Atlas, quatro Rotas Guiadas, os extremos dos controles dos quatro simuladores, áudio desligado e console sem erros.

## To Verify

- Métricas reais de FPS e memória em dispositivos móveis.
- Necessidade de pausar a Visão Estelar quando a seção de origem estiver fora da viewport.
- Benefício de adiar a criação das estrelas e a alocação do canvas até a primeira ativação.
- Necessidade de um fallback de visibilidade para a ressonância em navegadores sem `IntersectionObserver`.
