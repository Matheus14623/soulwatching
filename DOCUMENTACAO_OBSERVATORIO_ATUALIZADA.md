# Documentação atualizada do Observatório de Ideias

Atualizada em 15 de julho de 2026.

Esta documentação registra o estado implementado do projeto e complementa a auditoria anterior em `ia/estrutura geral observatório.md`. O documento anterior foi preservado como base histórica e referência; este arquivo descreve a arquitetura depois da expansão.

## 1. Visão do produto

O Observatório de Ideias é um sistema editorial pessoal para organizar hipóteses, relações e experiências de interface. A home é a entrada do sistema, não o contêiner de todo o conteúdo. Cada rota aprofunda uma função:

| Rota | Papel |
| --- | --- |
| `/index.html` | Apresenta o campo, oferece acesso às áreas, mostra um recorte e preserva as experiências de identidade. |
| `/Teorias/teorias.html` | Arquivo principal de hipóteses, com busca, filtros combinados, seleção e dossiês. |
| `/Mapa/mapa.html` | Visualização das relações entre teorias e eixos. |
| `/Arquivo/arquivo.html` | Define os futuros tipos editoriais e exibe o estado vazio sem inventar publicações. |
| `/Laboratorio/laboratorio.html` | Reúne as experiências existentes e seus critérios técnicos. |
| `/teorias.html` | Compatibilidade com links antigos por redirecionamento. |

### Princípios

- Preservar a atmosfera cósmica, contemplativa e tecnológica da versão existente.
- Separar teoria, metáfora, pergunta e conteúdo publicado.
- Não usar conteúdo fictício para preencher páginas vazias.
- Usar uma fonte de dados para todas as visualizações de teoria.
- Manter interações opcionais, acessíveis e proporcionais ao valor que entregam.
- Crescer por rotas e módulos, evitando transformar a home em uma página infinita.

## 2. Arquitetura atual

O site é uma aplicação estática multipágina. Cada rota é um HTML real, servido diretamente pela Vercel. A navegação não depende de um roteador client-side.

```text
HTML de cada rota
  |-- CSS global: assets/css/styles.css
  |-- CSS compartilhado de páginas internas: assets/css/observatory-pages.css
  |-- CSS específico da rota
  |-- navegação compartilhada: assets/js/navigation.js
  `-- módulo específico quando necessário

assets/data/theories.js
  |-- recorte da home: assets/js/theory-lab.js
  |-- arquivo completo: Teorias/teorias.js
  `-- relações e eixos: Mapa/mapa.js
```

### Decisões técnicas

- HTML semântico para conteúdo e navegação.
- CSS próprio com tokens globais, componentes e camadas específicas.
- JavaScript em módulos ES nativos.
- Nenhuma dependência de interface, gráfico ou áudio.
- Renderização client-side somente onde os dados se repetem ou a interação exige estado.
- Arquivos HTML reais para reduzir risco de configuração de rotas na hospedagem estática.
- Verificação em Node.js, sem compilação de assets.

## 3. Tecnologias

- HTML5 semântico.
- CSS moderno: custom properties, Grid, Flexbox, `clamp()`, media queries e `prefers-reduced-motion`.
- JavaScript ES modules.
- Canvas 2D para visão estelar e ressonância.
- Web Audio API com consentimento explícito.
- IntersectionObserver para limitar trabalho visual fora da tela.
- History API para URLs diretas das teorias.
- Node.js para servidor local e verificação.
- Vercel como hospedagem estática.

Não há framework, TypeScript, bundler, CMS, banco de dados ou backend.

## 4. Estrutura de pastas

