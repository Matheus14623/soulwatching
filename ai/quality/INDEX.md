---
id: "quality.index"
title: "Índice de qualidade"
scope: "quality"
kind: "index"
status: "canonical"
canonical_for:
  - "roteamento de verificação, release, desempenho e acessibilidade"
triggers:
  - "teste"
  - "QA"
  - "verify"
  - "release"
  - "performance"
  - "acessibilidade"
required_context:
  - "root.index"
related_context:
  - "quality.validation-release"
  - "quality.performance-accessibility"
evidence_sources:
  - "scripts/verify.mjs"
  - "scripts/build.mjs"
  - "scripts/public-manifest.mjs"
  - "scripts/tests/public-smoke.test.mjs"
  - "scripts/tests/accessibility-contracts.test.mjs"
  - "scripts/tests/browser-smoke.test.mjs"
  - ".github/workflows/quality.yml"
  - "assets/js/observer.js"
  - "assets/js/resonance.js"
---

# Índice de qualidade

Leia este escopo para revisar uma mudança ou definir o nível de validação proporcional ao risco.

## Navegação

- [Validação e release](VALIDATION_AND_RELEASE.md)
- [Desempenho e acessibilidade](PERFORMANCE_AND_ACCESSIBILITY.md)

## Estado confirmado

O projeto possui verificação estrutural/editorial, build por manifesto, smoke HTTP de todas as rotas, contratos estáticos de acessibilidade e um smoke em navegador real quando Chrome, Chromium ou Edge está disponível. O workflow `quality.yml` executa os testes da base e `npm test` em push e pull request com Node 22. Isso ainda não equivale a uma suíte E2E completa, teste unitário de todos os modelos, regressão visual, auditoria automatizada ampla de acessibilidade ou telemetria.

## Quando atualizar

Atualize este escopo quando uma regra passar a ser crítica, um novo arquivo público surgir, a matriz responsiva mudar ou uma nova verificação automatizada for criada.

## To Verify

- Navegadores e dispositivos de suporte oficial.
- Métricas de Core Web Vitals, FPS e memória em produção.
