---
id: "infrastructure.static-deploy"
title: "Build estático e deploy"
scope: "infrastructure"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "composição de dist, proteção de conteúdo interno e configuração da Vercel"
triggers:
  - "scripts/build.mjs"
  - "vercel.json"
  - "dist"
  - "allowlist"
  - "manifesto público"
  - "servidor local"
  - "publicação"
required_context:
  - "infrastructure.index"
conditional_context:
  - id: "project.boundaries"
    condition: "Quando um novo tipo de arquivo, documento ou fonte editorial puder atravessar a fronteira pública."
related_context:
  - "quality.validation-release"
  - "external.build-script"
  - "external.vercel-config"
evidence_sources:
  - "scripts/build.mjs"
  - "scripts/verify.mjs"
  - "scripts/serve.mjs"
  - "scripts/public-manifest.mjs"
  - "scripts/tests/public-smoke.test.mjs"
  - "scripts/tests/editorial-dashboard-contracts.test.mjs"
  - "tools/editorial-dashboard/server.mjs"
  - "vercel.json"
  - ".gitignore"
  - "robots.txt"
  - "index.html"
  - "Teorias/teorias.html"
  - "Mapa/mapa.html"
  - "GrandesNomes/grandes-nomes.html"
  - "Constelacoes/constelacoes.html"
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "Laboratorio/experimento.html"
  - "Rotas/rotas.html"
  - "Contribuicoes/contribuicoes.html"
  - "assets/vendor/swiper/LICENSE"
---

# Build estático e deploy

## Current Confirmed Structure

`vercel.json` declara projeto estático, executa `npm run build`, publica `dist/`, habilita URLs limpas e desabilita barra final. `scripts/public-manifest.mjs` é a fonte única das rotas públicas, dos HTML, dos arquivos obrigatórios e dos caminhos de build. O build verifica o projeto, remove somente o diretório `dist/` validado, recria a saída e copia essa allowlist. A cópia recursiva usa primitivas estáveis de `node:fs/promises`, sem depender de `fs.promises.cp`.

Entram dez rotas declaradas — incluindo executor de experimento —, o redirecionamento legado, assets públicos autorizados e as pastas de rota. Teorias e Grandes Nomes entram por arquivos explícitos; Mapa, Constelações, Arquivo, Laboratório, Rotas e Contribuições entram por diretórios públicos; os três arquivos vendorizados do Swiper permanecem explícitos. Não entram `docs/`, `ia/`, `ai/`, `.github/`, `scripts/`, `tools/`, `.content-drafts/`, `.content-reports/`, `.content-cache/`, fontes brutas ou documentos. Essas raízes também são rejeitadas por defesa em profundidade após a cópia.

As páginas principais possuem título, descrição e metadados Open Graph/Twitter, mas não declaram `canonical` nem `og:url`; as imagens sociais usam caminhos relativos. Apenas o redirecionamento legado possui `canonical`. `robots.txt` permite rastreamento geral, não existe sitemap e `vercel.json` não declara CSP ou outros headers de segurança. O carregamento do Google Fonts é uma requisição de runtime a terceiro.

O servidor local resolve caminhos a partir da raiz do projeto, mas no modo fonte só entrega arquivos autorizados pelo mesmo manifesto. Ele vincula-se a `localhost`, aceita `GET` e `HEAD`, reconhece URLs declaradas com e sem `.html` e responde 404 para arquivos internos ou rotas inexistentes. O modo `--dist` serve somente o artefato gerado. Os smoke tests exercitam os dois modos, mas não substituem a validação dos redirects, cache e headers reais da Vercel.

`npm run dashboard` inicia outro servidor em `localhost:4174`. Ele não usa o manifesto público, recusa conexões não locais e nunca é iniciado pela Vercel. O preview editorial copia uma allowlist para `.content-cache/`, aplica a revisão somente nessa sombra, executa o build real e entrega o resultado por uma porta efêmera protegida. Esse preview não é ambiente de deploy e desaparece ao expirar ou ao encerrar o processo.

## Canonical Rules

- Nunca mude `outputDirectory` para a raiz do repositório.
- Uma nova rota pública precisa entrar conscientemente na allowlist e no verificador.
- Um diretório copiado por inteiro exige revisão dos arquivos novos; o manifesto e o verificador precisam continuar alinhados.
- Preserve a capitalização dos caminhos para o ambiente Linux da hospedagem.
- O ledger de cobertura normaliza fontes Markdown para `LF` antes de calcular tamanho e SHA-256, evitando divergências entre checkouts Windows e Linux; fontes binárias permanecem byte a byte.
- Gere e verifique `dist/`; não edite o artefato manualmente.
- Use `npm run dev` para a fonte allowlisted e `npm run preview` para reconstruir e servir `dist/`; caminhos privados devem continuar retornando 404 em ambos os testes aplicáveis.
- Use `npm run dashboard` somente para operação editorial local; nunca adicione `tools/` ou seus workspaces à allowlist pública.
- Não use o servidor local como evidência definitiva do comportamento de redirects, cache ou headers da hospedagem.

## Validation

Execute `npm test`, confirme se o smoke de navegador não foi ignorado quando ele for requisito da mudança, inspecione os arquivos autorizados em `dist/`, confirme ausência de `ai/`, documentação, scripts, ferramentas, caches e fontes editoriais e abra as rotas principais por HTTP.

## To Verify

- Comportamento de `cleanUrls` e redirects no domínio final.
- Domínio absoluto, `canonical`, `og:url`, sitemap e URLs absolutas das imagens sociais.
- Política de CSP, headers de segurança e carregamento de fontes de terceiros.
- Headers de segurança e cache que precisam ser aplicados pela Vercel além dos valores básicos do servidor local.
- Schema permitido para arquivos novos dentro dos diretórios copiados por inteiro.
