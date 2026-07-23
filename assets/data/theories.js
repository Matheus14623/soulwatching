export const THEORY_FILTERS = Object.freeze([
  Object.freeze({ id: 'todas', label: 'Todas' }),
  Object.freeze({ id: 'cosmologia', label: 'Cosmologia' }),
  Object.freeze({ id: 'tempo', label: 'Tempo' }),
  Object.freeze({ id: 'vazio', label: 'Vazio' }),
  Object.freeze({ id: 'informacao', label: 'Informação' }),
  Object.freeze({ id: 'topologia', label: 'Topologia' }),
  Object.freeze({ id: 'existencial', label: 'Existencial' }),
  Object.freeze({ id: 'metodo', label: 'Método' }),
]);

export const THEORY_TYPES = Object.freeze([
  Object.freeze({
    id: 'hipotese-cientifica',
    label: 'Hipótese científica',
    shortLabel: 'Hipótese',
    description: 'Propõe uma explicação física que ainda precisa de mecanismo, modelo e confronto com dados.',
  }),
  Object.freeze({
    id: 'estudo-teorico',
    label: 'Estudo teórico',
    shortLabel: 'Estudo',
    description: 'Investiga limites ou consequências de teorias existentes sem reivindicar uma nova lei física.',
  }),
  Object.freeze({
    id: 'estrutura-conceitual',
    label: 'Estrutura conceitual',
    shortLabel: 'Framework',
    description: 'Organiza perguntas, relações e critérios de análise.',
  }),
  Object.freeze({
    id: 'linha-derivada',
    label: 'Linha derivada',
    shortLabel: 'Derivação',
    description: 'Desdobra outra entrada e só se torna independente se formular uma pergunta própria.',
  }),
  Object.freeze({
    id: 'heuristica',
    label: 'Heurística',
    shortLabel: 'Heurística',
    description: 'Oferece uma regra prática de decisão, não uma afirmação cosmológica.',
  }),
  Object.freeze({
    id: 'programa-pratico',
    label: 'Programa prático',
    shortLabel: 'Programa',
    description: 'Converte perguntas em projetos, dados, simulações ou instrumentos verificáveis.',
  }),
]);

export const THEORY_REVIEW_STATES = Object.freeze([
  Object.freeze({ id: 'reformulacao', label: 'Reformulação' }),
  Object.freeze({ id: 'formalizacao', label: 'Formalização' }),
  Object.freeze({ id: 'delimitacao', label: 'Delimitação' }),
  Object.freeze({ id: 'consolidacao', label: 'Consolidação' }),
  Object.freeze({ id: 'execucao', label: 'Execução' }),
]);

export const THEORY_OBJECTION_STATES = Object.freeze([
  Object.freeze({ id: 'aberta', label: 'Aberta', description: 'Ainda exige cálculo, fonte, dado ou decisão editorial.' }),
  Object.freeze({ id: 'respondida', label: 'Respondida', description: 'A formulação atual oferece uma resposta explícita, preservada para escrutínio.' }),
  Object.freeze({ id: 'incorporada', label: 'Incorporada', description: 'A objeção alterou o escopo ou o mecanismo da linha.' }),
]);

export const THEORY_RELATION_TYPES = Object.freeze([
  Object.freeze({ id: 'derivacao', label: 'Derivação', description: 'Uma linha desdobra uma pergunta ou mecanismo da outra.' }),
  Object.freeze({ id: 'dependencia-metodologica', label: 'Dependência metodológica', description: 'Uma linha precisa satisfazer condições explicitadas pela outra.' }),
  Object.freeze({ id: 'contexto-metodologico', label: 'Contexto metodológico', description: 'As linhas compartilham uma forma de organizar, testar ou revisar argumentos.' }),
  Object.freeze({ id: 'afinidade-conceitual', label: 'Afinidade conceitual', description: 'Há vocabulário ou problema comum sem implicar apoio empírico.' }),
  Object.freeze({ id: 'tensao-critica', label: 'Tensão crítica', description: 'Uma linha explicita um limite que restringe a interpretação da outra.' }),
  Object.freeze({ id: 'observavel-compartilhado', label: 'Observável compartilhado', description: 'As linhas podem ser confrontadas com parte do mesmo conjunto de observações.' }),
  Object.freeze({ id: 'ponte-operacional', label: 'Ponte operacional', description: 'Uma linha oferece um caminho prático para examinar a outra.' }),
]);

export const THEORY_RUBRICS = Object.freeze({
  'hipotese-cientifica': Object.freeze([
    Object.freeze({ id: 'mecanismo', label: 'Mecanismo', question: 'O processo físico e suas variáveis estão definidos sem depender apenas de analogia?' }),
    Object.freeze({ id: 'discriminacao', label: 'Previsão discriminante', question: 'Existe um resultado capaz de distinguir a proposta de explicações concorrentes?' }),
    Object.freeze({ id: 'confronto', label: 'Confronto empírico', question: 'Dados, incertezas e condição de abandono foram declarados antes do teste?' }),
  ]),
  'estudo-teorico': Object.freeze([
    Object.freeze({ id: 'premissas', label: 'Premissas', question: 'O domínio, as condições iniciais e as hipóteses matemáticas estão explícitos?' }),
    Object.freeze({ id: 'derivacao', label: 'Derivação', question: 'A conclusão decorre do formalismo sem saltos conceituais?' }),
    Object.freeze({ id: 'escopo', label: 'Escopo', question: 'Está claro o que o resultado demonstra e o que permanece fora dele?' }),
  ]),
  'estrutura-conceitual': Object.freeze([
    Object.freeze({ id: 'rastreabilidade', label: 'Rastreabilidade', question: 'Premissas, objeções, fontes e mudanças podem ser recuperadas?' }),
    Object.freeze({ id: 'separacao', label: 'Separação epistemológica', question: 'Fato, hipótese, metáfora e recomendação permanecem distintos?' }),
    Object.freeze({ id: 'utilidade', label: 'Utilidade comparável', question: 'O framework melhora análises reais de forma observável e reproduzível?' }),
  ]),
  'linha-derivada': Object.freeze([
    Object.freeze({ id: 'pergunta-propria', label: 'Pergunta própria', question: 'A derivação responde a algo que a linha principal não cobre?' }),
    Object.freeze({ id: 'heranca', label: 'Dependências herdadas', question: 'Mecanismos e premissas reutilizados estão ligados à origem?' }),
    Object.freeze({ id: 'resultado-proprio', label: 'Resultado distinto', question: 'Há uma consequência verificável que justifique manter uma ficha separada?' }),
  ]),
  heuristica: Object.freeze([
    Object.freeze({ id: 'variaveis', label: 'Variáveis de decisão', question: 'Benefício, dano, custo e alternativa estão explícitos?' }),
    Object.freeze({ id: 'limite-risco', label: 'Limite de risco', question: 'Há teto de perda, reversibilidade e condição de parada?' }),
    Object.freeze({ id: 'calibracao', label: 'Calibração', question: 'Previsões e resultados podem ser comparados sem justificativa posterior?' }),
  ]),
  'programa-pratico': Object.freeze([
    Object.freeze({ id: 'proveniencia', label: 'Proveniência', question: 'Dados, transformações e instrumentos podem ser auditados?' }),
    Object.freeze({ id: 'reproducao', label: 'Reprodução', question: 'O procedimento reproduz primeiro um resultado conhecido?' }),
    Object.freeze({ id: 'incerteza', label: 'Incerteza', question: 'Limites, erros e alternativas acompanham o resultado publicado?' }),
  ]),
});

