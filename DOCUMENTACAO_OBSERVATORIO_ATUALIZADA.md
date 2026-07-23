# Documentação atualizada do Observatório de Ideias

Atualizada em 22 de julho de 2026.

Este documento registra o estado implementado do projeto. A base canônica e progressiva para agentes está em `ai/`; a auditoria em `ia/estrutura geral observatório.md` permanece apenas como referência histórica.

## 1. Visão do produto

O Observatório de Ideias é um sistema editorial estático para organizar linhas de investigação, relações conceituais, história da ciência, experiências didáticas e contribuições creditadas. A home funciona como gateway; cada área possui um HTML real e aprofunda uma função.

| Rota | Papel atual |
| --- | --- |
| `/index.html` | Entrada, recortes dos catálogos, Visão Estelar, filosofia, ressonância e contato. |
| `/Teorias/teorias.html` | Dez linhas com busca, filtros, comparação, dossiê crítico e revisão individual. |
| `/Mapa/mapa.html` | Visualização dos 18 pares derivados do catálogo de relações tipadas. |
| `/GrandesNomes/grandes-nomes.html` | 22 perfis, comparação, trilhas, linha do tempo, fontes e conexões. |
| `/Constelacoes/constelacoes.html` | Atlas educativo de 12 constelações e modo treino. |
| `/Arquivo/arquivo.html` | Estado editorial dos ensaios e registros próprios. |
| `/Laboratorio/laboratorio.html` | Catálogo central das nove experiências públicas. |
| `/Laboratorio/experimento.html` | Executor compartilhado dos quatro simuladores didáticos. |
| `/Rotas/rotas.html` | Quatro percursos guiados entre perfis, teorias e experiências. |
| `/Contribuicoes/contribuicoes.html` | Política e proposta local de conteúdo externo com autoria explícita. |
| `/teorias.html` | Redirecionamento legado para a rota atual de Teorias. |

Princípios preservados:

- separar ciência estabelecida, hipótese, metáfora, interpretação e recomendação;
- não transformar referência, pessoa histórica ou proximidade visual em validação;
- não publicar rascunhos, bastidores, caminhos internos ou comentários dirigidos ao autor;
- não inventar publicações, autores, datas, métricas ou resultados para preencher estados vazios;
- derivar interfaces de catálogos centrais, sem duplicar slugs, contagens ou relações;
- manter interações opcionais, acessíveis e proporcionais ao que ajudam a entender.

## 2. Arquitetura atual

O site é uma aplicação estática multipágina em HTML semântico, CSS próprio e módulos ES nativos. Não há framework, TypeScript, bundler, backend, banco de dados, CMS ou autenticação. Canvas 2D atende à Visão Estelar e à ressonância; SVG atende ao atlas e aos simuladores. O Swiper 14.0.6 é a única biblioteca de interface, fixada e servida localmente na galeria.

```text
HTML de cada rota
  |-- assets/css/styles.css
  |-- assets/css/observatory-pages.css
  |-- CSS específico da rota
  |-- assets/js/navigation.js
  |    |-- smooth-scroll.js
  |    |-- global-search.js
  |    `-- site-metrics.js
  `-- controlador específico ou page-shell.js

catálogos em assets/data/
  |-- theories.js
  |-- notable-figures.js
  |-- constellations.js
  |-- experiments.js
  |-- learning-paths.js
  `-- contributions.js

scripts/public-manifest.mjs
  |-- servidor local
  |-- verificador
  |-- build de dist/
  `-- smoke tests de rotas
```

`assets/js/page-shell.js` permanece somente para a rota estática Arquivo. Teorias, Mapa, Grandes Nomes, Constelações, Laboratório, Rotas e Contribuições possuem controladores próprios. O executor de experimentos importa dinamicamente apenas um dos quatro módulos em `Laboratorio/simulations/`.

## 3. Catálogo e dossiês de Teorias

O catálogo público mantém dez entradas, nove núcleos independentes, seis naturezas e cinco estados de revisão. `assets/data/theories.js` também declara três estados de objeção, sete tipos de relação e uma rubrica de três perguntas para cada natureza.

Cada dossiê pode apresentar:

