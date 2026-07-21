---
id: "project.architecture"
title: "Arquitetura atual"
scope: "project"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "stack, rotas, entrypoints e divisão de responsabilidades do produto"
triggers:
  - "nova rota"
  - "entrypoint"
  - "módulo"
  - "stack"
  - "arquitetura multipágina"
required_context:
  - "project.index"
conditional_context:
  - id: "frontend.pages-modules"
    condition: "Quando a tarefa modificar HTML, CSS ou controladores de página."
related_context:
  - "project.boundaries"
  - "infrastructure.static-deploy"
evidence_sources:
  - "package.json"
  - "index.html"
  - "Teorias/teorias.html"
  - "Mapa/mapa.html"
  - "Arquivo/arquivo.html"
  - "Laboratorio/laboratorio.html"
  - "assets/js/main.js"
  - "assets/js/page-shell.js"
supersedes:
  - "external.current-architecture"
---

# Arquitetura atual

## Purpose

Registrar a estrutura que existe hoje e orientar mudanças sem transformar o site em outra arquitetura por conveniência.

## Current Confirmed Structure

O Observatório é uma aplicação estática multipágina. Cada destino principal é um HTML real; não existe roteador client-side. O navegador executa módulos ES diretamente.

| Superfície | Entry point | Responsabilidade |
| --- | --- | --- |
| Home | `index.html` → `assets/js/main.js` | Gateway, Visão Estelar, recorte de teorias, mapa-resumo, filosofia, ressonância e contato. |
| Teorias | `Teorias/teorias.html` → `Teorias/teorias.js` | Busca, filtros, cards, dossiê, referências, radar e URL direta. |
| Mapa | `Mapa/mapa.html` → `Mapa/mapa.js` | Relações, eixos, seleção, detalhe e URL direta. |
| Arquivo | `Arquivo/arquivo.html` → `assets/js/page-shell.js` | Estado editorial e conteúdo estático. |
| Laboratório | `Laboratorio/laboratorio.html` → `assets/js/page-shell.js` | Índice estático das experiências existentes. |
| Compatibilidade | `teorias.html` | Redirecionamento legado para a rota atual. |

Tecnologias confirmadas: HTML5, CSS, JavaScript ES Modules, Canvas 2D, Web Audio API, History API e IntersectionObserver. Não há framework, TypeScript, backend, banco, CMS ou dependências declaradas.

## Canonical Rules

- Preserve a arquitetura multipágina enquanto a escala não justificar outra decisão explícita.
- Compartilhe regras de domínio e dados; mantenha controladores de apresentação por rota.
- Use módulos pequenos com inicialização defensiva quando um elemento não existir.
- Uma nova rota recebe HTML real, CSS específico apenas quando necessário e `page-shell.js` se precisar somente da navegação comum.
- Não adicione uma dependência para substituir uma API nativa suficiente.

## Dependencies

`assets/data/theories.js` alimenta home, Teorias e Mapa. `assets/js/theory-model.js` concentra localização, correspondência de categoria e relações simétricas. Navegação e rolagem são compartilhadas por `navigation.js` e `smooth-scroll.js`.

## Validation

Execute `npm run verify` depois de alterar entrypoints, imports, rotas ou arquivos obrigatórios. Execute `npm run build` para comprovar a composição do artefato público.

## To Verify

- Matriz oficial de navegadores suportados.
- Critério de escala que justificaria Vite, outro gerador estático ou páginas individuais por slug.
