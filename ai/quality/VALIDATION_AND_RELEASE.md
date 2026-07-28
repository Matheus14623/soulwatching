---
id: "quality.validation-release"
title: "Validação e release"
scope: "quality"
kind: "checklist"
status: "canonical"
canonical_for:
  - "verificação automatizada e checklist de publicação"
triggers:
  - "npm run verify"
  - "npm run build"
  - "npm test"
  - "CI"
  - "smoke"
  - "publicação"
  - "checklist"
  - "regressão"
required_context:
  - "quality.index"
conditional_context:
  - id: "domains.theory-catalog"
    condition: "Quando dados ou interfaces de teorias forem alterados."
  - id: "domains.notable-figures"
    condition: "Quando perfis, fontes, retratos ou a galeria Grandes Nomes forem alterados."
  - id: "infrastructure.static-deploy"
    condition: "Quando build, allowlist ou Vercel forem alterados."
related_context:
  - "quality.performance-accessibility"
  - "project.commands"
evidence_sources:
  - "scripts/verify.mjs"
  - "scripts/build.mjs"
  - "scripts/public-manifest.mjs"
  - "scripts/tests/public-smoke.test.mjs"
  - "scripts/tests/accessibility-contracts.test.mjs"
  - "scripts/tests/feature-contracts.test.mjs"
  - "scripts/tests/contributions-contracts.test.mjs"
  - "scripts/tests/browser-smoke.test.mjs"
  - ".github/workflows/quality.yml"
  - "package.json"
---

# Validação e release

## Automated Coverage

`scripts/public-manifest.mjs` centraliza rotas, HTML, arquivos obrigatórios e caminhos copiados. `npm run verify` confere duplicidades e cobertura do manifesto, rejeita HTML público sem rota, valida referências e âncoras dos HTML cadastrados, restrições de linguagem, comentários nos arquivos públicos cadastrados, campos básicos dos catálogos de teorias, grandes nomes e constelações e sincronização da base `ai/`. No catálogo de perfis, também valida fontes, retratos, tipos de conexão, teorias resolvidas e as três posições de destaque. No atlas, valida estações, assinaturas, papéis estelares, coordenadas esquemáticas, relações e os três destaques da home. `npm run build` repete a verificação, recria `dist/` pela allowlist do manifesto e rejeita artefatos internos proibidos.

`npm test` executa o build no `pretest` e depois cinco arquivos de teste:

- `public-smoke`: entrega HTTP das rotas declaradas, URLs limpas, assets, 404, 405 e bloqueio de caminhos privados no servidor de fonte;
- `accessibility-contracts`: controles de ressonância, associação de erros, alvos invisíveis fora da ordem de foco, devolução defensiva do foco da busca, foco ao abrir Rotas e anúncio único no treino do Atlas;
- `feature-contracts`: IDs e referências cruzadas, relações e rubricas de teorias, trilhas e cronologia de Grandes Nomes, invariantes dos simuladores e contrato básico de contribuição;
- `contributions-contracts`: vocabulários, schema público, autoria, crédito, fontes, licença, revisão, segurança da proposta por `mailto:` e estado vazio atual;
- `browser-smoke`: inicialização em Chrome, Chromium ou Edge da home, Rotas, Contribuições, quatro simuladores e modo treino do Atlas, usando dump do DOM em viewport móvel. Esse teste é marcado como ignorado quando nenhum navegador compatível é encontrado.

`.github/workflows/quality.yml` roda em push e pull request, com permissões somente de leitura, Node 22, `npm ci --ignore-scripts`, `npm run knowledge:test` e `npm test`.

Essa cobertura é predominantemente estrutural. O smoke de navegador prova inicialização e presença de contratos no DOM, mas não opera teclado, pointer, drag, modais, filtros, comparação ou retorno entre uma Rota e seu conteúdo. A suíte não prova acessibilidade completa, desempenho, disponibilidade de links externos ou ausência de regressão visual.

O verificador enumera HTML dentro dos diretórios públicos e comprova que os arquivos obrigatórios estão cobertos pelo manifesto. Ele valida contribuições pelo contrato do próprio módulo e a suíte confere partes importantes de experiências, Rotas, relações, rubricas, trilhas e linha do tempo. Ainda não existe um schema declarativo completo e uniforme para todos esses catálogos. Também não cobre todo texto de interface montado em strings JavaScript com as mesmas regras editoriais aplicadas ao HTML e aos dados, não resolve todos os imports, não valida sintaxe CSS e não exige unicidade de `code` no catálogo.

## Required Checks

1. Execute `npm run verify`.
2. Execute `npm run knowledge:test` quando os geradores da base mudarem.
3. Execute `npm test` para build e smoke tests antes de publicar.
4. Inspecione `dist/` quanto a conteúdo inesperado quando o manifesto mudar.
5. Confirme no log se o smoke de navegador rodou ou foi ignorado.
6. Faça QA manual proporcional à superfície alterada.

## UI Checklist

- Navegação principal, menu, Escape e retorno ao topo.
- Busca, cada dimensão de filtro, estado vazio e reset.
- URL direta válida no catálogo e no mapa.
- Comparação de teorias, link de versão atual, objeções, rubricas, critérios de saída e relações inversas com perfis.
- URL direta de perfil, busca, áreas, estado vazio, arraste, pausa, índice e controles da galeria.
- Comparação de perfis, quatro trilhas e filtros da linha do tempo.
- URL direta de constelação, busca, filtros sazonais, estado vazio, hover, foco, toque, setas, `Home`, `End`, faixa de seleção, guia fixável e restauração da seleção ativa.
- Oito rodadas do modo treino, resposta, anúncio, repetição e retorno ao atlas.
- Busca global por botão e atalho, consulta vazia, teclado, Escape e devolução de foco.
- Quatro Rotas Guiadas, cinco etapas, URLs de etapa e links para as fontes.
- Nove cards do Laboratório e os quatro simuladores nos extremos dos controles, com limites textuais preservados.
- Contribuições em estado vazio e formulário local sem publicação automática.
- Seleção relacionada, foco e URL coerentes após re-render.
- Visão Estelar ligada e desligada repetidamente sem canvas duplicado.
- Ressonância com áudio inicialmente desligado e controles por teclado.
- Movimento reduzido, zoom de 200% e ausência de overflow horizontal.
- Console sem erros.
- Larguras 1440, 1024, 768, 430, 390 e 360 px quando houver mudança visual.

## Release Boundaries

Não declare uma validação de navegador como atual se ela não foi repetida após a mudança. Resultados registrados em snapshots anteriores são histórico de execução, não garantia permanente.

## To Verify

- Auditoria automatizada ampla de acessibilidade e regressão visual.
- Garantir navegador instalado no CI para impedir que o smoke real seja ignorado.
- Jornadas reais de teclado, foco após re-render, pointer, drag, modais, comparação e retorno de Rota no navegador.
- Varredura de todos os arquivos efetivamente copiados para `dist/`, incluindo strings públicas renderizadas por JavaScript.
- Validação de imports dos módulos, sintaxe CSS e unicidade de códigos editoriais.
- Schemas declarativos completos e integridade cruzada uniforme para experiências, Rotas Guiadas, contribuições, relações tipadas, rubricas, trilhas e linha do tempo.