```text
.
|-- index.html
|-- teorias.html
|-- Arquivo/
|   |-- arquivo.html
|   `-- arquivo.css
|-- Laboratorio/
|   |-- laboratorio.html
|   `-- laboratorio.css
|-- Mapa/
|   |-- mapa.html
|   |-- mapa.css
|   `-- mapa.js
|-- Teorias/
|   |-- teorias.html
|   |-- teorias.css
|   |-- teorias.js
|   `-- fontes editoriais brutas
|-- assets/
|   |-- css/
|   |   |-- styles.css
|   |   `-- observatory-pages.css
|   |-- data/theories.js
|   |-- icons/favicon.svg
|   |-- images/
|   `-- js/
|       |-- main.js
|       |-- page-shell.js
|       |-- navigation.js
|       |-- theory-lab.js
|       |-- observer.js
|       |-- philosophy.js
|       |-- resonance.js
|       |-- contact.js
|       |-- config.js
|       `-- utils.js
|-- docs/INTEGRACAO_TEORIAS.md
|-- scripts/
|   |-- serve.mjs
|   `-- verify.mjs
|-- package.json
`-- vercel.json
```

## 5. Identidade visual

### Linguagem

O sistema visual combina arquivo técnico, observatório e interface cósmica. A estética se apoia em fundo escuro, pontos luminosos, linhas orbitais, transparências controladas e tipografia de alto contraste.

### Tokens e componentes

Os tokens principais ficam em `assets/css/styles.css`: cores de fundo e texto, acentos ciano/violeta/dourado, espaços, raios, bordas e sombras. `assets/css/observatory-pages.css` compartilha a linguagem de heros internos, cartões de estado, grids de definição, painéis vazios e chamadas finais.

Componentes visuais recorrentes:

- cabeçalho com marca, navegação, estado e selo beta;
- hero com eyebrow, título, texto e ações;
- cartões translúcidos com borda e brilho moderado;
- filtros em trilha horizontal;
- tags e códigos monoespaçados;
- estados ativos por cor, borda e contraste, nunca apenas por animação;
- rodapé compacto com rotas internas e coordenadas externas.

### Responsividade e movimento

- Grids viram uma coluna em telas pequenas.
- A navegação usa menu expansível e devolve foco ao botão ao fechar com Escape.
- O dossiê lateral das teorias vira detalhe dentro do card no mobile.
- O mapa abandona posicionamento absoluto e linhas no mobile, tornando-se uma lista semântica.
- A indicação fixa da visão estrutural não ocupa a tela pequena.
- Animações respeitam `prefers-reduced-motion`.
- Áudio permanece desligado até ação explícita.

### Tom de conteúdo

Todo texto público deve permanecer em português brasileiro, com voz reflexiva, clara, madura e levemente poética. O conteúdo pode usar imagens cósmicas quando elas explicam uma relação, mas não como ornamentação repetitiva. Evite linguagem corporativa, autoelogio, frases genéricas de portfólio e qualquer enquadramento de diário pessoal. Prefira termos concretos como hipótese, linha de pensamento, pergunta, tensão, arquivo, registro e campo de investigação.

Afirmações científicas precisam ser distinguidas de metáforas e especulações. Textos sobre Matheus devem situá-lo como origem humana e profissional do observatório, sem atribuir autoridade ou resultados não comprovados.

## 6. Páginas e componentes

### Home

A home possui as seguintes camadas:

1. hero e visão estelar opcional;
2. apresentação do campo;
3. gateway para Teorias, Mapa, Arquivo, Laboratório e GitHub;
4. recorte de seis teorias com filtros de categoria;
5. recorte visual do mapa;
6. explicação do arquivo editorial;
7. bússola filosófica acessível por abas;
8. experimento de ressonância com seis controles de teclado;
9. trajetória do projeto;
10. coordenadas e contato.

### Teorias

O arquivo possui dez entradas, nove linhas independentes, seis naturezas de conteúdo e sete eixos temáticos. O usuário pode combinar texto, categoria, natureza, estado do trabalho e conceito. No desktop, o dossiê fica ao lado da lista; no mobile, o mesmo conteúdo abre dentro do card.

Cada dossiê apresenta:

- ideia central;
- pergunta central;
- proposição;
- contexto conhecido;
- recorte em investigação;
- limite atual;
- caminho verificável;
- perguntas abertas;
- conceitos;
- próximos passos;
- referências externas;
- linhas relacionadas;
- versão e data de revisão;
- acesso direto ao mapa.

Percentuais de maturidade foram removidos. Hipóteses científicas, estudos teóricos, estruturas conceituais, linhas derivadas, heurísticas e programas práticos usam classificações explícitas.

### Mapa

O mapa é derivado de `THEORIES`. Ele contém dez nós, dezoito relações únicas e sete eixos. Linhas significam afinidade conceitual catalogada, não causalidade ou evidência científica.

No desktop, os nós usam as coordenadas editoriais `position`. No mobile, tornam-se botões em fluxo normal. Relações declaradas por qualquer uma das pontas são apresentadas de forma simétrica. A seleção atualiza o detalhe, as conexões e o parâmetro `teoria` da URL.

### Arquivo

A rota distingue quatro tipos de conteúdo:

- teorias: hipóteses ainda abertas;
- ensaios: argumentos editorados e publicáveis;
- registros: notas datadas sobre mudanças de pensamento;
- laboratório: experiências que testam uma pergunta pela interface.

O arquivo declara zero publicações no estado atual. Isso é intencional e evita preencher o site com títulos, datas ou resultados fictícios.

### Laboratório

O laboratório aponta para três experiências reais:

- visão estelar;
- cordas de ressonância;
- mapa de ideias.

Os experimentos permanecem em suas páginas de origem para evitar duplicação. A rota também registra os critérios de função, controle e peso técnico.

## 7. Dados editoriais

`assets/data/theories.js` contém `THEORY_FILTERS`, `THEORY_TYPES`, `THEORY_REVIEW_STATES` e `THEORIES`. A interface deriva contagens, opções de filtro e relações desses dados.

`assets/data/theory-references.js` concentra a bibliografia pública. `assets/data/research-tracks.js` mantém ideias que ainda não justificam uma ficha independente. `assets/js/theory-model.js` concentra localização e relações, evitando duplicação entre home, arquivo e mapa.

Os identificadores `id` e `slug` são contratos estáveis. `id` liga entradas entre si; `slug` cria URLs diretas. Fontes brutas são mapeadas somente em `scripts/theory-sources.mjs`, que não faz parte do artefato público.

O contrato completo e um exemplo estão em `docs/INTEGRACAO_TEORIAS.md`.

## 8. Como evoluir o conteúdo

### Criar uma nova linha

1. Preserve a fonte bruta em `Teorias/`.
2. Mapeie a fonte somente em `scripts/theory-sources.mjs`.
3. Crie uma síntese pública em `assets/data/theories.js`.
4. Use código, id e slug inéditos.
5. Classifique natureza e estado do trabalho.
6. Preencha contexto conhecido, proposta, limite e caminho verificável.
7. Cadastre referências externas por ID.
8. Conecte apenas ids válidos.
9. Escolha posição no mapa e teste sobreposição.
10. Execute a verificação e navegue pelas três superfícies que usam o dado.

### Criar uma nova página

1. Crie uma pasta com HTML e CSS próprios, seguindo o padrão de `Arquivo/` ou `Laboratorio/`.
2. Carregue `assets/css/styles.css` antes de `assets/css/observatory-pages.css` e, por último, o CSS da rota.
3. Carregue `assets/js/page-shell.js` para navegação comum. Use um módulo específico apenas quando houver estado próprio.
4. Dê à página `title`, descrição, canonical coerente quando o domínio estiver definido, um único `h1` e landmarks semânticos.
5. Inclua a rota nos cabeçalhos e rodapés relevantes.
6. Adicione o arquivo à lista obrigatória de `scripts/verify.mjs` quando ele fizer parte do núcleo do produto.
7. Teste caminhos relativos a partir da raiz e de uma pasta interna.

### Adicionar o primeiro artigo, ensaio ou registro

O projeto ainda não possui publicações aprovadas. Quando o primeiro conteúdo real existir:

1. Classifique-o como ensaio, registro ou fragmento antes de criar a interface.
2. Preserve o texto-fonte e faça uma versão editorial pública separada.
3. Crie um catálogo compartilhado, por exemplo `assets/data/archive.js`, com pelo menos `id`, `slug`, `type`, `title`, `summary`, `status`, `tags`, `sourceFile` e uma data somente quando ela for conhecida.
4. Crie uma rota de leitura real ou uma página de índice em `Arquivo/`; não use cards que apontem para páginas inexistentes.
5. Faça a home consumir apenas um recorte do mesmo catálogo, sem duplicar títulos no HTML.
6. Adicione validação do novo schema e das novas rotas em `scripts/verify.mjs`.
7. Só substitua o estado vazio do Arquivo depois que ao menos uma publicação estiver revisada e navegável.

Ensaios devem conter argumento desenvolvido. Registros podem documentar mudanças conceituais datadas. Fragmentos podem ser breves, mas precisam de contexto e estado editorial. Nenhum dos três deve ser tratado como diário.

### Criar um novo experimento

1. Defina a pergunta que a interação ajuda a explorar.
2. Escolha HTML/CSS quando possível; use canvas apenas quando o desenho contínuo justificar.
3. Garanta controle equivalente por teclado e texto explicativo.
4. Não inicie áudio sem consentimento.
5. Pause loops quando a experiência estiver fora da tela ou a aba estiver oculta.
6. Respeite redução de movimento e ofereça um estado estático compreensível.
7. Adicione o experimento à rota do Laboratório somente quando existir uma implementação real.

## 9. Manutenção

### Antes de cada publicação

```bash
npm run build
```

Em seguida, teste manualmente:

- navegação interna e retorno à home;
- busca e cada dimensão de filtro;
- uma URL direta de teoria no arquivo e no mapa;
- menu, cards, dossiê e mapa em 390 px;
- foco visível e Escape no menu;
- visão estelar com redução de movimento;
- ressonância com áudio desligado e controles de teclado;
- console sem erros;
- links externos, `mailto:` e `tel:`.

### Regras de conteúdo

- Não publicar rascunhos brutos por automação.
- Não inventar datas, fontes, depoimentos, métricas ou projetos.
- Marcar hipóteses como hipóteses.
- Registrar a origem somente no mapeamento privado `scripts/theory-sources.mjs`.
- Evitar renomear slugs publicados; quando necessário, criar compatibilidade.
- Revisar relações em ambos os sentidos conceituais, ainda que o mapa remova duplicatas técnicas.

### Regras técnicas

- Manter módulos pequenos e específicos.
- Evitar regras CSS globais para uma única rota.
- Não duplicar dados de teoria no HTML.
- Preservar caminhos relativos e diferenças de maiúsculas/minúsculas.
- Não adicionar dependência para um recurso que o navegador já fornece de forma suficiente.

## 10. Limitações atuais

- O conteúdo é um módulo JavaScript editado manualmente; não há CMS nem painel editorial.
- Busca e filtros rodam apenas no cliente.
- URLs usam query string, não rotas individuais por teoria.
- Canonical e sitemap completos dependem da definição do domínio público final.
- O formulário usa `mailto:`; não há confirmação de entrega nem proteção de backend.
- O mapa usa posições manuais e pode exigir ajuste quando o número de nós crescer.
- Não há testes unitários ou de regressão visual automatizados.
- Não há analytics, consentimento ou telemetria.
- As relações do mapa ainda não possuem tipos explícitos.

## 11. Melhorias futuras

Prioridade alta:

- definir domínio canônico e gerar sitemap absoluto;
- criar testes automatizados de smoke e acessibilidade;
- oferecer redirecionamentos para slugs renomeados;
- tipar relações conceituais sem quebrar os ids existentes.

Prioridade média:

- separar conceitos em um catálogo próprio;
- criar página individual por teoria quando houver conteúdo suficiente;
- adicionar busca por URL e compartilhamento de conjuntos de filtros;
- gerar automaticamente uma legenda de tipos de relação;
- introduzir publicação real de ensaios quando existir conteúdo aprovado.

Somente quando a escala justificar:

- CMS ou arquivos Markdown com schema validado;
- geração estática de páginas por teoria;
- índice de busca pré-calculado;
- testes visuais em múltiplos navegadores;
- observabilidade de erros e desempenho com política de privacidade.

## 12. Transição futura para Vite ou Next.js

### Quando Vite faz sentido

Vite é o primeiro passo natural se surgirem muitos módulos, componentes reutilizados ou necessidade de testes e otimização de assets. A migração pode preservar o modelo multipágina:

1. mover o código-fonte para uma estrutura `src/` e `public/`;
2. transformar cabeçalho, rodapé e cards em componentes ou templates;
3. manter `theories.js` como módulo tipado ou migrá-lo para JSON/TypeScript;
4. configurar entradas multipágina para home, teorias, mapa, arquivo e laboratório;
5. preservar `dist/` como único artefato público.

### Quando Next.js faz sentido

Next.js se justifica quando houver páginas individuais geradas por slug, conteúdo Markdown/MDX, CMS, preview editorial, metadata por teoria ou rotas de API. Uma transição segura deve:

1. criar rotas estáticas para as páginas atuais;
2. criar `/teorias/[slug]` com geração estática;
3. preservar redirects de `?teoria=` e `/teorias.html`;
4. transformar o schema em TypeScript validado;
5. isolar canvas e Web Audio em componentes client-only;
6. confirmar que todo conteúdo editorial pode ser gerado no build;
7. manter o mapa leve e evitar enviar o conjunto completo quando a escala crescer.

Não há motivo técnico para migrar agora: a stack atual atende dez teorias e cinco rotas com baixa complexidade operacional.

## 13. Riscos de deploy na Vercel

| Risco | Efeito | Mitigação |
| --- | --- | --- |
| Falha ao gerar `dist/` | Deploy vazio ou falho | Executar `npm run build` e validar o artefato antes da publicação. |
| Introduzir rotas de SPA | Atualização direta retorna 404 | Continuar com HTML real ou configurar rewrites deliberadamente. |
| Diferença de caixa em nomes de pasta | Funciona no Windows e falha no Linux | Preservar exatamente `Teorias`, `Mapa`, `Arquivo` e `Laboratorio`. |
| Abrir por `file://` durante o teste | Módulos ES não carregam | Usar `npm run dev`. |
| Renomear slugs | Links compartilhados perdem contexto | Manter slugs ou criar redirect/alias. |
| Publicar fontes brutas | Conteúdo interno ou pessoal fica acessível | Gerar `dist/` por allowlist e testar extensões proibidas. |
| Crescer o mapa sem revisar posições | Nós sobrepostos no desktop | Ajustar `position` e testar em viewport amplo. |
| Adicionar fontes/CDNs externas sem política | Privacidade, indisponibilidade e CSP | Preferir assets locais e documentar qualquer exceção. |

