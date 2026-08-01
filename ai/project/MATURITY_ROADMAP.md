---
id: "project.maturity-roadmap"
title: "Plano de maturidade do produto"
scope: "project"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "priorização do amadurecimento geral, redução de complexidade inicial e preparação do produto para crescer"
triggers:
  - "pente-fino"
  - "maturidade"
  - "roadmap"
  - "onboarding"
  - "nova pessoa usuária"
  - "arquitetura de informação"
  - "escalabilidade"
  - "preparação para backend"
  - "dívida técnica"
required_context:
  - "project.index"
conditional_context:
  - id: "frontend.user-flows"
    condition: "Quando o ciclo alterar navegação, descoberta, continuidade ou leitura de uma superfície."
  - id: "domains.content-operations"
    condition: "Quando o ciclo alterar autoria, catálogos, relações, fontes, revisões ou contribuições."
  - id: "quality.validation-release"
    condition: "Antes de encerrar qualquer ciclo de amadurecimento."
related_context:
  - "project.architecture"
  - "project.boundaries"
  - "frontend.design-accessibility"
  - "domains.editorial-model"
  - "domains.editorial-dashboard"
  - "quality.performance-accessibility"
  - "infrastructure.static-deploy"
evidence_sources:
  - "index.html"
  - "Teorias/teorias.html"
  - "GrandesNomes/grandes-nomes.html"
  - "Rotas/rotas.html"
  - "Contribuicoes/contribuicoes.html"
  - "assets/css/styles.css"
  - "assets/js/navigation.js"
  - "assets/js/global-search.js"
  - "content/public/theories/observacao-nao-linear.json"
  - "content/public/figures/albert-einstein.json"
  - "content/public/catalogs/publications.json"
  - "content/public/catalogs/editorial-revision-ledger.json"
  - "scripts/content/change-set.mjs"
  - "scripts/content/compiler.mjs"
  - "scripts/content/editorial-impact.mjs"
  - "scripts/content/install-record.mjs"
  - "assets/js/content-repository.js"
  - "scripts/build.mjs"
  - "scripts/public-manifest.mjs"
  - "scripts/tests/browser-smoke.test.mjs"
---

# Plano de maturidade do produto

## Purpose

Orientar o próximo período do Observatório sem acrescentar novas áreas. A prioridade é tornar o sistema mais compreensível na primeira visita, mais eficiente para quem já sabe o que procura, mais previsível para manutenção e preparado para receber persistência no futuro sem reescrever a experiência atual.

Este documento registra direção e ordem de implementação. O estado confirmado abaixo separa entregas já realizadas de recomendações ainda abertas.

## Decisão executiva

O próximo ciclo deve ser **orientação, continuidade e operações de conteúdo**.

O produto já possui profundidade editorial, identidade visual, URLs diretas, relações, fontes, comparações, simuladores e validação estrutural. O principal risco agora é acrescentar novas superfícies antes de estabilizar quatro fundamentos:

1. uma entrada inequívoca para visitantes novos;
2. uma navegação igual em todas as rotas;
3. um conteúdo que progride do essencial à auditoria sem esconder profundidade;
4. um modelo de dados no qual uma entidade ou relação nova não exija alterações espalhadas por controladores.

Não se recomenda migrar para SPA, framework, CMS, banco de grafos ou backend neste ciclo. O site estático ainda é uma base adequada; a preparação deve ocorrer nos contratos, nos schemas e na fronteira de dados.

## Estado de execução

| Capacidade | Estado confirmado | Próximo passo |
| --- | --- | --- |
| Plataforma de conteúdo estática | Implementada com fonte granular, schemas, compilador, relações, referências, runtime gerado e fachada de leitura. | Manter compatibilidade e reduzir as dívidas dentro dos budgets. |
| Dependência editorial | Implementada com ledger por revisão, `reviewedAgainst`, `needs-review`, classes, impacto direto, gate e aplicação atômica por manifesto. | Validar o fluxo local com uso editorial real e reduzir a dívida relacional. |
| Operações editoriais públicas | Contratos, revisões, contribuições e publicação possuem base estrutural; o catálogo público permanece vazio onde não há material real. | Validar o primeiro fluxo editorial completo sem inventar conteúdo. |
| Dashboard editorial | Primeiro fluxo local de teorias implementado com workspace, formulário, impacto, decisões, preview-sombra e aplicação protegida. | Endurecer o piloto antes de ampliar para outros tipos. |
| Backend e persistência privada | Não implementados e não necessários no estado atual. | Iniciar somente pelos gatilhos da Fase 5. |

