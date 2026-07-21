---
id: "project.boundaries"
title: "Fronteiras, fontes de verdade e legado"
scope: "project"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "separação entre código ativo, conteúdo privado, documentação, legado e derivados"
triggers:
  - "dist"
  - "output"
  - "fonte privada"
  - "documentação histórica"
  - "ia/"
  - "material bruto"
required_context:
  - "project.index"
related_context:
  - "domains.editorial-model"
  - "infrastructure.static-deploy"
  - "maintenance.source-coverage"
evidence_sources:
  - "scripts/build.mjs"
  - "scripts/theory-sources.mjs"
  - "docs/INTEGRACAO_TEORIAS.md"
  - "DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md"
  - "ia/estrutura geral observatório.md"
---

# Fronteiras, fontes de verdade e legado

## Current Confirmed Structure

| Área | Papel | Autoridade |
| --- | --- | --- |
| HTML, CSS, JS e configurações ativos | Implementação do produto | Primária para comportamento atual. |
| `assets/data/` | Conteúdo público estruturado | Primária para dados exibidos. |
| `scripts/theory-sources.mjs` e materiais brutos | Proveniência editorial privada | Ler somente em tarefa editorial explícita. |
| `README.md` | Onboarding humano | Resumo, não proprietário de regras detalhadas. |
| `docs/INTEGRACAO_TEORIAS.md` | Especificação especializada anterior | Referência atual ligada ao domínio canônico em `ai/`. |
| `DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md` | Snapshot narrativo amplo | Referência preservada, decomposta por escopo em `ai/`. |
| `ia/estrutura geral observatório.md` | Auditoria histórica | Legado; exige revalidação. |
| `dist/` e `output/` | Artefatos derivados | Nunca usar como fonte de verdade. |

## Canonical Rules

- Código e configuração ativos prevalecem sobre um snapshot divergente.
- Não exponha caminhos de fontes, rascunhos, conversas, pareceres ou artefatos de QA no site público.
- Não leia materiais brutos por padrão; abra-os apenas quando a tarefa exigir curadoria editorial.
- Preserve documentos históricos e registre sua cobertura; não os reescreva para parecerem atuais.
- A pasta `ai/` é documentação interna e deve permanecer fora de `dist/`.

## Evidence

O build usa uma allowlist pública e rejeita extensões/documentos internos no artefato. A origem privada das entradas é mantida fora dos módulos consumidos pelo navegador.

## To Verify

- A allowlist copia alguns diretórios inteiros; arquivos futuros nesses diretórios precisam entrar no alcance do verificador antes de serem considerados seguros.
- A política futura para remover ou arquivar assets órfãos ainda não foi definida.
