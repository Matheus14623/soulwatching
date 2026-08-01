---
id: "domains.theory-catalog"
title: "Catálogo de linhas de investigação"
scope: "domains"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "contrato público, invariantes, relações, referências e evolução das linhas de investigação"
triggers:
  - "THEORIES"
  - "THEORY_TYPES"
  - "THEORY_REVIEW_STATES"
  - "linha de investigação"
  - "slug"
  - "relação"
  - "relação tipada"
  - "referência"
  - "objeção"
  - "rubrica"
  - "revisão individual"
  - "comparação de teorias"
  - "radar"
required_context:
  - "domains.index"
conditional_context:
  - id: "frontend.user-flows"
    condition: "Quando a alteração afetar busca, filtro, seleção, URL ou mapa."
  - id: "quality.validation-release"
    condition: "Antes de publicar qualquer alteração no catálogo."
related_context:
  - "external.theory-integration"
  - "domains.editorial-model"
  - "domains.content-operations"
  - "domains.editorial-dashboard"
evidence_sources:
  - "content/schemas/theory.schema.json"
  - "content/public/catalogs/editorial-revision-ledger.json"
  - "content/public/theories/observacao-nao-linear.json"
  - "content/public/taxonomies/theories.json"
  - "content/public/relations/theory--observacao-nao-linear--afinidade-conceitual--contentor-finito.json"
  - "content/public/research-tracks/astrobiologia-em-camadas.json"
  - "assets/js/theory-model.js"
  - "assets/js/theory-figure-model.js"
  - "Teorias/teorias.js"
  - "scripts/theory-sources.mjs"
  - "scripts/content/compiler.mjs"
  - "scripts/content/editorial-impact.mjs"
  - "docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx"
supersedes:
  - "external.theory-integration"
---

# Catálogo de linhas de investigação

## Current Confirmed Structure

Contagens de entradas, naturezas, estados, eixos, referências, radar e relações são derivadas dos módulos de dados e não constituem constantes documentais. Consulte ou importe as fontes ativas durante a tarefa; não copie totais voláteis para novos documentos canônicos.

`content/public/theories/` é a fonte canônica das linhas de investigação. Referências vivem no catálogo único de `content/public/references/`; ideias ainda não promovidas ficam em `content/public/research-tracks/`; relações teoria–teoria e perfil–teoria são declaradas uma vez em `content/public/relations/`. O ledger editorial registra a sequência, a classe e os caminhos alterados de cada revisão da teoria. O compilador gera os módulos de compatibilidade e os índices; `theory-model.js` e `theory-figure-model.js` resolvem as projeções públicas sem criar listas paralelas. O vínculo entre cada entrada e sua fonte privada existe apenas no mecanismo editorial autorizado; materiais brutos permanecem fora dos módulos públicos.

## Public Contract

Cada entrada precisa cobrir:

- identidade estável: `id`, `slug`, `code`, títulos e subtítulo;
- classificação: `kind`, `reviewState`, independência, categoria e filtros, além de `parentId` quando a entrada for derivada;
- apresentação: cor, brilho e posição no mapa;
- conteúdo: resumo, proposta, perguntas, conceitos e próximos passos;
- relações e fontes: relações no registro central, referências gerais em `referenceIds` e referências ligadas a afirmações em `claimLinks`;
- leitura crítica: `assessment`, `known`, `focus`, `limit` e `test`;
- escrutínio: objeções com estado, resposta, rubrica própria da natureza e condições explícitas para revisar ou abandonar;
- revisão individual: histórico com versão, rótulo, data verificável e resumo da mudança.

Campos derivados de leitura não criam uma segunda fonte de verdade. Nos adaptadores públicos, ideia central vem do resumo, pergunta central da primeira pergunta, tensão teórica do limite, conexões vêm do registro central e a revisão vigente aponta para o último item de `revisions`.

As objeções usam três estados: aberta, respondida e incorporada. As rubricas possuem três perguntas específicas para cada uma das seis naturezas e orientam revisão sem formar nota ou percentual. `decisionBoundary.revise` e `decisionBoundary.abandon` separam ajuste possível de uma condição que encerra ou reintegra a linha.

## Four-Layer Reading

1. **Contexto conhecido:** base estabelecida, literatura ou observação relevante.
2. **Recorte em investigação:** pergunta e proposição específica.
3. **Limite atual:** incompletude, objeção ou incompatibilidade conhecida.
4. **Caminho verificável:** cálculo, dado, simulação ou critério que pode fortalecer, revisar ou abandonar a proposta.

Essa leitura substitui percentuais sem rubrica.

## Invariants

- `id`, `slug` e `code` são únicos; IDs e slugs publicados são contratos.
- Relações apontam para IDs existentes e são apresentadas simetricamente pelo modelo.
- Cada relação possui um dos sete tipos declarados e uma justificativa; proximidade visual ou compartilhamento de vocabulário não substitui essa justificativa.
- Uma relação `reviewed` fixa as revisões consideradas em `reviewedAgainst`; mudança semântica ou estrutural posterior na teoria deriva `needs-review` e bloqueia publicação até decisão explícita.
- `legacy-baseline` preserva mecanicamente a revisão vigente anterior ao contrato sem inventar data ou responsável; uma revisão humana nova usa `editorial-review`.
- `parentId` aponta para uma linha válida quando houver derivação.
- Categoria e filtros pertencem aos registros declarados.
- Referências são IDs do catálogo externo e não confirmação da proposta.
- Uma afirmação só recebe fontes em `claims` quando os IDs sustentam especificamente aquele trecho; referências gerais continuam separadas.
- Caminhos de fontes, conversas e arquivos brutos não entram em módulos públicos.
- Cor e posição hoje vivem no mesmo registro editorial; mudar essa divisão exige atualizar consumidores e validação.

## Update Workflow

1. Crie um rascunho fora da árvore pública com `npm run content:new -- --type theory --id <id>`.
2. Analise fonte privada somente no contexto editorial autorizado.
3. Classifique natureza e estado antes da apresentação visual.
4. Preencha as quatro camadas, afirmações referenciadas, objeções, respostas e limites de decisão.
5. Registre uma nova revisão; não reescreva uma versão publicada. Classifique a mudança como `editorial`, `presentation`, `metadata`, `semantic` ou `structural`.
6. Preserve IDs e slugs; ao renomear, mantenha o slug anterior em `aliases`.
7. Cadastre referências e relações tipadas por ID, com justificativa e evidência proporcional.
8. Para uma substituição, agrupe teoria e decisões sobre as relações afetadas num manifesto privado.
9. Execute `content:impact`; não transforme automaticamente relações desatualizadas em aprovadas ou pendentes.
10. Instale com `content:apply`, execute `content:check`, `content:build -- --check`, `verify` e revise as projeções públicas.

## To Verify

- Persistência ou publicação de snapshots antigos; `?versao=` hoje identifica a revisão atual, mas não recupera conteúdo histórico.
- Histórico próprio das relações além das revisões recuperáveis pelo Git.
- Critério para promover pergunta, objeção ou conceito a entidade independente.
- Critério mensurável para promover itens do radar.
