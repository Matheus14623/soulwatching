---
id: "domains.editorial-model"
title: "Modelo editorial e publicação"
scope: "domains"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "voz pública, classificação de formatos, privacidade e passagem de rascunho para publicação"
triggers:
  - "tom de voz"
  - "ensaio"
  - "registro"
  - "arquivo"
  - "rascunho"
  - "conteúdo público"
  - "privacidade"
  - "contribuição externa"
  - "crédito"
required_context:
  - "domains.index"
related_context:
  - "project.boundaries"
  - "frontend.design-accessibility"
  - "domains.theory-catalog"
  - "domains.content-operations"
evidence_sources:
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "Contribuicoes/contribuicoes.html"
  - "assets/data/contributions.js"
  - "index.html"
  - "docs/INTEGRACAO_TEORIAS.md"
  - "scripts/build.mjs"
  - "scripts/verify.mjs"
---

# Modelo editorial e publicação

## Purpose

Preservar a essência do observatório sem transformar rascunhos, bastidores ou afirmações pessoais em conteúdo público.

## Current Confirmed Structure

O produto distingue linhas de investigação, ensaios e registros próprios, experiências de laboratório, percursos guiados e contribuições externas. O Arquivo declara zero ensaios e registros; o catálogo de contribuições externas também está vazio. São estados diferentes e nenhum deles cria títulos, autores, datas ou métricas fictícias para preencher espaço.

## Canonical Rules

- Escreva em português brasileiro com voz clara, madura, reflexiva e impessoal o suficiente para uso público.
- Separe ciência estabelecida, hipótese, metáfora, interpretação e recomendação.
- Não apresente referências como validação automática de uma proposta.
- Não publique conversas, bastidores de ferramentas, elogios genéricos, validações automáticas, narrativa íntima ou notas dirigidas ao autor.
- Não invente datas, fontes, resultados, depoimentos, métricas, projetos ou maturidade.
- Materiais brutos e pareceres são insumos privados; o conteúdo público é uma síntese editorial separada.
- Comentários de implementação e blocos desativados não pertencem aos arquivos públicos. Se uma ressalva é necessária ao visitante, escreva texto final no contexto adequado.
- Informações profissionais públicas devem permanecer funcionais e discretas; novos dados pessoais exigem decisão explícita.
- Conteúdo externo preserva o nome de crédito escolhido, a natureza da participação, fontes, permissões e revisões; não deve ser reatribuído ao Observatório ou a Matheus Camargo.
- Publicação externa não constitui endosso científico, e uma objeção publicada não é tratada como ataque pessoal.

## Publication Flow

```text
material privado
  -> pergunta e escopo identificados
  -> fato, hipótese, metáfora e opinião separados
  -> fontes, objeções e limites revisados
  -> versão pública sem caminhos internos ou bastidores
  -> URL, metadados e leitura responsiva
  -> verificação e build por allowlist
```

Propostas externas seguem uma entrada separada:

```text
formulário local
  -> e-mail preparado pelo navegador
  -> confirmação de autoria ou permissão
  -> leitura editorial e verificação de fontes
  -> decisão explícita de crédito, licença, revisão e local de publicação
  -> entrada no catálogo público somente depois da autorização
```

Os cinco formatos aceitos hoje são ensaio, nota técnica, visualização, revisão ou objeção e linha de investigação convidada. O formulário usa `mailto:`: não faz upload, não grava dados, não cria conta e não publica automaticamente.

## When Not To Publish

Não substitua o estado vazio do Arquivo até existir um ensaio ou registro próprio real, revisado, navegável e com uma decisão de schema. Não preencha a área de Contribuições até existir material externo autorizado, creditado e revisado. Um fragmento curto ainda precisa de contexto e estado editorial; não deve virar diário.

## Validation

Revise linguagem, procedência, privacidade, distinção epistemológica e presença apenas no artefato público permitido.

## To Verify

- Schema e rota canônica do primeiro ensaio, registro ou conteúdo externo completo.
- O telefone pessoal foi retirado do conteúdo público; e-mail, LinkedIn e GitHub permanecem como canais profissionais.