- contexto conhecido, recorte em investigação, proposta, limite e caminho verificável;
- afirmações com referências ligadas ao trecho correspondente;
- objeções abertas, respondidas ou incorporadas e a resposta editorial atual;
- condição explícita para revisar e condição para abandonar, encerrar ou reintegrar a linha;
- rubrica própria da natureza, sem percentual nem nota de maturidade;
- histórico individual de versão, data, rótulo e resumo da mudança;
- relações tipadas com justificativa;
- relações inversas com os perfis de Grandes Nomes.

`THEORY_RELATIONS` é a fonte central dos 18 pares. `theory-model.js` apresenta cada vínculo de modo simétrico; `connections` é um campo derivado para compatibilidade. Uma relação pode ser derivação, dependência metodológica, contexto metodológico, afinidade conceitual, tensão crítica, observável compartilhado ou ponte operacional. Nenhum tipo implica apoio empírico.

O Mapa desenha esses pares como conexões navegáveis, mas a geometria da linha não codifica o tipo nem a força da relação. Rótulo e justificativa pertencem à leitura textual do dossiê.

`theory-figure-model.js` percorre `notable-figures.js` e torna as conexões visíveis também pelo lado da teoria. Assim, uma ligação com Einstein, Poincaré, Bell ou outro perfil é editada em um único catálogo.

URLs relevantes:

```text
/Teorias/teorias.html?teoria=contentor-finito
/Teorias/teorias.html?comparar=contentor-finito,ciclagem-eterna
/Teorias/teorias.html?teoria=contentor-finito&versao=2.1
```

O parâmetro `versao` identifica a revisão pública atual. Versões anteriores não são armazenadas como snapshots: se uma URL pedir outra versão, a interface informa a limitação e mostra o conteúdo atual.

## 4. Grandes Nomes

O catálogo possui 22 perfis em três áreas: astronomia e observação; física, matemática e cosmos; filosofia e método. Os três destaques da home, a galeria e os dossiês usam os mesmos registros, fontes e retratos WebP locais.

Henri Poincaré foi incluído pela dinâmica qualitativa, estabilidade e contribuição metodológica aos sistemas dinâmicos. John Stewart Bell foi incluído pela desigualdade que tornou testável uma diferença entre previsões quânticas e teorias locais de variáveis ocultas. As duas inclusões possuem fontes e atribuições de imagem próprias; presença no catálogo não equivale a endosso de uma linha autoral.

A página completa oferece:

- galeria arrastável, teclado, índice, busca, filtros e `?perfil=<slug>`;
- comparação de duas trajetórias por `?comparar=<slug>,<slug>`;
- linha do tempo com 15 eventos de método ou descoberta, filtráveis por observar, medir, modelar e testar;
- quatro trilhas: medir distâncias, gravidade, quântica e filosofia do teste;
- dossiê com contribuições, marcos, fontes, crédito do retrato e conexões delimitadas.

A comparação descreve trajetórias em critérios equivalentes, sem ranking. As trilhas e a linha do tempo são recortes editoriais, não uma história completa da ciência nem atribuição exclusiva de descobertas coletivas.

## 5. Rotas Guiadas

`assets/data/learning-paths.js` declara quatro percursos de cinco etapas:

1. Observar o Universo distante;
2. Tempo, gravidade e causalidade;
3. Por que o vazio não é simplesmente “nada”;
4. Aprender a perder para a evidência.

Cada passo referencia por ID um perfil, uma linha de investigação ou uma experiência. `learning-paths-model.js` resolve título, resumo e link no catálogo de origem, evitando cópias divergentes. A home apresenta um recorte, e a rota completa explica por que cada passagem foi escolhida.

`?rota=<slug>&etapa=<n>` preserva a posição compartilhável. O progresso não é salvo, não existe conta e abrir o conteúdo completo troca de página. A rota orienta leitura; não certifica conclusão nem mistura os níveis de evidência dos três tipos de conteúdo.

## 6. Busca global

`global-search.js` adiciona um botão visível à navegação e aceita `Ctrl+K` ou `Command+K`. O diálogo importa sob demanda seis catálogos: teorias, grandes nomes, constelações, experiências, Rotas Guiadas e contribuições publicadas.

A consulta remove acentos, exige a presença de todos os termos, dá maior peso ao título e limita a saída a 12 resultados. Sem consulta, até oito Rotas Guiadas e experiências são sugeridas. Setas percorrem os links; o fechamento devolve foco ao gatilho.

