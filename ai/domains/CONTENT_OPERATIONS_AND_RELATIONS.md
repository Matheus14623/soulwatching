---
id: "domains.content-operations"
title: "Operações de conteúdo e relações"
scope: "domains"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "arquitetura-alvo de entidades, referências, relações, geração de catálogos, submissões e futura persistência"
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
  - "project.architecture"
  - "project.maturity-roadmap"
evidence_sources:
  - "assets/data/theories.js"
  - "assets/data/theory-references.js"
  - "assets/data/notable-figures.js"
  - "assets/data/notable-figure-references.js"
  - "assets/data/experiments.js"
  - "assets/data/learning-paths.js"
  - "assets/data/contributions.js"
  - "assets/js/theory-model.js"
  - "assets/js/theory-figure-model.js"
  - "assets/js/global-search.js"
  - "scripts/build.mjs"
  - "scripts/public-manifest.mjs"
  - "scripts/verify.mjs"
---

# Operações de conteúdo e relações

## Purpose

Definir como o Observatório deve evoluir de catálogos JavaScript estruturados para uma plataforma de conteúdo validada, gerada e substituível por persistência futura, sem quebrar a aplicação multipágina nem duplicar relações.

Este é um contrato de arquitetura-alvo. A estrutura recomendada, os comandos editoriais e a fachada descritos abaixo ainda não existem, salvo quando a seção declarar o estado atual.

## Current Confirmed Structure

- `assets/data/theories.js` mantém linhas de investigação e relações teoria–teoria.
- `assets/data/theory-references.js` mantém referências das linhas.
- `assets/data/notable-figures.js` mantém perfis, conexões perfil–teoria, trilhas e linha do tempo.
- `assets/data/notable-figure-references.js` mantém referências dos perfis.
- `assets/data/constellations.js` mantém campos do Atlas, fontes e metadados de reconhecimento.
- `assets/data/experiments.js` mantém experiências e seus vínculos com teorias.
- `assets/data/learning-paths.js` mantém percursos ordenados por catálogos existentes.
- `assets/data/research-tracks.js` mantém itens do radar ainda não promovidos a linhas independentes.
- `assets/data/contributions.js` reúne vocabulário, validadores, dados públicos e projeções de contribuição.
- `theory-figure-model.js` deriva corretamente a relação inversa nos dossiês de teoria a partir da conexão declarada no perfil.
- busca, métricas e interfaces importam os módulos públicos diretamente.
- o build copia `assets/data` recursivamente para o artefato público.
- não há backend, banco, conta, upload, API ou armazenamento de submissão.

Os registros já possuem boa riqueza editorial. O problema não é ausência de estrutura, mas a combinação de quatro responsabilidades em um mesmo lugar: autoria, validação, forma de runtime e transporte público.

## Problemas a resolver

### Acoplamento

Consumidores conhecem o caminho físico dos catálogos. Trocar a origem dos dados por arquivos gerados ou API exigiria alterar muitos imports.

### Granularidade

Arquivos extensos aumentam conflito de edição, tornam a revisão de uma entidade menos isolada e incentivam contagens ou índices manuais.

### Relações distribuídas

Uma pessoa precisa saber em qual lado declarar cada conexão. Uma relação perfil–teoria é declarada no perfil; teoria–teoria em outro módulo; experiência–teoria em outro. A interface deriva algumas inversões, mas não existe um contrato comum de procedência, evidência e revisão.

### Referências paralelas

Catálogos de referência separados podem representar a mesma obra ou fonte com IDs e metadados diferentes.

### Fronteira pública ampla

Qualquer arquivo colocado em uma árvore copiada recursivamente pode alcançar `dist/`. Isso é aceitável apenas para dados destinados ao público.

### Evolução editorial incompleta

Revisões atuais registram a versão mais recente, mas não recuperam snapshots históricos. Contribuições possuem contrato público, mas não um documento completo, workflow de correção ou submissão privada.

## Modelo de responsabilidade

Separar cinco camadas:

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

## Estrutura-alvo recomendada

```text
content/
  schemas/
    entity.schema.json
    theory.schema.json
    figure.schema.json
    constellation.schema.json
    experiment.schema.json
    publication.schema.json
    relation.schema.json
    reference.schema.json
  public/
    theories/
      <id>.json
    figures/
      <id>.json
    constellations/
      <id>.json
    experiments/
      <id>.json
    research-tracks/
      <id>.json
    publications/
      <id>.json
    references/
      <id>.json
    relations/
      <id>.json
    paths/
      <id>.json
    figure-trails/
      <id>.json
    timeline-events/
      <id>.json
    taxonomies/
      <id>.json
    site-pages/
      <id>.json
    presentation/
      home-featured.json
      map-layout.json
      experiment-runtime.json
assets/
  data/
    generated/
      runtime/
      search-index.js
      content-metrics.js
.content-reports/
    integrity-report.json
```

