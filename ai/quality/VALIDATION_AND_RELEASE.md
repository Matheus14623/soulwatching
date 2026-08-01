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
  - "scripts/tests/content-platform-contracts.test.mjs"
  - "scripts/tests/editorial-impact-contracts.test.mjs"
  - "scripts/tests/editorial-dashboard-contracts.test.mjs"
  - "tools/editorial-dashboard/tests/apply-preview-contracts.test.mjs"
  - "tools/editorial-dashboard/tests/preview-smoke.mjs"
  - "tools/editorial-dashboard/tests/server-contracts.test.mjs"
  - "tools/editorial-dashboard/tests/ui-context-contracts.test.mjs"
  - "tools/editorial-dashboard/tests/workflow-contracts.test.mjs"
  - "tools/editorial-dashboard/tests/workspace-contracts.test.mjs"
  - "scripts/tests/browser-smoke.test.mjs"
  - ".github/workflows/quality.yml"
  - "package.json"
---

# Validação e release

## Automated Coverage

`scripts/public-manifest.mjs` centraliza rotas, HTML, arquivos obrigatórios e caminhos copiados. `npm run verify` confere duplicidades e cobertura do manifesto, rejeita HTML público sem rota, valida referências e âncoras dos HTML cadastrados, restrições de linguagem, comentários nos arquivos públicos cadastrados, campos básicos dos catálogos de teorias, grandes nomes e constelações e sincronização da base `ai/`. No catálogo de perfis, também valida fontes, retratos, tipos de conexão, teorias resolvidas e as três posições de destaque. No atlas, valida estações, assinaturas, papéis estelares, coordenadas esquemáticas, relações e os três destaques da home. `npm run build` repete a verificação, recria `dist/` pela allowlist do manifesto e rejeita artefatos internos proibidos.

`npm test` executa o build no `pretest` e depois a suíte de contratos e smoke. Entre as coberturas relevantes:

- `public-smoke`: entrega HTTP das rotas declaradas, URLs limpas, assets, 404, 405 e bloqueio de caminhos privados no servidor de fonte;
- `accessibility-contracts`: controles de ressonância, associação de erros, alvos invisíveis fora da ordem de foco, devolução defensiva do foco da busca, foco ao abrir Rotas e anúncio único no treino do Atlas;
- `feature-contracts`: IDs e referências cruzadas, relações e rubricas de teorias, trilhas e cronologia de Grandes Nomes, invariantes dos simuladores e contrato básico de contribuição;
- `contributions-contracts`: vocabulários, schema público, autoria, crédito, fontes, licença, revisão, segurança da proposta por `mailto:` e estado vazio atual;
- `content-platform-contracts`: schemas, compilação, instalação atômica, uma única compilação por change set, exigência de classe em substituições e restauração integral de registros e ledgers;
- `editorial-impact-contracts`: diff determinístico, vocabulário fechado, classificação conservadora, sequência completa do ledger, vigência derivada, invalidação persistente e gate que separa `reviewed`, `pending` e `deprecated`;
- `editorial-dashboard-contracts`: isolamento em loopback, `Host`, `Origin`, CSRF, limites de corpo, workspaces privados versionados, detecção de adulteração, catálogo allowlisted, retomada e exclusão de rascunhos, bloqueio de paths inseguros, exigência de impacto e preview atuais e smoke HTTP do processo local;
- `tools/editorial-dashboard/tests`: contratos unitários complementares do servidor, do workspace e do fluxo vertical de teoria, sem aplicar fixtures na fonte canônica;
- `browser-smoke`: inicialização em Chrome, Chromium ou Edge da home, Rotas, Contribuições, quatro simuladores e modo treino do Atlas, usando dump do DOM em viewport móvel. Esse teste é marcado como ignorado quando nenhum navegador compatível é encontrado.

`.github/workflows/quality.yml` roda em push e pull request, com permissões somente de leitura, Node 22, `npm ci --ignore-scripts`, `npm run knowledge:test` e `npm test`.

Essa cobertura é predominantemente estrutural. O smoke de navegador prova inicialização e presença de contratos no DOM, mas não opera teclado, pointer, drag, modais, filtros, comparação ou retorno entre uma Rota e seu conteúdo. Os contratos da dashboard exercitam sua API e seus serviços, mas ainda não equivalem a uma jornada assistida completa no navegador. A suíte não prova acessibilidade completa, desempenho, disponibilidade de links externos ou ausência de regressão visual.

O verificador enumera HTML dentro dos diretórios públicos e comprova que os arquivos obrigatórios estão cobertos pelo manifesto. Ele valida contribuições pelo contrato do próprio módulo e a suíte confere partes importantes de experiências, Rotas, relações, rubricas, trilhas e linha do tempo. Ainda não existe um schema declarativo completo e uniforme para todos esses catálogos. Também não cobre todo texto de interface montado em strings JavaScript com as mesmas regras editoriais aplicadas ao HTML e aos dados, não resolve todos os imports, não valida sintaxe CSS e não exige unicidade de `code` no catálogo.

