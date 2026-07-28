# Documentação Geral do Projeto — Matheus Camargo

> Guia oficial da versão `2.3.0` do **Observatório de Ideias**  
> Auditoria realizada em 15 de julho de 2026  
> Escopo: arquivos-fonte, configurações, conteúdo, ativos e comportamento renderizado em desktop e mobile

## Como ler este documento

Esta documentação separa três tipos de informação:

- **Implementado:** comportamento ou regra diretamente confirmado no código ou na interface renderizada.
- **Inferido:** interpretação sustentada por padrões recorrentes do projeto, mas não declarada como regra em um arquivo de configuração.
- **Recomendação futura:** melhoria que ainda não existe. Não deve ser descrita como funcionalidade atual.

O projeto passou pelo verificador próprio (`npm run verify`, executado diretamente com o runtime Node disponível) e todos os módulos JavaScript passaram por validação de sintaxe. Também não foram observados erros ou avisos no console durante os testes da home e da página de teorias. Esses resultados não equivalem a uma suíte completa de testes, auditoria WCAG ou teste de desempenho automatizado.

---

## 1. Visão Geral do Projeto

O projeto é um site estático, responsivo e interativo chamado **Observatório de Ideias**, ligado a Matheus Camargo de Alencar. A definição presente em `package.json` e `README.md` o descreve como um espaço filosófico para teorias em desenvolvimento, hipóteses, mapas conceituais e experimentos visuais. A implementação confirma essa proposta.

O site combina quatro funções:

1. **Arquivo intelectual:** centraliza dez teorias em diferentes estados de maturação.
2. **Laboratório conceitual:** expõe hipótese central, perguntas abertas, conceitos relacionados e pontos ainda frágeis.
3. **Interface de exploração:** transforma relações entre ideias em cards, filtros, dossiês e um mapa de constelação.
4. **Presença pessoal e profissional:** apresenta Matheus como origem humana do campo, desenvolvedor full-stack e ponto de contato, sem transformar a página em currículo tradicional.

O projeto **não é somente um portfólio**: não existe uma grade convencional de cases, clientes, métricas ou tecnologias. Também **não é um diário**: os textos públicos não seguem uma cronologia íntima e a própria home declara que o espaço “não é um caderno íntimo nem um monumento pessoal”. Por fim, **não deve ser uma página egocêntrica**: Matheus é apresentado como “ponto humano de onde a observação parte”, não como centro do sistema.

A experiência geral parte de uma abertura cósmica e progressivamente desce de escala:

- hero e sistema orbital;
- definição do campo de investigação;
- catálogo de teorias;
- mapa de relações;
- estrutura editorial futura;
- bússola filosófica;
- experimento sensorial;
- linha de desenvolvimento;
- apresentação do autor;
- contato profissional.

**Impressão pretendida, inferida da implementação:** contemplação, curiosidade, rigor provisório e sensação de navegação por um sistema vivo. O visual é escuro, espacial e técnico; a escrita procura preservar assombro sem esconder incerteza.

---

## 2. Identidade Conceitual

### 2.1 Conceito central

O conceito que organiza o site é o de **observatório intelectual**. Ideias não são expostas como peças concluídas, mas como objetos em órbita: podem ser observadas, aproximadas, relacionadas, revisadas e amadurecidas.

A metáfora cósmica não é apenas decorativa. Ela estrutura o vocabulário e a interface:

- “observatório” nomeia o espaço;
- “campo de investigação” define sua função;
- “órbita” expressa relação e movimento;
- “constelação” expressa conexões entre teorias;
- “arquivo” expressa preservação e rastreabilidade;
- “maturação” expressa desenvolvimento epistemológico;
- “coordenadas” nomeiam contatos externos;
- “sinal” nomeia o envio de mensagem;
- “deriva estelar” nomeia a visualização alternativa.

### 2.2 Princípios conceituais confirmados

- As teorias devem permanecer identificadas como hipóteses, rascunhos, fronteiras ou linhas em refinamento.
- O valor da interface está em registrar premissa, limite, relação e próximo passo, não em dramatizar certezas.
- Filosofia, física, programação e cosmologia aparecem como lentes relacionadas, mas não intercambiáveis.
- A identidade profissional de Matheus complementa o arquivo; ela não substitui o conteúdo intelectual.
- A escala cósmica deve ampliar a reflexão, não legitimar afirmações não demonstradas.

### 2.3 Regras para orientar mudanças futuras

Toda nova seção deve responder positivamente a pelo menos uma destas perguntas:

- Organiza uma ideia, teoria, pergunta, registro ou relação?
- Ajuda o leitor a compreender o estágio de um pensamento?
- Torna visível uma conexão conceitual relevante?
- Acrescenta contexto verificável sobre Matheus ou sua prática técnica?
- Cria um instrumento útil de exploração, sem competir com o conteúdo?

Não adicionar seções apenas para preencher espaço, repetir linguagem de portfólio ou aumentar espetáculo visual. Um efeito cósmico sem função semântica enfraquece o conceito.

### 2.4 O que deve ser evitado

- linguagem de autopromoção grandiosa;
- afirmações como “teoria validada”, “descoberta revolucionária” ou “prova definitiva” sem sustentação;
- publicação direta dos rascunhos brutos da pasta `Teorias/`;
- linguagem de diário, confissão cotidiana ou cronologia pessoal sem relação com o arquivo intelectual;
- transformar metáforas de software em explicações físicas literais;
- tratar toda pergunta como teoria formal;
- usar “universo”, “quântico” ou “dimensão” apenas como ornamentação verbal.

---

## 3. Público e Uso Esperado

O site atende públicos diferentes por meio de camadas complementares:

| Público | Necessidade atendida | Área principal |
|---|---|---|
| Leitores interessados nas ideias de Matheus | Entender hipóteses, perguntas e conexões | Teorias e mapa |
| Pessoas interessadas em filosofia e cosmologia | Explorar reflexões com marcação de incerteza | Teorias, arquivo e bússola filosófica |
| Recrutadores e contatos profissionais | Identificar autoria, perfil técnico e canais de contato | Sobre, contato e footer |
| Desenvolvedores e colaboradores | Entender organização, interfaces e manutenção | Estrutura técnica e documentação |
| Futuros leitores de ensaios | Encontrar uma estrutura editorial organizada | Arquivo de artigos, ainda sem publicações |
| O próprio autor | Preservar versões, relações e lacunas do pensamento | Dados de teorias e material bruto |

O equilíbrio atual funciona da seguinte forma:

- **Intelectual primeiro:** teorias e mapa ocupam o centro da navegação.
- **Pessoal contextual:** a fotografia e os textos explicam a origem humana do projeto.
- **Profissional no fechamento:** contatos, GitHub e LinkedIn aparecem no fim, como saídas do observatório.
- **Portfolio indireto:** a própria qualidade técnica e visual do site funciona como demonstração de trabalho, mas não há catálogo de projetos implementado.

---

## 4. Tom de Voz e Escrita

### 4.1 Características do tom atual

O texto público é predominantemente:

- reflexivo;
- filosófico sem abandonar clareza;
- humano e autoral;
- técnico quando descreve mecanismos;
- levemente poético;
- cauteloso sobre o grau de certeza;
- contrário a linguagem corporativa e motivacional genérica.

O padrão mais forte é combinar uma imagem conceitual curta com uma explicação concreta. Exemplo existente: “Uma constelação não explica o céu. Ela ajuda a navegar por ele”, seguido pela explicação de que conexões não são provas, mas trilhas conceituais.

### 4.2 Vocabulário recomendado

- Teorias em desenvolvimento
- Hipóteses em expansão
- Arquivo de ideias
- Campo de investigação
- Linhas de pensamento
- Registros teóricos
- Constelação conceitual
- Perguntas abertas
- Estado de maturação
- Próximo refinamento
- Limites da hipótese
- Conceitos conectados

### 4.3 Construções recomendadas

> “Esta hipótese investiga se…”

> “O modelo parte da premissa de…, mas ainda precisa distinguir…”

> “A relação com a teoria T-03 é conceitual; não constitui evidência.”

> “Este registro preserva uma intuição ainda sem formalização matemática.”

> “O próximo refinamento é separar metáfora, hipótese física e limite observacional.”

### 4.4 Construções a evitar

> “Bem-vindo ao meu diário.”

> “Sou um visionário apaixonado por transformar o futuro.”

> “Esta teoria prova definitivamente…”

> “A física moderna valida exatamente a minha ideia.”

> “Conheça minha jornada incrível.”

> “Esta seção foi criada para mostrar…”

### 4.5 Regras editoriais

1. Preferir frases afirmativas e específicas a adjetivos vagos.
2. Usar “hipótese”, “especulação”, “metáfora” e “ciência estabelecida” com significados distintos.
3. Não apresentar porcentagens, datas cosmológicas ou consensos científicos sem fonte revisável.
4. Não usar elogios produzidos por IA como descrição da autoria.
5. Preservar português brasileiro na interface pública.
6. Manter títulos em formato de frase, não em caixa alta; o CSS cuida da caixa alta apenas em kickers e rótulos.
7. Evitar excesso de analogias de programação. Os próprios rascunhos registram que elas podem ser úteis, mas não devem traduzir todo conceito.
8. Explicar primeiro o conteúdo; usar a metáfora cósmica como segunda camada.

