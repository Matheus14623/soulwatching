---
id: "maintenance.source-coverage"
title: "Cobertura das fontes documentais"
scope: "maintenance"
kind: "migration-ledger"
status: "canonical"
canonical_for:
  - "inventário e decisão deliberada sobre documentação anterior à base canônica"
triggers:
  - "nova documentação fora de ai"
  - "migração de fonte"
  - "auditoria de cobertura"
required_context:
  - "maintenance.index"
related_context:
  - "maintenance.graph-standard"
  - "maintenance.expansion-guide"
  - "project.boundaries"
evidence_sources:
  - "ai/maintenance/source-coverage-decisions.json"
  - "ai/tools/build-source-coverage-ledger.mjs"
---

# Cobertura das fontes documentais

Este arquivo é gerado deterministicamente. Não o edite diretamente.

Decisões: [source-coverage-decisions.json](source-coverage-decisions.json). Gerador: [build-source-coverage-ledger.mjs](../tools/build-source-coverage-ledger.mjs).

## Política de cobertura

- O inventário inclui `.md`, `.docx` e `.pdf` fora de `ai/`, `dist/`, `output/` e `.git/`.
- Toda fonte inventariada exige uma decisão deliberada ou uma exclusão explícita.
- Headings Markdown são extraídos automaticamente; binários usam uma lista manual deliberada, inclusive quando vazia.
- Markdown é normalizado para `LF` antes do cálculo de tamanho e SHA-256; `.docx` e `.pdf` preservam os bytes originais.
- Destinos canônicos são validados com o casing real do filesystem.
- O ledger não reproduz conteúdo pessoal, fontes editoriais brutas ou bastidores.

## Resumo

- Fontes documentais inventariadas: **8**
- Fontes cobertas: **7**
- Exclusões explícitas: **1**

| Fonte | Tipo | Estado | Decisão | Headings | Destinos |
| --- | --- | --- | --- | ---: | ---: |
| [DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md](../../DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md) | architecture-guide | historical | preserve | 27 | 9 |
| [README.md](../../README.md) | operational-guide | current | preserve | 11 | 5 |
| [docs/INTEGRACAO_TEORIAS.md](../../docs/INTEGRACAO_TEORIAS.md) | domain-guide | historical | preserve | 11 | 4 |
| [docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx](../../docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx) | editorial-review | internal | reference | 25 | 4 |
| [docs/PROTOCOLO_RIGOROSO_VALIDACAO_DE_TEORIAS_E_ESTRUTURACAO_DO_PENSAMENTO.docx](../../docs/PROTOCOLO_RIGOROSO_VALIDACAO_DE_TEORIAS_E_ESTRUTURACAO_DO_PENSAMENTO.docx) | methodology-manual | internal | reference | 20 | 4 |
| [docs/_render_parecer/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026_browser.pdf](../../docs/_render_parecer/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026_browser.pdf) | qa-render | qa | qa-only | 0 | 1 |
| [ia/estrutura geral observatório.md](../../ia/estrutura%20geral%20observat%C3%B3rio.md) | historical-audit | historical | historical | 155 | 7 |

## Fontes cobertas

### DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md