`assets/data/generated` é a única saída destinada ao navegador e precisa ser incluída explicitamente no manifesto público. `.content-reports` é derivado local ou de CI, permanece fora da allowlist e nunca entra em `dist/`. A política recomendada é gerar ambos deterministicamente em desenvolvimento, verificação e build, sem versionar saídas; somente as fontes e os schemas são canônicos. Nunca colocar em `content/public` rascunho privado, dado de contato, token, anexo de submissão, prova de permissão, parecer privado ou material bruto. Resumo de revisão deliberadamente editado para publicação é permitido no histórico público. Nome de crédito e links públicos só entram por autorização específica e por campos incluídos na allowlist do schema público.

Durante a migração, adaptadores em `assets/data` preservam os exports atuais. O objetivo não é obrigar o navegador a buscar dezenas de arquivos; o gerador pode continuar entregando bundles JavaScript compactos.

## Contratos por tipo

O envelope comum a todo documento autoral precisa apenas de:

- versão do schema;
- `id` público estável, nunca recalculado a partir do título;
- tipo do registro;
- dimensão de estado aplicável ao tipo;
- revisão verificável.

Schemas específicos completam o contrato por capacidades como `Addressable`, `Citable`, `Revisioned`, `Credited` e `Renderable`. Uma teoria, perfil ou publicação navegável possui `slug`, `aliases`, título, resumo, créditos, referências e histórico conforme sua natureza. Referência não precisa de slug ou resumo editorial; relação não precisa de título, crédito ou URL própria. Natureza epistemológica, datas, coordenadas, limites de simulação e metadados de apresentação só são obrigatórios nos tipos aos quais realmente pertencem.

Taxonomias, trilhas, linha do tempo, radar e metadados de páginas institucionais também são conteúdo governado. Eles precisam de schema e geração próprios; não devem reaparecer como arrays ou títulos manuais dentro de controladores.

IDs semânticos já publicados permanecem como chaves legadas válidas. Nos catálogos principais, `id` e `slug` coincidem atualmente; `code` é um identificador editorial separado nas teorias. A migração deve preservar esses valores, não normalizá-los por estética. Um identificador interno de banco poderá ser adicionado no futuro, sem substituir o ID público nas URLs e relações.

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

Relações de domínio devem se tornar entidades de primeira classe. Forma recomendada:

```json
{
  "id": "rel-0001",
  "source": { "type": "figure", "id": "figure-id" },
  "target": { "type": "theory", "id": "theory-id" },
  "type": "historical-foundation",
  "label": "Base histórica",
  "justification": "Explicação pública, delimitada e verificável.",
  "referenceIds": ["reference-id"],
  "reviewState": "reviewed",
  "revisionId": "rel-0001-r1"
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
- apresentação visual não altera o significado;
- relação ausente é preferível a afinidade vaga.

O catálogo de tipos de relação declara pares de entidades permitidos, direção ou simetria, rótulos de origem e destino, tipo inverso quando houver e exigência de justificativa e referência. Navegar uma relação nos dois sentidos não a torna semanticamente simétrica.

`parentId` precisa de uma decisão por schema: ou permanece uma relação estrutural cardinalizada e é a única fonte de verdade, ou passa a ser derivado de uma aresta de derivação. Os dois não podem ser editados em paralelo.

Vínculos legados sem justificativa, como associações puramente enumeradas entre experiência e teoria, entram na migração com estado de revisão pendente. O gerador não inventa justificativa para completar o schema; a equipe editorial decide se escreve uma razão pública, reclassifica como vínculo estrutural ou remove a aresta.

Etapas de Rotas Guiadas continuam em registros de percurso, pois ordem, razão pedagógica e próximo passo não são equivalentes a uma relação ontológica. O percurso referencia entidades e pode consultar o registro central para contexto.

## Referências e afirmações

Criar um catálogo único de referências públicas com:

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

O gerador deve produzir:

- referências resolvidas por entidade;
- relatório de referências órfãs;
- relatório de IDs ausentes;
- detecção de duplicatas prováveis por DOI, URL normalizada ou metadados;
- índice inverso “onde esta fonte é usada”.

## Fachada de leitura

Introduzir uma fronteira assíncrona de carregamento e seletores síncronos sobre um snapshot:

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

O primeiro `ContentSource` importa módulos gerados e resolve o snapshot imediatamente. Um source HTTP futuro implementa a mesma promessa. Depois de um único bootstrap assíncrono, filtros, relações e busca operam sincronicamente sobre o snapshot imutável. Controladores não importam a implementação de armazenamento; recebem o repositório ou modelos que o utilizam.

## Pipeline de autoria e geração

Fluxo-alvo:

```text
arquivo de entidade
  -> validação de schema
  -> validação semântica e cruzada
  -> resolução de aliases, fontes e relações
  -> projeção por allowlist de campos públicos
  -> geração de assets/data/generated
  -> verificação do manifesto público
  -> testes de domínio e interface
  -> dist por allowlist
