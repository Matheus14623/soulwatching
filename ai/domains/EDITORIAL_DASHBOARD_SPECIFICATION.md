---
id: "domains.editorial-dashboard"
title: "Especificação funcional da dashboard editorial"
scope: "domains"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "escopo, fluxos, requisitos e critérios de aceitação da dashboard editorial privada"
triggers:
  - "dashboard editorial"
  - "painel editorial"
  - "cadastro de conteúdo"
  - "análise de impacto"
  - "revisão de relação"
  - "preview editorial"
  - "publicação administrativa"
required_context:
  - "domains.index"
  - "domains.content-operations"
conditional_context:
  - id: "domains.editorial-model"
    condition: "Quando o fluxo tocar publicação, contribuição externa, crédito, correção, retirada ou retratação."
  - id: "project.boundaries"
    condition: "Quando a solução tocar autenticação, dados privados, submissões, anexos ou deploy remoto."
  - id: "project.architecture"
    condition: "Quando a especificação sair do planejamento e passar a orientar implementação."
  - id: "infrastructure.static-deploy"
    condition: "Quando o fluxo passar de rascunho local para preview, commit, build ou publicação."
  - id: "quality.validation-release"
    condition: "Antes de considerar um incremento da dashboard pronto."
related_context:
  - "domains.theory-catalog"
  - "domains.notable-figures"
  - "project.maturity-roadmap"
evidence_sources:
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
  - "scripts/tests/editorial-impact-contracts.test.mjs"
  - "scripts/tests/editorial-change-set-contracts.test.mjs"
  - "scripts/tests/editorial-dashboard-contracts.test.mjs"
  - "scripts/tests/observacao-impact-fixture.test.mjs"
  - "scripts/content/fixtures/impact/observacao-nao-linear.json"
  - "tools/editorial-dashboard/server.mjs"
  - "tools/editorial-dashboard/services/catalog-service.mjs"
  - "tools/editorial-dashboard/services/editorial-workflow.mjs"
  - "tools/editorial-dashboard/services/preview-service.mjs"
  - "tools/editorial-dashboard/services/security.mjs"
  - "tools/editorial-dashboard/services/workspace-store.mjs"
  - "tools/editorial-dashboard/app/index.html"
  - "tools/editorial-dashboard/app/main.js"
  - "assets/js/content-repository.js"
  - "assets/js/content-source.js"
  - "package.json"
---

# Especificação funcional da dashboard editorial

## Purpose

Definir a primeira plataforma privada de autoria, revisão e publicação do Observatório. A dashboard deve tornar o conteúdo estruturado atual operável por formulário, sem transformar HTML em fonte de verdade, duplicar relações ou exigir backend antes de existir necessidade operacional.

Este documento especifica a dashboard e registra o núcleo de domínio que ela opera. O primeiro incremento local existe em `tools/editorial-dashboard/`; diff, classificação, vigência das relações, análise de impacto, gate e aplicação atômica continuam pertencendo aos módulos de conteúdo e não foram reimplementados na interface. Não há autenticação remota porque o processo aceita apenas loopback e não é publicado.

## Decisão executiva

A direção estabelecida para planejamento é incremental:

1. usar o contrato de dependência entre revisões e relações já concluído;
2. construir uma dashboard local sobre `content/public/`, `content/schemas/` e os comandos existentes;
3. validar o fluxo inteiro com `observacao-nao-linear`;
4. tornar o painel remoto por integração privada com Git somente se o acesso fora do ambiente local for necessário;
5. introduzir API, banco relacional e armazenamento de objetos apenas quando os gatilhos operacionais ou de privacidade justificarem.

A saída pública continua estática. A indisponibilidade da ferramenta editorial não pode remover nem degradar a última versão publicada.

## Baseline confirmada

O projeto já possui a plataforma de conteúdo que servirá de base:

- `content/public/` contém registros públicos granulares;
- `content/schemas/` valida os tipos editoriais;
- relações e referências possuem registros centrais;
- `scripts/content/compiler.mjs` valida a integridade cruzada e gera o runtime público;
- `content:new`, `content:check`, `content:build`, `content:report` e `content:rollback` já existem;
- `content:impact` analisa um manifesto privado sem escrever e `content:apply` instala o conjunto validado;
- o ledger editorial registra classe, caminhos e hash canônico por revisão de teorias, perfis, publicações e experimentos;
- relações revisadas registram `reviewedAgainst`; `needs-review` é derivado pelo compilador;
- `content:impact`, `content:apply` e `content:new --source` compartilham carregador privado, política de substituição, validação integral e gate;
- a instalação de múltiplos registros, ledgers e relatório privado é atômica para falhas capturadas e compartilha o lock do conteúdo;
- `ContentRepository` oferece consulta independente do local de armazenamento;
- `StaticContentSource` é a fonte ativa e `HttpContentSource` implementa o contrato futuro sem estar ativado;
- busca, métricas, índices de relações e projeções públicas são derivados;
- os módulos históricos de `assets/data/` funcionam como adaptadores, e imports diretos novos são bloqueados;
- a política atual preserva revisões e aliases publicados durante substituições.