## Baseline da auditoria

Os números abaixo são um retrato da auditoria de julho de 2026 e não devem virar constantes de produto.

| Sinal observado | Estado confirmado | Implicação |
| --- | --- | --- |
| Rotas públicas | 10 destinos principais e um redirecionamento legado | Há produto suficiente para exigir arquitetura de informação centralizada. |
| Home | 13 seções, 39 títulos e 71 candidatos à ordem de foco no conteúdo principal em desktop | A riqueza editorial compete com a orientação inicial. |
| Teorias | 55 candidatos à ordem de foco no conteúdo principal em desktop e 76 em 390 px | Filtros, comparação e auditoria aparecem com peso alto antes da escolha básica. |
| Grandes Nomes | 81 candidatos à ordem de foco no conteúdo principal; página com mais de 14 mil px em desktop | A profundidade precisa de navegação local e revelação progressiva. |
| Catálogos | teorias, perfis, relações, referências, experiências, rotas e demais registros públicos vivem em `content/public/` | A autoria é granular e validada; o runtime é derivado. |
| Dependência dos dados | imports diretos novos dos módulos legados estão em zero | A fachada e os exports gerados preservam a troca futura de armazenamento. |
| Contribuições | schema público robusto, catálogo vazio e entrada por `mailto:` | A publicação pode crescer; a submissão privada ainda não é um sistema. |
| Artefato público | o compilador projeta o runtime e o build usa allowlist | Dados privados de submissão, rascunho e contato permanecem fora de `content/public` e `dist/`. |
| Build | imagens continuam representando a maior parte do peso | Há margem de otimização sem redesenho. |
| QA | contratos, build e smoke existem; navegador é obrigatório na CI | Regressão visual e testes com pessoas ainda complementam a automação. |

As jornadas foram inspecionadas em 1440 × 900 e 390 × 844 sem overflow horizontal ou erros de console observados. Isso confirma boa adaptação visual, mas não elimina a carga cognitiva nem substitui teste com pessoas, teclado e leitor de tela.

As contagens são diagnósticas, não budgets automatizados: foram obtidas no estado inicial, depois da inicialização JavaScript, contando no `main` links, botões, campos e elementos com `tabindex` potencialmente alcançáveis. Elementos responsivos presentes no DOM podem alterar o total sem representar uma parada real de Tab. Antes de transformar esses números em gate, criar um teste reproduzível que exclua elementos ocultos, desabilitados, inertes e com `tabindex="-1"` e registre estado, viewport e seletor.

## Diagnóstico

### 1. A primeira visita oferece caminhos demais com peso semelhante

A home preserva bem a atmosfera do Observatório, porém seus primeiros chamados priorizam Teorias, Mapa e Visão Estelar. A entrada orientada por pergunta aparece tarde. Para uma pessoa nova, escolher entre catálogo, mapa, constelações, laboratório, arquivo e rotas exige entender a estrutura antes de receber ajuda dela.

### 2. A navegação não possui um contrato único

Os destinos e rótulos do cabeçalho variam entre a home, páginas antigas, Rotas e Contribuições. Isso reduz memória espacial: uma área pode parecer ter desaparecido apenas porque o visitante mudou de rota. O comportamento é compartilhado, mas o conteúdo da navegação continua repetido nos HTML.

### 3. A linguagem poética às vezes substitui o rótulo funcional

“Teorias”, “linhas de investigação”, “Arquivo”, “Coordenadas”, “mapa” e “constelação” assumem sentidos diferentes conforme o contexto. A identidade metafórica deve continuar, mas acompanhada de tradução literal onde uma ação ou destino precisa ser previsto.

### 4. A profundidade está presente, mas nem sempre em camadas

Teorias e Grandes Nomes oferecem recursos adequados para uma leitura avançada. Em alguns pontos, comparação, filtros, trilhas e linha do tempo chegam antes da explicação de como interpretar o material. O problema não é conteúdo demais; é ausência de uma ordem perceptível entre orientação, exploração e auditoria.

### 5. A continuidade de uma Rota Guiada se perde no conteúdo

A etapa é preservada dentro da página de Rotas, mas o link para uma teoria, perfil ou experiência não leva contexto suficiente para mostrar de onde a pessoa veio, como retomar ou qual é a próxima etapa. A rota orienta a partida, mas não acompanha a leitura.

