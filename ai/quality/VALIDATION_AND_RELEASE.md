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
  - "package.json"
---

# Validação e release

## Automated Coverage

`npm run verify` cobre a lista declarada de arquivos obrigatórios, referências e âncoras dos HTML cadastrados, restrições de linguagem em HTML e nos módulos públicos de dados, comentários nos arquivos públicos cadastrados, campos e relações dos catálogos de teorias e grandes nomes e sincronização da base `ai/`. No catálogo de perfis, também valida fontes, retratos, tipos de conexão, teorias resolvidas e as três posições de destaque. `npm run build` repete a verificação, recria `dist/` e rejeita artefatos internos proibidos.

Essa cobertura é estrutural. Ela não prova comportamento no navegador, acessibilidade completa, desempenho, disponibilidade de links externos ou ausência de regressão visual.

O verificador não enumera automaticamente todo arquivo futuro dentro dos diretórios copiados por inteiro. Também não cobre texto de interface montado em strings JavaScript com as mesmas regras editoriais aplicadas ao HTML e aos dados, não resolve imports de todos os módulos, não valida sintaxe CSS e não exige unicidade de `code` no catálogo.

## Required Checks

1. Execute `npm run verify`.
2. Execute os testes de ferramentas da base quando seus geradores mudarem.
3. Execute `npm run build` antes de publicar.
4. Inspecione `dist/` quanto a conteúdo inesperado quando a allowlist mudar.
5. Faça QA manual proporcional à superfície alterada.

## UI Checklist

- Navegação principal, menu, Escape e retorno ao topo.
- Busca, cada dimensão de filtro, estado vazio e reset.
- URL direta válida no catálogo e no mapa.
- URL direta de perfil, busca, áreas, estado vazio, arraste, pausa, índice e controles da galeria.
- Seleção relacionada, foco e URL coerentes após re-render.
- Visão Estelar ligada e desligada repetidamente sem canvas duplicado.
- Ressonância com áudio inicialmente desligado e controles por teclado.
- Movimento reduzido, zoom de 200% e ausência de overflow horizontal.
- Console sem erros.
- Larguras 1440, 1024, 768, 430, 390 e 360 px quando houver mudança visual.

## Release Boundaries

Não declare uma validação de navegador como atual se ela não foi repetida após a mudança. Resultados registrados em snapshots anteriores são histórico de execução, não garantia permanente.

## To Verify

- Smoke test automatizado em navegador.
- Auditoria automatizada de acessibilidade e regressão visual.
- CI para executar verificação e build em cada mudança.
- Varredura de todos os arquivos efetivamente copiados para `dist/`, incluindo strings públicas renderizadas por JavaScript.
- Validação de imports dos módulos, sintaxe CSS e unicidade de códigos editoriais.