As lacunas relevantes para esta especificação são:

- ausência de interface de autoria;
- ausência de rascunho visual com diff e preview coordenados;
- ausência de interface que apresente o impacto já calculado e recolha as decisões;
- ausência de preview visual coordenado com o manifesto;
- perguntas continuam como textos internos à teoria;
- objeções possuem IDs locais, mas não identidade reutilizável fora da teoria;
- conceitos são textos normalizados apenas por convenção;
- parte dos vínculos experimento–teoria ainda aguarda migração editorial para relações tipadas;
- existem relações que aguardam evidência bibliográfica específica.

Contagens correntes de dívida são retratos do relatório gerado e não podem virar constantes da dashboard. Os budgets máximos atualmente codificados — 12 vínculos experimento→teoria, 31 relações sem evidência específica e 32 baselines técnicos legados — são guardrails para impedir crescimento, não totais a exibir como verdade editorial permanente.

## Problema

Uma alteração em uma linha de investigação pode afetar relações com outras teorias, perfis históricos, experiências, percursos, referências, afirmações e superfícies públicas. O problema original era não conseguir afirmar se uma relação revisada continuava válida depois de uma mudança semântica em um dos extremos. O núcleo atual já resolve essa vigência e impede a instalação enquanto as decisões obrigatórias não forem registradas; a próxima lacuna é tornar esse fluxo legível e operável por uma interface privada.

O problema possui duas partes distintas:

1. **propagação mecânica:** atualizar cards, dossiês, mapa, busca, métricas e relações inversas;
2. **revalidação editorial:** decidir se justificativa, evidência e tipo de uma relação continuam corretos.

A primeira pode ser automática. A segunda precisa de decisão humana explícita.

## Objetivos do produto

- Permitir que uma pessoa mantenedora opere o conteúdo sem editar HTML ou controladores.
- Exibir os campos corretos de cada tipo a partir de contratos versionados.
- Declarar entidade, referência e relação uma única vez.
- Tornar alterações revisáveis por diff antes de alcançar a fonte pública.
- Identificar dependências potencialmente afetadas por uma mudança.
- Exigir decisão humana sobre relações epistemicamente afetadas.
- Preservar IDs, slugs, aliases, URLs e histórico publicado.
- Reutilizar compilador, schemas, lock, instalação e rollback existentes.
- Gerar preview fiel ao artefato público.
- Manter separação absoluta entre rascunho privado, operação administrativa e snapshot público.

## Não objetivos do primeiro incremento

- Criar um CMS público.
- Adicionar uma rota `/admin` ao artefato estático.
- Permitir edição anônima ou publicação direta por visitantes.
- Criar banco de dados, conta, upload ou colaboração simultânea.
- Mudar a arquitetura multipágina.
- Reescrever o frontend público em framework.
- Automatizar aceitação científica, autoria, crédito ou endosso.
- Transformar qualquer palavra em entidade independente.
- Resolver submissões externas privadas dentro do Git.
- Introduzir edição livre de HTML, JavaScript ou caminhos de módulo.

## Princípios e invariantes

### Uma fonte e várias projeções

Uma entidade é cadastrada uma vez; uma relação é declarada uma vez; todas as aparições públicas são derivadas.

### Automação mecânica e decisão humana

O sistema valida, compara, localiza dependências e gera. Uma pessoa identificada decide manter, revisar, descontinuar e publicar.

### Público e privado são pipelines diferentes

Rascunhos, comentários internos, anexos, contatos e pareceres não entram em `content/public`, runtime, Git de publicação ou `dist/`.

### Identidade não depende de apresentação

Título, cor, posição ou slug não são chave interna de relação. Relações apontam para IDs estáveis. Slug anterior vira alias.

### Histórico publicado é imutável

Uma versão publicada recebe nova revisão quando o conteúdo muda. `--force` não autoriza reescrever o passado.

### Disponibilidade pública independe do painel

O último snapshot válido permanece disponível se dashboard, serviço Git, API ou banco falharem.

## Modelo editorial operado pela dashboard

### Entidades de primeira classe já existentes