A busca é totalmente local. Ela não consulta servidor, não registra histórico, não indexa texto livre dos HTML e não retorna contribuições enquanto o catálogo correspondente estiver vazio.

## 7. Laboratório e catálogo de experiências

`assets/data/experiments.js` é a fonte única das nove experiências ativas e de quatro naturezas:

- visualização conceitual: Visão Estelar, Mapa de Ideias e Atlas Celeste;
- instrumento interativo: Ressonância;
- simulador didático: Cone de Luz, Zero vs. Epsilon, Recorrência Finita e Astrobiologia Probabilística;
- modo de treino: Treino do Atlas.

Home, Arquivo, Laboratório, busca, métricas e Rotas Guiadas consomem esses mesmos dados. Cada entrada declara pergunta, tecnologia, limite, destino e linhas autorais relacionadas.

### 7.1 Cone de luz e referenciais

Aplica transformações de Lorentz a um evento, compara dois referenciais inerciais, calcula o fator de Lorentz, preserva o intervalo e classifica a separação causal. Usa uma dimensão espacial e unidades com `c = 1`. Não representa gravidade, aceleração ou um espaço-tempo cosmológico completo.

### 7.2 Zero vs. Epsilon

Combina valores informados pelo visitante para chance, benefício, custo, dano, aprendizado e reversibilidade. Tetos independentes de custo e dano residual funcionam como critérios explícitos de parada: eles não alteram o saldo e, quando excedidos, impedem uma leitura favorável. O resultado é uma heurística transparente para comparar inação e teste pequeno, não uma previsão ou aconselhamento médico, jurídico, financeiro ou profissional.

### 7.3 Modelo finito de recorrência

Evolui um sistema determinístico pela regra `próximo = (a × estado + b) mod N` e separa transiente de ciclo quando um estado se repete. A repetição em um conjunto finito não demonstra recorrência do Universo e não garante visita a todos os estados possíveis.

### 7.4 Astrobiologia probabilística

Combina, em potências de dez, mundos candidatos e cinco probabilidades condicionais: abiogênese, complexidade, inteligência tecnológica, detectabilidade e sobreposição temporal. O produto segue a regra da cadeia. O cálculo da probabilidade de pelo menos um sinal assume candidatos independentes com a mesma probabilidade combinada. Os parâmetros são cenários escolhidos, não estimativas confirmadas da frequência de vida.

Todos os simuladores mantêm premissas, fórmulas, resultado e limite à vista. Uma relação com Teorias indica contexto editorial; o resultado do simulador não valida a proposta.

## 8. Atlas e modo treino

O Atlas mantém 12 constelações em uma superfície mestre–detalhe. Estrelas permanecem visíveis; hover ou foco pré-visualizam linhas, mouse e teclado mudam seleção sem fixá-las, toque ou caneta fixam a guia e o botão textual controla explicitamente esse estado. As linhas são convenções de reconhecimento, não figuras oficiais da IAU; o mapa é esquemático e não calcula céu para local, data e hora.

`?modo=treino` inicia oito rodadas. Cada rodada mostra somente o padrão estelar e quatro alternativas, revela linha e nome depois da resposta e anuncia pontuação e avanço. A sessão não persiste resultado e respeita movimento reduzido. O tubarão-baleia estelar continua como ilustração interativa separada, sem integrar o catálogo ou sua contagem.

## 9. Contribuições externas e autoria

A rota Contribuições aceita propostas em cinco formatos:

- ensaio;
- nota técnica;
- visualização;
- revisão ou objeção;
- linha de investigação convidada.

O formulário solicita contato, nome de crédito, formato, título, resumo, fontes e confirmação de autoria ou permissão. Tudo é validado no navegador e convertido em um `mailto:` para revisão antes do envio. Não há upload, armazenamento, conta, moderação automática ou publicação direta.

Uma publicação futura precisa preservar crédito, participação, fontes, permissões e revisões. Publicar não transfere autoria para Matheus Camargo e não significa endosso científico. `CONTRIBUTIONS` permanece vazio; a página declara isso em vez de criar colaboradores fictícios.