### 6. A modelagem foi centralizada, mas a operação ainda é técnica

Entidades, referências e relações possuem fontes granulares e projeções inversas. Relações revisadas registram as revisões consideradas, e CLI e dashboard local usam o mesmo diff, impacto e gate antes da instalação atômica. O fluxo de teorias já funciona sem edição manual de JSON; ainda falta validar sua operação prolongada e cobrir outros tipos.

### 7. Automação editorial e submissão são problemas diferentes

O catálogo público de contribuições possui validação, autoria, crédito, fontes, licença, procedência e revisão. O formulário atual prepara um e-mail, sem armazenamento. Automatizar a publicação direta seria um erro editorial e de privacidade. O objetivo correto é automatizar validação, propagação e acompanhamento depois de uma decisão humana explícita.

### 8. A qualidade estrutural é mais madura que a qualidade de jornada

O projeto já verifica rotas, referências internas, campos de catálogos e composição pública. Ainda faltam garantia de navegador no CI, jornadas por teclado, foco após re-render, auditoria automatizada ampla, regressão visual, budgets de desempenho e validação completa dos schemas.

## Contrato de experiência por intenção

Não criar um “modo leigo” separado. Os três públicos devem compartilhar as mesmas fontes e URLs, com profundidade progressiva:

| Intenção | Entrada necessária | Profundidade esperada |
| --- | --- | --- |
| Entender rapidamente | pergunta de partida, frase literal sobre o projeto, natureza e limite | resumo e contexto em até dois minutos |
| Explorar uma questão | Rota Guiada, relações justificadas e retorno de contexto | filtros, perfis, teorias e experiências conectados |
| Auditar ou pesquisar | busca direta, links profundos, fontes, objeções e revisões | histórico, critérios de abandono, comparação e referências |

A jornada de referência é:

```text
cheguei
  -> entendi o que é este lugar
  -> escolhi uma pergunta ou fui direto ao acervo
  -> reconheci a natureza do conteúdo
  -> aprofundei sem perder o contexto
  -> encontrei fontes, limites e revisões
  -> soube como retomar, compartilhar ou contribuir
```

## Princípios do amadurecimento

- **Orientação antes de exposição:** a primeira dobra explica e oferece uma escolha assistida; o acervo completo continua a uma ação de distância.
- **Uma fonte, várias leituras:** resumo, exploração e auditoria são projeções do mesmo registro, não cópias editoriais.
- **Metáfora com tradução:** nomes autorais podem permanecer, desde que destinos e estados possuam rótulos funcionais.
- **Contexto compartilhável:** filtros, seleção, rota, etapa e versão relevantes devem sobreviver em URL estável.
- **HTML real como base:** navegação e conteúdo essencial continuam acessíveis sem depender de um roteador client-side.
- **Decisão humana, automação mecânica:** código valida e propaga; autoria, revisão, correção e publicação permanecem decisões explícitas.
- **Privado por construção:** submissões, contatos privados, anexos e notas internas nunca passam pelo pipeline de `dist/`.
- **Compatibilidade antes de migração:** IDs, slugs, URLs e exports publicados não mudam durante a reorganização.
- **Métrica antes de gosto:** mudanças de hierarquia são verificadas com tarefas, não somente por impressão visual.

## Plano priorizado

Cada fase só deve começar quando o gate da anterior estiver atendido. Os ciclos representam dependências, não estimativas de calendário.

### Fase 0 — decisões e guardrails

**Objetivo:** remover ambiguidades que contaminariam as próximas implementações.

Entregas:

- decidir domínio canônico de produção para canonical URL, sitemap e metadados;
- manter o telefone pessoal fora do conteúdo público e preservar apenas canais profissionais deliberadamente publicados;
- definir o significado de “Beta”, seu escopo e critério de saída;
- aprovar um glossário público com pares como “Linhas de investigação — Teorias”, “Mapa de relações”, “Publicações — Arquivo editorial” e “Contato”;
- declarar a fronteira `conteúdo público` × `submissão privada`, separar dados de contato privados de identidade pública autorizada e impedir campos privados nos diretórios copiados;
- publicar aviso proporcional ao formulário atual sobre finalidade do nome e e-mail, destinatário, ausência de armazenamento pelo site, retenção na caixa de correio e canal de exclusão, sujeito a revisão jurídica;
- classificar assets sem consumidor como reservados com justificativa ou removíveis em tarefa própria;
- registrar budgets iniciais de peso, legibilidade e duração das jornadas.

