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
  - "scripts/public-manifest.mjs"
  - "scripts/build.mjs"
  - "scripts/serve.mjs"
  - "scripts/content/compiler.mjs"
  - "scripts/content/paths.mjs"
  - "content/schemas/entity.schema.json"
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
| `content/public/` | Fonte autoral pública granular | Primária para conteúdo, relações, referências e taxonomias. |
| `content/schemas/` | Contratos públicos e validação | Primária para a forma aceita de cada registro. |
| `assets/data/generated/` | Runtime público compilado | Derivada; nunca editar como fonte. |
| demais módulos em `assets/data/` | Adaptadores de compatibilidade | Derivados da fonte granular ou mantidos apenas por contrato legado. |
| `scripts/public-manifest.mjs` | Rotas e composição pública | Primária para servidor local, verificação, build e smoke tests. |
| `.content-drafts/`, `.content-reports/` e `.content-cache/` | Workspaces, diagnósticos e previews locais | Privados e derivados; nunca entram em `dist/`. |
| `tools/editorial-dashboard/` | Aplicação administrativa local | Código privado de operação; não é rota pública nem conteúdo do artefato. |
| `scripts/theory-sources.mjs` e materiais brutos | Proveniência editorial privada | Ler somente em tarefa editorial explícita. |
| `README.md` | Onboarding humano | Resumo, não proprietário de regras detalhadas. |
| `docs/INTEGRACAO_TEORIAS.md` | Especificação especializada anterior | Referência atual ligada ao domínio canônico em `ai/`. |
| `DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md` | Snapshot narrativo amplo | Referência preservada, decomposta por escopo em `ai/`. |
| `ia/estrutura geral observatório.md` | Auditoria histórica | Legado; exige revalidação. |
| `dist/` e `output/` | Artefatos derivados | Nunca usar como fonte de verdade. |

## Canonical Rules

- Código e configuração ativos prevalecem sobre um snapshot divergente.
- Conteúdo público é alterado em `content/public/`; runtime gerado e adaptadores não recebem edição autoral direta.
- Não exponha caminhos de fontes, rascunhos, conversas, pareceres ou artefatos de QA no site público.
- Ferramentas sob `tools/` precisam de servidor, segurança e testes próprios; não podem ser cadastradas no manifesto público nem copiadas para `dist/`.
- Não leia materiais brutos por padrão; abra-os apenas quando a tarefa exigir curadoria editorial.
- Preserve documentos históricos e registre sua cobertura; não os reescreva para parecerem atuais.
- A pasta `ai/` é documentação interna e deve permanecer fora de `dist/`.

## Evidence

O compilador projeta somente campos públicos validados, e o build usa uma allowlist central para compor `dist/`. O servidor de desenvolvimento aplica a mesma fronteira e os smoke tests confirmam que caminhos internos conhecidos respondem 404. A origem privada das entradas, rascunhos e relatórios permanece fora dos módulos consumidos pelo navegador.

## To Verify

- Mudanças futuras na allowlist ou nos campos projetados precisam de canary e inspeção de `dist/` antes de serem consideradas seguras.
- A política futura para remover ou arquivar assets órfãos ainda não foi definida.