O Arquivo possui outro escopo e continua com zero ensaios e registros próprios. “Sem ensaios e registros” e “sem contribuições externas” são estados editoriais separados.

## 10. Acessibilidade e movimento

Contratos implementados:

- menu compacto fechado usa `inert` e `aria-hidden`, e o estado é ressincronizado no breakpoint;
- retorno ao topo fica oculto, `inert` e fora da ordem de tabulação até aparecer;
- erros do contato estão ligados aos campos por `aria-describedby`; `aria-invalid` só existe durante erro;
- o primeiro campo inválido recebe foco e o status do formulário usa região viva atômica;
- a ressonância possui seis botões nomeados, além de mouse e toque;
- busca, Rotas, treino e simuladores usam ações textuais, foco visível e regiões vivas pequenas;
- movimento reduzido remove autoplay, profundidade, deslocamentos e transições não essenciais;
- rolagem suave pode ser cancelada por interação e cai para movimento imediato quando necessário.

Esses pontos possuem cobertura parcial automatizada. Zoom de 200%, contraste no fundo real, leitor de tela, foco depois de re-render e larguras 1440, 1024, 768, 430, 390 e 360 px continuam no QA manual proporcional à mudança.

## 11. Desempenho

- A Visão Estelar limita DPR e partículas por perfil, pausa na aba oculta e cancela frames e listeners ao desligar.
- A ressonância limita DPR, exige gesto para áudio e pausa fora da viewport quando `IntersectionObserver` existe.
- Grandes Nomes mantém uma única instância de Swiper, usa WebP local, lazy loading e desativa autoplay e coverflow com movimento reduzido.
- Atlas e treino reutilizam SVG e catálogo, sem canvas, timer recorrente ou loop contínuo.
- A busca carrega catálogos somente na primeira abertura do diálogo e limita resultados.
- O executor carrega somente um simulador e chama sua limpeza em `pagehide`.
- Rotas renderizam uma etapa completa por vez e não fazem prefetch ou persistência.

Não há orçamento numérico de bundle, FPS ou heap. WebGL pesado, loops globais adicionais e dependências novas só devem entrar depois de medição e justificativa.

## 12. Manifesto, servidor, build e Vercel

`scripts/public-manifest.mjs` centraliza dez rotas públicas, seus arquivos, URLs limpas, diretórios copiados e arquivos obrigatórios. Servidor, verificador, build e smoke tests consomem esse manifesto.

O servidor oferece dois modos:

- `npm run dev`: serve a fonte autorizada em `localhost`, sem expor `ai/`, `docs/`, `scripts/` ou `package.json`;
- `npm run preview`: executa o build e serve somente `dist/`.

Os dois aceitam apenas `GET` e `HEAD`; caminhos desconhecidos respondem 404. O comportamento local não é prova definitiva dos redirects, cache ou headers aplicados pela Vercel.

`npm run build` executa a verificação, recria `dist/` e copia somente a allowlist. Documentação interna, fontes brutas, scripts, pareceres e arquivos de QA ficam fora do artefato. `vercel.json` usa `framework: null`, `outputDirectory: "dist"`, `cleanUrls: true` e `trailingSlash: false`.

O projeto declara Node.js `>=18.17 <25`.

## 13. CI e testes

`.github/workflows/quality.yml` roda em push e pull request com Node 22 e permissões somente de leitura. O job executa:

```text
npm ci --ignore-scripts
npm run knowledge:test
npm test
```

`npm test` chama o build no `pretest` e depois:

- smoke HTTP de todas as rotas e URLs limpas, assets, 404 e 405;
- confirmação de que o servidor de fonte não expõe caminhos internos conhecidos;
- contratos estáticos dos seis controles da ressonância, erros ligados aos campos e alvos invisíveis fora do teclado;
- smoke em navegador da home, Rotas, Contribuições e Cone de Luz.

O smoke de navegador é ignorado se Chrome, Chromium ou Edge não estiver disponível. A suíte não substitui regressão visual, auditoria completa de acessibilidade, E2E de todas as jornadas, teste de memória ou validação de links externos.

O verificador ainda não cobre schemas completos dos catálogos de experiências, Rotas Guiadas e contribuições, nem todas as novas rubricas, relações, trilhas e eventos. Esses são pontos de expansão da automação, não funcionalidades ausentes da interface.