O compilador também valida o ledger editorial, exige `reviewedAgainst` em relações revisadas, deriva `needs-review` e rejeita blockers globais. O hash da revisão editorial detecta edição direta sem novo `revisionId`; em publicações, o hash da revisão cobre os snapshots público e de créditos. `content:impact` produz uma prévia de um manifesto privado usando a mesma política de substituição, a mesma integridade cruzada e os mesmos ledgers da aplicação; por isso duplicatas bibliográficas e operações repetidas falham antes da escrita. `content:apply` somente escreve quando o gate permite e restaura registros, ledgers e relatório privado se uma falha capturada ocorrer. Reapontar uma relação revisada para `pending` não contorna o gate. Os budgets máximos de dívida são 12 vínculos legados experimento→teoria, 31 relações sem evidência específica e 32 baselines técnicos legados. Os 32 registros `r1` também possuem hash canônico imutável; orçamento e hashes impedem crescimento ou reescrita silenciosa e não devem ser alterados para liberar uma mudança.

## Required Checks

1. Execute `npm run content:check` quando a fonte, schemas, relações ou ledgers mudarem.
2. Em um change set, execute `npm run content:impact -- --manifest <arquivo.json>` e revise blockers e avisos antes de `content:apply`.
3. Execute `npm run verify`.
4. Execute `npm run knowledge:test` quando os geradores da base mudarem.
5. Execute `npm test` para build e smoke tests antes de publicar.
6. Inspecione `dist/` quanto a conteúdo inesperado quando o manifesto mudar.
7. Confirme no log se o smoke de navegador rodou ou foi ignorado.
8. Faça QA manual proporcional à superfície alterada.
9. Quando a dashboard mudar, execute também `npm run test:dashboard`; para mudanças no preview, execute `npm run test:dashboard:preview` e confirme o hash preservado de `content/public/`.

## Gate editorial de relações

- `reviewed` + mudança `semantic` ou `structural` posterior a `reviewedAgainst`: bloqueia;
- `reviewed` + apenas mudanças `editorial`, `presentation` ou `metadata` posteriores: permanece vigente;
- `pending` preexistente: aviso, sem aprovação automática;
- `deprecated`: não bloqueia;
- relação antes `reviewed` alterada para `pending` no mesmo conjunto invalidante: continua bloqueada como decisão adiada;
- `editorial-review`: exige revisões finais dos dois extremos, data e responsável público autorizado;
- `legacy-baseline`: não pode conter data ou responsável inventados e não pode ampliar o budget.

O histórico de classes no ledger precisa ser completo desde `r1`: uma revisão editorial posterior não apaga a existência de uma revisão semântica intermediária. Relações não possuem snapshot histórico separado; para versões anteriores do registro, consulte o Git.

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

Para a dashboard local:

- catálogo, busca, criação, retomada e exclusão de rascunho;
- formulário de teoria por teclado, mensagens de erro e preservação de foco;
- conflito de versão entre duas leituras do mesmo workspace;
- diff, classificação e blockers coerentes com a CLI;
- confirmação, adiamento, revisão e depreciação de relação;
- preview protegido, expirável e encerrado após edição, reanálise, exclusão ou fim do processo;
- aplicação recusada sem `APLICAR`, digest atual e preview correspondente;
- workspace inconsistente listado sem conteúdo, sem retomada e com exclusão segura, mantendo symlinks como erro bloqueante;
- instalação canônica concluída não comunicada como falha repetível quando apenas o registro privado de conclusão falhar;
- ausência de `tools/`, `.content-drafts/` e `.content-cache/` em `dist/`.

## Release Boundaries

Não declare uma validação de navegador como atual se ela não foi repetida após a mudança. Resultados registrados em snapshots anteriores são histórico de execução, não garantia permanente.

## To Verify

- Auditoria automatizada ampla de acessibilidade e regressão visual.
- Garantir navegador instalado no CI para impedir que o smoke real seja ignorado.
- Jornadas reais de teclado, foco após re-render, pointer, drag, modais, comparação e retorno de Rota no navegador.
- Varredura de todos os arquivos efetivamente copiados para `dist/`, incluindo strings públicas renderizadas por JavaScript.
- Validação de imports dos módulos, sintaxe CSS e unicidade de códigos editoriais.
- Schemas declarativos completos e integridade cruzada uniforme para experiências, Rotas Guiadas, contribuições, relações tipadas, rubricas, trilhas e linha do tempo.
- Cobertura de crash abrupto durante a escrita da fonte; o rollback atual cobre falhas capturadas, não substitui journal transacional persistente.
- Jornada E2E da dashboard em navegador, incluindo leitor de tela, conflito entre abas e recuperação após encerramento abrupto.
