# Observatório de Ideias — Matheus Camargo

Site estático, responsivo e interativo concebido como um observatório de ideias: um sistema editorial para hipóteses, estudos teóricos, estruturas conceituais, programas práticos, relações e experiências de interface.

## Rotas principais

- `/index.html`: home e gateway do observatório.
- `/Teorias/teorias.html`: catálogo com busca, filtros, comparação, dossiês críticos, revisão individual e URLs diretas.
- `/Mapa/mapa.html`: mapa conceitual leve derivado dos mesmos dados das teorias.
- `/GrandesNomes/grandes-nomes.html`: perfis documentados, com galeria, comparação, trilhas, linha do tempo e URLs diretas.
- `/Constelacoes/constelacoes.html`: atlas educativo com linhas-guia, fontes, seleção acessível e modo treino.
- `/Arquivo/arquivo.html`: arquitetura editorial e estado honesto do arquivo.
- `/Arquivo/publicacoes/<slug>.html`: leitura estática completa, inclusive sem JavaScript, gerada somente quando uma publicação real é aprovada; o catálogo atual contém zero publicações e zero entidades `party` de crédito.
- `/Laboratorio/laboratorio.html`: catálogo central de experiências.
- `/Laboratorio/experimento.html?experimento=<slug>`: executor compartilhado dos simuladores didáticos catalogados.
- `/Rotas/rotas.html`: percursos guiados derivados do catálogo entre história da ciência, teorias e experiências.
- `/Contribuicoes/contribuicoes.html`: política e formulário local para propostas externas com crédito explícito.
- `/teorias.html`: redirecionamento legado para a rota atual de teorias.

As URLs de teoria usam o parâmetro `teoria`, por exemplo:

```text
/Teorias/teorias.html?teoria=zero-epsilon
/Mapa/mapa.html?teoria=zero-epsilon
/GrandesNomes/grandes-nomes.html?perfil=albert-einstein
/GrandesNomes/grandes-nomes.html?comparar=albert-einstein,henri-poincare
/Constelacoes/constelacoes.html?constelacao=orion
/Constelacoes/constelacoes.html?modo=treino
/Rotas/rotas.html?rota=tempo-gravidade-causalidade&etapa=3
/Laboratorio/experimento.html?experimento=cone-de-luz
```

## Como rodar localmente

Requisito declarado: Node.js `22.x`, alinhado com `.nvmrc`, desenvolvimento, CI e runtime de build da Vercel.

Com NVM:

```bash
nvm install 22
nvm use 22
node --version
```

```bash
npm run dev
```

Abra `http://localhost:5173`.

Não abra os HTML diretamente por `file://`, porque os módulos JavaScript precisam de um servidor. Prefira o servidor do projeto: um servidor genérico apontado para a raiz pode expor documentação e materiais que não pertencem ao site público.

## Verificação e build

```bash
npm run verify
npm run verify:editorial
npm run content:check
npm run build
npm test
```

`npm run content:check` valida schemas, IDs, aliases, relações, referências, revisões e créditos. `npm run verify` regenera o runtime determinístico e valida apenas a superfície pública: sintaxe, manifesto, referências internas, âncoras e linguagem. `npm run verify:editorial` acrescenta as fontes privadas e a base de conhecimento, sem levá-las a `dist/`. `npm run build` repete os gates públicos e gera o artefato pela allowlist. `npm test` executa smoke tests HTTP, contratos e jornadas em Chrome, Chromium ou Edge; o navegador pode ser ignorado localmente quando não está instalado, mas é instalado e obrigatório na CI. Para testar o artefato final, use `npm run preview`.

Use `npm run check:links` para a verificação online de destinos externos — ela também roda semanalmente na CI. `npm run content:rollback` restaura o último runtime válido somente como contingência; antes de publicar, reconcilie a fonte canônica e confirme com `npm run content:build -- --check`.

## Estrutura