### 4.6 Inconsistências editoriais atuais

Estas ocorrências existem e devem ser tratadas como conteúdo provisório, não como padrão:

- “ta meio bugado ainda rsrs” na seção de ressonância destoa do tom profissional.
- vários cards exibem apenas “Em Breve!”, sem contexto editorial;
- a seção “Sobre” alterna terceira pessoa com “Eu uso” no mesmo parágrafo;
- os rascunhos brutos contêm elogios exagerados e afirmações científicas categóricas que não foram mantidas na interface curada.

---

## 5. Estrutura Geral do Site

### 5.1 Header e navegação

**Implementado:** header fixo com marca orbital, nome “Observatório”, subtítulo, navegação principal, indicador de estado e selo Beta. Após 24 px de rolagem, recebe fundo translúcido, borda inferior e `backdrop-filter: blur(18px)`.

No desktop, a navegação fica centralizada. Em larguras de até 1080 px, transforma-se em menu acionado por botão. O menu fecha ao selecionar um link ou pressionar `Escape`. Não há fechamento por clique fora, aprisionamento de foco ou devolução explícita de foco.

Na home, os links são: Teorias, Mapa, Arquivo, Filosofia, Sobre e Contato. “Teorias” leva à página dedicada; os demais são âncoras locais. A página dedicada usa Início, Teorias, Fontes, Mapa e Contato.

### 5.2 Home / Hero (`#topo`)

**Função:** estabelecer a identidade do observatório e oferecer três entradas: teorias, mapa e visão estelar.

**Composição:** imagem de janela chuvosa em baixa opacidade, vinheta, linhas de varredura, grade, título serifado, texto introdutório, três CTAs e sistema solar feito em CSS.

**Comportamento:** ocupa pelo menos `100svh` no desktop. No teste mobile de 390 × 844 px, a altura renderizada foi aproximadamente 1171 px por causa do empilhamento do texto e do sistema orbital.

**Atualização:** preservar um título curto, uma explicação concreta e no máximo três ações primárias. Não transformar o hero em biografia ou lista de tecnologias.

### 5.3 Campo de investigação (`#campo`)

**Função:** explicar o que o observatório é e qual o papel de Matheus.

**Composição:** grande título à esquerda; painel translúcido à direita com texto, fotografia e declaração antiegocêntrica.

**Atualização:** manter esta seção como declaração de método. Biografia detalhada pertence a “Sobre”; contatos pertencem ao fechamento.

### 5.4 Teorias na home (`#teorias`)

**Função:** oferecer um recorte do arquivo completo.

**Composição:** cabeçalho, indicadores numéricos, busca, filtros, grade limitada a seis teorias e dossiê da teoria ativa.

**Comportamento:** os dados vêm de `assets/data/theories.js`. A home filtra todas as dez entradas, mas aplica `data-theory-limit="6"`; portanto, mostra no máximo as seis primeiras correspondências. Busca e filtros são combinados. Selecionar um card atualiza o dossiê e o mapa.

**Atualização:** a ordem do array define quais teorias têm prioridade na home. A inserção de uma nova teoria no fim não garante que ela apareça no recorte inicial.

### 5.5 Mapa de ideias (`#mapa`)

**Função:** mostrar relações entre teorias como constelação.

**Composição:** contêiner com órbitas, núcleo central, linhas SVG e dez botões posicionados por porcentagens.

**Comportamento:** as linhas são geradas a partir de `connections`; relações repetidas são desenhadas uma única vez. Selecionar uma estrela ativa a teoria correspondente, atualiza a legenda e rola até a seção de teorias.

**Atualização:** novas posições devem ser testadas manualmente em desktop e mobile. O mapa não contém algoritmo de prevenção de colisão.

### 5.6 Artigos, ensaios e registros (`#arquivo`)

**Função:** declarar a estrutura editorial futura sem inventar publicações.

**Estado atual:** não existem artigos publicados, dados de artigos, rotas de artigo ou templates editoriais. A home mostra cards estáticos para ensaios longos, fragmentos conceituais, experimentos visuais e um estado vazio.

**Atualização:** não remover a honestidade do estado vazio até existir conteúdo real. Quando houver publicação, a arquitetura editorial deve ser definida antes de multiplicar HTML manual.

### 5.7 Bússola filosófica (`#filosofia`)

**Função:** apresentar estoicismo, niilismo libertador e absurdismo como ferramentas, não identidades fechadas.

**Composição:** três controles com papel de tabs e um painel com imagem, título, citação e análise.

**Comportamento:** clique, setas, `Home` e `End` alteram o paradigma. O painel usa transição de 180 ms e troca imagem e textos a partir de `assets/js/philosophy.js`.

**Atualização:** qualquer nova lente deve incluir título, subtítulo, formulação curta, análise, imagem, `alt` e cor de acento. Evitar transformar o bloco em catálogo superficial de filosofias.

### 5.8 Experimento de ressonância (`#ressonancia`)

**Função:** relacionar gesto, onda, código e som.

**Composição:** texto, botão de áudio, status acessível e canvas com seis cordas.

**Comportamento:** mover ou tocar próximo a uma corda produz vibração visual; o áudio só é ativado após ação explícita. O motor usa Web Audio API com oscilador triangular e seis frequências. O canvas pausa quando sai da viewport e fica estático em preferência de movimento reduzido.

**Limite:** a interação principal depende de ponteiro; não há equivalente por teclado para tocar as cordas.

### 5.9 Linha de desenvolvimento (`#desenvolvimento`)

**Função:** tornar o estado intermediário parte da narrativa.

**Estado atual:** quatro cards — Agora, Próximo ciclo, Expansão e Critério — exibem “Em breve”; descrições mais úteis estão comentadas no HTML.

**Atualização:** transformar essa área em roadmap real somente com marcos verificáveis. Evitar promessas sem data, proprietário ou critério de conclusão.

### 5.10 Sobre (`#sobre`)

**Função:** apresentar Matheus como autor e observador.

**Composição:** imagem cósmica circular e dois parágrafos de apresentação.

**Regra:** manter o foco na relação entre desenvolvimento, sistemas, padrões e investigação. Não usar afirmações de autoridade científica que o projeto não sustenta.

### 5.11 Contato (`#contato`)

**Função:** ligar o arquivo intelectual à presença profissional.

**Composição:** título, cartões de presença profissional, três canais públicos e formulário.

**Comportamento:** os links usam `mailto:` e URLs externas. O formulário não possui backend: valida localmente, compõe uma mensagem e abre o cliente de e-mail.

### 5.12 Footer

**Função:** reforçar o estado Beta, a autoria e atalhos externos.

**Composição:** texto de status e links para e-mail, LinkedIn e GitHub. O manifesto institucional mantém os mesmos destinos de navegação em todas as páginas.

### 5.13 Página dedicada de teorias

**Rota ativa:** `Teorias/teorias.html`.

**Função:** apresentar o arquivo completo com busca, filtros e dossiê.

**Desktop:** duas colunas de cards e dossiê sticky, limitado à altura da viewport e com rolagem própria.

**Até 960 px:** o dossiê lateral é ocultado e detalhes deveriam ser abertos dentro do card ativo.

**Página raiz de compatibilidade:** `teorias.html` usa `meta refresh` para redirecionar à rota atual e preserva links antigos.

### 5.14 Fontes internas da página de teorias

A seção `#fontes` informa que a pasta `Teorias/` continua como material bruto. Seus três cards ainda dizem apenas “Em Breve”. A documentação de integração em `docs/INTEGRACAO_TEORIAS.md` é hoje a explicação técnica mais precisa dessa separação.

---

## 6. Arquitetura Técnica

### 6.1 Stack

O projeto usa:

- HTML5 estático;
- CSS puro;
- JavaScript em ES Modules;
- Canvas 2D;
- Web Audio API;
- Intersection Observer;
- Vercel como configuração de hospedagem estática;
- Node.js apenas para servidor local e verificação.

Não usa React, Vite, Next.js, TypeScript, Tailwind, bundler, transpilador, CMS, banco de dados ou backend de formulário.

### 6.2 Entradas principais

```text
index.html
└── assets/js/main.js
    ├── navigation.js
    ├── observer.js
    ├── theory-lab.js
    ├── philosophy.js
    ├── resonance.js
    └── contact.js

Teorias/teorias.html
└── Teorias/teorias.js
    ├── assets/js/navigation.js
    ├── assets/js/utils.js
    └── assets/data/theories.js
```

### 6.3 Árvore útil do projeto

