# Observatório de Ideias — Matheus Camargo

Site estático, responsivo e interativo concebido como um observatório de ideias: um sistema editorial para hipóteses, estudos teóricos, estruturas conceituais, programas práticos, relações e experiências de interface.

## Rotas principais

- `/index.html`: home e gateway do observatório.
- `/Teorias/teorias.html`: arquivo navegável com busca, filtros combinados, dossiês e URLs diretas.
- `/Mapa/mapa.html`: mapa conceitual leve derivado dos mesmos dados das teorias.
- `/GrandesNomes/grandes-nomes.html`: galeria documentada de cientistas e filósofos, com busca, filtros, dossiês e URLs diretas.
- `/Arquivo/arquivo.html`: arquitetura editorial e estado honesto do arquivo.
- `/Laboratorio/laboratorio.html`: índice dos experimentos existentes.
- `/teorias.html`: redirecionamento legado para a rota atual de teorias.

As URLs de teoria usam o parâmetro `teoria`, por exemplo:

```text
/Teorias/teorias.html?teoria=zero-epsilon
/Mapa/mapa.html?teoria=zero-epsilon
/GrandesNomes/grandes-nomes.html?perfil=albert-einstein
```

## Como rodar localmente

Requisito: Node.js 18 ou superior.

```bash
npm run dev
```

Abra `http://localhost:5173`.

Também é possível servir o diretório com qualquer servidor HTTP estático. Não abra os HTML diretamente por `file://`, porque os módulos JavaScript precisam de um servidor.

## Verificação e build

```bash
npm run verify
npm run build
```

`npm run verify` valida a estrutura, o schema, as referências, as relações, os links, a linguagem pública e a ausência de comentários nos arquivos públicos. `npm run build` repete a validação e gera `dist/` somente com arquivos autorizados para publicação.

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
|   `-- laboratorio.css
|-- GrandesNomes/
|   |-- grandes-nomes.html
|   |-- grandes-nomes.css
|   `-- grandes-nomes.js
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
|   |   `-- notable-figure-references.js
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
|   |-- serve.mjs
|   |-- theory-sources.mjs
|   `-- verify.mjs
|-- dist/                           # artefato público gerado e ignorado pelo Git
|-- DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md
|-- package.json
`-- vercel.json
```

## Arquitetura

O projeto preserva a stack estática existente: HTML semântico, CSS próprio e módulos ES nativos, sem framework. A galeria usa somente o Swiper 14.0.6 fixado e servido localmente, mantendo o deploy direto na Vercel sem dependência de CDN em runtime.

`assets/data/theories.js` é a fonte estruturada compartilhada pela home, pelo arquivo de teorias e pelo mapa. `assets/data/notable-figures.js` alimenta os três destaques da home e a galeria completa. Referências e linhas ainda em observação ficam em módulos próprios. Os modelos compartilhados concentram localização, busca e resolução de relações, enquanto cada rota controla apenas sua apresentação. `assets/js/smooth-scroll.js` centraliza a rolagem interna com uma curva curta, cancelamento por interação e fallback para movimento reduzido.

## Recursos principais

- Home organizada como porta de entrada para as áreas do observatório.
- Dez entradas catalogadas, nove linhas independentes, seis naturezas e sete eixos.
- Busca por texto e filtros combináveis por categoria, natureza, estado do trabalho e conceito.
- Dossiê com contexto conhecido, proposição, limite, caminho de teste, referências, versão e revisão.
- Link direto por entrada, preservado entre arquivo e mapa.
- Radar separado para ensaios, simuladores e projetos que ainda não justificam uma nova ficha.
- Mapa com dez nós e dezoito relações únicas, sem biblioteca gráfica pesada.
- Galeria com 20 perfis, três áreas, retratos licenciados, fontes institucionais e conexões editoriais delimitadas.
- Cards com arraste, coverflow leve, seleção por teclado e rotação de 30 segundos com pausa visível e respeito a movimento reduzido.
- Três destaques de Grandes Nomes na home, gerados pelo mesmo catálogo da página completa.
- Arquivo editorial sem publicações ou métricas inventadas.
- Laboratório com visão estelar, cordas de ressonância e mapa conceitual.
- Navegação por teclado, rolagem interna suave, estados ARIA, redução de movimento e layouts móveis dedicados.
- Verificação automatizada adequada ao build da Vercel.

## Dados editoriais

Para adicionar ou revisar teorias, consulte [docs/INTEGRACAO_TEORIAS.md](docs/INTEGRACAO_TEORIAS.md). Para perfis, retratos, fontes e conexões da galeria, consulte [ai/domains/NOTABLE_FIGURES_CATALOG.md](ai/domains/NOTABLE_FIGURES_CATALOG.md). A documentação ampla de arquitetura, manutenção, migração futura e deploy está em [DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md](DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md).

Os arquivos da pasta `Teorias/` continuam preservados como material bruto e ficam fora de `dist/`. A entrada pública precisa passar pela estrutura editorial de `assets/data/theories.js`; caminhos internos são mantidos somente em `scripts/theory-sources.mjs`.

## Deploy na Vercel

O `vercel.json` mantém o projeto como site estático, com `dist/` como única raiz pública e URLs limpas. Antes de publicar:

```bash
npm run build
```

O build usa uma lista explícita de páginas e assets. Documentos, pareceres, scripts, fontes brutas e materiais internos não entram no artefato. Os links atuais usam caminhos relativos e páginas HTML reais.

## Contato e presença profissional

- E-mail: `Matheuscamargodealencar@gmail.com`
- Telefone: `11 91363-9989`
- LinkedIn: `https://www.linkedin.com/in/gomin/`
- GitHub: `https://github.com/Matheus14623`

Esses dados ficam centralizados em `assets/js/config.js`. O formulário usa `mailto:` e não envia informações para um backend.

## Princípio editorial

As entradas são apresentadas de acordo com sua natureza real. Hipóteses não aparecem como fatos, frameworks não aparecem como física, heurísticas não aparecem como cosmologia e referências não são tratadas como confirmação automática.