- Fonte: [DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md](../../DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md)
- Formato: `md`
- Tipo: `architecture-guide`
- Estado: `historical`
- Decisão: `preserve`
- Tamanho: `20821` bytes
- SHA-256: `4309db4d21f8a8d05a931c0499a994ccb93289157fb754ec6d0f9f7768c5df6f`
- Síntese: Snapshot arquitetural amplo do estado pós-expansão, preservado como histórico e subordinado aos nós canônicos atuais.
- Destinos canônicos:
  - `project.architecture` — [ai/project/ARCHITECTURE.md](../project/ARCHITECTURE.md)
  - `project.boundaries` — [ai/project/REPOSITORY_BOUNDARIES.md](../project/REPOSITORY_BOUNDARIES.md)
  - `frontend.pages-modules` — [ai/frontend/PAGE_AND_MODULE_ARCHITECTURE.md](../frontend/PAGE_AND_MODULE_ARCHITECTURE.md)
  - `frontend.interactive-systems` — [ai/frontend/INTERACTIVE_SYSTEMS.md](../frontend/INTERACTIVE_SYSTEMS.md)
  - `frontend.design-accessibility` — [ai/frontend/DESIGN_AND_ACCESSIBILITY.md](../frontend/DESIGN_AND_ACCESSIBILITY.md)
  - `domains.editorial-model` — [ai/domains/EDITORIAL_MODEL.md](../domains/EDITORIAL_MODEL.md)
  - `quality.validation-release` — [ai/quality/VALIDATION_AND_RELEASE.md](../quality/VALIDATION_AND_RELEASE.md)
  - `infrastructure.static-deploy` — [ai/infrastructure/STATIC_BUILD_AND_DEPLOY.md](../infrastructure/STATIC_BUILD_AND_DEPLOY.md)
  - `maintenance.expansion-guide` — [ai/maintenance/EXPANSION_GUIDE.md](EXPANSION_GUIDE.md)
- Decisões complementares:
  - Usar como evidência do estado pós-expansão, subordinada ao comportamento verificado e aos nós especializados.
  - Resultados de testes são registros de uma execução e devem ser revalidados antes de sustentar garantias atuais.
- Headings: extração automática
  - `H1` Documentação atualizada do Observatório de Ideias
  - `H2` 1. Visão do produto
  - `H2` 2. Arquitetura atual
  - `H2` 3. Catálogo e dossiês de Teorias
  - `H2` 4. Grandes Nomes
  - `H2` 5. Rotas Guiadas
  - `H2` 6. Busca global
  - `H2` 7. Laboratório e catálogo de experiências
  - `H3` 7.1 Cone de luz e referenciais
  - `H3` 7.2 Zero vs. Epsilon
  - `H3` 7.3 Modelo finito de recorrência
  - `H3` 7.4 Astrobiologia probabilística
  - `H2` 8. Atlas e modo treino
  - `H2` 9. Contribuições externas e autoria
  - `H2` 10. Acessibilidade e movimento
  - `H2` 11. Desempenho
  - `H2` 12. Manifesto, servidor, build e Vercel
  - `H2` 13. CI e testes
  - `H2` 14. Como evoluir sem duplicação
  - `H3` Nova linha de investigação
  - `H3` Novo perfil histórico
  - `H3` Nova experiência
  - `H3` Nova Rota Guiada
  - `H3` Primeira contribuição externa
  - `H2` 15. Limitações e pontos a verificar
  - `H2` 16. Checklist de publicação
  - `H2` 17. Referências internas

### README.md

- Fonte: [README.md](../../README.md)
- Formato: `md`
- Tipo: `operational-guide`
- Estado: `current`
- Decisão: `preserve`
- Tamanho: `10029` bytes
- SHA-256: `51b29e7412ae8def8360a5c665b5a8515eef0e3f089c83e796409cf53d4a6bb4`
- Síntese: Entrada operacional resumida para rotas, execução local, arquitetura pública e publicação.
- Destinos canônicos:
  - `project.index` — [ai/project/INDEX.md](../project/INDEX.md)
  - `project.commands` — [ai/project/COMMANDS_AND_ENVIRONMENT.md](../project/COMMANDS_AND_ENVIRONMENT.md)
  - `project.architecture` — [ai/project/ARCHITECTURE.md](../project/ARCHITECTURE.md)
  - `domains.editorial-model` — [ai/domains/EDITORIAL_MODEL.md](../domains/EDITORIAL_MODEL.md)
  - `infrastructure.static-deploy` — [ai/infrastructure/STATIC_BUILD_AND_DEPLOY.md](../infrastructure/STATIC_BUILD_AND_DEPLOY.md)
- Decisões complementares:
  - Preservar como quickstart humano; detalhes normativos pertencem aos nós canônicos.
  - Contagens e requisitos de runtime precisam permanecer verificáveis, não duplicados como constantes do grafo.