export const THEORY_RELATIONS = Object.freeze([
  Object.freeze({ sourceId: 'observacao-nao-linear', targetId: 'er-epr-sondas', type: 'tensao-critica', justification: 'As duas linhas tratam informação e causalidade; a T-06 delimita o que o entrelaçamento não acrescenta à reconstrução astronômica da T-01.' }),
  Object.freeze({ sourceId: 'observacao-nao-linear', targetId: 'universo-buraco-negro', type: 'observavel-compartilhado', justification: 'Ambas dependem de geometrias, tempos de propagação e observáveis cosmológicos, embora investiguem perguntas diferentes.' }),
  Object.freeze({ sourceId: 'observacao-nao-linear', targetId: 'contentor-finito', type: 'afinidade-conceitual', justification: 'Reconstruções de estado precisam declarar espaço de estados e dinâmica; isso aproxima o método da T-04 sem implicar recorrência.' }),
  Object.freeze({ sourceId: 'observacao-nao-linear', targetId: 'horizonte-sentidos', type: 'ponte-operacional', justification: 'A T-10 oferece um caminho de dados e reprodução para testar estratégias de inferência formuladas na T-01.' }),
  Object.freeze({ sourceId: 'instabilidade-vazio', targetId: 'ciclagem-eterna', type: 'dependencia-metodologica', justification: 'Qualquer reboot baseado em vácuo precisa herdar um campo, um potencial e uma taxa de transição explicitados na T-02.' }),
  Object.freeze({ sourceId: 'instabilidade-vazio', targetId: 'contentor-finito', type: 'afinidade-conceitual', justification: 'Estabilidade e recorrência dependem de espaço de estados e dinâmica definidos, mas um resultado não implica o outro.' }),
  Object.freeze({ sourceId: 'instabilidade-vazio', targetId: 'vacuo-genese', type: 'derivacao', justification: 'A T-08 é o desdobramento geométrico e cosmológico da transição de vácuo examinada pela T-02.' }),
  Object.freeze({ sourceId: 'instabilidade-vazio', targetId: 'backend-existencia', type: 'contexto-metodologico', justification: 'A T-07 ajuda a tornar campo, potencial, premissas e objeções da T-02 explicitamente rastreáveis.' }),
  Object.freeze({ sourceId: 'ciclagem-eterna', targetId: 'contentor-finito', type: 'dependencia-metodologica', justification: 'Uma cosmologia cíclica precisa declarar condições dinâmicas e de medida antes de invocar recorrência.' }),
  Object.freeze({ sourceId: 'ciclagem-eterna', targetId: 'universo-buraco-negro', type: 'afinidade-conceitual', justification: 'As duas investigam cenários cosmológicos não triviais para origem e tempo, com mecanismos independentes.' }),
  Object.freeze({ sourceId: 'ciclagem-eterna', targetId: 'vacuo-genese', type: 'afinidade-conceitual', justification: 'Transições de vácuo podem participar de alguns cenários cosmológicos, sem produzir ciclos por si sós.' }),
  Object.freeze({ sourceId: 'contentor-finito', targetId: 'backend-existencia', type: 'contexto-metodologico', justification: 'A T-07 oferece rastreabilidade para expor as premissas necessárias à aplicação cosmológica da recorrência.' }),
  Object.freeze({ sourceId: 'contentor-finito', targetId: 'zero-epsilon', type: 'afinidade-conceitual', justification: 'As duas tratam retorno ou tentativa, porém uma é estudo matemático e a outra é uma heurística de decisão.' }),
  Object.freeze({ sourceId: 'universo-buraco-negro', targetId: 'er-epr-sondas', type: 'tensao-critica', justification: 'Horizontes e informação aproximam as perguntas, mas a leitura operacional da T-06 não sustenta a cosmologia proposta na T-05.' }),
  Object.freeze({ sourceId: 'er-epr-sondas', targetId: 'horizonte-sentidos', type: 'ponte-operacional', justification: 'Simulações reproduzíveis de circuitos podem transformar o estudo da T-06 em um projeto prático da T-10.' }),
  Object.freeze({ sourceId: 'backend-existencia', targetId: 'vacuo-genese', type: 'contexto-metodologico', justification: 'A T-07 mantém explícita a dependência da T-08 em relação à linha principal, evitando duplicação conceitual.' }),
  Object.freeze({ sourceId: 'backend-existencia', targetId: 'zero-epsilon', type: 'contexto-metodologico', justification: 'A T-07 fornece histórico e critérios para auditar decisões tomadas com a heurística da T-09.' }),
  Object.freeze({ sourceId: 'backend-existencia', targetId: 'horizonte-sentidos', type: 'ponte-operacional', justification: 'A T-10 oferece projetos concretos nos quais a arquitetura crítica da T-07 pode ser avaliada.' }),
]);

