const rawLearningPaths = [
  {
    id: 'universo-distante',
    slug: 'universo-distante',
    title: 'Observar o Universo distante',
    summary: 'Da observação telescópica à medida de distâncias e ao cuidado com aquilo que uma interface pode realmente mostrar.',
    audience: 'Para começar pela astronomia observacional',
    durationMinutes: 18,
    accent: 'cyan',
    steps: [
      { type: 'figure', id: 'galileo-galilei', reason: 'O telescópio ampliou o alcance da observação e também tornou explícita a dependência de instrumentos.' },
      { type: 'figure', id: 'henrietta-swan-leavitt', reason: 'A relação período–luminosidade das Cefeidas abriu um método para estimar distâncias.' },
      { type: 'figure', id: 'cecilia-payne-gaposchkin', reason: 'A espectroscopia revelou composição e condições físicas estelares além da aparência visual.' },
      { type: 'theory', id: 'horizonte-sentidos', reason: 'A linha pergunta como limites sensoriais e instrumentais moldam o que conseguimos inferir.' },
      { type: 'experiment', id: 'visao-estelar', reason: 'A visualização encerra a rota distinguindo movimento estelar real de uma representação acelerada.' },
    ],
  },
  {
    id: 'tempo-gravidade-causalidade',
    slug: 'tempo-gravidade-causalidade',
    title: 'Tempo, gravidade e causalidade',
    summary: 'Uma rota entre relatividade, simetrias, horizontes e as restrições causais representadas por um cone de luz.',
    audience: 'Para conectar física e modelos de espaço-tempo',
    durationMinutes: 22,
    accent: 'purple',
    steps: [
      { type: 'figure', id: 'albert-einstein', reason: 'A relatividade reorganiza as relações entre medidas de espaço, tempo, energia e gravidade.' },
      { type: 'figure', id: 'emmy-noether', reason: 'O vínculo entre simetrias e leis de conservação oferece uma linguagem estrutural para a física.' },
      { type: 'theory', id: 'universo-buraco-negro', reason: 'A hipótese é lida como proposta especulativa, com suas dependências e limites expostos.' },
      { type: 'theory', id: 'observacao-nao-linear', reason: 'A entrada amplia a discussão sobre referência, observação e descrição sem confundi-las com leis estabelecidas.' },
      { type: 'experiment', id: 'cone-de-luz', reason: 'O simulador separa mudanças de coordenadas de invariantes causais em um caso controlado.' },
    ],
  },
  {
    id: 'vazio-nao-e-nada',
    slug: 'vazio-nao-e-nada',
    title: 'Por que o vazio não é simplesmente “nada”',
    summary: 'Distingue usos físicos e filosóficos do termo vazio antes de aproximar hipóteses próprias e cosmologia teórica.',
    audience: 'Para desfazer uma ambiguidade recorrente',
    durationMinutes: 20,
    accent: 'gold',
    steps: [
      { type: 'theory', id: 'instabilidade-vazio', reason: 'A teoria apresenta a pergunta central e declara em que sentido emprega “vazio”.' },
      { type: 'theory', id: 'vacuo-genese', reason: 'A derivação permite comparar continuidade conceitual, mudança de escopo e lacunas próprias.' },
      { type: 'figure', id: 'stephen-hawking', reason: 'A física de campos em espaço-tempo curvo mostra por que “vácuo” depende de estrutura teórica precisa.' },
      { type: 'theory', id: 'zero-epsilon', reason: 'A distinção entre ausência e quantidade pequena abre uma ponte metodológica, não uma equivalência física.' },
      { type: 'experiment', id: 'zero-epsilon', reason: 'O laboratório explicita como uma diferença pequena pode ser tratada sem converter analogia em prova.' },
    ],
  },
  {
    id: 'perder-para-evidencia',
    slug: 'perder-para-evidencia',
    title: 'Aprender a perder para a evidência',
    summary: 'Métodos, objeções e critérios de abandono para tratar uma ideia como investigação, não como identidade pessoal.',
    audience: 'Para começar pelo método crítico',
    durationMinutes: 24,
    accent: 'green',
    steps: [
      { type: 'figure', id: 'johannes-kepler', reason: 'O abandono de círculos perfeitos diante dos dados ilustra revisão de uma estrutura preferida.' },
      { type: 'figure', id: 'karl-popper', reason: 'A falseabilidade ajuda a perguntar o que contaria contra uma proposta.' },
      { type: 'figure', id: 'imre-lakatos', reason: 'Programas de pesquisa permitem avaliar evolução, ajustes protetores e ganho explicativo ao longo do tempo.' },
      { type: 'theory', id: 'ciclagem-eterna', reason: 'A entrada funciona como caso para aplicar objeções, dependências e critérios explícitos de revisão.' },
      { type: 'experiment', id: 'recorrencia-finita', reason: 'O modelo mostra como uma conclusão rigorosa pode ser menor do que a interpretação intuitiva inicial.' },
    ],
  },
];

function freezePath(path) {
  return Object.freeze({
    ...path,
    steps: Object.freeze(path.steps.map((step) => Object.freeze({ ...step }))),
  });
}

export const LEARNING_PATHS = Object.freeze(rawLearningPaths.map(freezePath));

export function findLearningPath(id, fallback = null) {
  return LEARNING_PATHS.find((path) => path.id === id || path.slug === id) || fallback;
}
