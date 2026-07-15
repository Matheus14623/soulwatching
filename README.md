# Observatório de Ideias — Matheus Camargo

Site estático, responsivo e interativo concebido como um observatório de ideias: um sistema editorial para teorias em desenvolvimento, relações conceituais, arquivo futuro e experiências de interface.

## Rotas principais

- `/index.html`: home e gateway do observatório.
- `/Teorias/teorias.html`: arquivo navegável com busca, filtros combinados, dossiês e URLs diretas.
- `/Mapa/mapa.html`: mapa conceitual leve derivado dos mesmos dados das teorias.
- `/Arquivo/arquivo.html`: arquitetura editorial e estado honesto do arquivo.
- `/Laboratorio/laboratorio.html`: índice dos experimentos existentes.
- `/teorias.html`: redirecionamento legado para a rota atual de teorias.

As URLs de teoria usam o parâmetro `teoria`, por exemplo:

```text
/Teorias/teorias.html?teoria=zero-epsilon
/Mapa/mapa.html?teoria=zero-epsilon
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

O projeto não possui etapa de compilação. Os dois comandos executam a validação estrutural usada antes do deploy: arquivos obrigatórios, schema das teorias, relações, links locais, âncoras, linguagem principal e dependências indevidas.

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
|   |-- data/theories.js
|   |-- icons/
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
|-- docs/
|   `-- INTEGRACAO_TEORIAS.md
|-- scripts/
|   |-- serve.mjs
|   `-- verify.mjs
|-- DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md
|-- package.json
`-- vercel.json
```

## Arquitetura

O projeto preserva a stack estática existente: HTML semântico, CSS próprio e módulos ES nativos, sem framework ou dependências de interface. Essa escolha mantém o carregamento simples e o deploy direto na Vercel.

`assets/data/theories.js` é a fonte estruturada compartilhada pela home, pelo arquivo de teorias e pelo mapa. A home consome um recorte; as páginas profundas usam o conjunto completo. CSS e JavaScript específicos permanecem próximos de cada rota, enquanto tokens, navegação e componentes comuns ficam em `assets/`.

## Recursos principais

- Home organizada como porta de entrada para as áreas do observatório.
- Dez teorias catalogadas e sete eixos de investigação.
- Busca por texto e filtros combináveis por categoria, fase, status e conceito.
- Dossiê com ideia, pergunta, hipótese, tensão, próximos passos, relações e proveniência.
- Link direto por teoria, preservado entre arquivo e mapa.
- Mapa com dez nós e dezoito relações únicas, sem biblioteca gráfica pesada.
- Arquivo editorial sem publicações ou métricas inventadas.
- Laboratório com visão estelar, cordas de ressonância e mapa conceitual.
- Navegação por teclado, estados ARIA, redução de movimento e layouts móveis dedicados.
- Verificação automatizada adequada ao build da Vercel.

## Dados editoriais

Para adicionar ou revisar teorias, consulte [docs/INTEGRACAO_TEORIAS.md](docs/INTEGRACAO_TEORIAS.md). A documentação ampla de arquitetura, manutenção, migração futura e deploy está em [DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md](DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md).

Os arquivos da pasta `Teorias/` continuam preservados como material bruto. Conteúdo bruto não deve ser publicado automaticamente: a entrada pública precisa passar pela estrutura editorial de `assets/data/theories.js`.

## Deploy na Vercel

O `vercel.json` mantém o projeto como site estático, com raiz publicada em `.` e URLs limpas. Antes de publicar:

```bash
npm run build
```

Evite alterar `outputDirectory` para uma pasta inexistente e não introduza rotas dependentes de fallback de SPA. Os links atuais usam caminhos relativos e páginas HTML reais.

## Contato e presença profissional

- E-mail: `Matheuscamargodealencar@gmail.com`
- Telefone: `11 91363-9989`
- LinkedIn: `https://www.linkedin.com/in/gomin/`
- GitHub: `https://github.com/Matheus14623`

Esses dados ficam centralizados em `assets/js/config.js`. O formulário usa `mailto:` e não envia informações para um backend.

## Princípio editorial

As teorias são apresentadas como hipóteses em desenvolvimento, nunca como verdades finais. O site não inventa publicações, depoimentos, projetos ou métricas para preencher estados ainda vazios.