```text
Desenvolvimento/
├── index.html                       # Home completa
├── teorias.html                     # Redirecionamento de compatibilidade
├── package.json                     # Scripts e metadados; sem dependências
├── package-lock.json                # Lockfile mínimo
├── README.md                        # Visão operacional resumida
├── robots.txt                       # Permite rastreamento
├── vercel.json                      # Hospedagem estática
├── assets/
│   ├── css/
│   │   └── styles.css               # Tokens e todo o sistema visual global
│   ├── data/
│   │   └── theories.js              # Fonte de verdade das teorias
│   ├── icons/
│   │   └── favicon.svg
│   ├── images/
│   │   ├── rain-window.webp
│   │   ├── calabi-yau-wireframe.webp
│   │   ├── cosmic-web.svg
│   │   ├── cosmic-scale.webp
│   │   ├── github-profile.webp
│   │   ├── matheus-camargo.webp
│   │   ├── og-observatorio.jpg
│   │   ├── sisyphus-absurdism.webp
│   │   └── stoic-rock.webp
│   └── js/
│       ├── main.js                  # Inicialização da home
│       ├── config.js                # Contato usado pelo formulário
│       ├── navigation.js            # Header, menu, seção ativa e voltar ao topo
│       ├── observer.js              # Visão estelar/estrutural
│       ├── theory-lab.js            # Recorte, busca, cards, dossiê e mapa da home
│       ├── theories.js              # Reexportação de dados
│       ├── philosophy.js            # Bússola filosófica
│       ├── resonance.js             # Canvas e áudio
│       ├── contact.js               # Validação e mailto
│       └── utils.js                 # Seletores, debounce, clamp e ARIA
├── Teorias/
│   ├── teorias.html                 # Página ativa do arquivo completo
│   ├── teorias.css                  # Camada visual específica
│   ├── teorias.js                   # Busca, filtros, cards e dossiê
│   ├── TEORIAS_ORIGINAIS.txt        # Material bruto histórico
│   ├── backup gpt universo.txt      # Material bruto de conversas
│   ├── Agora erabole...txt          # Material bruto de conversas
│   └── três cópias idênticas de     # Documento Cosmologia Lógica
│       Cosmologia Lógica*.txt
├── docs/
│   └── INTEGRACAO_TEORIAS.md
└── scripts/
    ├── serve.mjs                    # Servidor HTTP estático local
    └── verify.mjs                   # Verificação estrutural customizada
```

### 6.4 Organização de dados

`assets/data/theories.js` é a fonte de verdade compartilhada. A home e a página dedicada importam o mesmo array, o que evita duplicação do conteúdo publicado.

A pasta `Teorias/` acumula duas responsabilidades:

1. página pública ativa;
2. material editorial bruto.

Essa proximidade exige cuidado. Os `.txt` não são carregados no navegador, mas contêm conversas pessoais, dados biográficos, formulações antigas e afirmações não verificadas. Devem ser tratados como **fonte privada de pesquisa**, não como conteúdo pronto para publicação.

Três arquivos são cópias byte a byte do mesmo texto: `# Cosmologia Lógica O Backend da Ex.md.txt`, a variante de nome com `L=gica` e `Novo(a) Documento de Texto.md.txt`.

### 6.5 Configuração e build

Não há build real. `npm run build` apenas executa `scripts/verify.mjs`. `vercel.json` define:

- `framework: null`;
- `buildCommand: ""`;
- `outputDirectory: "."`;
- URLs limpas;
- sem barra final.

O deploy publica os arquivos como estão. Qualquer erro de CSS, caminho ou compatibilidade chega diretamente à produção.

### 6.6 Verificação existente

`scripts/verify.mjs` confirma:

- presença de arquivos obrigatórios;
- referências e âncoras em três HTMLs;
- ausência de URL `blob:` nos HTMLs;
- ausência de placeholders e `TODO` nos arquivos principais;
- ausência de Tailwind CDN e Tone.js;
- ausência de `console.log` nos JavaScripts exigidos.

Ele **não** valida CSS, schema das teorias, acessibilidade, responsividade, links externos, contraste, imagens referenciadas pelo JavaScript, consistência de contagens ou comportamento visual.

---

## 7. Sistema Visual

### 7.1 Cores

O projeto é exclusivamente escuro (`color-scheme: dark`). Os tokens globais ficam em `:root` de `assets/css/styles.css`.

| Variável/valor | Função implementada | Uso recomendado | Evitar |
|---|---|---|---|
| `--bg: #050712` | fundo principal, theme color e base do favicon | páginas e grandes áreas | substituir por preto puro sem necessidade |
| `--bg-2: #070a16` | variação de fundo | transições de seção | usar como acento |
| `--bg-3: #0b1020` | superfície escura elevada | painéis densos | áreas muito extensas sem contraste |
| `--surface: rgba(255,255,255,.055)` | vidro leve | cards e controles | sobre fundos claros |
| `--surface-2: rgba(255,255,255,.085)` | vidro mais evidente | hover ou elevação | empilhar muitas camadas translúcidas |
| `--surface-3: rgba(8,14,28,.78)` | painel escuro quase opaco | menus e painéis legíveis | substituir fundos de todas as seções |
| `--border: rgba(255,255,255,.115)` | borda padrão | cards, campos e separadores | bordas grossas |
| `--border-strong: rgba(125,221,255,.34)` | destaque estrutural | foco e estados ativos | contorno de todos os elementos |
| `--text: #f5f7fb` | texto principal | títulos e conteúdo de alta prioridade | grandes fundos |
| `--text-soft: #c8d3df` | corpo de texto | parágrafos | metadados muito pequenos |
| `--muted: #8996a9` | texto secundário | labels, legendas e microcopy | informação crítica em tamanho pequeno |
| `--muted-2: #5f6d80` | texto muito discreto | detalhes não essenciais | corpo de texto ou controles |
| `--cyan: #72ecff` | acento principal | kickers, foco, conexões e estados ativos | grandes áreas preenchidas |
| `--cyan-deep: #164e63` | apoio escuro ao ciano | gradientes controlados | texto sobre fundo escuro |
| `--blue: #7ca7ff` | acento teórico | teoria/variação | uso indiscriminado |
| `--purple: #ad8cff` | acento cósmico secundário | órbitas, teorias e gradientes | substituir o ciano como identidade central |
| `--violet: #7257ff` | violeta profundo | gradientes e luzes | texto pequeno |
| `--gold: #f6d56d` | calor, status e contraste | estados, astros e detalhes | alertas de erro |
| `--green: #68f0cb` | confirmação e variedade orbital | sucesso e alguns conceitos | mensagens de perigo |
| `--danger: #ff8a8a` | erro de formulário e áudio | validação | decoração |

As teorias adicionam acentos próprios por dados, incluindo `#ff9ef2`, `#b7f7ff`, `#c99bff`, `#f7df87` e `#8fd8ff`. Cada objeto também declara um `glow` RGBA correspondente.

**Regra:** o ciano é a linguagem estrutural global; as outras cores distinguem objetos e estados. Não criar uma nova cor saturada sem função semântica.

### 7.2 Tipografia

As fontes são carregadas do Google Fonts:

- **Inter** (`300–700`): corpo, navegação, botões e interface.
- **Playfair Display** (`600`, `700`, itálico `600`): títulos, frases filosóficas e números de destaque.
- **JetBrains Mono** (`400`, `600`, `700`): códigos, kickers, labels, status, tags, metadados e coordenadas.

Hierarquia global:

- `h1`: Playfair, `clamp(4rem, 11vw, 9.6rem)`, linha `0.95`, largura curta;
- `h2`: Playfair, `clamp(2.35rem, 5.4vw, 5.6rem)`;
- `h3`: Inter por padrão, `1.18–1.45rem`; alguns componentes mudam para Playfair;
- corpo: Inter, linha `1.75`, cor `--text-soft`;
- kickers: JetBrains Mono, `0.75rem`, espaçamento `0.18em`, caixa alta;
- tags e status: JetBrains Mono, cerca de `0.62–0.68rem`, caixa alta.

Alguns títulos de seção recebem escalas próprias maiores, como Campo e Contato (`até 6.8rem` e `6.4rem`). A página de teorias usa hero de até `8.7rem`.

**Regras para novos textos:**

- títulos devem ser curtos o suficiente para `text-wrap: balance` funcionar;
- labels monoespaçados não devem carregar parágrafos;
- texto corrido deve permanecer em largura aproximada de `60–65ch` quando possível;
- evitar texto crítico abaixo de `0.68rem`;
- verificar fontes de fallback, pois o site depende de rede para as famílias do Google.

### 7.3 Formas e elementos visuais

Padrões recorrentes:

- círculos e elipses como órbitas;
- cards translúcidos com gradientes de baixa opacidade;
- bordas finas, quase brancas ou ciano;
- glows difusos, nunca sólidos;
- pills com `border-radius: 999px`;
- cards com raios entre `0.55rem` e `2.2rem`;
- sistemas orbitais feitos com pseudo-elementos;
- grades, scanlines e estrelas como textura;
- linhas SVG para relações;
- imagens circulares ou recortadas em grandes raios;
- ícones de contato simples, monocromáticos e desenhados inline.

Tokens de raio:

| Token | Valor |
|---|---:|
| `--radius-xs` | `0.55rem` |
| `--radius-sm` | `0.8rem` |
| `--radius-md` | `1.1rem` |
| `--radius-lg` | `1.6rem` |
| `--radius-xl` | `2.2rem` |

**Regra de densidade:** cada seção deve escolher um motivo dominante. O hero usa órbitas; teorias usam cards e acentos; o mapa usa conexões; contato usa dois nós de identidade. Repetir todos os motivos em toda seção produz ruído.