- Headings: extração automática
  - `H1` Observatório de Ideias
  - `H2` Rotas principais
  - `H2` Como rodar localmente
  - `H2` Verificação e build
  - `H2` Estrutura
  - `H2` Arquitetura
  - `H2` Recursos principais
  - `H2` Dados editoriais
  - `H2` Deploy na Vercel
  - `H2` Contato e presença profissional
  - `H2` Princípio editorial

### docs/INTEGRACAO_TEORIAS.md

- Fonte: [docs/INTEGRACAO_TEORIAS.md](../../docs/INTEGRACAO_TEORIAS.md)
- Formato: `md`
- Tipo: `domain-guide`
- Estado: `historical`
- Decisão: `preserve`
- Tamanho: `9598` bytes
- SHA-256: `51a9c055a238c995051cb3e0572f61291e6ed52b621e0b715dbc44a107483e11`
- Síntese: Especificação especializada anterior para dados, leitura crítica, relações, referências, URLs e publicação das linhas de investigação.
- Destinos canônicos:
  - `domains.editorial-model` — [ai/domains/EDITORIAL_MODEL.md](../domains/EDITORIAL_MODEL.md)
  - `domains.theory-catalog` — [ai/domains/THEORY_CATALOG.md](../domains/THEORY_CATALOG.md)
  - `project.boundaries` — [ai/project/REPOSITORY_BOUNDARIES.md](../project/REPOSITORY_BOUNDARIES.md)
  - `maintenance.expansion-guide` — [ai/maintenance/EXPANSION_GUIDE.md](EXPANSION_GUIDE.md)
- Decisões complementares:
  - É a especificação documental especializada do domínio, abaixo do código e da validação executável.
  - O exemplo mínimo deve acompanhar todos os campos obrigatórios do contrato.
- Headings: extração automática
  - `H1` Integração e escala das linhas de investigação
  - `H2` Arquitetura de dados
  - `H2` Contrato público de uma entrada
  - `H2` Leitura pública em quatro camadas
  - `H2` Exemplo mínimo
  - `H2` Como adicionar ou revisar uma entrada
  - `H2` Filtros e busca
  - `H2` URLs diretas
  - `H2` Radar de desenvolvimento
  - `H2` Privacidade e publicação
  - `H2` Critério editorial

### docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx

- Fonte: [docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx](../../docs/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026.docx)
- Formato: `docx`
- Tipo: `editorial-review`
- Estado: `internal`
- Decisão: `reference`
- Tamanho: `66918` bytes
- SHA-256: `fe9a260f58623cc6f3dc001706c3f6e7917395403b49fc8587e7cd44045fac81`
- Síntese: Parecer editorial interno usado para calibrar clareza científica, classificação e limites das linhas de investigação.
- Destinos canônicos:
  - `domains.editorial-model` — [ai/domains/EDITORIAL_MODEL.md](../domains/EDITORIAL_MODEL.md)
  - `domains.theory-catalog` — [ai/domains/THEORY_CATALOG.md](../domains/THEORY_CATALOG.md)
  - `project.boundaries` — [ai/project/REPOSITORY_BOUNDARIES.md](../project/REPOSITORY_BOUNDARIES.md)
  - `quality.validation-release` — [ai/quality/VALIDATION_AND_RELEASE.md](../quality/VALIDATION_AND_RELEASE.md)
- Decisões complementares:
  - Fonte interna: aproveitar conclusões editoriais neutras sem publicar proveniência pessoal ou processo de produção.
  - Não tratar o parecer como revisão por pares nem como validação automática das propostas.
