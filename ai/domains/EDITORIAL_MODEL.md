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
required_context:
  - "domains.index"
related_context:
  - "project.boundaries"
  - "frontend.design-accessibility"
  - "domains.theory-catalog"
evidence_sources:
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "index.html"
  - "docs/INTEGRACAO_TEORIAS.md"
  - "scripts/build.mjs"
  - "scripts/verify.mjs"
---

# Modelo editorial e publicação

## Purpose

Preservar a essência do observatório sem transformar rascunhos, bastidores ou afirmações pessoais em conteúdo público.

## Current Confirmed Structure

O produto distingue linhas de investigação, ensaios, registros e experiências de laboratório. O Arquivo ainda declara zero publicações e não cria títulos, datas ou métricas fictícias para preencher espaço.

## Canonical Rules

- Escreva em português brasileiro com voz clara, madura, reflexiva e impessoal o suficiente para uso público.
- Separe ciência estabelecida, hipótese, metáfora, interpretação e recomendação.
- Não apresente referências como validação automática de uma proposta.
- Não publique conversas, bastidores de ferramentas, elogios genéricos, validações automáticas, narrativa íntima ou notas dirigidas ao autor.
- Não invente datas, fontes, resultados, depoimentos, métricas, projetos ou maturidade.
- Materiais brutos e pareceres são insumos privados; o conteúdo público é uma síntese editorial separada.
- Comentários de implementação e blocos desativados não pertencem aos arquivos públicos. Se uma ressalva é necessária ao visitante, escreva texto final no contexto adequado.
- Informações profissionais públicas devem permanecer funcionais e discretas; novos dados pessoais exigem decisão explícita.

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

## When Not To Publish

Não substitua o estado vazio do Arquivo até existir uma publicação real, revisada, navegável e com uma decisão de schema. Um fragmento curto ainda precisa de contexto e estado editorial; não deve virar diário.

## Validation

Revise linguagem, procedência, privacidade, distinção epistemológica e presença apenas no artefato público permitido.

## To Verify

- Schema e rota canônica do primeiro ensaio ou registro completo.
- Decisão atual sobre manter telefone pessoal no conteúdo público.