Gate:

- nenhuma decisão acima permanece implícita;
- nenhum dado privado pode alcançar `dist/` por cópia recursiva;
- 4 de 5 participantes predizem corretamente o destino de cada rótulo principal antes de clicar, sem confundir Linhas de investigação com Arquivo editorial.

### Fase 1 — orientação e continuidade

**Objetivo:** uma pessoa nova entende o sistema sem reduzir a velocidade de quem já conhece o acervo.

Entregas:

- criar um manifesto único de navegação e gerar ou verificar os mesmos links, ordem e rótulos em todas as páginas;
- agrupar os destinos em **Começar**, **Explorar**, **Publicações**, **Contribuir**, **Sobre** e **Buscar**, validando a quantidade e a apresentação responsiva;
- reorganizar a entrada da home em “Começar por uma pergunta”, “Explorar por assunto”, “Entender o projeto” e “Participar”;
- tornar Rotas Guiadas a entrada primária assistida e manter catálogo/busca como entrada direta;
- incluir contexto `rota + etapa + origem` nos links e uma faixa discreta de “Retomar” e “Próxima etapa” nas páginas de destino; `origem` é ID interno allowlisted, nunca URL arbitrária, não compõe a URL canônica e não pode gerar redirecionamento aberto;
- indexar páginas e seções institucionais na busca global a partir de metadados, sem títulos duplicados à mão;
- reduzir a posição hierárquica de superfícies vazias até existir conteúdo real;
- adicionar navegação local em páginas longas.

Gate:

- todos os destinos principais aparecem na mesma ordem em todas as rotas;
- visitante leigo inicia uma rota em uma ação;
- visitante avançado chega à busca ou ao catálogo em uma ação;
- sair de uma etapa, atualizar a página e retomar não perde contexto;
- consultas como “como contribuir”, “sobre” e “visão estelar” chegam à seção correta.

### Fase 2 — leitura em camadas e acessibilidade operacional

**Objetivo:** oferecer densidade sem apresentar todas as decisões ao mesmo tempo.

Entregas:

- aplicar a todas as entidades as camadas **Essencial**, **Explorar relações** e **Auditar**;
- mover ajuda de interpretação antes de comparação, trilhas e ferramentas avançadas;
- transformar comparações inativas em disclosure ou ação posterior à seleção;
- mostrar tipo e justificativa de uma relação no Mapa sem depender somente de cor;
- preservar foco equivalente depois de filtros e re-renders;
- elevar o piso de legibilidade dos metadados informativos e corrigir contrastes insuficientes;
- manter foco visível consistente em busca, menu, filtros, cards e modais;
- comprovar zoom de 200%, movimento reduzido, teclado e leitor de tela nas jornadas críticas.

Gate:

- todas as tarefas principais são concluídas somente por teclado;
- nenhum re-render perde o foco ou o envia ao início do documento;
- zero violação crítica ou séria nas auditorias automatizadas adotadas;
- 4 de 5 participantes distinguem conteúdo estabelecido, proposta autoral e simulação sem assistência; ninguém confunde referência com endosso.

### Fase 3 — plataforma de conteúdo estática

**Objetivo:** adicionar ou relacionar conteúdo por dados validados, sem editar controladores de interface.

**Estado confirmado:** a baseline, o contrato de dependência editorial e o primeiro fluxo assistido local foram entregues. As pendências atuais são endurecimento do piloto, ampliação seletiva dos formulários e redução da dívida existente, não uma nova migração dos catálogos.

Entregas:

- separar schemas, conteúdo público autoral e artefatos gerados;
- testar um formato autoral granular, preferencialmente um documento por entidade, preservando os exports atuais por adaptação;
- normalizar referências compartilhadas;
- criar registro central de relações tipadas e derivar projeções inversas;
- preservar `id`, `slug`, aliases e URLs já publicados;
- introduzir uma fachada `ContentRepository` com adaptador estático;
- gerar índices de busca, métricas e catálogos de runtime;
- oferecer comandos equivalentes a `content:new`, `content:check` e `content:build`;
- manter ledger de classes por revisão e registrar os extremos avaliados nas relações revisadas;
- calcular impacto direto e bloquear relações revisadas que ficaram desatualizadas;
- aplicar entidades, relações e ledgers como um único conjunto recuperável;
- rejeitar relações quebradas, fontes ausentes, slugs ambíguos e conteúdo privado no build.