- Headings: lista manual
  - `Manual` 1. Veredito executivo
  - `Manual` 3. Matriz geral das dez entradas públicas
  - `Manual` 4. Parecer detalhado por entrada
  - `Manual` T-01 — Observação Não-Linear
  - `Manual` T-02 — Instabilidade Probabilística do Vazio
  - `Manual` T-03 — Ciclagem Eterna e Reboot do Vácuo
  - `Manual` T-04 — Topologia do Contentor Finito
  - `Manual` T-05 — Gênese Gravitacional do Tempo / Universo-Buraco-Negro
  - `Manual` T-06 — ER=EPR e Sondas Quânticas
  - `Manual` T-07 — Backend da Existência
  - `Manual` T-08 — Gênese por Flutuação do Vácuo
  - `Manual` T-09 — Zero versus Epsilon
  - `Manual` T-10 — Maldição do Horizonte e Extensão dos Sentidos
  - `Manual` 5.1 Universo como sistema distribuído assíncrono
  - `Manual` 5.2 Astrobiologia em camadas e Equação de Drake
  - `Manual` 5.3 Energia, ondas gravitacionais e relógios
  - `Manual` 5.4 Infinito, possibilidade e impossibilidade
  - `Manual` 5.5 Matéria, identidade e consciência
  - `Manual` 5.6 Buracos negros antigos, portais e dimensões que morrem
  - `Manual` 7. Roteiro de desenvolvimento recomendado
  - `Manual` Modelo mínimo de ficha científica
  - `Manual` Apêndice B — Correções factuais prioritárias
  - `Manual` Fontes e referências
  - `Manual` Literatura e fontes externas
  - `Manual` Limitações do parecer
- Omissões deliberadas de headings:
  - `seção-2` — proveniência e autoria internas
  - `introdução-da-seção-5` — contexto de conversas internas
  - `seção-5.7` — processo interno de produção
  - `seção-6` — auditoria de ferramenta e bastidores
  - `apêndice-a` — inventário de arquivos e fontes internas

### docs/PROTOCOLO_RIGOROSO_VALIDACAO_DE_TEORIAS_E_ESTRUTURACAO_DO_PENSAMENTO.docx

- Fonte: [docs/PROTOCOLO_RIGOROSO_VALIDACAO_DE_TEORIAS_E_ESTRUTURACAO_DO_PENSAMENTO.docx](../../docs/PROTOCOLO_RIGOROSO_VALIDACAO_DE_TEORIAS_E_ESTRUTURACAO_DO_PENSAMENTO.docx)
- Formato: `docx`
- Tipo: `methodology-manual`
- Estado: `internal`
- Decisão: `reference`
- Tamanho: `61585` bytes
- SHA-256: `437c42ef3ff2d78049ed9e6e0025daa086cc5f169edcc178ff4a4fcf551a1a7f`
- Síntese: Manual privado para auditoria crítica por IA, validação proporcional ao tipo de ideia e estruturação disciplinada do pensamento científico, filosófico e prático.
- Destinos canônicos:
  - `domains.editorial-model` — [ai/domains/EDITORIAL_MODEL.md](../domains/EDITORIAL_MODEL.md)
  - `domains.theory-catalog` — [ai/domains/THEORY_CATALOG.md](../domains/THEORY_CATALOG.md)
  - `quality.validation-release` — [ai/quality/VALIDATION_AND_RELEASE.md](../quality/VALIDATION_AND_RELEASE.md)
  - `maintenance.expansion-guide` — [ai/maintenance/EXPANSION_GUIDE.md](EXPANSION_GUIDE.md)
- Decisões complementares:
  - Tratar como instrumento privado de método, não como validação científica de qualquer teoria específica.
  - O documento pode orientar revisões futuras, mas sua incorporação em conteúdo público exige síntese editorial separada.