```text
.
|-- index.html
|-- teorias.html                    # redirecionamento legado
|-- Arquivo/
|   |-- arquivo.html
|   |-- arquivo.css
|   |-- arquivo.js
|   |-- publicacao.html
|   |-- publicacao.css
|   `-- publicacao.js
|-- Laboratorio/
|   |-- laboratorio.html
|   |-- laboratorio.css
|   |-- laboratorio.js
|   |-- experimento.html
|   |-- experimento.css
|   |-- experimento.js
|   `-- simulations/
|-- Rotas/
|   |-- rotas.html
|   |-- rotas.css
|   `-- rotas.js
|-- Contribuicoes/
|   |-- contribuicoes.html
|   |-- contribuicoes.css
|   `-- contribuicoes.js
|-- GrandesNomes/
|   |-- grandes-nomes.html
|   |-- grandes-nomes.css
|   `-- grandes-nomes.js
|-- Constelacoes/
|   |-- constelacoes.html
|   |-- constelacoes.css
|   `-- constelacoes.js
|-- Mapa/
|   |-- mapa.html
|   |-- mapa.css
|   `-- mapa.js
|-- Teorias/
|   |-- teorias.html
|   |-- teorias.css
|   |-- teorias.js
|   `-- materiais editoriais brutos
|-- assets/
|   |-- css/
|   |   |-- styles.css
|   |   `-- observatory-pages.css
|   |-- data/
|   |   |-- generated/              # runtime público compilado; não editar
|   |   |-- theories.js             # adaptador legado
|   |   |-- theory-references.js
|   |   |-- research-tracks.js
|   |   |-- notable-figures.js
|   |   |-- notable-figure-references.js
|   |   |-- constellations.js
|   |   |-- experiments.js
|   |   |-- learning-paths.js
|   |   `-- contributions.js
|   |-- icons/
|   |-- images/
|   |   `-- grandes-nomes/
|   |-- vendor/
|   |   `-- swiper/
|   `-- js/
|       |-- main.js
|       |-- page-shell.js
|       |-- navigation.js
|       |-- smooth-scroll.js
|       |-- theory-model.js
|       |-- notable-figures-model.js
|       |-- notable-figures-preview.js
|       |-- constellation-model.js
|       |-- constellation-chart.js
|       |-- constellations-preview.js
|       |-- global-search.js
|       |-- site-metrics.js
|       |-- learning-paths-model.js
|       |-- learning-paths-preview.js
|       |-- theory-figure-model.js
|       |-- theory-lab.js
|       |-- observer.js
|       |-- philosophy.js
|       |-- resonance.js
|       |-- contact.js
|       |-- config.js
|       `-- utils.js
|-- content/
|   |-- public/                     # entidades, relações, taxonomias e ledger públicos
|   `-- schemas/                    # contratos fechados e versionados
|-- docs/
|   `-- INTEGRACAO_TEORIAS.md
|-- scripts/
|   |-- build.mjs
|   |-- check-external-links.mjs
|   |-- check-syntax.mjs
|   |-- content/
|   |-- publication-pages.mjs
|   |-- public-metadata.mjs
|   |-- public-manifest.mjs
|   |-- serve.mjs
|   |-- theory-sources.mjs
|   |-- verify.mjs
|   |-- verify-editorial.mjs
|   `-- tests/
|-- .github/workflows/quality.yml
|-- dist/                           # artefato público gerado e ignorado pelo Git
|-- DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md
|-- package.json
`-- vercel.json
```

## Arquitetura

O projeto preserva a stack estática existente: HTML semântico, CSS próprio e módulos ES nativos, sem framework. A galeria usa somente o Swiper 14.0.6 fixado e servido localmente, mantendo o deploy direto na Vercel sem dependência de CDN em runtime.

`content/public/` é a fonte canônica granular para teorias, perfis, partes públicas autorizadas, publicações, constelações, experiências, rotas guiadas, radar, metadados de páginas institucionais, referências, relações, taxonomias e ledger de revisões. O compilador valida essa fonte pelos contratos de `content/schemas/` e gera módulos imutáveis em `assets/data/generated/`. Os módulos históricos em `assets/data/` permanecem apenas como adaptadores de compatibilidade; código novo deve consumir `ContentRepository` ou os exports gerados específicos. Modelos compartilhados resolvem relações, projeções inversas e etapas guiadas; cada rota controla apenas sua apresentação.

`assets/js/content-source.js`, `content-repository.js` e `content-platform.js` formam a fronteira de leitura. O snapshot reúne entidades, taxonomias, coleções auxiliares, relações, referências, busca e métricas compondo os mesmos módulos públicos, sem duplicar os catálogos no download. `StaticContentSource` é a implementação ativa; `HttpContentSource` já implementa o mesmo contrato, cache e timeout, mas permanece inativo porque o projeto ainda não possui endpoint nem backend. As telas atuais continuam consumindo projeções estáticas específicas para manter inicialização síncrona e carregamento seletivo; ativar uma API exigirá migrar gradualmente essa inicialização para o repositório, não remodelar o conteúdo. A busca global usa o índice público gerado e não precisa baixar os dossiês completos.

## Recursos principais

- Home organizada como porta de entrada para as áreas do observatório.
- Linhas catalogadas com natureza explícita e revisão individual; totais são derivados pelo runtime.
- Busca por texto e filtros combináveis por categoria, natureza, estado do trabalho e conceito.
- Dossiê com afirmações referenciadas, objeções, rubrica, critérios de revisão ou abandono, histórico individual e relações tipadas.
- Comparação compartilhável entre duas linhas e vínculos inversos com os perfis históricos relacionados.
- Link direto por entrada, preservado entre arquivo e mapa.
- Radar separado para ensaios, simuladores e projetos que ainda não justificam uma nova ficha.
- Mapa derivado das mesmas relações tipadas, sem biblioteca gráfica pesada.
- Galeria de perfis em áreas documentadas, incluindo Henri Poincaré e John Stewart Bell, com fontes, retratos de direitos documentados e conexões delimitadas.
- Cards com arraste, coverflow leve, seleção por teclado e rotação de 30 segundos com pausa visível e respeito a movimento reduzido.
- Comparação de duas trajetórias, linha do tempo de métodos e descobertas e trilhas derivadas do catálogo.
- Três destaques de Grandes Nomes na home, gerados pelo mesmo catálogo da página completa.
- Atlas mestre–detalhe com busca, filtros sazonais, faixa de seleção, navegação por mouse, teclado ou toque, URL direta e distinção entre regiões oficiais, linhas-guia e asterismos.
- Treino do Atlas com oito rodadas, três alternativas distratoras definidas pelo controlador e revelação acessível do padrão.
- Três demonstrações de constelações na home, geradas pelo mesmo catálogo e renderizador SVG da rota completa.
- Arquivo editorial sem ensaios ou registros inventados e área separada para propostas externas com autoria explícita.
- Laboratório com experiências documentadas e simuladores didáticos, incluindo cone de luz, Zero vs. Epsilon, recorrência finita e astrobiologia probabilística.
- Rotas Guiadas com etapas e posição compartilhável por URL.
- Busca global por botão ou `Ctrl+K`/`Command+K` sobre o índice público gerado, incluindo páginas e seções institucionais da mesma fonte canônica.
- Navegação por teclado, rolagem interna suave, estados ARIA, redução de movimento e layouts móveis dedicados.
- Manifesto público compartilhado por servidor, verificador, build e testes; CI em push e pull request.