function initialRevision(changeSummary) {
  return Object.freeze({
    version: '2.1',
    reviewedAt: '2026-07-22',
    label: 'Primeiro registro individual · jul. 2026',
    changeSummary,
  });
}

const rawTheories = [
  {
    id: 'observacao-nao-linear',
    slug: 'observacao-nao-linear',
    code: 'T-01',
    title: 'Observação Não-Linear',
    shortTitle: 'Observação não-linear',
    subtitle: 'Inferência causal e observação distribuída do estado cósmico',
    kind: 'hipotese-cientifica',
    reviewState: 'reformulacao',
    independent: true,
    category: 'informacao',
    filters: ['cosmologia', 'informacao', 'tempo'],
    color: '#72ecff',
    glow: 'rgba(114, 236, 255, 0.58)',
    position: { x: 15, y: 31 },
    summary: 'Investiga como dados atrasados, lentes e observatórios distribuídos podem melhorar a reconstrução do estado provável de sistemas distantes sem ultrapassar o limite causal da luz.',
    proposal: 'Modelos de cone de luz, atrasos de lentes e assimilação de dados podem produzir estimativas melhores do estado cósmico do que uma leitura isolada, embora não entreguem à Terra o presente exato de uma região causalmente inacessível.',
    questions: [
      'Quanto uma arquitetura distribuída melhora a reconstrução de uma fonte observada com atraso?',
      'Quais observáveis distinguem variações ambientais de expansão de um erro de inferência?',
      'Como medir a qualidade da reconstrução quando novos dados chegam?',
    ],
    concepts: ['cone de luz', 'lookback time', 'lentes gravitacionais', 'inferência bayesiana', 'observação distribuída'],
    nextSteps: [
      'Escolher um conjunto de dados de lentes ou uma simulação de cone de luz.',
      'Definir uma métrica de erro antes da análise.',
      'Comparar a reconstrução prevista com observações posteriores.',
    ],
    referenceIds: ['hogg-distance', 'refsdal-lensing', 'suyu-time-delay'],
    claimLinks: [
      { id: 'contexto-observacao', label: 'Base observacional', field: 'review.known', referenceIds: ['hogg-distance', 'refsdal-lensing', 'suyu-time-delay'] },
    ],
    objections: [
      { id: 'causalidade-superluminal', title: 'A reconstrução permitiria ver o presente distante?', status: 'incorporada', response: 'Não. A linha foi restringida a inferência dentro do cone de luz e não reivindica acesso causal ao presente remoto.' },
      { id: 'ganho-reconstrucao', title: 'O ganho sobre uma observação isolada ainda não foi quantificado', status: 'aberta', response: 'É necessário definir uma métrica de erro e testar a reconstrução contra observações posteriores.' },
    ],
    decisionBoundary: {
      revise: 'Revisar o modelo se observações adicionais não reduzirem o erro ou se o ganho depender de premissas não identificáveis.',
      abandon: 'Abandonar a arquitetura proposta se ela não superar, em dados reservados, métodos convencionais de reconstrução sob o mesmo orçamento observacional.',
    },
    review: {
      assessment: 'Promissora após reformulação',
      known: 'A astronomia observa fontes no cone de luz passado. Lentes podem produzir imagens com trajetórias e atrasos diferentes, úteis para reconstrução e cosmologia.',
      focus: 'Transformar o problema de “ver o presente” em um problema mensurável de inferência, latência e coordenação entre observatórios.',
      limit: 'Nenhuma lente, sonda enviada agora ou correlação quântica faz a informação chegar antes do caminho causal mais rápido.',
      test: 'Comparar previsões de um modelo de reconstrução com curvas de luz, atrasos de lentes, redshift drift ou observações posteriores.',
    },
    revisions: [initialRevision('A causalidade, as objeções e o critério de abandono passaram a integrar o dossiê individual.')],
  },
  {
    id: 'instabilidade-vazio',
    slug: 'instabilidade-vazio',
    code: 'T-02',
    title: 'Instabilidade Probabilística do Vazio',
    shortTitle: 'Vazio instável',
    subtitle: 'Estabilidade, transições e decaimento em estados de vácuo definidos',
    kind: 'hipotese-cientifica',
    reviewState: 'formalizacao',
    independent: true,
    category: 'vazio',
    filters: ['cosmologia', 'vazio'],
    color: '#ad8cff',
    glow: 'rgba(173, 140, 255, 0.58)',
    position: { x: 72, y: 23 },
    summary: 'Pergunta sob quais condições um estado de vácuo metastável pode decair e produzir uma transição cosmológica com consequências observáveis.',
    proposal: 'Em um modelo com campo, potencial e mínimos definidos, um falso vácuo pode decair por tunelamento. A consequência depende da ação, da geometria e da taxa de nucleação, não de uma instabilidade obrigatória do “nada”.',
    questions: [
      'Qual campo e qual potencial definem o estado de vácuo estudado?',
      'A taxa de decaimento é compatível com a idade do universo?',
      'Que assinatura distinguiria essa transição de outros processos cosmológicos?',
    ],
    concepts: ['falso vácuo', 'potencial de campo', 'tunelamento', 'nucleação de bolhas', 'transição de fase'],
    nextSteps: [
      'Definir um potencial V(φ) com falso e verdadeiro mínimos.',
      'Calcular ou simular a ação de bounce e a taxa de nucleação.',
      'Derivar uma assinatura observável do modelo escolhido.',
    ],
    referenceIds: ['coleman-deluccia', 'hiller-vacuum'],
    claimLinks: [
      { id: 'contexto-decaimento', label: 'Base teórica', field: 'review.known', referenceIds: ['coleman-deluccia', 'hiller-vacuum'] },
    ],
    objections: [
      { id: 'vacuo-como-nada', title: 'Vácuo físico não equivale a nada absoluto', status: 'incorporada', response: 'A formulação agora exige campo, potencial e estado de vácuo definidos antes de discutir decaimento.' },
      { id: 'modelo-ausente', title: 'O potencial e a taxa de nucleação ainda não foram calculados', status: 'aberta', response: 'Sem V(φ), ação de bounce e escala, a linha permanece uma pergunta legítima, não um modelo completo.' },
    ],
    decisionBoundary: {
      revise: 'Revisar o recorte se o potencial escolhido for incompatível com limites experimentais ou produzir uma vida do vácuo inconsistente.',
      abandon: 'Abandonar o mecanismo específico se nenhuma região de parâmetros fisicamente admissível produzir a transição e a assinatura declaradas.',
    },
    review: {
      assessment: 'Núcleo legítimo; mecanismo ainda incompleto',
      known: 'Decaimento de falso vácuo e estabilidade eletrofraca são problemas reais de teoria quântica de campos e cosmologia.',
      focus: 'Substituir o “nada absoluto” por um estado físico explicitamente definido e calcular suas transições possíveis.',
      limit: 'Vácuo quântico não é ausência de campos ou leis; incerteza energia-tempo não obriga energia a surgir nem torna um novo Big Bang inevitável.',
      test: 'Especificar V(φ), estimar a taxa de decaimento e procurar assinaturas compatíveis com uma transição de fase.',
    },
    revisions: [initialRevision('O dossiê individual registra a distinção entre vácuo físico e nada, além da condição de abandono do mecanismo.')],
  },
  {
    id: 'ciclagem-eterna',
    slug: 'ciclagem-eterna',
    code: 'T-03',
    title: 'Ciclagem Eterna e Reboot do Vácuo',
    shortTitle: 'Reboot cósmico',
    subtitle: 'Condições para uma cosmologia cíclica com mecanismo definido',
    kind: 'hipotese-cientifica',
    reviewState: 'reformulacao',
    independent: true,
    category: 'cosmologia',
    filters: ['cosmologia', 'vazio', 'topologia'],
    color: '#f6d56d',
    glow: 'rgba(246, 213, 109, 0.52)',
    position: { x: 64, y: 76 },
    summary: 'Examina se o Big Bang pode ser uma transição entre fases cósmicas dentro de um modelo cíclico específico, em vez de combinar vários mecanismos incompatíveis.',
    proposal: 'Um ciclo só é defensável quando um formalismo explica contração ou transição, bounce, evolução da entropia e previsões próprias.',
    questions: [
      'Qual formalismo produz a transição entre ciclos?',
      'Como o modelo trata singularidade e crescimento da entropia?',
      'Qual assinatura primordial o diferencia de uma cosmologia não cíclica?',
    ],
    concepts: ['cosmologia cíclica', 'bounce', 'entropia', 'espectro primordial', 'transição cosmológica'],
    nextSteps: [
      'Escolher um único formalismo cíclico para estudo.',
      'Declarar o mecanismo de bounce e o tratamento da entropia.',
      'Derivar uma previsão capaz de perder para os dados.',
    ],
    referenceIds: ['ashtekar-singh-lqc', 'steinhardt-turok'],
    claimLinks: [
      { id: 'contexto-ciclico', label: 'Modelos de comparação', field: 'review.known', referenceIds: ['ashtekar-singh-lqc', 'steinhardt-turok'] },
    ],
    objections: [
      { id: 'mistura-mecanismos', title: 'Mecanismos cosmológicos distintos foram combinados sem derivação', status: 'incorporada', response: 'A linha passou a exigir a escolha de um único formalismo antes de ligar bounce, entropia e observáveis.' },
      { id: 'entropia-ciclos', title: 'A evolução da entropia entre ciclos permanece sem solução', status: 'aberta', response: 'O formalismo escolhido deverá demonstrar como trata crescimento entrópico sem recorrer apenas à repetição verbal do ciclo.' },
    ],
    decisionBoundary: {
      revise: 'Revisar a proposta se o formalismo escolhido exigir condições iniciais ou assinaturas incompatíveis com observações cosmológicas.',
      abandon: 'Abandonar a versão cíclica estudada se ela não produzir uma transição consistente e ao menos uma previsão distinguível de modelos não cíclicos.',
    },
    review: {
      assessment: 'Especulativa; precisa ser reconstruída',
      known: 'Existem modelos cíclicos, ekpiróticos e de cosmologia quântica em loop com mecanismos e previsões diferentes.',
      focus: 'Escolher um modelo e perguntar se ele produz uma transição consistente e uma assinatura observável.',
      limit: 'Big Freeze, decaimento do próton, recorrência e buracos negros não formam automaticamente uma cadeia causal comum.',
      test: 'Derivar espectro primordial, não gaussianidade, fundo de ondas gravitacionais ou outra assinatura exclusiva do formalismo.',
    },
    revisions: [initialRevision('O primeiro histórico individual fixa a exigência de um único formalismo, objeções abertas e critérios de saída.')],
  },
  {
    id: 'contentor-finito',
    slug: 'contentor-finito',
    code: 'T-04',
    title: 'Topologia do Contentor Finito',
    shortTitle: 'Contentor finito',
    subtitle: 'Condições matemáticas de recorrência em cosmologias finitas',
    kind: 'estudo-teorico',
    reviewState: 'formalizacao',
    independent: true,
    category: 'topologia',
    filters: ['topologia', 'tempo', 'cosmologia'],
    color: '#68f0cb',
    glow: 'rgba(104, 240, 203, 0.48)',
    position: { x: 29, y: 76 },
    summary: 'Investiga quais hipóteses de medida, dinâmica e topologia permitiriam recorrência em um modelo cosmológico.',
    proposal: 'Alguns sistemas dinâmicos que preservam medida em espaços de medida finita apresentam retornos arbitrariamente próximos. Aplicar isso ao universo exige demonstrar cada condição.',
    questions: [
      'Qual medida é preservada pela dinâmica proposta?',
      'O espaço de fase relevante tem medida finita?',
      'O retorno seria aproximado, exato ou restrito a um subconjunto de estados?',
    ],
    concepts: ['recorrência de Poincaré', 'medida invariante', 'espaço de fase', 'ergodicidade', 'topologia'],
    nextSteps: [
      'Construir um modelo reduzido com Hamiltoniano e medida explícitos.',
      'Demonstrar recorrência ou produzir um contraexemplo no modelo.',
      'Separar finitude espacial, sistema fechado e espaço de fase finito.',
    ],
    referenceIds: ['assani-presser', 'dyson-kleban-susskind'],
    claimLinks: [
      { id: 'contexto-recorrencia', label: 'Resultado matemático', field: 'review.known', referenceIds: ['assani-presser'] },
      { id: 'contexto-cosmologico', label: 'Aplicação cosmológica', field: 'review.focus', referenceIds: ['dyson-kleban-susskind'] },
    ],
    objections: [
      { id: 'finitude-repeticao', title: 'Finitude espacial não implica repetição exata', status: 'incorporada', response: 'A formulação separa topologia espacial, medida finita, dinâmica e tipo de retorno.' },
      { id: 'hipoteses-teorema', title: 'As condições do teorema ainda não foram demonstradas para um modelo cosmológico', status: 'aberta', response: 'O próximo passo é construir um sistema reduzido com Hamiltoniano e medida explícitos.' },
    ],
    decisionBoundary: {
      revise: 'Revisar o alcance cosmológico se a recorrência aparecer apenas em subconjuntos ou depender de uma medida sem interpretação física.',
      abandon: 'Abandonar a aplicação proposta ao universo se o modelo não preservar medida ou não possuir espaço de fase de medida finita.',
    },
    review: {
      assessment: 'Boa pergunta matemática; conclusão cósmica exagerada',
      known: 'O teorema de recorrência estabelece retornos sob condições precisas de medida e dinâmica.',
      focus: 'Identificar quais cosmologias satisfazem essas condições e o que exatamente retorna.',
      limit: 'Universo finito não implica estados finitos, visita a todas as possibilidades ou repetição exata de pessoas e eventos.',
      test: 'Provar o resultado em um modelo reduzido e confrontar separadamente as premissas geométricas e dinâmicas.',
    },
    revisions: [initialRevision('O registro individual separa o teorema matemático de sua aplicação cosmológica e explicita condições de abandono.')],
  },
  {
    id: 'universo-buraco-negro',
    slug: 'universo-buraco-negro',
    code: 'T-05',
    title: 'Gênese Gravitacional do Tempo',
    shortTitle: 'Gênese do tempo',
    subtitle: 'Relógios, vazios e cosmologia inhomogênea como projeto principal',
    kind: 'hipotese-cientifica',
    reviewState: 'delimitacao',
    independent: true,
    category: 'tempo',
    filters: ['tempo', 'cosmologia', 'topologia'],
    color: '#7ca7ff',
    glow: 'rgba(124, 167, 255, 0.52)',
    position: { x: 85, y: 55 },
    summary: 'Prioriza diferenças comparáveis de tempo próprio e expansão entre ambientes cósmicos, mantendo a hipótese de universo-filho como uma linha separada e de longo prazo.',
    proposal: 'Geometrias inhomogêneas podem produzir diferenças de tempo próprio e expansão que devem ser calculadas e comparadas com observações antes de qualquer interpretação mais ampla.',
    questions: [
      'Qual diferença de tempo próprio é prevista entre vazios e paredes cósmicas?',
      'O efeito permanece compatível com supernovas, BAO, CMB, lentes e sirenes padrão?',
      'Que dinâmica adicional seria necessária para um modelo de universo-filho em buraco negro?',
    ],
    concepts: ['tempo próprio', 'backreaction', 'vazios cósmicos', 'timescape', 'universo-filho'],
    nextSteps: [
      'Modelar Δτ/τ e a diferença de expansão entre ambientes.',
      'Confrontar o modelo com mais de uma classe de observável.',
      'Manter universo-filho, seta do tempo e ondas gravitacionais como projetos distintos.',
    ],
    referenceIds: ['hogg-distance', 'seifert-timescape', 'poplawski-black-hole'],
    claimLinks: [
      { id: 'contexto-tempo-proprio', label: 'Base observacional', field: 'review.known', referenceIds: ['hogg-distance', 'seifert-timescape'] },
      { id: 'contexto-universo-filho', label: 'Hipótese de comparação', field: 'summary', referenceIds: ['poplawski-black-hole'] },
    ],
    objections: [
      { id: 'horizontes-equivalentes', title: 'Horizonte observável não é horizonte de Schwarzschild', status: 'incorporada', response: 'A linha principal passou a priorizar relógios e inhomogeneidade; universo-filho permanece separado e de longo prazo.' },
      { id: 'vantagem-observacional', title: 'A vantagem sobre cosmologias de referência ainda não foi estabelecida', status: 'aberta', response: 'O modelo precisa confrontar simultaneamente mais de uma classe de observável e suas covariâncias.' },
    ],
    decisionBoundary: {
      revise: 'Revisar o mecanismo se a diferença de tempo próprio for degenerada com efeitos já modelados ou exigir parâmetros incompatíveis entre observáveis.',
      abandon: 'Abandonar a formulação específica se ela não alcançar consistência conjunta com supernovas, BAO, CMB, lentes e sirenes padrão.',
    },
    review: {
      assessment: 'Núcleo observacional promissor; teses precisam ser separadas',
      known: 'Tempo próprio depende da métrica e da trajetória. Cosmologias inhomogêneas e backreaction são linhas reais de investigação.',
      focus: 'Calcular diferenças entre relógios e expansão em ambientes cósmicos antes de avançar para hipóteses de universo-filho.',
      limit: 'Horizonte observável não é horizonte de Schwarzschild, e gravidade externa não fornece por si só uma derivação da seta do tempo.',
      test: 'Comparar previsões de relógios e expansão com supernovas, BAO, CMB, lentes, sirenes padrão ou redshift drift.',
    },
    revisions: [initialRevision('A revisão individual mantém universo-filho como hipótese separada e registra a exigência de confronto observacional conjunto.')],
  },
  {
    id: 'er-epr-sondas',
    slug: 'er-epr-sondas',
    code: 'T-06',
    title: 'ER=EPR e Sondas Quânticas',
    shortTitle: 'Limites de sondagem',
    subtitle: 'Scrambling, entrelaçamento e limites operacionais de leitura',
    kind: 'estudo-teorico',
    reviewState: 'delimitacao',
    independent: true,
    category: 'informacao',
    filters: ['informacao', 'tempo', 'topologia'],
    color: '#ff9ef2',
    glow: 'rgba(255, 158, 242, 0.46)',
    position: { x: 48, y: 14 },
    summary: 'Reformula a ideia de sonda como estudo de informação quântica, scrambling e limites de recuperação, sem prometer telemetria do interior de um buraco negro.',
    proposal: 'Circuitos e modelos holográficos podem investigar como informação se dispersa e é reconstruída, preservando causalidade e a impossibilidade de sinalização pelo entrelaçamento.',
    questions: [
      'Que informação pode ser recuperada em um modelo de scrambling?',
      'Como ruído e decoerência alteram a recuperação?',
      'Quais resultados pertencem ao simulador e quais poderiam ter interpretação gravitacional?',
    ],
    concepts: ['ER=EPR', 'scrambling', 'teleportação quântica', 'no-signalling', 'modelos holográficos'],
    nextSteps: [
      'Implementar um protocolo de scrambling ou teleportação em circuito.',
      'Medir recuperação sob canais ruidosos.',
      'Registrar explicitamente o limite de no-signalling.',
    ],
    referenceIds: ['maldacena-susskind', 'gao-jafferis-wall', 'information-causality'],
    claimLinks: [
      { id: 'contexto-er-epr', label: 'Contexto teórico', field: 'review.known', referenceIds: ['maldacena-susskind', 'gao-jafferis-wall'] },
      { id: 'limite-sinalizacao', label: 'Limite operacional', field: 'review.limit', referenceIds: ['information-causality'] },
    ],
    objections: [
      { id: 'entrelacamento-canal', title: 'Entrelaçamento não funciona como canal de telemetria', status: 'incorporada', response: 'A promessa de sonda foi substituída por um estudo de scrambling, recuperação e no-signalling.' },
      { id: 'ponte-gravidade', title: 'A interpretação gravitacional de resultados em circuitos é limitada', status: 'aberta', response: 'Cada resultado deverá separar o que pertence ao simulador do que depende de uma correspondência holográfica específica.' },
    ],
    decisionBoundary: {
      revise: 'Revisar o alcance se a recuperação depender de pós-seleção, canal clássico ou condições ausentes no cenário gravitacional comparado.',
      abandon: 'Abandonar qualquer arquitetura apresentada como sonda se ela exigir sinalização controlada pelo entrelaçamento ou leitura operacional do interior.',
    },
    review: {
      assessment: 'Inviável como sonda; útil como estudo teórico',
      known: 'ER=EPR, scrambling, teleportação e wormholes atravessáveis aparecem em contextos teóricos específicos.',
      focus: 'Estudar recuperação de informação e causalidade em circuitos e modelos reduzidos.',
      limit: 'A metade externa de um par entrelaçado não revela dados escolhidos no interior; comparar correlações exige canal clássico.',
      test: 'Executar protocolos em simuladores, medir fidelidade e comparar os resultados com modelos de informação quântica.',
    },
    revisions: [initialRevision('O histórico individual registra o abandono da promessa de telemetria e preserva apenas o programa de informação quântica.')],
  },
  {
    id: 'backend-existencia',
    slug: 'backend-existencia',
    code: 'T-07',
    title: 'Cosmologia Lógica: o Backend da Existência',
    shortTitle: 'Backend da existência',
    subtitle: 'Uma arquitetura editorial para perguntas, modelos e limites',
    kind: 'estrutura-conceitual',
    reviewState: 'consolidacao',
    independent: true,
    category: 'metodo',
    filters: ['metodo', 'cosmologia', 'tempo', 'existencial'],
    color: '#b7f7ff',
    glow: 'rgba(183, 247, 255, 0.42)',
    position: { x: 50, y: 48 },
    summary: 'Organiza o acervo como um sistema de perguntas, premissas, mecanismos, evidências, objeções e revisões.',
    proposal: 'A linguagem de sistemas pode tornar hipóteses complexas mais rastreáveis quando funciona como método de organização, não como afirmação de que o universo seja literalmente software.',
    questions: [
      'Quais metáforas esclarecem o modelo e quais importam pressupostos indevidos?',
      'Como tornar cada dependência, objeção e fonte visível?',
      'Que critérios mostram se o framework melhora a qualidade das perguntas?',
    ],
    concepts: ['arquitetura de ideias', 'rastreabilidade', 'premissa', 'objeção', 'versionamento'],
    nextSteps: [
      'Aplicar a mesma estrutura crítica a todas as entradas.',
      'Registrar mudanças de escopo e objeções respondidas.',
      'Avaliar o método pela clareza e pela reprodução das análises.',
    ],
    referenceIds: [],
    claimLinks: [],
    objections: [
      { id: 'metafora-literal', title: 'A metáfora de software pode ser confundida com mecanismo físico', status: 'respondida', response: 'A entrada está classificada como estrutura conceitual e rejeita explicitamente a leitura literal do universo como software.' },
      { id: 'ganho-framework', title: 'A utilidade do framework ainda precisa ser comparada', status: 'aberta', response: 'Seu valor deve aparecer na rastreabilidade, na reprodução das análises e na identificação de contradições reais.' },
    ],
    decisionBoundary: {
      revise: 'Revisar a arquitetura quando seus campos não capturarem objeções ou criarem mais ambiguidade do que rastreabilidade.',
      abandon: 'Abandonar uma regra do framework quando ela não melhorar análises repetidas ou induzir equivalência entre metáfora e explicação física.',
    },
    review: {
      assessment: 'Forte como framework; não é teoria física',
      known: 'Modelos editoriais podem melhorar rastreabilidade, comparação e aprendizado sem produzir uma lei cosmológica.',
      focus: 'Usar a metáfora de backend para organizar o acervo e revelar dependências ou contradições.',
      limit: 'Uma metáfora de software não fornece automaticamente equações, previsões ou um programador do universo.',
      test: 'Avaliar se o framework melhora fontes, objeções, histórico de revisão e reprodução de análises.',
    },
    revisions: [initialRevision('O primeiro registro individual fixa a natureza metodológica e explicita como a utilidade do framework deve ser testada.')],
  },
  {
    id: 'vacuo-genese',
    slug: 'vacuo-genese',
    code: 'T-08',
    title: 'Gênese por Flutuação do Vácuo',
    shortTitle: 'Gênese do vácuo',
    subtitle: 'Derivação integrada à investigação sobre estabilidade do vácuo',
    kind: 'linha-derivada',
    reviewState: 'consolidacao',
    independent: false,
    parentId: 'instabilidade-vazio',
    category: 'vazio',
    filters: ['vazio', 'cosmologia', 'tempo'],
    color: '#c99bff',
    glow: 'rgba(201, 155, 255, 0.44)',
    position: { x: 84, y: 82 },
    summary: 'Registra o desdobramento cosmológico da T-02 e permanece vinculado a ela até formular mecanismo e observáveis próprios.',
    proposal: 'Uma segunda ficha só se justifica se estudar especificamente a geometria, evolução e observáveis no interior de uma bolha de vácuo.',
    questions: [
      'Qual pergunta desta linha não é respondida pela T-02?',
      'Que geometria descreve a região após a nucleação?',
      'Quais observáveis pertencem ao interior da bolha?',
    ],
    concepts: ['vácuo metastável', 'bolha de vácuo', 'cosmogênese', 'geometria', 'linha derivada'],
    nextSteps: [
      'Manter a linha vinculada à T-02 no catálogo.',
      'Definir uma pergunta independente antes de separá-la.',
      'Reutilizar o modelo de campo e a taxa de nucleação da linha principal.',
    ],
    referenceIds: ['coleman-deluccia', 'hiller-vacuum'],
    claimLinks: [
      { id: 'contexto-bolhas', label: 'Base teórica herdada', field: 'review.known', referenceIds: ['coleman-deluccia', 'hiller-vacuum'] },
    ],
    objections: [
      { id: 'duplicacao-t02', title: 'A linha ainda se sobrepõe à T-02', status: 'incorporada', response: 'A ficha permanece declaradamente derivada e herda campo, potencial e taxa de nucleação da linha principal.' },
      { id: 'resultado-proprio', title: 'Ainda não existe consequência geométrica própria', status: 'aberta', response: 'A independência depende de derivar evolução ou observável que não seja apenas repetição do decaimento do vácuo.' },
    ],
    decisionBoundary: {
      revise: 'Revisar a separação se a pergunta puder ser respondida integralmente dentro da T-02.',
      abandon: 'Reintegrar e encerrar a ficha independente se nenhum resultado geométrico ou observacional próprio for derivado.',
    },
    review: {
      assessment: 'Não constitui uma teoria independente',
      known: 'Transições de fase e cosmologia de bolhas são problemas reais quando o modelo é especificado.',
      focus: 'Distinguir estabilidade do vácuo da evolução geométrica de uma bolha após a nucleação.',
      limit: 'Flutuação, tunelamento, inflação e novo Big Bang não são sinônimos; a formulação atual se sobrepõe à T-02.',
      test: 'Usar o mesmo campo e potencial da T-02 e derivar uma consequência geométrica ou observacional própria.',
    },
    revisions: [initialRevision('A revisão individual formaliza a dependência da T-02 e o critério objetivo para manter ou reintegrar esta ficha.')],
  },
  {
    id: 'zero-epsilon',
    slug: 'zero-epsilon',
    code: 'T-09',
    title: 'Zero vs. Epsilon',
    shortTitle: 'Zero vs epsilon',
    subtitle: 'Uma heurística de ação com orçamento de risco',
    kind: 'heuristica',
    reviewState: 'consolidacao',
    independent: true,
    category: 'existencial',
    filters: ['existencial', 'metodo', 'tempo'],
    color: '#f7df87',
    glow: 'rgba(247, 223, 135, 0.42)',
    position: { x: 18, y: 86 },
    summary: 'Transforma a diferença entre não tentar e tentar em uma regra de decisão que inclui custo, reversibilidade, aprendizado e condição de parada.',
    proposal: 'Uma ação com chance positiva pode ser racional quando seu benefício esperado e seu valor de informação superam riscos, custos e alternativas.',
    questions: [
      'Qual é o teto de perda aceitável?',
      'A tentativa é reversível e produz aprendizado?',
      'Que evidência determina continuar, pausar ou abandonar?',
    ],
    concepts: ['utilidade esperada', 'risco', 'reversibilidade', 'valor de informação', 'condição de parada'],
    nextSteps: [
      'Definir benefício, dano, custo e melhor alternativa.',
      'Registrar previsões antes das decisões.',
      'Revisar a calibração após uma amostra suficiente.',
    ],
    referenceIds: [],
    claimLinks: [],
    objections: [
      { id: 'chance-nao-basta', title: 'Chance positiva não basta para justificar uma tentativa', status: 'incorporada', response: 'A heurística agora exige benefício, dano, custo de oportunidade, reversibilidade e condição de parada.' },
      { id: 'calibracao-ausente', title: 'A regra ainda não possui uma série de decisões calibrada', status: 'aberta', response: 'Previsões precisam ser registradas antes da ação e comparadas com resultados em uma amostra suficiente.' },
    ],
    decisionBoundary: {
      revise: 'Revisar os limiares quando decisões registradas mostrarem subestimação recorrente de dano, custo ou alternativas.',
      abandon: 'Abandonar a regra em domínios nos quais tentativas não sejam reversíveis, o teto de perda não possa ser imposto ou o aprendizado não seja mensurável.',
    },
    review: {
      assessment: 'Boa heurística quando inclui custos',
      known: 'Probabilidade positiva não basta para tornar uma ação racional; valor, dano e custo de oportunidade também importam.',
      focus: 'Usar epsilon como gatilho para tentativas reversíveis, limitadas e informativas.',
      limit: 'A regra não é uma lei psicológica nem uma teoria cosmológica, e pode recomendar ações ruins quando o custo é alto.',
      test: 'Manter um registro prévio de decisões, previsões, custos e resultados para revisar a calibração.',
    },
    revisions: [initialRevision('O histórico individual transforma a máxima original em uma heurística limitada por risco, reversibilidade e calibração.')],
  },
  {
    id: 'horizonte-sentidos',
    slug: 'horizonte-sentidos',
    code: 'T-10',
    title: 'Maldição do Horizonte e Extensão dos Sentidos',
    shortTitle: 'Horizonte dos sentidos',
    subtitle: 'Dados, instrumentos e software como programa de investigação',
    kind: 'programa-pratico',
    reviewState: 'execucao',
    independent: true,
    category: 'informacao',
    filters: ['informacao', 'cosmologia', 'existencial'],
    color: '#8fd8ff',
    glow: 'rgba(143, 216, 255, 0.42)',
    position: { x: 22, y: 55 },
    summary: 'Converte curiosidade cosmológica em projetos reproduzíveis com catálogos, espectros, curvas de luz, simulações e análise de incertezas.',
    proposal: 'Instrumentos e modelos estendem a capacidade de medir o universo quando seus limites, dados e suposições permanecem explícitos.',
    questions: [
      'Qual pergunta do acervo pode virar um projeto de dados em até doze semanas?',
      'Como separar observação, transformação do sinal e inferência do modelo?',
      'Que resultado conhecido deve ser reproduzido antes de procurar algo novo?',
    ],
    concepts: ['astrofísica computacional', 'dados públicos', 'reprodutibilidade', 'incerteza', 'instrumentação'],
    nextSteps: [
      'Escolher um catálogo público e uma pergunta restrita.',
      'Reproduzir um resultado conhecido com incertezas documentadas.',
      'Publicar código, dados derivados e limitações do pipeline.',
    ],
    referenceIds: ['nasa-exoplanet-archive', 'nasa-drake'],
    claimLinks: [
      { id: 'contexto-dados-publicos', label: 'Infraestrutura observacional', field: 'review.known', referenceIds: ['nasa-exoplanet-archive'] },
    ],
    objections: [
      { id: 'simulacao-observacao', title: 'Simulação e instrumento podem ser confundidos com observação', status: 'respondida', response: 'A linha separa aquisição, transformação do sinal, modelo e inferência, e exige limites explícitos.' },
      { id: 'projeto-ausente', title: 'O primeiro projeto reproduzível ainda precisa ser concluído', status: 'aberta', response: 'A execução começa por um catálogo público, uma pergunta restrita e a reprodução de um resultado conhecido.' },
    ],
    decisionBoundary: {
      revise: 'Revisar o projeto quando a procedência, as incertezas ou a reprodução do resultado de controle falharem.',
      abandon: 'Encerrar um pipeline específico se ele não reproduzir o controle após auditoria de dados, transformação e implementação.',
    },
    review: {
      assessment: 'A linha mais executável agora',
      known: 'A astronomia moderna converte sinais em dados, modelos e inferências verificáveis.',
      focus: 'Usar programação como extensão instrumental e transformar perguntas amplas em projetos reproduzíveis.',
      limit: 'Simulação não é observação e instrumento não remove horizonte causal nem garante interpretação correta.',
      test: 'Concluir um projeto curto que adquira dados, reproduza um resultado publicado e estime incertezas.',
    },
    revisions: [initialRevision('A revisão individual explicita proveniência, controle reproduzível e critérios para interromper um pipeline.')],
  },
];