- Headings: lista manual
  - `Manual` Como usar este manual
  - `Manual` 1. Compromisso epistemológico
  - `Manual` 2. Classificar antes de avaliar
  - `Manual` 3. Estados de maturidade
  - `Manual` 4. Dossiê mínimo de entrada
  - `Manual` 5. Processo de auditoria em quatorze etapas
  - `Manual` 6. Trilha de validação científica
  - `Manual` 7. Trilha de validação filosófica
  - `Manual` 8. Trilha de decisão e filosofia prática
  - `Manual` 9. Protocolo de fontes e evidências
  - `Manual` 10. Revisão adversarial e controle de vieses
  - `Manual` 11. Rubrica de avaliação
  - `Manual` 12. Classes de veredito
  - `Manual` 13. Estrutura obrigatória do parecer da IA
  - `Manual` 14. Prompt Mestre para auditoria por IA
  - `Manual` 15. Manual de estruturação do pensamento
  - `Manual` 16. Fichas reutilizáveis
  - `Manual` 17. Rotina de desenvolvimento intelectual
  - `Manual` 18. Checklist de qualidade final
  - `Manual` 19. Limites, escalonamento e base metodológica

### docs/_render_parecer/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026_browser.pdf

- Fonte: [docs/_render_parecer/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026_browser.pdf](../../docs/_render_parecer/PARECER_CRITICO_INTEGRAL_DAS_TEORIAS_2026_browser.pdf)
- Formato: `pdf`
- Tipo: `qa-render`
- Estado: `qa`
- Decisão: `qa-only`
- Tamanho: `207837` bytes
- SHA-256: `069d53b1722b493b59f0629ba9aaf059f2736741d569fdf7efd4a0555e6a0442`
- Síntese: Render de controle visual do parecer, retido exclusivamente como evidência de QA documental.
- Destinos canônicos:
  - `quality.validation-release` — [ai/quality/VALIDATION_AND_RELEASE.md](../quality/VALIDATION_AND_RELEASE.md)
- Decisões complementares:
  - Não é fonte editorial independente e não deve ser publicado como conteúdo do observatório.
- Headings: lista manual deliberadamente vazia

### ia/estrutura geral observatório.md

- Fonte: [ia/estrutura geral observatório.md](../../ia/estrutura%20geral%20observat%C3%B3rio.md)
- Formato: `md`
- Tipo: `historical-audit`
- Estado: `historical`
- Decisão: `historical`
- Tamanho: `72362` bytes
- SHA-256: `6ec22f2b48fb5262ee14eeeb35b34fa1c128ca8d4a0b99e11aa025b5d9a2f2d9`
- Síntese: Auditoria histórica anterior à arquitetura atual, útil para rastrear decisões e regressões sem definir o estado vigente.
- Destinos canônicos:
  - `project.architecture` — [ai/project/ARCHITECTURE.md](../project/ARCHITECTURE.md)
  - `frontend.pages-modules` — [ai/frontend/PAGE_AND_MODULE_ARCHITECTURE.md](../frontend/PAGE_AND_MODULE_ARCHITECTURE.md)
  - `frontend.interactive-systems` — [ai/frontend/INTERACTIVE_SYSTEMS.md](../frontend/INTERACTIVE_SYSTEMS.md)
  - `frontend.design-accessibility` — [ai/frontend/DESIGN_AND_ACCESSIBILITY.md](../frontend/DESIGN_AND_ACCESSIBILITY.md)
  - `domains.editorial-model` — [ai/domains/EDITORIAL_MODEL.md](../domains/EDITORIAL_MODEL.md)
  - `quality.performance-accessibility` — [ai/quality/PERFORMANCE_AND_ACCESSIBILITY.md](../quality/PERFORMANCE_AND_ACCESSIBILITY.md)
  - `maintenance.expansion-guide` — [ai/maintenance/EXPANSION_GUIDE.md](EXPANSION_GUIDE.md)
- Decisões complementares:
  - Preservar como evidência histórica, nunca como autoridade automática sobre o runtime atual.
  - Só migrar princípios estáveis depois de revalidá-los contra código, testes e documentação corrente.