## Dados editoriais

Para adicionar ou revisar teorias, consulte o contrato canônico em [ai/domains/THEORY_CATALOG.md](ai/domains/THEORY_CATALOG.md). Para perfis, retratos, fontes e conexões da galeria, consulte [ai/domains/NOTABLE_FIGURES_CATALOG.md](ai/domains/NOTABLE_FIGURES_CATALOG.md). A operação unificada está em [ai/domains/CONTENT_OPERATIONS_AND_RELATIONS.md](ai/domains/CONTENT_OPERATIONS_AND_RELATIONS.md).

Use `npm run content:new -- --type <tipo> --id meu-id` para criar um rascunho local fora da árvore pública. Os tipos aceitos são `theory`, `figure`, `party`, `publication`, `constellation`, `experiment`, `path`, `research-track`, `site-page`, `reference` e `relation`. O comando não inventa conteúdo e o rascunho não entra no build. Depois da revisão editorial, forneça um JSON completo com `--source`; a instalação e as compilações concorrentes compartilham um lock durante leitura, validação, ledger, escrita e geração, e a instalação desfaz falhas capturadas. Esse mecanismo não substitui um journal editorial contra encerramento abrupto do processo; o journal e o manifesto de hashes existentes protegem especificamente o runtime gerado. Rode `npm run content:check` para validar a fonte, `npm run content:build` para regenerar os módulos e `npm run content:report` para atualizar o relatório privado de integridade. O relatório inclui uma fila estruturada dos vínculos legados experimento→teoria que exigem decisão editorial; ela prepara origem e destino, mas não inventa tipo, justificativa nem evidência.

Publicações internas e contribuições externas compartilham o mesmo contrato público de autoria, direitos, declarações, referências e histórico. Dados de contato, submissões originais, provas de consentimento e notas privadas nunca pertencem a `content/public/`. As raízes `.content-drafts/`, `.content-reports/`, `content/private/`, `submissions/` e `private-attachments/` são locais e estão excluídas do Git e do manifesto público.

Os arquivos da pasta `Teorias/` continuam preservados como material bruto e ficam fora de `dist/`. Uma entrada publicada precisa existir como registro validado em `content/public/`; caminhos internos são mantidos somente em `scripts/theory-sources.mjs`.

## Deploy na Vercel

O `vercel.json` mantém o projeto como site estático, com `dist/` como única raiz pública e URLs limpas. Antes de publicar:

```bash
npm run build
```

O build usa `scripts/public-manifest.mjs` como lista explícita de páginas e assets. Ele compila a fonte canônica, monta `dist/` em staging, sincroniza contagens e descrições de fallback com as métricas geradas, copia somente os DTOs e adaptadores necessários, prerenderiza publicações aprovadas e então promove o artefato por uma transação recuperável. Uma falha antes da promoção preserva o `dist/` anterior; uma troca interrompida é recuperada no próximo build. Canonical, Open Graph, dados estruturados, sitemap e robots usam `PUBLIC_SITE_ORIGIN` ou a URL de produção da Vercel; em ambiente de deploy, a ausência de uma origem válida interrompe o build. Documentos, pareceres, relatórios, rascunhos, submissões, fontes brutas e materiais internos não entram no artefato. O mesmo manifesto limita o servidor de desenvolvimento e alimenta os smoke tests de rotas. Os headers incluem HSTS e CSP aplicada sem liberar scripts ou estilos inline; a suíte de navegador também executa uma navegação com esses headers.

## Contato e presença profissional

- E-mail: `Matheuscamargodealencar@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/gomin/`
- GitHub: `https://github.com/Matheus14623`

O formulário usa `mailto:` e não envia informações para um backend. O telefone pessoal não faz parte dos canais públicos do projeto.

## Princípio editorial

As entradas são apresentadas de acordo com sua natureza real. Hipóteses não aparecem como fatos, frameworks não aparecem como física, heurísticas não aparecem como cosmologia e referências não são tratadas como confirmação automática.
