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
  - "assets/js/observer.js"
  - "assets/js/resonance.js"
---

# Índice de qualidade

Leia este escopo para revisar uma mudança ou definir o nível de validação proporcional ao risco.

## Navegação

- [Validação e release](VALIDATION_AND_RELEASE.md)
- [Desempenho e acessibilidade](PERFORMANCE_AND_ACCESSIBILITY.md)

## Estado confirmado

O projeto possui verificação estrutural/editorial e build por allowlist, mas não possui suíte E2E, testes unitários do produto, regressão visual, CI ou telemetria. Os validadores da base `ai/` possuem testes nativos separados.

## Quando atualizar

Atualize este escopo quando uma regra passar a ser crítica, um novo arquivo público surgir, a matriz responsiva mudar ou uma nova verificação automatizada for criada.

## To Verify

- Navegadores e dispositivos de suporte oficial.
- Métricas de Core Web Vitals, FPS e memória em produção.
