---
id: "domains.content-operations"
title: "Operações de conteúdo e relações"
scope: "domains"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "arquitetura implementada e evolução de entidades, referências, relações, geração de catálogos, submissões e futura persistência"
triggers:
  - "novo conteúdo"
  - "schema"
  - "relação central"
  - "referência compartilhada"
  - "gerador de conteúdo"
  - "contribuição"
  - "submissão"
  - "backend"
  - "banco de dados"
  - "migração de dados"
  - "ContentRepository"
required_context:
  - "domains.index"
conditional_context:
  - id: "project.boundaries"
    condition: "Quando houver risco de misturar material privado, submissão, dados pessoais privados ou artefato público."
  - id: "infrastructure.static-deploy"
    condition: "Quando a mudança alterar geração, allowlist ou conteúdo copiado para dist."
  - id: "quality.validation-release"
    condition: "Antes de migrar uma entidade, relação, referência ou publicação."
related_context:
  - "domains.editorial-model"
  - "domains.theory-catalog"
  - "domains.notable-figures"
  - "domains.editorial-dashboard"
  - "project.architecture"
  - "project.maturity-roadmap"
evidence_sources:
  - "content/schemas/entity.schema.json"
  - "content/schemas/theory.schema.json"
  - "content/schemas/relation.schema.json"
  - "content/schemas/reference.schema.json"
  - "content/schemas/editorial-change-set.schema.json"
  - "content/schemas/editorial-revision-ledger.schema.json"
  - "content/public/catalogs/editorial-revision-ledger.json"
  - "content/public/theories/observacao-nao-linear.json"
  - "content/public/taxonomies/relation-types.json"
  - "scripts/content/change-set.mjs"
  - "scripts/content/cli.mjs"
  - "scripts/content/compiler.mjs"
  - "scripts/content/editorial-impact.mjs"
  - "scripts/content/editorial-revision-ledger.mjs"
  - "scripts/content/install-record.mjs"
  - "scripts/content/revision-policy.mjs"
  - "scripts/content/direct-import-policy.mjs"
  - "scripts/tests/editorial-impact-contracts.test.mjs"
  - "scripts/tests/editorial-change-set-contracts.test.mjs"
  - "scripts/tests/editorial-dashboard-contracts.test.mjs"
  - "scripts/tests/observacao-impact-fixture.test.mjs"
  - "scripts/content/fixtures/impact/observacao-nao-linear.json"
  - "tools/editorial-dashboard/server.mjs"
  - "tools/editorial-dashboard/services/editorial-workflow.mjs"
  - "tools/editorial-dashboard/services/preview-service.mjs"
  - "tools/editorial-dashboard/services/workspace-store.mjs"
  - "assets/js/content-repository.js"
  - "assets/js/content-source.js"
---

# Operações de conteúdo e relações

## Purpose

Definir a plataforma de conteúdo validada do Observatório, seus contratos de autoria, geração, leitura e evolução para persistência futura, sem quebrar a aplicação multipágina nem duplicar relações.

Este documento é o proprietário da arquitetura de conteúdo. Requisitos de interface, análise de impacto assistida, fluxo da dashboard e critérios de aceitação do painel pertencem à [especificação funcional da dashboard editorial](EDITORIAL_DASHBOARD_SPECIFICATION.md).

## Current Confirmed Structure

- `content/public/` é a fonte canônica granular das entidades, relações, referências, taxonomias, percursos, coleções e metadados institucionais públicos.
- `content/schemas/` define os contratos JSON Schema por tipo.
- `scripts/content/compiler.mjs` valida schemas e integridade cruzada, resolve referências, aliases e relações e gera o runtime público.
- `scripts/content/cli.mjs` implementa `content:new`, `content:check`, `content:build`, `content:report`, `content:impact`, `content:apply` e `content:rollback`.
- `scripts/content/revision-policy.mjs` preserva revisões e aliases publicados durante substituições.
- `content/public/catalogs/editorial-revision-ledger.json` registra a sequência completa das revisões de teorias, perfis, publicações e experimentos, com classe de mudança e caminhos alterados.
- `scripts/content/editorial-impact.mjs` produz diff determinístico, classificação conservadora, vigência derivada das relações e impacto direto.
- `scripts/content/install-record.mjs` aplica um ou vários registros, seus ledgers e o runtime em uma única transação com lock e restauração em caso de falha capturada.
- `assets/data/generated/` é saída derivada, não versionada e destinada ao navegador.
- módulos históricos em `assets/data/` preservam compatibilidade, mas não são fonte autoral.
- `ContentRepository` consulta entidades, relações, referências, busca e coleções sem conhecer o armazenamento físico.
- `StaticContentSource` é a implementação ativa; `HttpContentSource` implementa o mesmo contrato de leitura, mas permanece inativo porque não existe endpoint.
- imports diretos novos dos módulos legados são bloqueados e o budget atual é zero.
- build e servidor preservam a fronteira pública por allowlist.
- há uma dashboard editorial exclusivamente local, sem backend remoto, banco, conta, upload ou armazenamento de submissão; sua API existe apenas no processo de loopback e nunca é publicada.