`vercel.json` usa `framework: null`, `outputDirectory: "dist"`, `cleanUrls: true` e `trailingSlash: false`. `npm run build` valida o projeto, limpa a saída anterior e copia somente os caminhos públicos permitidos.

## 14. Testes executados nesta expansão

### Automáticos

- sintaxe de todos os módulos JavaScript;
- presença de arquivos e rotas obrigatórias;
- schema e unicidade de id/slug;
- natureza, estado, revisão e coordenadas;
- categorias, filtros, referências, fontes privadas e relações válidas;
- links locais e âncoras dos HTML;
- ausência de comentários HTML, caminhos internos e linguagem de bastidor nos dados públicos;
- artefato `dist/` sem documentos, fontes brutas ou scripts.

### Navegador — desktop 1440 × 900

- home, teorias, mapa, arquivo e laboratório carregados;
- dez entradas, seis naturezas e sete eixos renderizados;
- busca textual, estado vazio, limpeza e filtros por categoria e natureza funcionais;
- URL direta restaurando a T-08, com vínculo navegável para a linha principal T-02;
- mapa com dez nós, dezoito relações únicas, filtros e seleção sincronizada;
- Visão Estelar ativada e desativada repetidamente sem duplicar overlay ou canvas;
- nenhum elemento do sistema visual descartado de buraco negro;
- estouro horizontal ausente;
- console sem erros ou avisos.