### 7.4 Espaçamento e layout

- Container principal: `min(100% - 2rem, 1180px)`.
- Container mobile: `min(100% - 1rem, 1180px)`.
- Header: shell de até `1360px`, altura de `76px`; `68px` no mobile.
- Seções: padding vertical `clamp(5rem, 9vw, 8.5rem)`.
- Grandes grids: gaps normalmente entre `2rem` e `6rem`.
- Cards: gaps próximos de `0.85–1rem`.
- Layouts usam `minmax(0, ...)` para evitar estouro de conteúdo.

O ritmo visual alterna uma seção editorial ampla com uma seção de interface mais densa. Novas seções devem usar:

```html
<section class="section nome-da-secao" id="identificador" aria-labelledby="titulo-identificador">
  <div class="container">
    <p class="section-kicker">10 · Rótulo</p>
    <h2 id="titulo-identificador">Título claro e conceitual.</h2>
  </div>
</section>
```

Não copiar números de seção sem renumerar o fluxo seguinte.

### 7.5 Imagens e mídia

Inventário raster atual:

| Arquivo | Dimensão | Uso |
|---|---:|---|
| `rain-window.webp` | 1024 × 559 | fundo do hero, preload e prioridade alta |
| `calabi-yau-wireframe.webp` | 1024 × 1024 | referência comentada; não renderiza |
| `cosmic-scale.webp` | 717 × 1024 | seção Sobre e opção da bússola |
| `stoic-rock.webp` | 717 × 1024 | estado inicial da bússola |
| `sisyphus-absurdism.webp` | 717 × 1024 | absurdismo |
| `matheus-camargo.webp` | 640 × 640 | Campo e Contato |
| `github-profile.webp` | 460 × 460 | nó técnico do Contato |
| `og-observatorio.jpg` | 1200 × 630 | Open Graph e Twitter |

Há ainda `cosmic-web.svg` (1600 × 1000 por `viewBox`), atualmente sem referência, e o favicon SVG.

Os rasters somam aproximadamente **554 KiB**. O hero usa `fetchpriority="high"`; as demais imagens visíveis usam `loading="lazy"`, exceto a imagem social, que só aparece nos metadados.

**Pontos de atenção:**

- várias imagens conceituais exibem uma marca “ai” no canto;
- origem, licença e autorização de uso não estão documentadas;
- não há `srcset` ou `sizes`;
- imagens da bússola e da seção Sobre não declaram dimensões no HTML;
- `og:image` usa caminho relativo, menos confiável para crawlers sociais;
- `cosmic-web.svg` e `calabi-yau-wireframe.webp` são ativos não utilizados na interface atual.

**Regras para novas imagens:**

1. documentar fonte, licença e autoria;
2. remover marcas de ferramenta apenas se houver direito para isso;
3. preferir WebP/AVIF para fotografia e SVG para desenho vetorial;
4. declarar `width` e `height` quando a proporção for conhecida;
5. usar `alt=""` apenas quando a imagem for realmente decorativa;
6. para conteúdo, escrever `alt` que explique a função, não apenas a aparência;
7. manter tratamento escuro e contraste controlado, sem transformar o site em galeria de imagens espaciais genéricas.

---

## 8. Componentes e Padrões de Interface

### 8.1 Botões

Base `.button`: pill, altura mínima de `3rem`, peso 700 e transição curta. Variantes:

- `.button-primary`: gradiente claro ciano/lilás, texto escuro;
- `.button-secondary`: vidro escuro com borda;
- `.button-ghost`: semelhante ao secundário, usado na visão estelar.

**Regra:** uma seção não deve ter mais de uma ação visualmente primária.

### 8.2 Cards de teoria da home

Estrutura gerada:

- código;
- status;
- título;
- subtítulo;
- resumo;
- quantidade de perguntas e conceitos;
- até cinco tags;
- barra de maturidade.

O elemento é um `<article role="button" tabindex="0">` com tratamento de `Enter` e espaço. Funciona por teclado, embora um `<button>` interno ou link de detalhe fosse semanticamente mais simples.

### 8.3 Dossiê de teoria

Exibe:

- status e código;
- título e subtítulo;
- categoria, contagens e progresso;
- hipótese central;
- perguntas abertas;
- conceitos;
- itens a amadurecer;
- estágio.

Na página dedicada, acrescenta teorias relacionadas.

### 8.4 Filtros, tags e badges

Filtros são botões pills com `aria-pressed`. Tags são informativas, sem interação. Status usa cor própria e contorno.

**Regra:** não usar a mesma aparência de pill para ações e metadados sem diferença de cursor, foco e contraste.

### 8.5 Campos de busca

Busca é client-side, insensível a acentos e caixa. Na home, pesquisa título, subtítulo, resumo, hipótese, status, estágio, conceitos, perguntas e necessidades. Na página dedicada, inclui código, categoria, filtros e conexões.

### 8.6 Mapa de constelação

Cada nó é um botão real com `aria-label`. A cor e a posição vêm do objeto de teoria. A legenda funciona como retorno textual da seleção.

### 8.7 Tabs filosóficas

Há três botões `role="tab"`, `aria-selected` e navegação direcional. O painel recebe `tabindex="0"` e `aria-live="polite"`.

**Lacuna:** o painel não tem `role="tabpanel"`, e os tabs não possuem associação completa por `id`/`aria-labelledby`.

### 8.8 Cards de arquivo e roadmap

São cards estáticos com número/formato, título e descrição. Devem ser usados para estados editoriais ou etapas reais, não como substitutos de navegação quando houver páginas publicadas.

### 8.9 Links de contato

Grid com ícone circular, label monoespaçado e valor. Links externos abrem nova aba com `noopener noreferrer`; o e-mail usa o protocolo nativo `mailto:`.

### 8.10 Formulário

Três campos: nome, e-mail e mensagem. O HTML usa `novalidate`, e o JavaScript aplica mensagens próprias com `aria-invalid`, estado visual e foco no primeiro erro.

### 8.11 Regras para novos componentes

- começar pelos tokens existentes;
- reutilizar raio, borda e superfícies;
- incluir estado de foco, hover, ativo, vazio e erro quando aplicável;
- preferir HTML semântico a `role` corretivo;
- manter conteúdo e comportamento separados;
- criar novo módulo JavaScript apenas quando houver comportamento reutilizável;
- evitar estilos inline; os `style="z-index: ..."` atuais são exceções históricas, não padrão;
- testar em 1440 px, 1024 px, 760 px e aproximadamente 390 px.

---

## 9. Animações e Interações

### 9.1 Animações CSS existentes

| Efeito | Implementação | Duração |
|---|---|---:|
| Fundo de estrelas | deslocamento de `background-position` | 60 s, infinito |
| Órbitas do hero | rotação de quatro elipses | 18, 29, 42 e 58 s |
| Sonda | flutuação vertical | 6 s |
| Núcleo do mapa | rotação | 24 s |
| Botões | elevação no hover | 170 ms |
| Cards de teoria | elevação e glow | 180 ms |
| Tabs filosóficas | deslocamento lateral | 160 ms |
| Troca do painel filosófico | opacidade e posição | 180 ms |
| Menu mobile | opacidade e translação | 160 ms |
| Visão estelar | opacidade da camada e indicador | 420–640 ms |

### 9.2 Navegação

- rolagem suave global;
- link ativo calculado com Intersection Observer;
- botão de voltar ao topo aparece depois de 620 px;
- header muda depois de 24 px;
- menu fecha por link ou `Escape`.

### 9.3 Bússola filosófica

Suporta mouse e teclado. A troca acontece depois de um atraso de 180 ms, durante o qual o painel recebe `.is-changing`.

### 9.4 Ressonância

O canvas roda com `requestAnimationFrame`, seis cordas e pontos amostrados a cada 4 px. Só toca se o ponteiro estiver a até 24 px de uma corda. O áudio é opcional e usa frequências entre 82,41 Hz e 329,63 Hz.

O loop pausa fora da viewport. O `devicePixelRatio` é limitado a 2. Em movimento reduzido, o desenho fica estático.

### 9.5 Regras para animações futuras

- animar `transform` e `opacity` sempre que possível;
- não iniciar áudio sem consentimento;
- pausar loops fora da viewport ou com documento oculto;
- limitar DPR e quantidade de partículas;
- não combinar mais de um loop pesado por seção;
- manter transições de interface entre 120 e 240 ms;
- oferecer estado estático útil para `prefers-reduced-motion`;
- não usar animação para esconder falta de hierarquia ou conteúdo.

---

## 10. Visão Estrutural / Visão Estelar

### 10.1 Nome e propósito

A solicitação histórica chama o recurso de “visão estrutural”; a interface atual o chama de **visão estelar**. O código mantém ambos os vocabulários:

- módulo: `assets/js/observer.js`;
- classe do body: `.is-structural-vision`;
- overlay: `.structural-overlay.stellar-drift-overlay`;
- texto da UI: “Ativar/Desativar visão estelar”;
- estado: `body[data-mode="observer"]`.

Seu propósito conceitual é deslocar o site de um fundo fotográfico para uma simulação de deriva estelar, reforçando tempo profundo, observação e relações.