A plataforma estática, o contrato de dependência editorial e o primeiro fluxo assistido foram implementados. Diff, classificação, análise de impacto, gate e instalação atômica são operáveis tanto pela linha de comando quanto pela dashboard local, sempre pelo mesmo manifesto privado. O próximo limite é validar o piloto em uso real e ampliar os formulários somente depois disso.

## Problemas a resolver

### Vigência e decisão das relações

Relações revisadas registram as revisões de origem e destino consideradas em `reviewedAgainst`. O compilador consulta o ledger editorial e deriva `needs-review` quando encontra uma mudança semântica ou estrutural posterior. Essa automação detecta dependência desatualizada, mas não confirma, reescreve, reclassifica nem descontinua a relação; essas continuam sendo decisões editoriais explícitas.

### Operação editorial

Os comandos fornecem diff, impacto, gate e instalação transacional. A dashboard local torna o manifesto operável por formulário para teorias, apresenta as dependências e coordena decisões e preview; o arquivo continua técnico, privado e gerado pela ferramenta. Os demais tipos ainda não possuem autoria completa por interface.

### Granularidade seletiva

Perguntas permanecem como strings, objeções possuem identidade apenas dentro da teoria e conceitos são textos. Eles só devem ganhar entidade própria quando houver reuso, relação, revisão ou citação independente.

### Dívida relacional e bibliográfica

Vínculos legados experimento–teoria ainda precisam de decisão editorial para migração. Relações que exigem evidência específica não podem receber fonte inventada pelo gerador.

O compilador usa budgets máximos para impedir crescimento silencioso: `experimentTheoryLinksAwaitingMigration` ≤ 12, `relationsAwaitingEvidence` ≤ 31 e `legacyRelationReviewBaselines` ≤ 32. Esses valores são limites técnicos da dívida herdada, não metas nem contagens editoriais a reproduzir na interface. Eles podem diminuir após decisões reais e não devem ser elevados para fazer uma mudança passar.

### Snapshots e operação privada

Publicações possuem ledger imutável e as entidades relacionáveis possuem ledger de classes por revisão, mas teorias ainda não oferecem recuperação completa de snapshots históricos. O ledger editorial prova a sequência e o tipo de mudança; ele não armazena o corpo antigo. Relações também não possuem um ledger histórico próprio: revisões anteriores continuam recuperáveis pelo histórico do Git. Não existem submissão privada, anexos, auditoria persistente nem fluxo multiusuário.

## Modelo de responsabilidade

Separar responsabilidades por camada:

| Camada | Responsabilidade | Pode conter dados privados? |
| --- | --- | --- |
| Fonte pública autoral | registros canônicos de entidades, relações e referências em formato validado | não |
| Schema | forma, vocabulário e integridade cruzada | não |
| Gerador | valida, resolve e cria índices de runtime | não |
| Runtime público | exports compatíveis, busca e projeções consumidas pelo site | não |
| Proveniência editorial privada atual | mapeamentos e materiais de origem já usados para revisão, separados da síntese pública | sim, sem entrada no runtime |
| Operação privada futura | submissões, anexos, contatos, revisão e auditoria | sim, fora do pipeline público e fora do Git |

O frontend não deve decidir onde o conteúdo é armazenado. Ele consulta um contrato de leitura.

Dados pessoais precisam de classificação explícita:

- `privateContactData`: e-mail, telefone, mensagens, endereço, prova de permissão e notas de decisão; nunca entram no runtime público;
- `authorizedPublicIdentity`: nome de crédito, biografia curta e links que a pessoa aprovou para exibição; entram somente por campos públicos permitidos;
- dados editoriais e técnicos sem caráter pessoal.

O fato de o repositório Git ser privado não o transforma em sistema de gestão de submissões. Antes de existir armazenamento apropriado, contatos, permissões, pareceres e anexos permanecem na ferramenta de comunicação escolhida, com política de retenção, e fora do Git.

## Estrutura implementada

