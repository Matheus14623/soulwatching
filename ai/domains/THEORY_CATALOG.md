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
  - "referência"
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
evidence_sources:
  - "assets/data/theories.js"
  - "assets/data/theory-references.js"
  - "assets/data/research-tracks.js"
  - "assets/js/theory-model.js"
  - "scripts/theory-sources.mjs"
  - "scripts/verify.mjs"
  - "docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx"
supersedes:
  - "external.theory-integration"
---

# Catálogo de linhas de investigação

## Current Confirmed Structure

Contagens de entradas, naturezas, estados, eixos, referências, radar e relações são derivadas dos módulos de dados e não constituem constantes documentais. Consulte ou importe as fontes ativas durante a tarefa; não copie totais voláteis para novos documentos canônicos.

`assets/data/theories.js` é a fonte pública. `theory-references.js` possui a bibliografia; `research-tracks.js` mantém ideias ainda não promovidas; `theory-model.js` centraliza localização, categoria e relações simétricas. O vínculo entre cada entrada e sua fonte privada existe apenas em `scripts/theory-sources.mjs`; os materiais brutos permanecem fora dos módulos públicos.

## Public Contract

Cada entrada precisa cobrir:

- identidade estável: `id`, `slug`, `code`, títulos e subtítulo;
- classificação: `kind`, `reviewState`, independência, categoria e filtros, além de `parentId` quando a entrada for derivada;
- apresentação: cor, brilho e posição no mapa;
- conteúdo: resumo, proposta, perguntas, conceitos e próximos passos;
- relações e fontes: `connections` e `referenceIds` válidos;
- leitura crítica: `assessment`, `known`, `focus`, `limit` e `test`;
- revisão: versão, rótulo e data verificável.

Campos derivados de leitura não devem criar uma segunda fonte de verdade. No estado atual, ideia central vem do resumo, pergunta central da primeira pergunta e tensão teórica do limite. A revisão é compartilhada pelo conjunto durante o congelamento dos dados, não individual por objeto.

## Four-Layer Reading

1. **Contexto conhecido:** base estabelecida, literatura ou observação relevante.
2. **Recorte em investigação:** pergunta e proposição específica.
3. **Limite atual:** incompletude, objeção ou incompatibilidade conhecida.
4. **Caminho verificável:** cálculo, dado, simulação ou critério que pode fortalecer, revisar ou abandonar a proposta.

Essa leitura substitui percentuais sem rubrica.

## Invariants

- `id`, `slug` e `code` são únicos; IDs e slugs publicados são contratos.
- Relações apontam para IDs existentes e são apresentadas simetricamente pelo modelo.
- `parentId` aponta para uma linha válida quando houver derivação.
- Categoria e filtros pertencem aos registros declarados.
- Referências são IDs do catálogo externo e não confirmação da proposta.
- Caminhos de fontes, conversas e arquivos brutos não entram em módulos públicos.
- Cor e posição hoje vivem no mesmo registro editorial; mudar essa divisão exige atualizar consumidores e validação.

## Update Workflow

1. Analise a fonte privada somente no contexto editorial autorizado.
2. Classifique natureza e estado antes da apresentação visual.
3. Preencha as quatro camadas e referências verificáveis.
4. Preserve IDs e slugs; use derivação em vez de duplicar um núcleo.
5. Ajuste posição e relações com IDs existentes.
6. Execute `npm run verify` e revise home, Teorias e Mapa em desktop e mobile.

## To Verify

- Se `revision` deve passar de global a individual.
- Tipagem futura das relações sem quebrar o contrato atual.
- Estratégia de aliases para slugs antigos.
- Critério mensurável para promover itens do radar.