### Navegador — responsividade

- arquivo de teorias verificado em 1024 × 768, 768 × 900, 430 × 932, 390 × 844 e 360 × 800;
- dossiê lateral usado em desktop e detalhe móvel usado a partir de 768 px;
- as quatro camadas críticas e as referências permanecem disponíveis no detalhe móvel;
- mapa verificado em 390 × 844, com nós, detalhe e seleção preservados;
- home, arquivo e laboratório verificados em 360 × 800;
- Visão Estelar entra no perfil leve em 360 px;
- nenhuma das larguras apresentou estouro horizontal ou erros no console.

## 15. Checklist para próxima grande atualização

- [ ] Preservar o documento histórico e registrar uma nova data de arquitetura.
- [ ] Confirmar se a nova demanda é conteúdo, página, experimento ou infraestrutura.
- [ ] Revisar os materiais brutos antes de criar dados públicos.
- [ ] Atualizar o schema e a verificação antes de depender de novos campos.
- [ ] Evitar renomear ids e slugs existentes.
- [ ] Atualizar todas as navegações quando houver nova rota principal.
- [ ] Validar home, Teorias e Mapa após qualquer mudança em `theories.js`.
- [ ] Testar desktop, tablet, mobile, teclado e redução de movimento.
- [ ] Verificar console, links, âncoras, metadados e caminhos com caixa correta.
- [ ] Rodar `npm run build` antes do deploy.
- [ ] Revisar `vercel.json` se a saída deixar de ser a raiz.
- [ ] Atualizar README, integração de teorias e esta documentação.