```text
content/
  schemas/
    <tipo>.schema.json
  public/
    catalogs/
      editorial-revision-ledger.json
      publication-revision-ledger.json
    constellations/
    experiments/
    figures/
    figure-trails/
    paths/
    references/
    relations/
    research-tracks/
    site-pages/
    taxonomies/
    theories/
    timeline-events/
assets/
  data/
    generated/
      runtime/
      search-index.js
      content-metrics.js
.content-reports/
    integrity-report.json
.content-drafts/
    <tipo>/
      <id>.json
```

`content:new` cria rascunhos em `.content-drafts/` por padrão; esse diretório fica fora de `content/public`. Tipos sem registros públicos ainda podem não possuir diretório próprio, embora o schema, o compilador e o comando já aceitem o tipo.

`assets/data/generated` é a saída destinada ao navegador e entra no artefato somente pelo pipeline autorizado. `.content-reports` é derivado local ou de CI, permanece fora da allowlist e nunca entra em `dist/`. Ambos são gerados deterministicamente e não são versionados; somente fontes e schemas são canônicos. Nunca colocar em `content/public` rascunho privado, dado de contato, token, anexo de submissão, prova de permissão, parecer privado ou material bruto. Resumo de revisão deliberadamente editado para publicação é permitido no histórico público. Nome de crédito e links públicos só entram por autorização específica e por campos permitidos pelo schema público.

Adaptadores em `assets/data` preservam exports compatíveis, sem obrigar o navegador a buscar cada arquivo autoral. Código de produto novo consome exports gerados ou `ContentRepository`.

## Contratos por tipo

O envelope comum a todo documento autoral precisa apenas de:

- versão do schema;
- `id` público estável, nunca recalculado a partir do título;
- tipo do registro;
- dimensão de estado aplicável ao tipo;
- revisão verificável.

Schemas específicos completam o contrato por capacidades como `Addressable`, `Citable`, `Revisioned`, `Credited` e `Renderable`. Uma teoria, perfil ou publicação navegável possui `slug`, `aliases`, título, resumo, créditos, referências e histórico conforme sua natureza. Referência não precisa de slug ou resumo editorial; relação não precisa de título, crédito ou URL própria. Natureza epistemológica, datas, coordenadas, limites de simulação e metadados de apresentação só são obrigatórios nos tipos aos quais realmente pertencem.

Taxonomias, trilhas, linha do tempo, radar e metadados de páginas institucionais também são conteúdo governado. Eles precisam de schema e geração próprios; não devem reaparecer como arrays ou títulos manuais dentro de controladores.

IDs semânticos já publicados permanecem válidos. Nos catálogos principais, `id` e `slug` coincidem atualmente; `code` é um identificador editorial separado nas teorias. Alterações preservam esses valores e usam aliases para slugs anteriores. Um identificador interno de banco poderá ser adicionado no futuro, sem substituir o ID público nas URLs e relações.

### Revisões

Não assumir SemVer para conteúdo editorial. Cada schema `Revisioned` declara:

- `revisionId` interno e imutável;
- ordinal monotônico por entidade;
- `versionLabel` público adequado ao tipo;
- `reviewedAt`;
- resumo da mudança;
- responsáveis e papéis.

Vínculos de citação, avisos de correção e snapshots apontam para `revisionId`, não somente para o rótulo público.

### Slugs e aliases

- slug publicado nunca é reutilizado para outra entidade;
- renomear cria um alias, não um redirecionamento ad hoc espalhado;
- resolução verifica slug atual e aliases;
- colisões falham no build;
- relações usam `id`, nunca slug;
- URL canônica usa o slug atual; no modelo por query string, a resolução por alias normaliza o estado e a URL sem prometer redirecionamento HTTP inexistente.

## Registro central de relações

Relações de domínio são entidades de primeira classe. Forma reduzida do contrato vigente:

```json
{
  "id": "figure--figure-id--historical-foundation--theory-id",
  "revisionId": "figure--figure-id--historical-foundation--theory-id-r1",
  "source": { "type": "figure", "id": "figure-id" },
  "target": { "type": "theory", "id": "theory-id" },
  "type": "historical-foundation",
  "label": "Base histórica",
  "justification": "Explicação pública, delimitada e verificável.",
  "referenceIds": ["reference-id"],
  "reviewState": "reviewed",
  "reviewedAgainst": {
    "mode": "editorial-review",
    "sourceRevisionId": "figure-id-r2",
    "targetRevisionId": "theory-id-r3",
    "reviewedAt": "2026-08-01",
    "reviewedBy": "responsavel-publico-autorizado"
  }
}
```

Regras:

- a relação é declarada uma vez;
- os dois extremos precisam existir;
- tipo e combinações de origem/destino pertencem a vocabulário validado;
- o tipo declara se justificativa e evidência são obrigatórias; relações editoriais exibidas entre teorias, perfis e publicações exigem justificativa;
- simetria ou rótulo inverso é propriedade do tipo, não cópia manual;
- evidência por referência é recomendada quando a relação fizer afirmação histórica ou técnica;
- o gerador produz índices por origem e destino;
- toda relação com `reviewState: "reviewed"` declara `reviewedAgainst`;
- `mode: "editorial-review"` exige data e responsável cuja exposição pública foi autorizada;
- `mode: "legacy-baseline"` fixa somente as revisões vigentes antes da introdução do contrato e proíbe data ou responsável inventados;
- o conteúdo completo dos 32 vínculos legados `r1` é protegido por hash canônico; não pode ser alterado, removido nem usado como modelo para novos IDs;
- a saída de `legacy-baseline` exige nova revisão ordinal e decisão `editorial-review` ou `deprecated`;
- apresentação visual não altera o significado;
- relação ausente é preferível a afinidade vaga.

O catálogo de tipos de relação declara pares de entidades permitidos, direção ou simetria, rótulos de origem e destino, tipo inverso quando houver e exigência de justificativa e referência. Navegar uma relação nos dois sentidos não a torna semanticamente simétrica.

`parentId` precisa de uma decisão por schema: ou permanece uma relação estrutural cardinalizada e é a única fonte de verdade, ou passa a ser derivado de uma aresta de derivação. Os dois não podem ser editados em paralelo.

Vínculos legados sem justificativa, como associações puramente enumeradas entre experiência e teoria, entram na migração com estado de revisão pendente. O gerador não inventa justificativa para completar o schema; a equipe editorial decide se escreve uma razão pública, reclassifica como vínculo estrutural ou remove a aresta.

Etapas de Rotas Guiadas continuam em registros de percurso, pois ordem, razão pedagógica e próximo passo não são equivalentes a uma relação ontológica. O percurso referencia entidades e pode consultar o registro central para contexto.

### Ledger editorial e estado derivado

`content/public/catalogs/editorial-revision-ledger.json` cobre as entidades que podem ser extremos de relações: `theory`, `figure`, `publication` e `experiment`. Cada entrada é identificada pelo par tipo–ID e mantém uma sequência completa `r1`, `r2`, …; cada revisão registra:

- `revisionId`;
- classe efetiva da mudança;
- caminhos alterados em JSON Pointer.
- hash canônico do registro público naquela revisão.

O compilador exige que a última revisão do ledger corresponda ao `revisionId` e ao hash do registro atual e rejeita lacunas, duplicatas, ordem não determinística ou edição direta sem nova revisão. Na instalação, o ledger é atualizado mecanicamente a partir do diff. Os hashes antigos permanecem como prova de integridade, mas o ledger não duplica snapshots editoriais completos.

O estado `needs-review` é derivado, não autoral. Para uma relação `reviewed`, o compilador percorre as revisões posteriores às duas revisões fixadas em `reviewedAgainst`. A existência de qualquer mudança `semantic` ou `structural` torna a relação bloqueante até uma decisão explícita. Mudanças `editorial`, `presentation` e `metadata` posteriores preservam a vigência. Relações `pending` e `deprecated` não são promovidas automaticamente a bloqueio. O runtime expõe `reviewStatus` como `current`, `needs-review`, `pending` ou `deprecated`, além dos motivos e das revisões atuais; `ContentRepository` aceita filtro explícito por `needsReview`.

### Classes de mudança

O vocabulário fechado é `editorial`, `presentation`, `metadata`, `semantic` e `structural`, em ordem crescente de risco. O diff usa JSON Pointer e uma classificação conservadora por raiz de campo. A classe declarada pela pessoa editora pode elevar o risco sugerido, mas nunca reduzi-lo; campo desconhecido é tratado como `structural`. Somente `semantic` e `structural` invalidam a vigência de relações.

Substituições de teoria, perfil, publicação, experimento ou relação exigem classe explícita. Uma entidade nova recebe `structural` como baseline inicial. A classificação registrada no ledger é a classe efetiva após comparar declaração e diff.

## Referências e afirmações

O catálogo único de referências públicas registra:

- ID estável;
- título, autores, instituição e publicadora em campos distintos;
- datas específicas como submissão, publicação, revisão, acesso e última conferência quando aplicáveis;
- tipo de fonte;
- URL ou identificador persistente;
- data de acesso apenas quando necessária;
- licença ou direitos quando o recurso for incorporado;
- estado de disponibilidade;
- notas editoriais não íntimas.