- teoria ou linha de investigação;
- perfil histórico;
- referência;
- relação;
- experimento;
- publicação;
- constelação;
- Rota Guiada;
- trilha de pesquisa;
- trilha de perfis;
- evento de linha do tempo;
- metadado de página;
- parte pública autorizada.

### Elementos internos à teoria

Perguntas, objeções e conceitos não devem ser promovidos automaticamente.

Uma pergunta ou objeção recebe entidade própria quando pelo menos uma destas condições ocorrer:

- precisa ser relacionada a mais de uma teoria;
- possui ciclo de revisão independente;
- recebe referências ou publicações próprias;
- precisa de URL, busca ou citação própria;
- participa de uma Rota Guiada como destino independente.

Um conceito recebe entidade própria quando:

- possui definição editorial que precisa ser preservada;
- é usado de maneira consistente por várias entidades;
- possui aliases, limites de uso ou relações próprias;
- precisa ser comparado ou auditado.

Enquanto essas condições não ocorrerem, perguntas continuam como conteúdo local e objeções usam seus IDs estáveis dentro da teoria. Tags e filtros não são conceitos.

### Pessoas, perfis e crédito

Um perfil em Grandes Nomes representa conteúdo histórico. Uma pessoa autora, editora, revisora ou colaboradora pertence ao modelo de identidade e crédito. As duas responsabilidades não devem compartilhar automaticamente o mesmo registro.

### Rotas Guiadas

Rotas continuam como sequências ordenadas. Ordem pedagógica, duração e próximo passo não são relações ontológicas e não devem ser convertidos em arestas genéricas.

## Classificação de mudança

Cada revisão criada pelo painel precisa declarar uma classe principal:

| Classe | Exemplos | Impacto mínimo |
| --- | --- | --- |
| `editorial` | ortografia, clareza sem mudança de sentido, pontuação | regenerar projeções e registrar diff |
| `presentation` | cor, posição no mapa, destaque, ordem visual | regenerar superfícies visuais |
| `metadata` | descrição de busca, palavra-chave, rótulo funcional | regenerar índices e metadados afetados |
| `semantic` | proposta, resumo, pergunta, limite, teste, objeção | revisar relações dependentes e afirmações |
| `structural` | referências, relações, identidade, tipo, estado, slug | validar integridade, impacto e compatibilidade |

Uma revisão pode possuir sinalizadores secundários, mas precisa de uma classe principal para o gate.

A classificação inicial é informada pela pessoa editora. O sistema pode sugerir uma classe pela lista de campos alterados, mas não pode reduzir silenciosamente uma mudança semântica a correção editorial.

O contrato já está implementado com o vocabulário fechado `editorial`, `presentation`, `metadata`, `semantic` e `structural`. O diff determinístico usa JSON Pointer; a classe efetiva é sempre a mais conservadora entre a declaração e a inferência por campos. Campo desconhecido é `structural`. Somente `semantic` e `structural` invalidam relações. Se a classificação declarada for fraca demais e a classe efetiva for invalidante, o conjunto recebe bloqueio explícito em vez de ser publicado silenciosamente.

## Vigência das relações

### Estado implementado

Uma relação com `reviewState: "reviewed"` registra as revisões de `source` e `target` consideradas na última revisão. O ledger editorial mantém a sequência e a classe das revisões de cada extremo; o compilador cruza os dois contratos e deriva a vigência.

### Contrato vigente

Uma revisão editorial explícita usa:

```json
{
  "reviewedAgainst": {
    "mode": "editorial-review",
    "sourceRevisionId": "entidade-origem-r2",
    "targetRevisionId": "entidade-destino-r1",
    "reviewedAt": "2026-08-01",
    "reviewedBy": "responsavel-publico-autorizado"
  }
}
```

O contrato funcional e físico é:

- a revisão dos dois extremos é conhecida;
- na revisão editorial explícita, data e responsável publicamente autorizado são obrigatórios;
- a mudança semântica ou estrutural de um extremo torna a relação potencialmente desatualizada;
- a relação original não é apagada;
- o compilador deriva o estado operacional `needs-review`;
- `needs-review` não substitui o vocabulário autoral `pending`, `reviewed` e `deprecated`;
- a relação só volta a ser considerada vigente depois de decisão explícita.

As relações que já estavam revisadas quando esse contrato foi introduzido receberam `mode: "legacy-baseline"` com as revisões então vigentes. Esse baseline é técnico: não contém nem permite data ou responsável inventados. Ele preserva o estado público anterior até a primeira revisão editorial explícita; o budget inicial de 32 não pode crescer.