Gate:

- uma teoria ou um perfil novo exige apenas arquivo de entidade, referências/relações justificadas e asset autorizado;
- nenhum controlador, HTML ou lista de contagem precisa ser editado;
- a conexão perfil–teoria é declarada uma vez e aparece dos dois lados;
- uma pessoa mantenedora adiciona uma entidade e uma relação sem conhecer o formato de runtime; se a granularidade proposta não facilitar esse teste, ela deve ser revista;
- o runtime público conserva URLs e comportamento atuais;
- o artefato gerado é determinístico e reproduzível.

### Fase 4 — operações editoriais e contribuições

**Objetivo:** tornar publicação, correção e crédito previsíveis antes de introduzir persistência.

**Estado confirmado:** contratos públicos, vigência relacional, análise de impacto, gate, instalação por manifesto, dashboard local de teorias e preview-sombra foram implementados. A submissão privada, a colaboração remota e os formulários dos demais tipos permanecem futuros. A interface administrativa segue a [especificação funcional da dashboard editorial](../domains/EDITORIAL_DASHBOARD_SPECIFICATION.md) e reutiliza o núcleo da CLI.

Entregas:

- definir documento completo e rota própria para publicação externa;
- separar pessoa, crédito, autoria, revisão e organização;
- mapear afirmações a fontes quando a sustentação for específica;
- definir gatilho, autoridade, concordância autoral, aviso público, registro privado e contestação para correção, substituição, retirada e retratação;
- decidir e implementar snapshots imutáveis antes da primeira publicação externa;
- separar consentimento para contato, licença do texto, direitos por asset, autorização do nome público e aprovação das alterações finais;
- registrar conflito de interesses e independência da revisão sem expor identidade de revisor sem autorização;
- preservar URL e exibir aviso datado quando um conteúdo publicado mudar de estado;
- trocar a suposição global de catálogo vazio por fixtures explícitas de catálogo vazio e não vazio, preservando ambos os comportamentos e permitindo publicações reais;
- oferecer prévia, copiar proposta e baixar texto como fallback ao `mailto:`;
- documentar o fluxo privado de submissão e o fluxo público de publicação.

Gate:

- o primeiro conteúdo externo pode ser publicado sem inventar um contrato durante a implementação;
- crédito, licença, revisão, fontes, estado e relações aparecem a partir dos dados;
- corrigir ou retirar não apaga silenciosamente o registro histórico;
- no fluxo sem persistência, falha preserva o texto e a pessoa vê a próxima ação; recibo ou protocolo só se torna gate quando existir backend de submissão;
- nenhuma transição para publicação ocorre sem decisão humana identificada;
- nenhuma submissão privada entra na árvore pública, nos módulos enviados ao navegador ou em `dist/`; o Git privado também não vira sistema de submissão.

### Fase 5 — backend somente por gatilho

**Objetivo:** adicionar persistência quando o custo operacional real justificar.

Gatilhos suficientes incluem:

- necessidade de acompanhar submissões privadas por protocolo;
- anexos ou uploads;
- mais de uma pessoa revisora;
- rascunhos privados, agendamento ou preview protegido;
- volume que torna revisão por arquivo insegura;
- autenticação administrativa ou trilha de auditoria persistente.

Introduzir persistência quando houver um gatilho não negociável de segurança ou privacidade, ou quando uma combinação recorrente de gatilhos operacionais produzir custo documentado. A decisão também exige responsável pela operação, revisão de privacidade e segurança e plano de exportação e rollback. Nesse ponto, usar API pequena, banco relacional, armazenamento de objetos para anexos e autenticação apenas no painel editorial. A saída pública deve continuar podendo ser gerada estaticamente. Banco de grafos, SPA e reescrita do frontend não são pré-requisitos.

Gate:

- submissão privada e publicação pública são modelos diferentes;
- todo evento editorial sensível possui ator, data e histórico;
- permissões são mínimas e testáveis;
- falha do backend não remove o acervo público já publicado.

## Qualidade, desempenho e operação

O amadurecimento também exige:

- instalar explicitamente navegador no CI ou falhar quando o smoke obrigatório não puder rodar;
- testar foco após filtro, menu, busca, modais, comparação, rota–conteúdo–rota e envio de contribuição;
- ampliar os schemas para experiências, rotas, contribuições, relações, rubricas, trilhas e linha do tempo;
- validar imports, sintaxe CSS e links externos em rotinas adequadas;
- adotar regressão visual das superfícies críticas, sem transformar snapshots em substituto de revisão;
- definir budgets de CSS, JavaScript, imagens e tempo de interação;
- otimizar a imagem raster de maior peso e investigar assets órfãos em mudança separada;
- adicionar canonical URL, sitemap, metadados sociais absolutos e dados estruturados após definir o domínio;
- introduzir cabeçalhos de segurança de forma graduada, começando por política em modo de relatório quando necessário.

## Métricas de sucesso

### Descoberta

- 4 de 5 participantes explicam em 30 segundos o que é o Observatório.
- 4 de 5 distinguem linha autoral de conhecimento estabelecido.
- Rotas Guiadas e busca ficam, cada uma, a uma ação da entrada.
- qualquer destino principal está a no máximo duas ações.

### Continuidade

- contexto de rota sobrevive a navegação, refresh e compartilhamento da URL.
- retorno à etapa anterior ocorre em uma ação.
- acesso direto sem contexto não mostra controles de rota indevidos.

### Manutenção

- adicionar entidade não exige editar HTML nem controlador.
- relação é declarada uma vez.
- totais e estados vazios são derivados.
- build igual sobre a mesma fonte produz artefato igual.
- mudanças de schema falham antes da publicação, com mensagem acionável.

### Inclusão e qualidade

- tarefas críticas funcionam por teclado e com movimento reduzido.
- zoom de 200% não corta conteúdo ou controles.
- nenhum texto informativo depende de contraste ou tamanho meramente decorativo.
- CI executa o navegador de verdade e bloqueia regressões críticas.

## Avaliação formativa com pessoas

Usar pelo menos cinco participantes: três sem familiaridade prévia e dois com familiaridade em ciência, tecnologia ou filosofia. Não explicar a interface antes das tarefas.

Tarefas:

1. dizer o que é o site depois de 30 segundos;
2. iniciar uma rota sobre causalidade;
3. distinguir contexto científico de proposta autoral;
4. sair de uma etapa, consultar o conteúdo e retomar;
5. encontrar a fonte de uma afirmação;
6. comparar duas trajetórias ou linhas;
7. descobrir como propor uma contribuição.

Registrar sucesso, tempo, hesitação, rótulo interpretado incorretamente e necessidade de ajuda. A meta inicial é pelo menos 80% de conclusão sem assistência; nenhum participante deve confundir submissão com publicação ou referência com endosso. Cinco pessoas servem para encontrar problemas e comparar iterações, não para produzir validade estatística.

## Ordem recomendada de execução

1. Decisões públicas e fronteira de privacidade.
2. Manifesto de navegação e glossário.
3. Primeira dobra da home e continuidade de Rotas.
4. Busca institucional e navegação local.
5. Foco, contraste, tipografia e QA de jornada.
6. Schemas e conteúdo por entidade.
7. Registro central de relações e referências.
8. Fachada de acesso, geradores e comandos editoriais.
9. Ledger, vigência das relações, impacto, gate e transação por manifesto — concluído.
10. Dashboard local, decisões assistidas e preview — primeiro fluxo de teorias concluído.
11. Contrato completo de publicação e contribuição.
12. Backend apenas após os gatilhos.

## Não fazer agora

- criar novas áreas para resolver um problema de orientação;
- esconder profundidade em um modo separado para leigos;
- duplicar resumos para cada superfície;
- migrar todo o frontend para framework;
- publicar contribuição diretamente após envio;
- colocar submissões ou anexos privados em `content/public`, runtime gerado ou qualquer diretório copiado para `dist/`;
- trocar IDs, slugs ou URLs para “limpar” a estrutura;
- adotar banco de grafos porque o produto possui relações;
- usar IA para validar alegação científica, aceitar ou rejeitar contribuição, atribuir autoria, alterar estado editorial ou publicar sem revisão humana identificada;
- usar analytics invasivo como substituto de teste com pessoas;
- redesenhar a identidade antes de corrigir hierarquia e continuidade.

## To Verify

- Domínio canônico final de produção.
- O telefone pessoal foi retirado do conteúdo público; reintroduzi-lo exigiria nova decisão explícita de privacidade.
- Escopo e critério de saída do selo Beta.
- Valores iniciais dos budgets de peso e interação.
- Resultado do primeiro teste de navegação com cinco participantes.
- Necessidade de um ledger histórico próprio para relações; na fase atual, revisões anteriores são recuperadas pelo Git.