Entidades apontam para IDs. Afirmações que exigem sustentação específica registram `entityRevisionId`, `contentBlockId` ou `claimId`, `referenceId`, papel da fonte (`supports`, `contextualizes` ou `contrasts`) e página, seção ou locator quando aplicável. Bibliografia geral permanece separada. Duas superfícies que usam a mesma obra não criam duas referências.

O gerador produz:

- referências resolvidas por entidade;
- relatório de referências órfãs;
- relatório de IDs ausentes;
- detecção de duplicatas prováveis por DOI, URL normalizada ou metadados;
- índice inverso “onde esta fonte é usada”.

## Fachada de leitura

A fronteira implementada usa carregamento assíncrono e seletores síncronos sobre um snapshot:

```text
ContentSource
  load() -> Promise<ContentSnapshot>

ContentRepository(snapshot)
  list(entityType, query)
  getById(entityType, id)
  getBySlug(entityType, slugOrAlias)
  getRelations(entityRef, filters)
  search(query, filters)
```

`StaticContentSource` importa módulos gerados e resolve o snapshot. `HttpContentSource` implementa a mesma promessa, cache e timeout, mas não está ativado por ausência de endpoint. Depois de um único bootstrap assíncrono, filtros, relações e busca operam sincronicamente sobre o snapshot imutável. A migração dos controladores preservou projeções estáticas específicas quando elas evitam carregar o catálogo completo; novos consumidores não conhecem a implementação de armazenamento.

## Pipeline de autoria e geração

Fluxo implementado:

```text
arquivo de entidade
  -> diff e classe efetiva
  -> ledger editorial proposto
  -> análise de impacto direto
  -> gate de decisões editoriais
  -> validação de schema
  -> validação semântica e cruzada
  -> resolução de aliases, fontes e relações
  -> projeção por allowlist de campos públicos
  -> geração de assets/data/generated
  -> verificação do manifesto público
  -> testes de domínio e interface
  -> dist por allowlist
```

Comandos implementados:

- `content:new --type theory --id <id>` cria um esqueleto não publicável fora de `content/public`;
- `content:check` valida schemas e integridade;
- `content:build` gera os módulos de runtime;
- `content:report` lista órfãos, lacunas, relações que precisam de revisão e dívidas editoriais;
- `content:impact --manifest <arquivo.json>` analisa um conjunto de mudanças sem escrever na fonte canônica;
- `content:apply --manifest <arquivo.json>` aplica o conjunto autorizado de forma atômica;
- `content:rollback` restaura o último runtime válido como contingência, sem alterar a fonte canônica.

O gerador não escreve decisões editoriais. Ele não inventa resumo, estado, crédito, fonte, conexão ou revisão. O runtime é construído somente a partir de campos expressamente permitidos pelo schema público; campo desconhecido falha na validação em vez de ser copiado por conveniência.

O manifesto é um arquivo privado, dentro do projeto e fora de `content/public/`. Seu schema aceita operações sobre `theory`, `figure`, `party`, `publication`, `experiment`, `reference` e `relation`; cada operação aponta para um rascunho JSON também privado. Toda substituição no manifesto exige `force: true` e `changeClass`, inclusive para partes e referências, para que análise e aplicação usem o mesmo contrato. Operações repetidas para a mesma entidade são recusadas. Antes de responder que a mudança é permitida, `content:impact` executa a mesma política de substituição usada por `content:apply`, valida schemas e dados privados, monta todas as fontes propostas em memória e chama a mesma integridade cruzada do compilador — inclusive unicidade bibliográfica, aliases, endpoints, tipos de relação, rastreabilidade, créditos, referências e ledgers. `content:new --source` usa o mesmo carregador privado e o mesmo gate; não existe um caminho simplificado de instalação. A análise retorna, por entidade:

- diff e classificação declarada, sugerida e efetiva;
- relações diretas e seus estados;
- referências adicionadas ou removidas;
- afirmações atingidas;
- experiências e percursos que usam a entidade;
- arquivos gerados e superfícies públicas conhecidas;
- avisos e bloqueios.

O gate bloqueia uma relação anteriormente revisada quando uma mudança invalidante a deixou desatualizada. Rebaixá-la para `pending` no mesmo conjunto não resolve a decisão; é necessário revisá-la contra as novas revisões ou descontinuá-la explicitamente. Relações que já estavam `pending` permanecem aviso. Dívidas bibliográficas e vínculos legados permanecem não bloqueantes apenas dentro de budgets explícitos, que não podem crescer.