### 10.2 Ativação e estado inicial

Apesar do HTML inicial dizer “Ativar visão estelar”, `initObserverMode()` começa com `isObserverMode = true`. Assim, após o JavaScript carregar:

- o recurso fica ativado automaticamente;
- `body.dataset.mode` vira `observer`;
- o botão passa a dizer “Desativar visão estelar”;
- o status vira “Deriva estelar simulada”.

O estado não é persistido. Recarregar a home ativa novamente o modo.

### 10.3 Implementação

Ao inicializar, o módulo cria uma única camada fixa no `body` contendo:

- um canvas em tela inteira;
- indicador de anos simulados;
- barra de progresso.

Há proteção contra overlay duplicado e contra inicialização dupla. A ativação inicia o renderer; a desativação remove listeners de resize e visibilidade e cancela o frame.

O ciclo visual simula até **450.000 anos**. O indicador atualiza no máximo a cada 180 ms. O ciclo dura 118 s em desktop e 96 s em telas compactas.

### 10.4 Qualidade e desempenho real

O renderer limita DPR a:

- 1,25 em telas até 760 px;
- 1,5 até 1040 px;
- 1,75 acima disso.

Ele desativa trilhas e linhas de relação no mobile. Também pausa quando a aba fica oculta.

Entretanto, os limites atuais de contagem merecem revisão:

- em 1440 × 900, o cálculo resulta em aproximadamente **1.989 estrelas**;
- na faixa tablet, os argumentos invertidos de `clamp` fazem a contagem tender a **2.128 estrelas**;
- em 390 × 844, a contagem fica próxima de 274 estrelas;
- em movimento reduzido, a animação para, mas ainda são criadas mais de **2.100 estrelas estáticas**.

O comentário no CSS afirma que a versão otimizada não teria loop contínuo em canvas, mas a implementação atual usa `requestAnimationFrame`. A documentação deve seguir o código, não o comentário.

### 10.5 Efeito visual

Quando ativo:

- a fotografia do hero fica quase invisível e menos saturada;
- grade e scanline ganham presença;
- o canvas desenha estrelas, trilhas e algumas linhas;
- o botão recebe borda e glow ciano;
- o indicador mostra a deriva temporal.

Não é uma visualização real da estrutura do DOM ou do sistema de componentes. É uma camada atmosférica e conceitual.

### 10.6 Mobile e movimento reduzido

No mobile, o indicador é movido para o topo, logo abaixo do header. Na verificação renderizada, ele se sobrepôs a conteúdo durante a rolagem. A versão é visualmente mais simples quanto a trilhas, mas o indicador continua presente e fixo.

Em `prefers-reduced-motion: reduce`:

- transições CSS são eliminadas;
- o campo estelar é desenhado uma vez;
- não há trilhas nem linhas de relação;
- o tempo simulado permanece em zero.

### 10.7 Regras obrigatórias de manutenção

- conservar uma única camada de overlay;
- não criar uma estrela como elemento DOM;
- corrigir a lógica de quantidade antes de aumentar efeitos;
- não adicionar um segundo loop global de canvas;
- manter pausa por `visibilitychange`;
- limpar `requestAnimationFrame`, timers e listeners na desativação;
- manter DPR limitado;
- simplificar ou ocultar o indicador no mobile para evitar sobreposição;
- preservar estado estático em movimento reduzido;
- decidir explicitamente se o modo deve iniciar ligado; o texto inicial e o estado JavaScript devem concordar;
- atualizar comentários do CSS quando a arquitetura mudar.

---

## 11. Teorias e Conteúdo Intelectual

### 11.1 Fonte de dados

Todas as teorias publicadas ficam em `assets/data/theories.js`. O array está congelado com `Object.freeze`, mas o congelamento é superficial; a intenção é tratá-lo como configuração somente leitura em runtime.

### 11.2 Schema atual

Cada teoria contém:

| Campo | Tipo | Função |
|---|---|---|
| `id` | string | slug único e chave de relações |
| `code` | string | código exibido, como `T-01` |
| `title` | string | título completo |
| `shortTitle` | string | título compacto do mapa |
| `subtitle` | string | recorte conceitual em uma linha |
| `status` | string | estado editorial livre |
| `stage` | string | descrição do estágio atual |
| `progress` | número | maturidade manual de 0 a 100 |
| `category` | string | categoria principal |
| `filters` | string[] | eixos pelos quais a teoria aparece |
| `color` | string | cor de acento |
| `glow` | string | sombra RGBA |
| `position` | objeto | coordenadas percentuais `x` e `y` do mapa |
| `summary` | string | resumo para card |
| `hypothesis` | string | hipótese central |
| `questions` | string[] | perguntas abertas |
| `concepts` | string[] | conceitos e tags |
| `needs` | string[] | lacunas e próximos refinamentos |
| `connections` | string[] | IDs de teorias relacionadas |

### 11.3 Catálogo atual

O arquivo contém dez linhas:

1. T-01 — Observação Não-Linear
2. T-02 — Instabilidade Probabilística do Vazio
3. T-03 — Ciclagem Eterna e Reboot do Vácuo
4. T-04 — Topologia do Contentor Finito
5. T-05 — Gênese Gravitacional do Tempo
6. T-06 — ER=EPR e Sondas Quânticas
7. T-07 — Cosmologia Lógica: o Backend da Existência
8. T-08 — Gênese por Flutuação do Vácuo
9. T-09 — Zero vs. Epsilon
10. T-10 — Maldição do Horizonte e Extensão dos Sentidos

Os status são textos livres, como “em expansão”, “rascunho conceitual”, “fronteira teórica”, “eixo integrador”, “filosofia operacional” e “ponte prática”. Não existe enumeração ou validação automática.

### 11.4 Filtros

`THEORY_FILTERS` contém sete opções visuais incluindo “Todas”: Cosmologia, Tempo, Vazio, Informação, Topologia e Método. Portanto, são seis eixos filtráveis além do estado geral.

Há uma inconsistência atual:

- o filtro `existencial` está comentado;
- T-07, T-09 e T-10 incluem `existencial` em `filters`, e T-09 usa essa categoria principal;
- a home diz estaticamente “7 eixos de filtro”;
- a página dedicada calcula e mostra “6 eixos de filtro”.

Isso deve ser corrigido antes de considerar as contagens como confiáveis.

### 11.5 Progresso e status epistemológico

O `progress` é manual; não existe fórmula. A interface o chama de “maturidade conceitual inferida”. Ele não deve ser interpretado como probabilidade científica, validade ou porcentagem de conclusão objetiva.

Uma teoria em desenvolvimento deve sempre:

- declarar o que está sendo proposto;
- registrar perguntas que podem enfraquecê-la;
- separar metáfora de mecanismo;
- indicar o que falta formalizar;
- evitar linguagem de verdade final;
- não usar a porcentagem como argumento de autoridade.

### 11.6 Conexões

`connections` usa IDs. O mapa trata as linhas como relações não direcionais ao evitar duplicatas, mas o dossiê dedicado exibe somente as conexões declaradas no objeto ativo. Para uma relação simétrica ser visível nos dois dossiês, convém registrá-la nos dois objetos.

### 11.7 Material bruto

Os `.txt` preservam origem e evolução das ideias. Eles contêm:

- conversas com IA;
- dados pessoais e planos de vida;
- linguagem elogiosa e categórica;
- números e interpretações sem fonte;
- versões repetidas;
- português de variantes diferentes;
- conteúdo que o próprio site público já refinou.

Fluxo editorial obrigatório:

```text
rascunho bruto
→ extração da pergunta central
→ checagem de afirmações e fontes
→ separação entre ciência, hipótese e metáfora
→ redação no schema público
→ revisão de tom
→ publicação em theories.js
```

Nunca ligar a interface diretamente aos `.txt` sem uma etapa editorial.

---

## 12. Artigos, Ensaios e Registros

### 12.1 Estado implementado

Não há sistema de artigos. A seção da home é uma estrutura estática que declara três formatos futuros:

- ensaios longos;
- fragmentos conceituais;
- experimentos visuais.

Não há datas, autores, slugs, páginas de detalhe, feed, dados, Markdown processado ou artigos reais.

### 12.2 Estrutura editorial recomendada para um artigo futuro

Esta é uma **recomendação**, não um schema existente:

- título;
- slug;
- resumo;
- data de publicação e data de revisão;
- estado editorial;
- categoria;
- tags;
- teorias relacionadas por `id`;
- tese ou pergunta central;
- desenvolvimento;
- limites e objeções;
- fontes;
- histórico de versão.

### 12.3 Regras de tom

- artigo não é registro cotidiano;
- datas devem versionar o texto, não transformá-lo em diário;
- fragmentos podem ser curtos, mas devem conter uma pergunta ou relação identificável;
- ensaios devem distinguir opinião, hipótese, referência e fato;
- textos ligados a uma teoria devem usar seu código, como `T-03`;
- conteúdo produzido com IA deve passar por autoria, revisão e verificação humanas.

### 12.4 Organização futura

Antes da primeira publicação, escolher e documentar uma arquitetura. O projeto atual não define se o conteúdo será HTML, Markdown ou dados JavaScript. Não criar pastas e convenções isoladas sem essa decisão.

