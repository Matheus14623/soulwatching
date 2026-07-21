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
  - "vercel.json"
  - ".gitignore"
  - "robots.txt"
  - "index.html"
  - "Teorias/teorias.html"
  - "Mapa/mapa.html"
  - "GrandesNomes/grandes-nomes.html"
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "assets/vendor/swiper/LICENSE"
---

# Build estático e deploy

## Current Confirmed Structure

`vercel.json` declara projeto estático, executa `npm run build`, publica `dist/`, habilita URLs limpas e desabilita barra final. O build verifica o projeto, remove somente o diretório `dist/` validado, recria a saída e copia uma allowlist. A cópia recursiva é implementada com primitivas estáveis de `node:fs/promises`, sem depender de `fs.promises.cp`, para manter compatibilidade com ambientes Node anteriores à versão 16.7.

Entram páginas principais, assets públicos autorizados e as pastas de rota. A rota Grandes Nomes e os três arquivos vendorizados do Swiper entram por allowlist explícita; retratos WebP entram pelo diretório público de imagens. Não entram `docs/`, `ia/`, `ai/`, `scripts/`, fontes brutas ou documentos. A base `ai/` não faz parte da allowlist e também deve ser rejeitada por defesa em profundidade.

As páginas principais possuem título, descrição e metadados Open Graph/Twitter, mas não declaram `canonical` nem `og:url`; as imagens sociais usam caminhos relativos. Apenas o redirecionamento legado possui `canonical`. `robots.txt` permite rastreamento geral, não existe sitemap e `vercel.json` não declara CSP ou outros headers de segurança. O carregamento do Google Fonts é uma requisição de runtime a terceiro.

O servidor local serve a raiz de `process.cwd()`. Uma rota inexistente devolve o HTML da home com status 404, portanto ele não reproduz o comportamento de `cleanUrls` da Vercel e não deve ser usado para validar redirects ou URLs de produção.

## Canonical Rules

- Nunca mude `outputDirectory` para a raiz do repositório.
- Uma nova rota pública precisa entrar conscientemente na allowlist e no verificador.
- Um diretório copiado por inteiro exige que todos os seus tipos de arquivo estejam cobertos pela verificação.
- Preserve a capitalização dos caminhos para o ambiente Linux da hospedagem.
- O ledger de cobertura normaliza fontes Markdown para `LF` antes de calcular tamanho e SHA-256, evitando divergências entre checkouts Windows e Linux; fontes binárias permanecem byte a byte.
- Gere e verifique `dist/`; não edite o artefato manualmente.
- Não trate `scripts/serve.mjs` como preview seguro: ele serve a raiz e pode expor arquivos internos por URL conhecida.
- Não use o servidor local como evidência do comportamento de roteamento, cache ou headers da hospedagem.

## Validation

Execute `npm run build`, conte e inspecione os arquivos autorizados, confirme ausência de `ai/`, documentação, scripts e fontes editoriais e abra as rotas principais por HTTP.

## To Verify

- Comportamento de `cleanUrls` e redirects no domínio final.
- Domínio absoluto, `canonical`, `og:url`, sitemap e URLs absolutas das imagens sociais.
- Política de CSP, headers de segurança e carregamento de fontes de terceiros.
- Se o servidor de desenvolvimento deve passar a servir somente `dist/`, fixar `127.0.0.1` e trocar a validação de caminho por uma fronteira que não dependa apenas de prefixo textual.
- Cobertura automática de arquivos novos dentro dos diretórios copiados por inteiro.