```

Comandos recomendados, ainda não implementados:

- `content:new --type theory --id <id>` cria somente um esqueleto válido;
- `content:check` valida schemas e integridade;
- `content:build` gera os módulos de runtime;
- `content:report` lista órfãos, lacunas e duplicatas prováveis.

O gerador não escreve decisões editoriais. Ele não inventa resumo, estado, crédito, fonte, conexão ou revisão. O runtime é construído somente a partir de campos expressamente permitidos pelo schema público; campo desconhecido falha na validação em vez de ser copiado por conveniência.

Ordem operacional:

1. `content:check` valida a fonte;
2. `content:build` gera o runtime e relatórios fora de `dist/`;
3. `verify` confere contratos e manifesto;
4. `build` copia somente a saída pública permitida;
5. `dev` executa `content:check` e regenera quando a fonte mudou, sem servir runtime obsoleto.

Chaves de comportamento, como `moduleKey` dos experimentos, resolvem somente uma allowlist fechada mantida no código. Conteúdo gerado, arquivo autoral ou resposta futura de API nunca fornece caminho de import, HTML executável ou nome livre de módulo.

## Inclusão de uma linha de investigação

Depois da migração, o fluxo deve ser:

1. criar um arquivo de entidade a partir do schema;
2. registrar a proveniência editorial privada no mecanismo permitido, fora do runtime;
3. registrar fontes já existentes ou adicionar novas referências normalizadas;
4. declarar afirmações, objeções, critérios de revisão e histórico;
5. adicionar relações justificadas no registro central;
6. executar validação e geração;
7. revisar as projeções em Teorias, Mapa, busca, Rotas e Grandes Nomes;
8. publicar sem alterar controlador, HTML ou contagem manual.

Uma conexão nova com um perfil histórico deve aparecer nos dois dossiês a partir da mesma aresta. Se não houver justificativa rigorosa, nenhum dos lados recebe a conexão.

## Inclusão de um perfil

O fluxo equivalente deve exigir:

1. entidade e retrato autorizado;
2. fontes normalizadas;
3. contribuições e limites históricos;
4. créditos e direitos;
5. relações justificadas quando existirem;
6. geração de índices, destaques, comparação e busca a partir dos dados.

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

## Estratégia de migração

### Passo 1 — schemas e segurança

- inventariar campos atuais e consumidores;
- definir schemas sem alterar o runtime;
- proibir campos privados na árvore pública;
- validar IDs, slugs, aliases e referências.

### Passo 2 — formato granular piloto

- migrar um catálogo de baixo risco como piloto;
- testar se uma pessoa mantenedora adiciona entidade e relação sem conhecer o runtime;
- gerar exatamente o export atual;
- comparar snapshots semânticos;
- manter reexports compatíveis.

### Passo 3 — relações e referências

- normalizar fontes;
- criar registro central;
- adaptar `theory-model` e `theory-figure-model`;
- comprovar que inversões e URLs permanecem iguais.

### Passo 4 — índices e fachada

- gerar busca e métricas;
- fazer modelos consumirem `ContentRepository`;
- impedir imports novos diretamente dos arquivos físicos;
- adicionar regra de arquitetura ao verificador.

### Passo 5 — publicações e contribuições

- introduzir rota completa, revisões e estados públicos;
- separar submissão privada;
- somente então avaliar persistência.

Cada passo deve ser reversível enquanto os exports atuais forem preservados. Não migrar todos os catálogos de uma vez.

Cada piloto precisa declarar:

- uma única fonte de verdade durante a etapa;
- fixture dourada ou snapshot semântico e teste de paridade dos exports;
- chave explícita para selecionar o adaptador antigo ou o novo;
- retenção do último snapshot válido;
- procedimento de rollback;
- migração por `schemaVersion`;
- proibição de editar simultaneamente fonte antiga e nova.

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

Antes de aceitar a plataforma de conteúdo:

- validar todos os schemas e vocabulários;
- testar IDs, aliases, relações e referências quebradas;
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
- referências não são duplicadas por superfície;
- aliases preservam links antigos;
- uma correção atualiza todas as projeções e mantém histórico;
- submissão privada não entra na árvore pública, no bundle, em `dist/` nem no Git;
- sources estático e HTTP obedecem ao mesmo contrato assíncrono de `ContentSnapshot`;
- falha de schema bloqueia o build com caminho e motivo acionáveis;
- nenhuma migração exige mudança visual não relacionada.

## To Verify

- formato autoral final por entidade: JSON, YAML ou Markdown com frontmatter.
- formato e armazenamento de snapshots públicos imutáveis, a decidir antes da primeira publicação externa.
- vocabulário completo de tipos de relação por par de entidades.
- thresholds operacionais que, somados aos gatilhos de segurança e privacidade, justificam iniciar persistência.