Uma evolução coerente seria centralizar metadados como ocorre com teorias, mas isso é apenas uma direção recomendada.

---

## 13. Sobre Matheus Camargo

Matheus aparece em três camadas:

1. **Origem do campo:** o painel inicial o apresenta como desenvolvedor, organizador de sistemas e autor de perguntas.
2. **Autor humano:** a seção Sobre explica a relação entre software, cosmologia, tempo e percepção.
3. **Presença profissional:** Contato conecta fotografia, GitHub, LinkedIn e e-mail.

A identidade pessoal é construída por contexto e não por autoelogio. A frase mais importante para manutenção é: “Matheus Camargo não é o centro do sistema. É o ponto humano de onde a observação parte.”

### Regras de apresentação pessoal

- usar fatos verificáveis;
- evitar títulos profissionais não confirmados;
- apresentar interesses como interesses e hipóteses como hipóteses;
- não importar dados pessoais dos rascunhos sem decisão explícita do proprietário;
- manter fotografia e nome em função da autoria e contato;
- integrar projetos profissionais somente quando houver ligação clara com pensamento, sistemas, dados, criatividade ou tecnologia;
- não substituir o arquivo por currículo cronológico.

---

## 14. Contato e Presença Profissional

### 14.1 Dados confirmados na implementação

| Canal | Valor implementado | Onde aparece |
|---|---|---|
| E-mail | `soulwatching@gmail.com` | config, seção Contato, footer da home e footer de Teorias |
| LinkedIn | `https://www.linkedin.com/in/gomin/` | config, seção Contato e footer da home |
| GitHub | `https://github.com/Matheus14623` | config, seção Contato e ambos os footers |

Os três canais profissionais acima permanecem públicos. O telefone pessoal foi retirado da interface.

### 14.2 Fonte de verdade parcial

`assets/js/config.js` centraliza os dados usados pelo formulário, mas o HTML repete manualmente os valores visíveis e links. Portanto, alterar apenas `SITE_CONFIG` não atualiza toda a interface.

Ao mudar contato, revisar:

- `assets/js/config.js`;
- links e textos de `index.html`;
- footer de `Teorias/teorias.html`;
- `README.md`;
- esta documentação.

### 14.3 Comportamento de links

- o e-mail abre o handler do sistema;
- LinkedIn e GitHub abrem nova aba;
- links externos usam `rel="noopener noreferrer"`;
- links de contato principais possuem `aria-label` descritivo;
- links do footer são mais compactos e não informam no nome acessível que abrem nova aba.

### 14.4 Formulário

O formulário valida:

- nome obrigatório, mínimo de 2 caracteres;
- e-mail obrigatório e válido;
- mensagem obrigatória, mínimo de 12 caracteres.

Depois, cria assunto e corpo e navega para uma URL `mailto:`. Não há confirmação de entrega, persistência, API ou proteção antispam porque a mensagem não passa por um servidor do projeto.

**Regra:** não escrever “mensagem enviada”. O texto correto é “cliente de e-mail aberto” ou “mensagem preparada”.

---

## 15. Responsividade

### 15.1 Breakpoints identificados

| Breakpoint | Uso principal |
|---:|---|
| `1180px` | ajustes de teorias e contato |
| `1080px` | menu recolhido e empilhamento de layouts principais |
| `1040px` | qualidade tablet da visão estelar, via JavaScript |
| `960px` | dossiê de teorias oculto e detalhe mobile |
| `760px` | layout mobile, botões largos, espaçamento e tipografia |
| `460px` | ajustes compactos globais |
| `430px` | ajustes compactos da página de teorias |

### 15.2 Desktop

- header completo e navegação horizontal;
- hero em duas colunas;
- cards de teoria em duas colunas com dossiê lateral;
- mapa amplo;
- bússola com controles laterais;
- contato com apresentação em duas colunas e links em grade.

### 15.3 Tablet

- menu já é recolhido em 1080 px;
- hero, Campo, Arquivo, Ressonância, Sobre e outros grids empilham;
- sistema solar fica centralizado;
- dossiê da home deixa de ser sticky;
- página dedicada conserva dossiê até 960 px.

### 15.4 Mobile

Confirmado em viewport de 390 × 844 px:

- header de 68 px;
- subtítulo da marca oculto;
- menu abre em painel de aproximadamente 288 px;
- botões e filtros da home ocupam largura total;
- página dedicada usa uma coluna e trilha horizontal de filtros;
- dossiê lateral fica oculto;
- contato empilha links em uma coluna;
- não há overflow horizontal geral.

### 15.5 Problemas responsivos confirmados

1. **Grade da home permanece com duas colunas no mobile.** Uma regra posterior redefine `.theory-grid` para duas colunas depois da media query que tentava usar uma coluna. Em 390 px, cada coluna ficou com aproximadamente 172 px, produzindo cards estreitos e textos muito longos.
2. **Detalhe mobile da página dedicada está visualmente comprometido.** O primeiro card ativo apresentou conteúdo de detalhe fora da altura calculada do card; o pai usa `overflow: clip`, e o botão com `min-height: 100%` contribui para grande espaço interno e possível recorte do detalhe.
3. **Indicador da visão estelar se sobrepõe ao conteúdo durante rolagem mobile.** Ele permanece fixo abaixo do header.
4. **Hero mobile é muito alto.** É coerente com o empilhamento atual, mas aumenta o tempo até o conteúdo principal.

Esses itens devem ser tratados como defeitos atuais, não como padrões de design.

---

## 16. Acessibilidade

### 16.1 Recursos implementados

- `lang="pt-BR"`;
- link “Ir para o conteúdo principal”;
- `main`, `header`, `nav`, `section`, `article`, `aside`, `footer` e headings;
- foco visível global de 2 px em ciano;
- labels para campos;
- mensagens de erro e status com regiões ao vivo;
- `aria-expanded` no menu;
- `aria-pressed` em filtros, áudio e visão estelar;
- teclado nos cards de teoria da home;
- teclado completo nos tabs filosóficos;
- textos alternativos nas imagens de conteúdo;
- `alt=""` nas imagens decorativas;
- `rel="noopener noreferrer"` em links externos;
- `prefers-reduced-motion` em CSS e JavaScript;
- mensagem `noscript` nas duas páginas.

Na inspeção DOM não foram encontrados IDs duplicados, controles sem nome acessível ou imagens sem atributo `alt`.

### 16.2 Lacunas

- o painel filosófico não usa `role="tabpanel"` nem associação completa com cada tab;
- o canvas de cordas tem `aria-label`, mas `tabIndex = -1` e não oferece operação por teclado;
- a página de teorias gera vários `h4` de detalhes sem um `h3` correspondente no card, pois o título do card é um `<span>`;
- o menu não controla foco quando abre ou fecha;
- não existe alternativa textual equivalente ao experimento de ressonância;
- links externos do footer não anunciam “nova aba”;
- `--muted-2` e textos pequenos sobre superfícies translúcidas precisam de teste formal de contraste;
- rolagens JavaScript usam `behavior: "smooth"` sem checagem explícita de movimento reduzido;
- cards da home simulam botão com `role`, em vez de usar semântica nativa.

### 16.3 Regras para manutenção

- preferir elementos nativos;
- manter foco visível e ordem lógica;
- não comunicar estado apenas por cor;
- associar tabs e tabpanel;
- validar contraste no fundo real, incluindo transparências;
- incluir teclado e instrução equivalente em toda interação por ponteiro;
- preservar heading hierárquico;
- testar zoom a 200%;
- testar com JavaScript desativado e leitor de tela;
- respeitar movimento reduzido também nas chamadas JavaScript de rolagem.

---

## 17. SEO e Metadados

### 17.1 Implementado na home

- título: `Observatório de Ideias | Matheus Camargo`;
- meta description específica;
- author;
- robots `index, follow`;
- theme color `#050712`;
- Open Graph title, description, type, image e locale;
- Twitter card, title, description e image;
- favicon SVG;
- um `h1` e estrutura de headings;
- `robots.txt` permitindo rastreamento.

### 17.2 Implementado na página de teorias

Metadados equivalentes e específicos, com título “Constelação de Teorias | Observatório de Ideias”.

### 17.3 Compatibilidade de rota

`teorias.html` define redirecionamento e canonical relativo para `Teorias/teorias.html`. As páginas finais não possuem canonical próprio.

### 17.4 Ausências e recomendações futuras

- não há `og:url`;
- imagens OG usam caminho relativo;
- não há canonical absoluto nas páginas finais;
- não há `sitemap.xml`;
- não há JSON-LD/Schema.org;
- não há manifesto web;
- não há URL de domínio documentada;
- a imagem social deve ser verificada após deploy;
- páginas de artigo futuras precisarão de metadados próprios;
- teorias individuais não têm URL, o que limita compartilhamento e indexação granular.

Não adicionar metadados absolutos antes de conhecer o domínio canônico de produção.

---

## 18. Performance

### 18.1 Pontos positivos