O ledger editorial cobre `theory`, `figure`, `publication` e `experiment`. Ele guarda `revisionId`, classe efetiva, caminhos alterados e o hash canônico do registro daquela revisão, sem duplicar snapshots completos do conteúdo. O hash impede edição direta mantendo o mesmo `revisionId`. Para relações, o histórico anterior continua sendo o Git; a Fase 1 não criou um ledger histórico relacional separado.

### Decisões disponíveis

Para cada relação afetada:

- **confirmar:** justificativa, tipo e evidências continuam adequados;
- **revisar:** criar nova revisão da relação;
- **reclassificar:** alterar o tipo com justificativa;
- **complementar:** adicionar evidência ou locator;
- **descontinuar:** marcar como `deprecated`, preservando o histórico;
- **adiar:** manter fora do conjunto pronto para publicação quando o gate exigir revisão.

## Análise de impacto

### Entradas

- tipo e ID da entidade alterada;
- revisão anterior e revisão proposta;
- campos modificados;
- classe da mudança;
- relações de entrada e saída;
- referências gerais e por afirmação;
- percursos e coleções que referenciam o ID;
- superfícies públicas geradas pelo compilador.

### Saídas

A dashboard precisa exibir os campos que o núcleo já calcula:

- resumo do diff;
- entidades diretamente relacionadas;
- relações que exigem revisão;
- referências adicionadas, removidas ou órfãs;
- afirmações cuja sustentação mudou;
- experiências e percursos que usam a entidade;
- páginas e componentes derivados que serão regenerados;
- alertas de slug, alias, ID ou estado;
- bloqueios e avisos não bloqueantes;
- comandos ou ações necessários para validar e publicar.

### Profundidade

A implementação calcula impacto direto, de um salto, e superfícies derivadas conhecidas. Expansão transitiva não foi introduzida: uma rede inteira não é marcada como inválida apenas porque existe um caminho indireto.

### Política de gate

- mudança `editorial`: não bloqueia por relação, salvo alteração detectada em campo classificado como semântico;
- mudança `presentation`: não invalida relação de domínio;
- mudança `metadata`: atualiza índices e não invalida relação, salvo quando também altera identidade ou classificação de domínio;
- mudança `semantic`: bloqueia publicação quando houver relação revisada cuja vigência não foi decidida;
- mudança `structural`: bloqueia em integridade quebrada e exige decisão proporcional para relações e aliases.

Avisos de evidência editorial já aceitos como dívida podem permanecer não bloqueantes enquanto o budget estiver explícito e não aumentar. Relações novas sujeitas a referência obrigatória não podem ampliar silenciosamente essa dívida.

Na implementação atual, uma relação que já estava `pending` gera aviso e uma `deprecated` não bloqueia. Uma relação anteriormente `reviewed` que se tornou desatualizada bloqueia. Alterá-la para `pending` no mesmo conjunto é tratado como adiamento e continua bloqueando; a saída exige nova revisão contra os extremos finais ou descontinuação explícita. O compilador também impede que qualquer relação desatualizada já presente na fonte passe pelo gate global.

## Estados operacionais

Estado operacional da dashboard não substitui `reviewState`, maturidade científica ou disponibilidade pública.

Fluxo mínimo:

```text
draft
  -> validating
  -> ready-for-review
  -> changes-requested
  -> approved
  -> installed
  -> published
```

Regras:

- `draft` fica fora de `content/public`;
- `validating` executa schema e integridade sem instalar;
- `ready-for-review` possui diff e impacto calculados;
- `approved` registra decisão humana;
- `installed` indica que a fonte canônica foi alterada com sucesso;
- `published` exige build e deploy concluídos;
- falha após instalação não deve ser representada como publicação;
- cancelamento de rascunho não remove uma versão já publicada.

O MVP local persiste esse estado em `.content-drafts/editorial-dashboard/<workspace-id>/state.json`, ao lado do manifesto e dos registros privados. A versão otimista do workspace impede que uma aba salve sobre outra leitura; hashes canônicos detectam alteração externa dos arquivos. Esse metadado operacional não entra no snapshot público.

## Perfis de acesso

### Primeiro incremento

Existe uma única pessoa mantenedora local, com controle do repositório. Não há autenticação de aplicação porque o painel não é publicado.

### Evolução remota

Os papéis conceituais são:

- **autor:** propõe ou revisa o conteúdo;
- **editor:** ajusta estrutura e metadados;
- **revisor:** decide relações, fontes e limites;
- **publicador:** autoriza instalação, merge e deploy;
- **administrador:** configura vocabulários e permissões.

Uma pessoa pode acumular papéis. A separação serve para auditoria e futura autorização; não justifica banco ou login no MVP.

## Requisitos funcionais

### RF-01 — Visão geral

Exibir:

- rascunhos;
- alterações aguardando revisão;
- relações potencialmente desatualizadas;
- erros de schema;
- relações aguardando evidência;
- vínculos legados aguardando migração;
- último build válido;
- última publicação conhecida.

### RF-02 — Catálogo unificado

Listar entidades por tipo, estado, texto, revisão e data. A lista precisa distinguir registro público, rascunho e item arquivado sem usar cor como único sinal.

### RF-03 — Formulário por schema

Apresentar os campos permitidos para o tipo selecionado, com:

- ajuda editorial curta;
- obrigatoriedade explícita;
- validação próxima ao campo;
- componentes próprios para IDs, referências, relações e vocabulários;
- prevenção de campo desconhecido;
- visualização do JSON somente como recurso avançado, não como fluxo principal.

A UI pode ser orientada pelos schemas, mas textos de ajuda e widgets específicos devem vir de metadados de apresentação separados. O JSON Schema sozinho não define uma boa experiência editorial.

### RF-04 — Cadastro de teoria

Organizar o formulário em:

1. identidade;
2. classificação;
3. apresentação;
4. resumo e proposta;
5. perguntas e conceitos;
6. revisão crítica;
7. objeções e limites de decisão;
8. referências e afirmações;
9. relações;
10. revisão e responsáveis.

### RF-05 — Biblioteca de referências

Permitir:

- buscar antes de cadastrar;
- reutilizar referência existente;
- conferir onde ela é usada;
- detectar DOI, URL ou metadados provavelmente duplicados;
- distinguir bibliografia geral, fonte de afirmação e evidência de relação;
- registrar papel `supports`, `contextualizes` ou `contrasts` quando esse contrato for adotado.

### RF-06 — Editor de relações

Permitir selecionar origem, destino e tipo somente entre combinações válidas. Exibir:

- rótulo direto e inverso;
- simetria;
- justificativa;
- exigência de evidência;
- estado de revisão;
- revisão dos extremos;
- preview dos dois lados.

O editor rejeita autorrelação proibida, aresta duplicada e duplicação invertida de relação simétrica.

### RF-07 — Revisões e diff

Comparar revisão pública vigente com o rascunho por:

- campos escalares;
- listas adicionadas, removidas e reordenadas;
- objeções e afirmações por ID;
- relações e referências;
- metadados de apresentação.

O histórico publicado é somente leitura.

### RF-08 — Análise de impacto

Executar a política descrita neste documento e permitir decisão individual ou em lote somente quando a decisão em lote tiver exatamente o mesmo significado e evidência.

O motor já existe fora da interface. `content:impact --manifest <arquivo.json>` monta o overlay completo em memória, recusa operações repetidas e executa a mesma integridade cruzada, política de revisão e ledgers da aplicação antes de retornar diff, classificação, dependências diretas, avisos e blockers sem escrever. A dashboard deve apresentar essa saída e gerar o mesmo manifesto; não deve manter uma segunda implementação da regra.

### RF-09 — Preview

Gerar a aplicação pública com o rascunho aprovado em ambiente isolado e fornecer links diretos para:

- dossiê;
- cards;
- mapa;
- busca;
- Grandes Nomes relacionados;
- experiências e Rotas Guiadas afetadas.

O preview não publica nem altera a revisão vigente.

### RF-10 — Instalação

Usar a operação existente de instalação, respeitando lock, validação, histórico, aliases e rollback. Escrita parcial ou falha de compilação não pode deixar a fonte canônica em estado ambíguo.

`content:apply --manifest <arquivo.json>` já instala operações de teoria, perfil, parte pública autorizada, publicação, experimento, referência e relação na mesma transação. Registros, ledger editorial, ledger de publicação, relatório privado e runtime são restaurados se o gate ou a compilação falhar. `content:new --source` usa o mesmo caminho seguro. A dashboard deve invocar esse contrato e comunicar que a garantia cobre falhas capturadas; encerramento abrupto ainda não possui journal da fonte.

### RF-11 — Publicação

No MVP local, publicar significa preparar uma alteração validada para o fluxo Git e build existente. O painel precisa distinguir:

- arquivo instalado;
- commit criado;
- preview gerado;
- alteração integrada;
- deploy concluído.

### RF-12 — Auditoria

Registrar, no mínimo:

- entidade;
- revisão anterior e nova;
- classe da mudança;
- resumo;
- responsável declarado;
- data;
- relações decididas;
- resultado de validação;
- destino da instalação.

Informação privada de operação não entra no snapshot público.

### RF-13 — Remoção segura

Antes de remover um registro, calcular dependências e distinguir:

- descarte físico de rascunho nunca publicado;
- arquivamento de entidade pública;
- descontinuação de relação;
- retirada, retratação ou substituição de publicação;
- exclusão física excepcional, sujeita a regra de domínio e decisão registrada.

Registro publicado ainda referenciado não pode ser apagado silenciosamente. O mecanismo exato de arquivamento para cada tipo precisa ser fechado antes de implementar a ação.

### RF-14 — Recuperação

Expor o último runtime válido e orientar rollback sem apresentar a restauração do runtime como correção da fonte. A fonte canônica precisa ser reconciliada antes da próxima publicação.

## Arquitetura de informação da dashboard

### 1. Visão geral

Saúde editorial, trabalho pendente e estado técnico.

### 2. Conteúdos

Lista unificada com atalhos para Teorias, Grandes Nomes, Experimentos, Publicações, Rotas, Constelações e páginas institucionais.

### 3. Relações

Tabela e exploração em grafo como visualização complementar. O formulário e a tabela permanecem o mecanismo acessível e preciso.

### 4. Referências

Biblioteca central, uso inverso e duplicatas prováveis.

### 5. Revisão

Fila de impacto, diff, decisões e aprovações.

### 6. Preview

Links por superfície, viewport e entidade.

### 7. Builds

Validação, geração, commit, preview, deploy e rollback.

### 8. Configuração

Vocabulários e preferências locais. Alterar schema ou taxonomia continua exigindo revisão técnica, mesmo que a interface ofereça auxílio.

## Arquitetura por etapas

### Etapa A — dashboard local

```text
navegador local
  -> processo editorial local
  -> rascunhos fora de content/public
  -> manifesto privado
  -> content:impact
  -> preview local
  -> content:apply
  -> instalação validada em content/public + ledgers
  -> Git e build existentes
```

O navegador não escreve no filesystem sozinho. Um processo local de confiança fornece operações restritas e nunca aceita caminho arbitrário enviado pela interface.

O trecho entre manifesto, impacto e aplicação continua centralizado na CLI e nos módulos compartilhados. O manifesto e seus rascunhos permanecem dentro do projeto e fora de `content/public`; caminhos externos e fontes dentro da árvore pública são rejeitados. O processo local produz esses arquivos, apresenta diff e dependências e coordena o preview sem substituir os contratos existentes.

O processo local foi implementado em Node.js 22, HTML, CSS e módulos JavaScript nativos, sem dependências adicionais. `npm run dashboard` vincula a interface a `localhost:4174`, valida endereço remoto, `Host`, `Origin`, tipo e limite do corpo e exige token CSRF nas mutações. O navegador fornece somente tipos e IDs allowlisted; nunca escolhe caminho de arquivo ou comando.

O preview usa uma raiz de sessão sob `.content-cache/editorial-dashboard/previews/`, copia por allowlist uma fonte sem materiais privados, aplica o manifesto no workspace-sombra e executa o build real em subprocessos sem shell. O artefato recebe token efêmero, cookie local, `noindex`, expiração e limpeza no encerramento. A aplicação canônica exige o digest atual do impacto e um preview correspondente; dentro do lock, o impacto é recalculado antes de qualquer escrita.

Cada preview usa um cookie `HttpOnly` próprio, porque cookies do mesmo hostname não são isolados por porta. A interface também associa toda resposta assíncrona ao ID e à época do workspace que iniciou a ação: trocar de rascunho invalida respostas tardias, encerra a prévia anterior e impede que diff, digest ou confirmação sejam reaproveitados em outro registro. Editar, reanalisar ou receber conflito limpa o estado de preview e exige nova confirmação.

Um workspace com estado ou registro inconsistente permanece visível como item de recuperação local, sem expor seu conteúdo e sem permitir retomada. A única ação oferecida é a exclusão segura dentro da raiz privada; links simbólicos e violações de caminho continuam sendo falhas bloqueantes, não casos recuperáveis. Se a instalação canônica terminar, mas o registro privado de conclusão falhar, a resposta preserva o sucesso da instalação e apresenta um aviso operacional que proíbe repetir a aplicação antes de conferir a revisão canônica.

Essa etapa não precisa de:

- API pública;
- banco de dados;
- autenticação web;
- segredo remoto;
- rota administrativa na Vercel.

### Etapa B — dashboard remota baseada em Git

```text
dashboard privada autenticada
  -> serviço server-side
  -> branch e commit no repositório privado
  -> validação em CI
  -> preview da Vercel
  -> aprovação e merge
  -> deploy público
```

O token Git fica somente no servidor, com permissão mínima. A dashboard não recebe segredo de escrita. O Observatório público não precisa expor endpoint de mutação.