## 14. Como evoluir sem duplicação

### Nova linha de investigação

1. Preserve o material bruto fora dos módulos públicos e mapeie a fonte apenas em `scripts/theory-sources.mjs`.
2. Classifique natureza e estado antes de escrever a apresentação.
3. Preencha contexto, recorte, proposta, limite, teste, afirmações referenciadas, objeções e critérios de saída.
4. Registre uma revisão individual e preserve `id`, `slug` e `code` publicados.
5. Cadastre relações tipadas com IDs válidos e justificativa; não edite `connections` como fonte paralela.
6. Revise relações inversas em Grandes Nomes e teste home, Teorias, comparação e Mapa.

### Novo perfil histórico

1. Adicione perfil, fontes e retrato WebP local com licença e crédito completos.
2. Use `theoryLinks` somente quando houver relação pública rigorosa.
3. Revise comparação, trilhas e linha do tempo antes de incluir o perfil em qualquer recorte.
4. Não copie o perfil para a home ou para HTML estático.

### Nova experiência

1. Cadastre pergunta, natureza, tecnologia, limite, destino e relações em `experiments.js`.
2. Use o executor compartilhado somente para simuladores; visualizações em páginas próprias apontam para seu `href`.
3. Exponha premissas e resultado, forneça teclado e texto equivalente e implemente limpeza quando houver listeners ou trabalho recorrente.
4. Atualize o manifesto apenas se novos arquivos ou uma nova rota forem necessários.

### Nova Rota Guiada

1. Referencie somente IDs existentes de teoria, perfil ou experiência.
2. Explique o motivo de cada passagem e preserve a diferença de evidência entre as etapas.
3. Não duplique títulos, resumos ou links no controlador.

### Primeira contribuição externa

1. Confirme autoria, permissão, crédito público, fontes e licença.
2. Defina schema e rota de leitura antes de preencher `CONTRIBUTIONS`.
3. Separe autoria, revisão editorial e eventual objeção ou resposta.
4. Adicione validação do schema e do destino antes de publicar.

## 15. Limitações e pontos a verificar

- Não há CMS, backend, conta, persistência, analytics ou telemetria.
- Busca, filtros, treino, Rotas e simuladores executam somente no cliente.
- URLs usam query string; slugs antigos ainda precisam de estratégia de alias quando forem renomeados.
- `?versao=` não recupera snapshots anteriores.
- O mapa usa posições editoriais manuais.
- O domínio canônico, `canonical`, `og:url`, sitemap e URLs sociais absolutas ainda dependem de decisão de publicação.
- Não existe regressão visual, auditoria automatizada completa de acessibilidade ou garantia de navegador instalado no CI.
- Os catálogos novos ainda precisam de validação estrutural tão profunda quanto Teorias, Grandes Nomes e Constelações.
- FPS, heap, Core Web Vitals e comportamento com leitor de tela precisam de medição em dispositivos reais.

## 16. Checklist de publicação

```bash
npm run knowledge:build
npm test
```

Depois:

- confirme que o smoke de navegador executou quando a mudança depender dele;
- inspecione `dist/` quando o manifesto mudar;
- teste URLs diretas, inválidas e retorno por histórico;
- revise busca global, comparação, Rotas, treino e os quatro simuladores;
- teste formulários sem assumir envio ou persistência;
- confira teclado, Escape, foco, zoom, movimento reduzido e overflow horizontal;
- faça QA visual nas larguras afetadas;
- confirme console sem erros e ausência de arquivos internos no artefato.

## 17. Referências internas

- Entrada da base: `ai/INDEX.md`.
- Roteamento gerado: `ai/ROUTING.md`.
- Arquitetura: `ai/project/ARCHITECTURE.md`.
- Sistemas interativos: `ai/frontend/INTERACTIVE_SYSTEMS.md`.
- Teorias: `ai/domains/THEORY_CATALOG.md`.
- Grandes Nomes: `ai/domains/NOTABLE_FIGURES_CATALOG.md`.
- Validação: `ai/quality/VALIDATION_AND_RELEASE.md`.
- Build e Vercel: `ai/infrastructure/STATIC_BUILD_AND_DEPLOY.md`.
- Integração editorial anterior: `docs/INTEGRACAO_TEORIAS.md`.