- sem framework e sem dependências de produção;
- aproximadamente 554 KiB de imagens raster;
- WebP para imagens de interface;
- preload apenas do hero;
- lazy loading nas imagens abaixo da dobra;
- ES Modules carregados sob demanda por página;
- DPR limitado nos canvas;
- Ressonância pausada fora da viewport;
- Visão estelar pausada com aba oculta;
- `contain` em overlays e alguns cards;
- `requestAnimationFrame` em vez de timer para desenho;
- servidor local aplica cache de um dia para imagens.

### 18.2 Áreas pesadas

- `styles.css` tem aproximadamente 74 KiB e 3.414 linhas, com várias camadas históricas e seletores não usados;
- visão estelar inicia ligada e cria cerca de 2.000 estrelas em desktop;
- movimento reduzido ainda cria mais de 2.100 estrelas estáticas;
- fundo de estrelas e quatro órbitas animam continuamente;
- Canvas de ressonância redesenha seis cordas a cada frame quando visível;
- busca da home rerenderiza filtros, cards, dossiê e mapa a cada tecla, sem debounce;
- fonte externa cria dependência de rede;
- não há minificação, compressão definida no repositório ou hashing de assets;
- módulos e CSS usam query strings manuais de versão, não pipeline de cache.

### 18.3 Escalabilidade de conteúdo

Com dez teorias, rerenderização completa é aceitável. Com dezenas ou centenas:

- separar atualização de busca da reconstrução do mapa;
- aplicar debounce;
- evitar recriar filtros a cada tecla;
- considerar paginação ou virtualização somente quando medida;
- validar custo das conexões e do dossiê.

### 18.4 Regras de performance

- medir antes de adicionar bibliotecas;
- não adicionar framework apenas para renderizar conteúdo estático;
- otimizar e dimensionar imagens;
- limitar partículas por área com limites corretos;
- manter uma única animação global;
- pausar tudo que não está visível;
- não usar `will-change` permanentemente sem necessidade;
- revisar CSS morto antes de acrescentar nova camada de overrides;
- manter testes em aparelho mobile real ou perfil de CPU reduzida.

---

## 19. Regras Para Futuras Atualizações

### 19.1 Conceito

1. Preservar a identidade cósmica, filosófica e intelectual.
2. Não transformar o projeto em portfólio genérico.
3. Não usar linguagem de diário.
4. Não usar autoelogio ou reivindicação de autoridade sem evidência.
5. Toda seção deve ter propósito conceitual e funcional.
6. Todo efeito deve apoiar sentido, hierarquia ou interação.

### 19.2 Conteúdo

7. Tratar teorias como ideias em desenvolvimento.
8. Separar fato, hipótese, metáfora e recomendação.
9. Não publicar rascunhos brutos automaticamente.
10. Não inventar artigos, métricas, depoimentos, títulos ou experiências.
11. Incluir limites e perguntas abertas.
12. Versionar textos longos.

### 19.3 Design

13. Reutilizar tokens de cor, tipografia, raio e espaçamento.
14. Manter ciano como acento estrutural.
15. Usar outras cores para distinção, não ruído.
16. Evitar excesso de glow, órbitas e partículas.
17. Respeitar largura de leitura.
18. Não adicionar estilo inline.
19. Corrigir o CSS existente antes de criar outra camada de override.

### 19.4 Interface

20. Preferir componentes e semântica existentes.
21. Incluir estados vazio, erro, foco e movimento reduzido.
22. Testar desktop, tablet e mobile.
23. Manter teclado e leitor de tela em escopo.
24. Não criar interação exclusivamente por hover.

### 19.5 Técnica

25. Não adicionar dependência pesada sem justificativa e medição.
26. Manter dados de teoria centralizados.
27. Validar IDs e conexões.
28. Rodar `npm run verify` antes de publicar.
29. Adicionar testes específicos quando uma regra passar a ser crítica.
30. Atualizar README e esta documentação após mudança arquitetural.

### 19.6 Segurança e privacidade editorial

31. Revisar os `.txt` como material sensível.
32. Não expor dados pessoais novos sem autorização explícita.
33. Não incluir segredos, tokens ou dados de terceiros no frontend.
34. Verificar licença e procedência de mídia.

---

## 20. Como Adicionar Novas Teorias

### Passo 1 — Preparar o conteúdo

Antes de tocar no código, escrever:

- título;
- descrição curta;
- hipótese central;
- status honesto;
- estágio;
- perguntas abertas;
- conceitos;
- lacunas;
- conexões pretendidas.

Checar afirmações físicas e marcar especulação.

### Passo 2 — Editar a fonte de dados

Adicionar um objeto ao array `THEORIES` em `assets/data/theories.js`.

Modelo baseado no schema real:

```js
{
  id: 'slug-unico',
  code: 'T-11',
  title: 'Título completo',
  shortTitle: 'Título curto',
  subtitle: 'Recorte conceitual em uma linha',
  status: 'hipótese inicial',
  stage: 'Descrição honesta do estágio',
  progress: 20,
  category: 'metodo',
  filters: ['metodo'],
  color: '#72ecff',
  glow: 'rgba(114, 236, 255, 0.45)',
  position: { x: 40, y: 65 },
  summary: 'Resumo legível no card.',
  hypothesis: 'Formulação da hipótese central.',
  questions: ['Pergunta aberta?'],
  concepts: ['conceito'],
  needs: ['Ponto que ainda precisa amadurecer.'],
  connections: ['id-de-outra-teoria'],
}
```

### Passo 3 — Validar identidade e IDs

- `id` deve ser único, minúsculo e estável;
- `code` deve ser único;
- não renomear ID publicado sem atualizar todas as conexões;
- `connections` deve apontar apenas para IDs existentes;
- se a relação for conceitualmente bidirecional, adicionar nos dois objetos.

### Passo 4 — Categoria e filtros

- reutilizar filtro existente quando suficiente;
- para novo filtro, adicionar em `THEORY_FILTERS`;
- garantir que `category` e itens de `filters` tenham opção navegável quando necessário;
- resolver a inconsistência de `existencial` antes de expandir categorias.

### Passo 5 — Cor e posição

- escolher cor coerente com a paleta;
- criar `glow` da mesma família;
- posicionar `x` e `y` entre 0 e 100;
- testar colisões no mapa desktop e mobile;
- não usar cor como única explicação de categoria.

### Passo 6 — Progresso

Definir `progress` como indicação editorial, não científica. Registrar fora da interface qual critério justificou o número, ou substituir futuramente por estágios discretos.

### Passo 7 — Atualizar contagens estáticas

A página dedicada atualiza totais por JavaScript. A home contém “10 linhas catalogadas” e “7 eixos de filtro” escritos diretamente em `index.html`; esses números precisam ser atualizados manualmente ou refatorados para dados dinâmicos.

Também revisar `README.md` quando o total ou a estrutura mudar.

### Passo 8 — Entender o recorte da home

A home mostra no máximo seis resultados. Se a nova teoria precisa aparecer inicialmente, ajustar a ordem do array conscientemente. Não remover uma teoria prioritária sem decisão editorial.

### Passo 9 — Testar

1. rodar `npm run verify`;
2. abrir a home e a página dedicada;
3. buscar por título, conceito e pergunta;
4. testar todos os filtros associados;
5. selecionar o card e conferir o dossiê;
6. selecionar relações;
7. conferir mapa em desktop e mobile;
8. testar teclado;
9. conferir ausência de overflow;
10. revisar linguagem e status epistemológico.

---

## 21. Como Adicionar Novos Artigos ou Registros

### 21.1 Limite da arquitetura atual

Não existe local técnico oficial para um artigo completo. A seção `#arquivo` é HTML estático e não aponta para páginas. Portanto, o primeiro artigo exige uma decisão arquitetural; não basta copiar um card.

### 21.2 Caminho mínimo, sem criar sistema novo

Para apenas anunciar um registro curto na home:

1. editar `index.html` dentro de `.archive-grid`;
2. substituir ou acrescentar um `<article class="archive-card">`;
3. manter label de formato, título e descrição;
4. remover “Sem artigos publicados ainda” somente quando houver publicação real;
5. testar a grade em 760 px e abaixo.

Esse caminho não cria URL, leitura completa, data, SEO ou relação automatizada.

### 21.3 Caminho recomendado para publicação completa

Antes de implementar:

1. decidir entre HTML manual, Markdown processado ou dados estruturados;
2. definir schema e versionamento;
3. definir URL canônica;
4. criar template de artigo;
5. ligar artigo a teorias por IDs;
6. criar lista real no Arquivo;
7. adicionar metadados sociais por página;
8. atualizar verificação para checar links, headings e campos.

### 21.4 Convenção editorial recomendada

Enquanto não houver arquitetura aprovada, não há convenção oficial de nomes de arquivo. Quando ela for definida, preferir slugs estáveis, minúsculos, sem espaços e sem caracteres dependentes de encoding.

### 21.5 Checklist do artigo

- título e resumo não genéricos;
- data de publicação e revisão;
- relação com teoria identificada;
- fontes verificáveis;
- distinção entre opinião e fato;
- objeções e limites;
- português brasileiro revisado;
- sem tom de diário;
- heading único e hierárquico;
- SEO e compartilhamento;
- mobile e acessibilidade.

---

## 22. Como Adicionar Novas Seções