### Etapa C — serviço editorial com persistência

```text
dashboard autenticada
  -> API editorial privada
  -> banco relacional
  -> armazenamento privado de anexos
  -> revisão e aprovação
  -> exportador de snapshot público
  -> build estático
```

Essa etapa só começa quando houver gatilho real, como múltiplas pessoas editoras, rascunhos privados remotos, submissões, anexos, colaboração concorrente, agendamento ou auditoria persistente.

## Segurança e privacidade

- A dashboard remota é uma aplicação separada do artefato público.
- Ocultar `/admin` não constitui controle de acesso.
- Nenhum token ou conexão de banco chega ao navegador.
- Operações de arquivo usam IDs e diretórios allowlisted.
- Conteúdo livre é tratado como dado, nunca como HTML executável ou caminho de módulo.
- Rascunhos e relatórios privados ficam fora de `content/public` e `dist/`.
- Submissões externas, contatos, permissões e anexos ficam fora do Git.
- Preview privado não pode ser indexado nem compartilhado sem autorização.
- Logs não armazenam conteúdo ou dados pessoais além do necessário.
- Publicação exige pessoa e decisão identificáveis.

## Requisitos não funcionais

### RNF-01 — Compatibilidade

Não alterar IDs, slugs, aliases, URLs, exports nem aparência pública por conveniência da dashboard.

### RNF-02 — Determinismo

A mesma fonte, schemas e versão do gerador produzem o mesmo runtime e relatório.

### RNF-03 — Acessibilidade

A dashboard precisa funcionar por teclado, preservar foco após validação e re-render, anunciar erros, não depender de drag-and-drop e oferecer alternativa tabular ao grafo.

### RNF-04 — Desempenho

Listas e busca devem continuar responsivas com crescimento significativo do catálogo. Operações pesadas de compilação podem executar em processo separado e apresentar progresso sem bloquear edição.

### RNF-05 — Recuperabilidade

Nenhuma ação destrutiva remove silenciosamente histórico publicado. Operações interrompidas precisam falhar de modo reconhecível.

### RNF-06 — Observabilidade

Validação deve informar caminho, entidade, campo, regra e ação possível. “Erro ao salvar” não é diagnóstico suficiente.

### RNF-07 — Portabilidade

O contrato editorial não pode depender do framework escolhido para a dashboard. Schemas, compilador e snapshot continuam reutilizáveis.

### RNF-08 — Testabilidade

Fluxos críticos precisam de fixtures, testes de contrato e testes de navegador. O catálogo público real não é fixture de mutação.

### RNF-09 — Usabilidade editorial

Uma pessoa mantenedora precisa criar ou revisar uma teoria, uma referência e uma relação sem conhecer o formato do runtime, os adaptadores ou os controladores públicos.

### RNF-10 — Escalabilidade editorial

Adicionar um registro não exige atualizar manualmente contagens, cards, busca, mapa, relações inversas, listas HTML ou controladores. Catálogos extensos usam busca, filtros e carregamento proporcional sem alterar o contrato do conteúdo.

## Piloto obrigatório: Observação Não-Linear

O primeiro fluxo precisa usar uma cópia de fixture de `observacao-nao-linear`, nunca modificar o catálogo público durante teste.

Os contratos da Fase 1 já usam Observação Não-Linear como entidade de referência para provar diff, classes, sequência do ledger, invalidação persistente, separação entre `reviewed`, `pending` e `deprecated`, gate e rollback. O cenário completo abaixo ainda precisa ser repetido pela interface da Fase 2 em workspace isolado.

### Cenário

1. criar rascunho a partir da revisão vigente;
2. alterar um trecho semântico da proposta;
3. incluir uma pergunta;
4. revisar uma objeção;
5. substituir ou adicionar uma referência;
6. calcular o impacto;
7. listar relações com teorias e Grandes Nomes;
8. marcar cada relação como confirmada, revisada, descontinuada ou pendente;
9. mostrar diff e preview;
10. validar e instalar em workspace isolado;
11. comprovar geração das projeções;
12. comprovar rollback e preservação da revisão anterior.

### Resultado esperado

Nenhum HTML, controlador, contagem, card, dossiê inverso ou índice é editado manualmente. Nenhuma relação é considerada revisada contra a nova teoria sem uma decisão explícita.

## Critérios de aceitação do MVP