- Headings: extração automática
  - `H1` Documentação Geral do Projeto
  - `H2` Como ler este documento
  - `H2` 1. Visão Geral do Projeto
  - `H2` 2. Identidade Conceitual
  - `H3` 2.1 Conceito central
  - `H3` 2.2 Princípios conceituais confirmados
  - `H3` 2.3 Regras para orientar mudanças futuras
  - `H3` 2.4 O que deve ser evitado
  - `H2` 3. Público e Uso Esperado
  - `H2` 4. Tom de Voz e Escrita
  - `H3` 4.1 Características do tom atual
  - `H3` 4.2 Vocabulário recomendado
  - `H3` 4.3 Construções recomendadas
  - `H3` 4.4 Construções a evitar
  - `H3` 4.5 Regras editoriais
  - `H3` 4.6 Inconsistências editoriais atuais
  - `H2` 5. Estrutura Geral do Site
  - `H3` 5.1 Header e navegação
  - `H3` 5.2 Home / Hero (`#topo`)
  - `H3` 5.3 Campo de investigação (`#campo`)
  - `H3` 5.4 Teorias na home (`#teorias`)
  - `H3` 5.5 Mapa de ideias (`#mapa`)
  - `H3` 5.6 Artigos, ensaios e registros (`#arquivo`)
  - `H3` 5.7 Bússola filosófica (`#filosofia`)
  - `H3` 5.8 Experimento de ressonância (`#ressonancia`)
  - `H3` 5.9 Linha de desenvolvimento (`#desenvolvimento`)
  - `H3` 5.10 Sobre (`#sobre`)
  - `H3` 5.11 Contato (`#contato`)
  - `H3` 5.12 Footer
  - `H3` 5.13 Página dedicada de teorias
  - `H3` 5.14 Fontes internas da página de teorias
  - `H2` 6. Arquitetura Técnica
  - `H3` 6.1 Stack
  - `H3` 6.2 Entradas principais
  - `H3` 6.3 Árvore útil do projeto
  - `H3` 6.4 Organização de dados
  - `H3` 6.5 Configuração e build
  - `H3` 6.6 Verificação existente
  - `H2` 7. Sistema Visual
  - `H3` 7.1 Cores
  - `H3` 7.2 Tipografia
  - `H3` 7.3 Formas e elementos visuais
  - `H3` 7.4 Espaçamento e layout
  - `H3` 7.5 Imagens e mídia
  - `H2` 8. Componentes e Padrões de Interface
  - `H3` 8.1 Botões
  - `H3` 8.2 Cards de teoria da home
  - `H3` 8.3 Dossiê de teoria
  - `H3` 8.4 Filtros, tags e badges
  - `H3` 8.5 Campos de busca
  - `H3` 8.6 Mapa de constelação
  - `H3` 8.7 Tabs filosóficas
  - `H3` 8.8 Cards de arquivo e roadmap
  - `H3` 8.9 Links de contato
  - `H3` 8.10 Formulário
  - `H3` 8.11 Regras para novos componentes
  - `H2` 9. Animações e Interações
  - `H3` 9.1 Animações CSS existentes
  - `H3` 9.2 Navegação
  - `H3` 9.3 Bússola filosófica
  - `H3` 9.4 Ressonância
  - `H3` 9.5 Regras para animações futuras
  - `H2` 10. Visão Estrutural / Visão Estelar
  - `H3` 10.1 Nome e propósito
  - `H3` 10.2 Ativação e estado inicial
  - `H3` 10.3 Implementação
  - `H3` 10.4 Qualidade e desempenho real
  - `H3` 10.5 Efeito visual
  - `H3` 10.6 Mobile e movimento reduzido
  - `H3` 10.7 Regras obrigatórias de manutenção
  - `H2` 11. Teorias e Conteúdo Intelectual
  - `H3` 11.1 Fonte de dados
  - `H3` 11.2 Schema atual
  - `H3` 11.3 Catálogo atual
  - `H3` 11.4 Filtros
  - `H3` 11.5 Progresso e status epistemológico
  - `H3` 11.6 Conexões
  - `H3` 11.7 Material bruto
  - `H2` 12. Artigos, Ensaios e Registros
  - `H3` 12.1 Estado implementado
  - `H3` 12.2 Estrutura editorial recomendada para um artigo futuro
  - `H3` 12.3 Regras de tom
  - `H3` 12.4 Organização futura
  - `H2` 15. Responsividade
  - `H3` 15.1 Breakpoints identificados
  - `H3` 15.2 Desktop
  - `H3` 15.3 Tablet
  - `H3` 15.4 Mobile
  - `H3` 15.5 Problemas responsivos confirmados
  - `H2` 16. Acessibilidade
  - `H3` 16.1 Recursos implementados
  - `H3` 16.2 Lacunas
  - `H3` 16.3 Regras para manutenção
  - `H2` 17. SEO e Metadados
  - `H3` 17.1 Implementado na home
  - `H3` 17.2 Implementado na página de teorias
  - `H3` 17.3 Compatibilidade de rota
  - `H3` 17.4 Ausências e recomendações futuras
  - `H2` 18. Performance
  - `H3` 18.1 Pontos positivos
  - `H3` 18.2 Áreas pesadas
  - `H3` 18.3 Escalabilidade de conteúdo
  - `H3` 18.4 Regras de performance
  - `H2` 19. Regras Para Futuras Atualizações
  - `H3` 19.1 Conceito
  - `H3` 19.2 Conteúdo
  - `H3` 19.3 Design
  - `H3` 19.4 Interface
  - `H3` 19.5 Técnica
  - `H3` 19.6 Segurança e privacidade editorial
  - `H2` 20. Como Adicionar Novas Teorias
  - `H3` Passo 1 — Preparar o conteúdo
  - `H3` Passo 2 — Editar a fonte de dados
  - `H3` Passo 3 — Validar identidade e IDs
  - `H3` Passo 4 — Categoria e filtros
  - `H3` Passo 5 — Cor e posição
  - `H3` Passo 6 — Progresso
  - `H3` Passo 7 — Atualizar contagens estáticas
  - `H3` Passo 8 — Entender o recorte da home
  - `H3` Passo 9 — Testar
  - `H2` 21. Como Adicionar Novos Artigos ou Registros
  - `H3` 21.1 Limite da arquitetura atual
  - `H3` 21.2 Caminho mínimo, sem criar sistema novo
  - `H3` 21.3 Caminho recomendado para publicação completa
  - `H3` 21.4 Convenção editorial recomendada
  - `H3` 21.5 Checklist do artigo
  - `H2` 22. Como Adicionar Novas Seções
  - `H3` Passo 1 — Definir propósito
  - `H3` Passo 2 — Escolher posição e número
  - `H3` Passo 3 — Criar HTML semântico
  - `H3` Passo 4 — Reutilizar layout
  - `H3` Passo 5 — Adicionar CSS
  - `H3` Passo 6 — Adicionar comportamento, se necessário
  - `H3` Passo 7 — Navegação
  - `H3` Passo 8 — Responsividade
  - `H3` Passo 9 — Movimento e acessibilidade
  - `H3` Passo 10 — Documentar
  - `H2` 23. Como Rodar e Manter o Projeto
  - `H3` 23.1 Requisitos
  - `H3` 23.2 Instalação
  - `H3` 23.3 Desenvolvimento
  - `H3` 23.4 Verificação
  - `H3` 23.5 Build
  - `H3` 23.6 Preview
  - `H3` 23.7 Deploy
  - `H3` 23.8 Manutenção rotineira
  - `H2` 24. Pontos de Atenção
  - `H3` 24.1 Prioridade alta
  - `H3` 24.2 Prioridade média
  - `H3` 24.3 Conteúdo e governança
  - `H3` 24.4 Ferramentas e teste
  - `H3` 24.5 Melhorias futuras possíveis
  - `H2` 25. Resumo Executivo
  - `H2` Apêndice A — Checklist de entrega de qualquer atualização
  - `H2` Apêndice B — Arquivos mais sensíveis a regressão
- Omissões deliberadas de headings:
  - `seção-13` — conteúdo pessoal ou interno omitido deliberadamente
  - `seção-14` — conteúdo pessoal ou interno omitido deliberadamente

## Exclusões explícitas

- [AGENTS.md](../../AGENTS.md) — criado pela base atual.