### Passo 1 — Definir propósito

Escrever em uma frase o que a seção permite ao usuário compreender ou fazer. Se a resposta for apenas “deixar o site mais bonito”, não adicionar.

### Passo 2 — Escolher posição e número

A home usa sequência de 01 a 09. Inserir uma seção exige renumerar kickers posteriores e revisar links do header quando aplicável.

### Passo 3 — Criar HTML semântico

Editar `index.html`, usando `section`, `container`, `aria-labelledby` e heading compatível.

### Passo 4 — Reutilizar layout

Começar com `.section`, `.container`, `.section-heading`, `.section-kicker`, `.button` e padrões de card existentes. Criar classe específica somente para diferenças reais.

### Passo 5 — Adicionar CSS

Adicionar regras em `assets/css/styles.css`, de preferência próximas ao componente relacionado. Não continuar o padrão de múltiplos “ajustes finais” no fim do arquivo; consolidar a regra original quando seguro.

### Passo 6 — Adicionar comportamento, se necessário

Criar módulo em `assets/js/` com uma função `init...()`, importá-lo em `main.js` e retornar cedo quando o elemento não existir. Evitar estado global e garantir inicialização única para overlays/listeners globais.

### Passo 7 — Navegação

Se a seção merecer link:

- criar `id` único;
- adicionar âncora no nav;
- manter quantidade de links manejável;
- verificar que o menu fecha;
- rodar o verificador de âncoras.

### Passo 8 — Responsividade

Testar:

- 1440 × 900;
- aproximadamente 1024 × 768;
- 760 px;
- 390 × 844;
- zoom de 200%;
- conteúdo maior do que o exemplo.

### Passo 9 — Movimento e acessibilidade

- foco visível;
- teclado;
- nomes acessíveis;
- movimento reduzido;
- sem dependência exclusiva de cor ou hover;
- textos alternativos;
- ordem de headings.

### Passo 10 — Documentar

Atualizar árvore, seção funcional, regras de manutenção e README.

---

## 23. Como Rodar e Manter o Projeto

### 23.1 Requisitos

O projeto não declara versão de Node em `engines`, `.nvmrc` ou arquivo equivalente. A auditoria executou com Node `v24.14.0`. O mínimo oficial não pode ser confirmado.

**Recomendação:** declarar uma versão LTS suportada depois de testá-la; até lá, usar Node moderno com ES Modules.

### 23.2 Instalação

Não há dependências externas no `package.json`. Ainda assim, para manter o fluxo padrão:

```bash
npm install
```

O `package-lock.json` é mínimo.

### 23.3 Desenvolvimento

```bash
npm run dev
```

Servidor local esperado:

```text
http://localhost:5173
```

Também existe `npm start`, com o mesmo comando.

### 23.4 Verificação

```bash
npm run verify
```

### 23.5 Build

```bash
npm run build
```

Esse comando não produz `dist/`; apenas executa a verificação.

### 23.6 Preview

Não existe script separado de preview. `npm run dev` serve os mesmos arquivos que serão publicados.

### 23.7 Deploy

O repositório está preparado para deploy estático na Vercel. O diretório de saída é a raiz. Não há etapa de compilação.

### 23.8 Manutenção rotineira

- verificar links e contatos;
- revisar contagens de teorias;
- validar filtros e conexões;
- otimizar novas imagens;
- revisar conteúdo bruto antes de curadoria;
- executar verificação e teste visual;
- checar console;
- revisar SEO quando domínio ou rotas mudarem;
- manter esta documentação sincronizada.

---

## 24. Pontos de Atenção

### 24.1 Prioridade alta

1. **Mobile da home:** grade de teoria renderiza duas colunas estreitas por conflito de cascata.
2. **Detalhe mobile da página de teorias:** estrutura de altura/overflow pode recortar o conteúdo expandido.
3. **Visão estelar:** limites de partículas desktop/tablet e reduced motion parecem incorretos e contradizem o comentário de otimização.
4. **Indicador mobile:** sobreposição de conteúdo durante rolagem.
5. **Filtros:** `existencial` existe nos dados, mas não na interface; contagens divergem.

### 24.2 Prioridade média

6. `styles.css` acumulou regras antigas, overrides e seletores sem uso.
7. A declaração de `background` de `.theory-card` próxima ao refinamento contém uma vírgula final inválida e é ignorada pelo navegador; a regra base anterior continua valendo.
8. Há CSS para layouts antigos de contato e página de teorias que não corresponde ao HTML atual.
9. Números da home são estáticos, enquanto a página dedicada calcula dinamicamente.
10. Formulário `mailto:` depende de cliente local e não confirma entrega.
11. Canvas de ressonância não tem interação equivalente por teclado.
12. Tabs filosóficos precisam de semântica ARIA completa.
13. Rota de teorias não oferece URL por teoria.
14. `og:image` relativo e ausência de canonical/og:url reduzem robustez de compartilhamento.

### 24.3 Conteúdo e governança

15. Rascunhos brutos contêm informações pessoais e afirmações não verificadas.
16. Três documentos duplicados aumentam risco de edição da cópia errada.
17. “Em Breve” e texto informal da ressonância reduzem acabamento editorial.
18. `stage: 'Confidencial'` em T-07 é exibido publicamente; o termo deve ser revisto, pois conteúdo confidencial não deve estar no frontend.
19. Progressos percentuais não têm critério documentado.
20. Licença e origem de imagens não estão documentadas; várias mostram marca de IA.

### 24.4 Ferramentas e teste

21. O verificador não analisa CSS ou schema dos dados.
22. Não há testes automatizados de interface, acessibilidade ou regressão visual.
23. Não há CI documentada.
24. Versão de Node não está fixada.
25. `package-lock.json` está modificado no worktree antes desta documentação; essa alteração preexistente não foi tocada durante a auditoria.

### 24.5 Melhorias futuras possíveis

- validar teorias por schema;
- tornar contagens dinâmicas;
- criar URLs compartilháveis por teoria;
- separar página pública e rascunhos brutos em diretórios distintos;
- consolidar CSS;
- adicionar teste de acessibilidade e responsividade;
- documentar procedência de mídia;
- criar arquitetura editorial somente quando houver primeiro artigo real;
- melhorar fallback de fontes;
- medir Core Web Vitals em produção.

---

## 25. Resumo Executivo

O **Observatório de Ideias** é um site estático e interativo que organiza o universo intelectual de Matheus Camargo sem reduzi-lo a portfólio, diário ou monumento pessoal. Sua identidade nasce da combinação entre arquivo, laboratório e observatório: ideias são apresentadas como estruturas rastreáveis, ligadas por relações e explicitamente abertas a revisão.

O que deve ser preservado:

- honestidade sobre o estágio das teorias;
- prioridade das ideias sobre autopromoção;
- metáfora cósmica usada como arquitetura, não enfeite;
- paleta escura com ciano estrutural e acentos controlados;
- hierarquia tipográfica entre Playfair, Inter e JetBrains Mono;
- dados centralizados de teorias;
- separação entre material bruto e conteúdo público;
- presença profissional discreta no fechamento;
- acessibilidade, responsividade e movimento reduzido.

O projeto deve evoluir por refinamento: corrigir inconsistências mobile e de performance, consolidar CSS, validar dados e transformar conteúdo real em publicações somente quando houver estrutura editorial suficiente. Toda atualização precisa responder a uma finalidade intelectual clara, reutilizar o sistema existente e preservar a diferença fundamental deste site: ele não vende uma imagem pronta; ele torna visível um pensamento em desenvolvimento.

---

## Apêndice A — Checklist de entrega de qualquer atualização

- [ ] A mudança tem propósito conceitual claro.
- [ ] O conteúdo é real e verificável.
- [ ] Fato, hipótese, metáfora e recomendação estão separados.
- [ ] Tokens existentes foram reutilizados.
- [ ] Não há estilo inline novo.
- [ ] Desktop, tablet e mobile foram testados.
- [ ] Não há overflow horizontal.
- [ ] Teclado e foco foram testados.
- [ ] Movimento reduzido foi testado.
- [ ] Imagens têm origem, licença, dimensão e `alt` adequados.
- [ ] Contagens e filtros continuam consistentes.
- [ ] Conexões de teorias apontam para IDs válidos.
- [ ] `npm run verify` passa.
- [ ] Console não apresenta erros.
- [ ] README e documentação foram atualizados quando necessário.

## Apêndice B — Arquivos mais sensíveis a regressão

| Arquivo | Motivo |
|---|---|
| `assets/css/styles.css` | cascata longa, overrides históricos e todos os breakpoints globais |
| `assets/js/observer.js` | loop global, canvas, listeners, DPR e movimento reduzido |
| `assets/data/theories.js` | fonte de verdade, relações e contagens |
| `assets/js/theory-lab.js` | home, filtros, cards, dossiê e mapa acoplados |
| `Teorias/teorias.js` | arquivo completo, estado ativo e detalhe mobile |
| `Teorias/teorias.css` | dossiê desktop e expansão mobile |
| `index.html` | conteúdo, números estáticos, contatos e ordem de seções |
| `assets/js/config.js` | destinatário e assunto do formulário; não atualiza HTML sozinho |