## 16. Referências internas

- Auditoria anterior: `ia/estrutura geral observatório.md`.
- Integração de dados: `docs/INTEGRACAO_TEORIAS.md`.
- Fonte estruturada: `assets/data/theories.js`.
- Validação: `scripts/verify.mjs`.
- Configuração de deploy: `vercel.json`.

## 17. O que mudou nesta atualização

- A home passou a funcionar como gateway, com cinco destinos reais e contagens derivadas dos dados.
- A navegação foi ampliada e ganhou indicação de página ativa e comportamento de teclado mais completo.
- O arquivo de teorias recebeu naturezas, estados do trabalho, slugs, campos editoriais derivados e origem mantida fora do conteúdo público.
- A página de teorias ganhou busca ampliada, filtros combinados, resumo de filtros, reset, dossiê progressivo, links diretos e detalhe móvel no próprio card.
- O Mapa de Ideias tornou-se uma página independente, leve e derivada da mesma fonte de dados.
- Arquivo e Laboratório ganharam páginas honestas, sem publicações ou projetos fictícios.
- As experiências existentes foram preservadas; a visão estelar ficou desligada por padrão e com menos partículas quando ativada.
- Bússola filosófica, ressonância e navegação receberam melhorias de semântica, teclado e redução de movimento.
- A verificação passou a cobrir as novas rotas, o schema das teorias, relações, fontes, links e âncoras.
- README, integração de teorias e esta documentação foram atualizados sem apagar a auditoria anterior.

## 18. Atualização de clareza científica e privacidade

Esta expansão preserva a identidade visual e as rotas do observatório, mas altera a forma de apresentar o acervo:

- “teorias” passa a ser uma área de linhas de investigação com naturezas explícitas;
- percentuais editoriais deixam de aparecer nos dados e nas interfaces;
- cada ficha separa contexto conhecido, recorte em investigação, limite atual e caminho verificável;
- referências externas, versão e data de revisão passam a integrar o dossiê;
- T-08 permanece ligada à T-02 como linha derivada, sem inflar o número de núcleos independentes;
- ideias ainda não catalogadas entram em um radar próprio;
- relações são calculadas por um módulo compartilhado e apresentadas simetricamente;
- comentários e blocos desativados são proibidos nos arquivos públicos de produção;
- fontes brutas, documentos, pareceres e scripts ficam fora de `dist/`;
- a Visão Estelar original foi preservada sem qualquer sistema visual de buraco negro.

Novos efeitos cósmicos não devem ser inferidos a partir do conteúdo das teorias. Experimentos visuais pertencem ao laboratório e só entram quando possuírem função conceitual, ciclo de vida controlado, movimento reduzido e custo proporcional ao dispositivo.