`content:apply` usa o mesmo lock para ler o estado anterior, analisar o conjunto, atualizar os registros e os ledgers, compilar e gerar o relatório. Falha de gate, schema, integridade ou compilação restaura todos os arquivos tocados pela transação, inclusive o relatório privado caso ele já tenha sido escrito. Um gate recusado não substitui o relatório canônico do último estado válido; seus bloqueios permanecem na saída de `content:impact` ou no erro da operação. O mecanismo cobre erros capturados; encerramento abrupto do processo ainda não possui journal de fonte autoral.

Ordem operacional:

1. `content:check` valida a fonte;
2. `content:build` gera o runtime e relatórios fora de `dist/`;
3. `verify` confere contratos e manifesto;
4. `build` copia somente a saída pública permitida;
5. `dev` executa `content:check` e regenera quando a fonte mudou, sem servir runtime obsoleto.

Chaves de comportamento, como `moduleKey` dos experimentos, resolvem somente uma allowlist fechada mantida no código. Conteúdo gerado, arquivo autoral ou resposta futura de API nunca fornece caminho de import, HTML executável ou nome livre de módulo.

## Inclusão de uma linha de investigação

O fluxo vigente é:

1. criar um arquivo de entidade a partir do schema;
2. registrar a proveniência editorial privada no mecanismo permitido, fora do runtime;
3. registrar fontes já existentes ou adicionar novas referências normalizadas;
4. declarar afirmações, objeções, critérios de revisão e histórico;
5. adicionar relações justificadas no registro central;
6. agrupar a nova revisão e as decisões sobre relações afetadas em um manifesto;
7. executar `content:impact` e confirmar que nenhuma decisão humana foi substituída por automação;
8. instalar o conjunto com `content:apply`, executar validação e geração;
9. revisar as projeções em Teorias, Mapa, busca, Rotas e Grandes Nomes;
10. publicar sem alterar controlador, HTML ou contagem manual.

Uma conexão nova com um perfil histórico deve aparecer nos dois dossiês a partir da mesma aresta. Se não houver justificativa rigorosa, nenhum dos lados recebe a conexão.

## Inclusão de um perfil

O fluxo equivalente exige:

1. entidade e retrato autorizado;
2. fontes normalizadas;
3. contribuições e limites históricos;
4. créditos e direitos;
5. relações justificadas quando existirem;
6. instalação validada e geração de índices, destaques, comparação e busca a partir dos dados.

Trilhas e linha do tempo referenciam IDs de perfis; não copiam biografias.

## Contribuições: dois modelos, não um

O formulário atual já trata nome e e-mail pela caixa de correio, embora o site não persista os dados. Antes de ampliar o fluxo, a interface precisa informar finalidade, destinatário, ausência de armazenamento pelo site, retenção na caixa postal e canal para solicitar exclusão, com revisão jurídica proporcional.

### Submissão privada futura

Contém contato, proposta, anexos, permissões, consentimentos, mensagens, pareceres e eventos de workflow. Esses registros distinguem finalidade do contato, licença para publicar o texto, direitos de cada asset, autorização para exibir identidade e links e aprovação da versão editorial final. Um único booleano não representa todas essas decisões.

Estados recomendados:

```text
draft
  -> submitted
  -> screening
  -> in-review
  -> changes-requested
  -> approved
  -> converted-to-publication
```

Terminais: `declined`, `withdrawn`. O evento registra ator e papel, inclusive quando a retirada veio da pessoa autora. `converted-to-publication` registra o `publicationId` criado; agendamento e publicação pertencem ao registro público, não à submissão.

Antes de `approved`, verificar direitos separadamente para texto, imagem, gráfico, código, dataset e anexo, registrar conflito de interesses e papel da revisão e obter aprovação final de título, corpo, ordem de crédito, licença, links e alterações editoriais. Identidade da pessoa revisora só se torna pública com autorização.

Esse modelo nunca é copiado para `dist/` nem armazenado no Git. A pessoa autora recebe protocolo ou link seguro somente quando existir backend apropriado.

### Publicação pública

Contém conteúdo final, créditos escolhidos, fontes, licença, relações, versão e histórico público. `authorshipOrigin` distingue publicação interna do Arquivo e contribuição externa; Contribuições é uma projeção filtrada do catálogo geral, não uma segunda cópia. Separar disponibilidade atual de eventos de revisão.

`availabilityState`:

- `published`;
- `superseded`;
- `withdrawn`;
- `retracted`;
- `archived`.

`revisionEventType`:

- `initial-publication`;
- `update`;
- `correction`;
- `metadata-fix`.