const typeById = new Map(THEORY_TYPES.map((item) => [item.id, item]));
const reviewStateById = new Map(THEORY_REVIEW_STATES.map((item) => [item.id, item]));
const objectionStateById = new Map(THEORY_OBJECTION_STATES.map((item) => [item.id, item]));

function resolveClaimText(theory, field) {
  if (field === 'summary') return theory.summary;
  if (field === 'proposal') return theory.proposal;
  if (field.startsWith('review.')) return theory.review[field.slice('review.'.length)] || '';
  return '';
}

function freezeTheory(theory) {
  const type = typeById.get(theory.kind);
  const reviewState = reviewStateById.get(theory.reviewState);
  const { claimLinks, revisions, ...publicTheory } = theory;
  const revisionHistory = Object.freeze(revisions.map((revision) => Object.freeze({ ...revision })));
  const currentRevision = revisionHistory.at(-1);
  const connections = THEORY_RELATIONS
    .filter((relation) => relation.sourceId === theory.id || relation.targetId === theory.id)
    .map((relation) => (relation.sourceId === theory.id ? relation.targetId : relation.sourceId));

  return Object.freeze({
    ...publicTheory,
    typeLabel: type?.label || theory.kind,
    typeShortLabel: type?.shortLabel || type?.label || theory.kind,
    reviewStateLabel: reviewState?.label || theory.reviewState,
    filters: Object.freeze([...theory.filters]),
    position: Object.freeze({ ...theory.position }),
    questions: Object.freeze([...theory.questions]),
    concepts: Object.freeze([...theory.concepts]),
    nextSteps: Object.freeze([...theory.nextSteps]),
    connections: Object.freeze(connections),
    referenceIds: Object.freeze([...theory.referenceIds]),
    claims: Object.freeze(claimLinks.map((claim) => Object.freeze({
      ...claim,
      text: resolveClaimText(theory, claim.field),
      referenceIds: Object.freeze([...claim.referenceIds]),
    }))),
    objections: Object.freeze(theory.objections.map((objection) => Object.freeze({
      ...objection,
      statusLabel: objectionStateById.get(objection.status)?.label || objection.status,
    }))),
    decisionBoundary: Object.freeze({ ...theory.decisionBoundary }),
    rubric: THEORY_RUBRICS[theory.kind] || Object.freeze([]),
    review: Object.freeze({ ...theory.review }),
    revisionHistory,
    revision: currentRevision,
    centralIdea: theory.summary,
    centralQuestion: theory.questions[0] || '',
    theoreticalTension: theory.review.limit,
  });
}

export const THEORIES = Object.freeze(rawTheories.map(freezeTheory));
