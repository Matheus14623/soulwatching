# Observatório de Ideias — Matheus Camargo

Site estático, responsivo e interativo concebido como um observatório de ideias: um sistema editorial para hipóteses, estudos teóricos, estruturas conceituais, programas práticos, relações e experiências de interface.

## Rotas principais

- `/index.html`: home e gateway do observatório.
- `/Teorias/teorias.html`: catálogo com busca, filtros, comparação, dossiês críticos, revisão individual e URLs diretas.
- `/Mapa/mapa.html`: mapa conceitual leve derivado dos mesmos dados das teorias.
- `/GrandesNomes/grandes-nomes.html`: 22 perfis documentados, com galeria, comparação, trilhas, linha do tempo e URLs diretas.
- `/Constelacoes/constelacoes.html`: atlas educativo com 12 constelações, linhas-guia, fontes, seleção acessível e modo treino.
- `/Arquivo/arquivo.html`: arquitetura editorial e estado honesto do arquivo.
- `/Laboratorio/laboratorio.html`: catálogo central de nove experiências.
- `/Laboratorio/experimento.html?experimento=<slug>`: executor compartilhado dos quatro simuladores didáticos.
- `/Rotas/rotas.html`: quatro percursos guiados entre história da ciência, teorias e experiências.
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

Requisito declarado: Node.js `>=18.17 <25`. A versão recomendada e usada pela CI é a 22, registrada em `.nvmrc`.

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
npm run build
npm test
```

`npm run verify` valida estrutura, referências, relações, links, linguagem pública e sincronização da base de conhecimento. `npm run build` repete a validação e gera `dist/` pelo manifesto público. `npm test` também executa smoke tests HTTP, contratos de acessibilidade e um smoke em Chrome, Chromium ou Edge quando disponível. Para testar o artefato final, use `npm run preview`.

## Estrutura

```text
.
|-- index.html
|-- teorias.html                    # redirecionamento legado
|-- Arquivo/
|   |-- arquivo.html
|   `-- arquivo.css
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
|   |   |-- theories.js
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
|-- docs/
|   `-- INTEGRACAO_TEORIAS.md
|-- scripts/
|   |-- build.mjs
|   |-- public-manifest.mjs
|   |-- serve.mjs
|   |-- theory-sources.mjs
|   |-- verify.mjs
|   `-- tests/
|-- .github/workflows/quality.yml
|-- dist/                           # artefato público gerado e ignorado pelo Git
|-- DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md
|-- package.json
`-- vercel.json
```

## Arquitetura

O projeto preserva a stack estática existente: HTML semântico, CSS próprio e módulos ES nativos, sem framework. A galeria usa somente o Swiper 14.0.6 fixado e servido localmente, mantendo o deploy direto na Vercel sem dependência de CDN em runtime.

`assets/data/theories.js`, `notable-figures.js`, `constellations.js`, `experiments.js`, `learning-paths.js` e `contributions.js` são os catálogos públicos centrais. Modelos compartilhados resolvem relações, perfis inversos e etapas guiadas; cada rota controla apenas sua apresentação. `navigation.js` inicializa menu, busca global, métricas e rolagem. A busca carrega os catálogos sob demanda, e o executor do Laboratório importa somente o simulador solicitado.

## Recursos principais

- Home organizada como porta de entrada para as áreas do observatório.
- Dez linhas catalogadas, com seis naturezas e revisão individual.
- Busca por texto e filtros combináveis por categoria, natureza, estado do trabalho e conceito.
- Dossiê com afirmações referenciadas, objeções, rubrica, critérios de revisão ou abandono, histórico individual e relações tipadas.
- Comparação compartilhável entre duas linhas e vínculos inversos com os perfis históricos relacionados.
- Link direto por entrada, preservado entre arquivo e mapa.
- Radar separado para ensaios, simuladores e projetos que ainda não justificam uma nova ficha.
- Mapa derivado das mesmas relações tipadas, sem biblioteca gráfica pesada.
- Galeria com 22 perfis em três áreas, incluindo Henri Poincaré e John Stewart Bell, com fontes, retratos de direitos documentados e conexões delimitadas.
- Cards com arraste, coverflow leve, seleção por teclado e rotação de 30 segundos com pausa visível e respeito a movimento reduzido.
- Comparação de duas trajetórias, linha do tempo de métodos e descobertas e quatro trilhas: medir distâncias, gravidade, quântica e filosofia do teste.
- Três destaques de Grandes Nomes na home, gerados pelo mesmo catálogo da página completa.
- Atlas mestre–detalhe com 12 constelações, busca, filtros sazonais, faixa de seleção, navegação por mouse, teclado ou toque, URL direta e distinção entre regiões oficiais, linhas-guia e asterismos.
- Treino do Atlas com oito rodadas, quatro respostas e revelação acessível do padrão.
- Três demonstrações de constelações na home, geradas pelo mesmo catálogo e renderizador SVG da rota completa.
- Arquivo editorial sem ensaios ou registros inventados e área separada para propostas externas com autoria explícita.
- Laboratório com catálogo de nove experiências e quatro simuladores: cone de luz, Zero vs. Epsilon, recorrência finita e astrobiologia probabilística.
- Quatro Rotas Guiadas com cinco etapas cada e posição compartilhável por URL.
- Busca global por botão ou `Ctrl+K`/`Command+K` sobre seis catálogos públicos.
- Navegação por teclado, rolagem interna suave, estados ARIA, redução de movimento e layouts móveis dedicados.
- Manifesto público compartilhado por servidor, verificador, build e testes; CI em push e pull request.

## Dados editoriais

Para adicionar ou revisar teorias, consulte o contrato canônico em [ai/domains/THEORY_CATALOG.md](ai/domains/THEORY_CATALOG.md). Para perfis, retratos, fontes e conexões da galeria, consulte [ai/domains/NOTABLE_FIGURES_CATALOG.md](ai/domains/NOTABLE_FIGURES_CATALOG.md). A documentação ampla de arquitetura, manutenção e deploy está em [DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md](DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md); `docs/INTEGRACAO_TEORIAS.md` permanece como especificação anterior.

Os arquivos da pasta `Teorias/` continuam preservados como material bruto e ficam fora de `dist/`. A entrada pública precisa passar pela estrutura editorial de `assets/data/theories.js`; caminhos internos são mantidos somente em `scripts/theory-sources.mjs`.

## Deploy na Vercel

O `vercel.json` mantém o projeto como site estático, com `dist/` como única raiz pública e URLs limpas. Antes de publicar:

```bash
npm run build
```

O build usa `scripts/public-manifest.mjs` como lista explícita de páginas e assets. Documentos, pareceres, scripts, fontes brutas e materiais internos não entram no artefato. O mesmo manifesto limita o servidor de desenvolvimento e alimenta os smoke tests de rotas.

## Contato e presença profissional

- E-mail: `Matheuscamargodealencar@gmail.com`
- Telefone: `11 91363-9989`
- LinkedIn: `https://www.linkedin.com/in/gomin/`
- GitHub: `https://github.com/Matheus14623`

Esses dados ficam centralizados em `assets/js/config.js`. O formulário usa `mailto:` e não envia informações para um backend.

## Princípio editorial

As entradas são apresentadas de acordo com sua natureza real. Hipóteses não aparecem como fatos, frameworks não aparecem como física, heurísticas não aparecem como cosmologia e referências não são tratadas como confirmação automática.