Atualizar ou corrigir não torna o conteúdo indisponível. Retirada, retratação e substituição não apagam a URL.

Antes da primeira publicação externa, definir uma matriz de transição com:

- gatilho e exemplos de uso;
- autoridade responsável;
- quando a concordância da pessoa autora é necessária e como registrar discordância;
- `publicNotice` obrigatório com tipo, data efetiva, versão afetada, razão factual curta e substituição;
- `privateDecisionNotes` com pareceres, denúncias, conflitos, dados pessoais e evidência interna, nunca projetadas ao site;
- canal e prazo de contestação;
- vínculo para snapshot afetado e publicação substituta.

Correção atende erro delimitado mantendo a peça disponível. Substituição aponta para versão ou peça sucessora. Retirada registra decisão autoral ou editorial de remover disponibilidade sem afirmar necessariamente má conduta. Retratação sinaliza problema substancial de integridade ou confiabilidade segundo política explícita. A redação final desses critérios exige revisão editorial e jurídica proporcional.

### Papéis e crédito

Pessoa, organização, autoria, afiliação e papel são registros diferentes. Papéis podem incluir autor, coautor, editor, revisor editorial, ilustrador, desenvolvedor ou tradutor. Afiliação declarada não implica endosso institucional. Não chamar revisão editorial de revisão por pares sem processo acadêmico real.

Cada publicação preserva um snapshot do crédito no momento da versão: nome exibido, ordem, papéis, afiliação declarada e links autorizados. Alterar um perfil global não reescreve silenciosamente a autoria histórica.

Contato privado e identidade de crédito não são deduplicados automaticamente por nome ou e-mail. O modelo aceita pseudônimo e vínculo opcional, consentido, com um perfil público. Não usar dados privados para conectar contribuições que a pessoa escolheu manter separadas.

### Snapshots públicos

Antes da primeira publicação externa, cada revisão publicada precisa produzir snapshot imutável com `revisionId`, conteúdo público, crédito daquela versão, referências, relações, aviso editorial aplicável, data e hash de integridade. A URL atual pode apontar para a revisão vigente, mas correção, retratação e citação precisam recuperar a versão afetada. O formato físico e o local de armazenamento podem evoluir; a imutabilidade e a recuperabilidade são requisitos.

### Automação correta

Depois de aprovação explícita, o sistema pode:

- validar campos e permissões;
- gerar página, card, busca, métricas e relações;
- notificar ausência de fonte ou licença;
- publicar estado e histórico;
- propagar correção a todas as projeções.

O sistema não pode:

- aceitar como verdadeiro;
- inferir consentimento;
- publicar automaticamente ao enviar;
- atribuir autoria;
- decidir aceitação, conflito ou retratação sem responsável humano identificado;
- remover crítica;
- transformar referência em endosso.

## Preparação para backend

Quando os gatilhos definidos no plano de maturidade ocorrerem, um banco relacional é suficiente. Modelo lógico inicial:

- `entities`, `entity_slugs`, `entity_revisions`;
- `relation_types`, `relations`;
- `references`, `entity_references`, `claim_references`;
- `paths`, `path_steps`;
- `people`, `organizations`, `affiliations`, `credits`, `publication_credit_snapshots`;
- `submissions`, `submission_events`;
- `assets`, `asset_rights`.

Usar chaves internas no banco e manter IDs públicos separados. JSON pode armazenar campos editoriais variáveis no início, mas identidade, relações, estados, créditos e auditoria devem permanecer consultáveis.

Arquitetura futura mínima:

```text
painel editorial autenticado
  -> API de submissão e revisão
  -> banco relacional
  -> armazenamento privado de anexos
  -> publicação aprovada
  -> snapshot público gerado
  -> site estático
```

O catálogo público deve continuar disponível mesmo se o painel ou a API estiverem indisponíveis. Não expor conexão de banco ao navegador. Aplicar autenticação, autorização por função, limite de taxa, proteção contra abuso, política de retenção, exportação e exclusão de dados pessoais.

A política de retenção precisa separar contato privado apagável de crédito público necessário à atribuição e integridade histórica. Antes de operar o backend, definir quando o crédito pode ser anonimizado, como isso interage com licença, retirada e histórico e quais obrigações impedem exclusão imediata, com revisão jurídica adequada.

## Estado da evolução

### Baseline concluída

- schemas públicos por tipo;
- fonte granular em JSON;
- referências normalizadas;
- registro central de relações;
- aliases e política de revisões;
- compilador e relatório de integridade;
- runtime, busca e métricas gerados;
- `ContentRepository`, sources estático e HTTP;
- bloqueio de imports diretos legados;
- instalação com lock e rollback do runtime;
- contratos e fixtures de conteúdo.