- A teoria piloto pode ser alterada pela interface sem edição manual de JSON.
- Os campos produzidos obedecem ao schema vigente.
- A dashboard não escreve fora dos diretórios permitidos.
- Rascunho não entra em `content/public` nem em `dist/`.
- Diff separa conteúdo, apresentação, referências e relações.
- Mudança semântica identifica todas as relações diretas.
- Relação revisada registra as revisões consideradas.
- Relação declarada uma vez aparece nos dois sentidos.
- Referência existente é reutilizada sem duplicação.
- Instalação respeita revisão imutável e aliases.
- Preview mostra todas as superfícies afetadas.
- Falha de validação não altera a fonte pública.
- Build continua determinístico.
- O site público funciona sem a dashboard.
- Teclado completa cadastro, revisão e publicação local.
- Nenhuma decisão científica é tomada automaticamente.

## Métricas de sucesso

- tempo para alterar uma teoria e publicar uma revisão;
- quantidade de arquivos editados manualmente;
- quantidade de dependências afetadas não apresentadas pelo painel;
- relações publicadas sem decisão contra a revisão vigente;
- erros encontrados antes e depois do preview;
- taxa de reutilização de referências existentes;
- falhas de build causadas por conteúdo;
- tempo de recuperação após instalação inválida.

O objetivo do MVP é reduzir a edição manual a zero para o fluxo piloto e não omitir dependências diretas conhecidas.

## Ordem de implementação

### Fase 0 — contrato

**Estado:** concluída.

- aprovar esta especificação;
- corrigir divergências da documentação atual;
- fechar decisões de estado e gate;
- manter decisões ainda abertas em `To Verify`.

### Fase 1 — dependência editorial

**Estado:** concluída no núcleo de domínio e na CLI; não inclui dashboard.

- classificar mudanças;
- registrar revisões dos extremos nas relações;
- derivar `needs-review`;
- construir relatório de impacto direto;
- validar o overlay completo com o mesmo contrato da instalação;
- proteger revisões e créditos com hashes canônicos;
- aplicar registros, ledgers e relatório privado com rollback;
- cobrir o comportamento com fixtures.

### Fase 2 — dashboard local mínima

**Estado:** implementada para o fluxo vertical de teorias.

- catálogo;
- formulário de teoria;
- biblioteca de referências;
- editor de relações;
- diff;
- impacto;
- preview;
- instalação.

O catálogo, o formulário de teoria, a reutilização de referências, as decisões de relações, o diff, o impacto, o preview-sombra e a instalação protegida estão disponíveis no processo local. A cobertura de outros tipos de entidade continua pertencendo à Fase 4; a dashboard não anuncia suporte de autoria que ainda não possui.

### Fase 3 — piloto e endurecimento

**Estado:** em validação.

- executar o cenário de Observação Não-Linear;
- testar recuperação;
- testar acessibilidade;
- medir tempo e arquivos manuais;
- ajustar o contrato antes de ampliar tipos.

### Fase 4 — cobertura dos demais tipos

- Grandes Nomes;
- experimentos;
- Rotas Guiadas;
- publicações;
- páginas institucionais;
- taxonomias sob controle técnico.

### Fase 5 — operação remota

Somente após necessidade confirmada, escolher integração Git privada ou API persistente conforme os gatilhos deste documento.

## Decisões fechadas no primeiro incremento

- tecnologia: Node.js 22, HTML, CSS e módulos JavaScript nativos, sem framework ou dependência nova;
- localização: `tools/editorial-dashboard/` no mesmo repositório, fora do manifesto público;
- estado operacional: workspace privado versionado e assinado em `.content-drafts/editorial-dashboard/`;
- preview: workspace-sombra efêmero em `.content-cache/editorial-dashboard/`, build real e servidor local protegido;
- identidade relacional: `reviewedBy` aponta para uma `party` pública autorizada; uma parte nova entra como operação do mesmo manifesto;
- aplicação: confirmação explícita, digest atual, preview correspondente e reanálise dentro do lock.

## Decisões explicitamente abertas

- representação futura de pessoa responsável interna sem expor identidade privada; o contrato público atual aceita somente identidade autorizada;
- semântica de arquivamento, descontinuação e exclusão para cada tipo;
- estratégia para reduzir os budgets de dívida sem reclassificar automaticamente relações;
- necessidade de ledger histórico próprio para relações além do Git;
- critérios de promoção de pergunta, objeção e conceito;
- momento em que integração Git remota passa a compensar;
- política de backup dos rascunhos privados;
- requisitos jurídicos antes de operar submissões e dados pessoais.

## To Verify

- Confirmar a experiência do formulário com uso editorial real e tecnologias assistivas antes de ampliar a outros tipos.
- Medir o custo atual do fluxo manual para estabelecer baseline.
- Validar se o impacto direto cobre todos os consumidores reais ou se alguma projeção exige dependência transitiva explícita.
- Definir a identidade de revisão e aprovação antes de tornar o painel remoto.