### Dependência editorial concluída

- ledger de classes e caminhos por revisão para entidades relacionáveis;
- `reviewedAgainst` com modos `legacy-baseline` e `editorial-review`;
- derivação determinística de `needs-review`;
- diff e classificação conservadora de mudanças;
- impacto direto sobre relações, referências, afirmações, experiências, percursos e superfícies geradas;
- manifesto privado para análise e aplicação atômica;
- gate proporcional, rollback de todos os arquivos tocados e budgets de dívida;
- contratos automatizados usando Observação Não-Linear como entidade de referência.

### Próximo incremento de operação

A dashboard local usa a plataforma existente; não cria uma segunda fonte de verdade nem duplica diff, classificação, impacto, gate ou transação. Seu primeiro incremento torna o manifesto operável por formulário, exibe decisões de relação e oferece preview isolado. Escopo, fluxo e gates estão na [especificação funcional da dashboard editorial](EDITORIAL_DASHBOARD_SPECIFICATION.md).

Também permanecem decisões de domínio independentes da interface: critérios de promoção de perguntas, objeções e conceitos, redução editorial das dívidas existentes e snapshots completos de teorias.

### Futuro condicionado

Integração Git remota, API, banco, autenticação e armazenamento de anexos só entram pelos gatilhos de operação e privacidade. Toda migração preserva exports, URLs, último snapshot válido e um único proprietário canônico por etapa.

## Invariants

- conteúdo privado nunca é dependência de build público;
- uma entidade possui uma única fonte de verdade canônica;
- uma relação possui uma única fonte de verdade canônica;
- referências compartilhadas possuem um ID;
- totais, estados vazios e índices são derivados;
- IDs e slugs públicos permanecem compatíveis;
- histórico publicado não é reescrito silenciosamente;
- geradores são determinísticos;
- frontend consome contratos, não o local de armazenamento;
- publicação exige decisão editorial;
- ausência de backend não impede autoria e validação estruturadas.

## Validation

Ao alterar a plataforma de conteúdo:

- validar todos os schemas e vocabulários;
- testar IDs, aliases, relações e referências quebradas;
- testar sequência completa do ledger, classes, JSON Pointers e correspondência com a revisão atual;
- testar `reviewedAgainst`, `needs-review`, impacto direto e separação entre blockers, pending e deprecated;
- provar que mudanças editoriais, de apresentação e metadados não escondem uma mudança semanticamente invalidante anterior;
- testar manifesto fora da árvore pública, aplicação atômica e restauração integral após falha;
- comparar exports gerados com os contratos existentes;
- executar busca, filtros, URLs diretas e relações inversas;
- construir DTOs públicos por allowlist, rejeitar campos desconhecidos e usar canary de campo proibido para provar que o gerador não o publica;
- inspecionar `dist/` como defesa adicional para dados privados de contato, campos não permitidos e arquivos inesperados;
- provar geração determinística em ambiente limpo;
- testar adição e correção de uma entidade fictícia em fixture, não no catálogo público;
- medir tempo e número de arquivos manuais necessários.

## Critérios de aceitação

- nova teoria, perfil ou publicação não exige editar HTML ou controlador;
- conexão perfil–teoria é declarada uma vez;
- uma relação revisada declara as duas revisões contra as quais foi avaliada;
- uma mudança semântica ou estrutural não pode ser publicada com relação revisada desatualizada;
- uma mudança não invalidante preserva a vigência sem apagar uma invalidante anterior;
- o manifesto atualiza entidade, relações e ledgers em uma única transação ou restaura o estado anterior;
- referências não são duplicadas por superfície;
- aliases preservam links antigos;
- uma correção atualiza todas as projeções e mantém histórico;
- submissão privada não entra na árvore pública, no bundle, em `dist/` nem no Git;
- sources estático e HTTP obedecem ao mesmo contrato assíncrono de `ContentSnapshot`;
- falha de schema bloqueia o build com caminho e motivo acionáveis;
- nenhuma migração exige mudança visual não relacionada.

## To Verify

- necessidade e formato de um ledger histórico próprio para relações além do histórico do Git;
- política de snapshots completos e recuperáveis para teorias;
- critérios para transformar pergunta, objeção ou conceito em entidade independente;
- vocabulário adicional de tipos de relação somente quando surgir par de entidades real;
- thresholds operacionais que, somados aos gatilhos de segurança e privacidade, justificam iniciar persistência.
