# Integração e escala das linhas de investigação

As entradas públicas do observatório são mantidas em `assets/data/theories.js`. Esse arquivo é a fonte compartilhada por três experiências:

- a home mostra um recorte de seis entradas;
- `Teorias/teorias.html` oferece busca, filtros e dossiês;
- `Mapa/mapa.html` calcula nós e relações conceituais.

Nem toda entrada é uma teoria física. O modelo distingue hipóteses científicas, estudos teóricos, estruturas conceituais, linhas derivadas, heurísticas e programas práticos. Essa classificação é parte do conteúdo público e deve permanecer visível.

Os materiais brutos da pasta `Teorias/` são fontes editoriais privadas. Eles não são importados pela interface, não aparecem no dossiê e não entram no artefato de publicação.

## Arquitetura de dados

| Arquivo | Responsabilidade |
| --- | --- |
| `assets/data/theories.js` | Conteúdo público, classificações, rubricas, objeções, revisões e registro tipado de relações. |
| `assets/data/theory-references.js` | Registro único das referências externas exibidas nos dossiês. |
| `assets/data/research-tracks.js` | Radar de ideias que ainda não justificam uma entrada independente. |
| `assets/js/theory-model.js` | Busca por ID/slug, relações simétricas e regras compartilhadas do domínio. |
| `assets/js/theory-figure-model.js` | Relações inversas entre linhas autorais e perfis de Grandes Nomes. |
| `scripts/theory-sources.mjs` | Mapeamento privado entre uma entrada e seu material editorial de origem. |
| `scripts/verify.mjs` | Validação do schema, referências, rotas, privacidade e HTML. |

Home, arquivo e mapa possuem controladores próprios, mas não devem duplicar as regras de localização ou de relação entre entradas.

## Contrato público de uma entrada

| Campo | Função |
| --- | --- |
| `id` | Identificador estável usado nas relações internas. |
| `slug` | Identificador legível usado em `?teoria=...`. Deve ser único. |
| `code` | Código editorial curto, como `T-11`. |
| `title` e `shortTitle` | Título completo e rótulo compacto do mapa. |
| `subtitle` | Uma linha que delimita o problema. |
| `kind` | Natureza da entrada, definida em `THEORY_TYPES`. |
| `reviewState` | Estado do trabalho, definido em `THEORY_REVIEW_STATES`. |
| `independent` | Indica se a entrada representa uma linha própria. |
| `parentId` | Linha principal de uma derivação, quando aplicável. |
| `category` | Eixo principal; deve existir em `THEORY_FILTERS`. |
| `filters` | Eixos relacionados usados na busca e no mapa. |
| `color` e `glow` | Acentos visuais dos cards e nós. |
| `position` | Coordenadas percentuais `{ x, y }` do mapa desktop. |
| `summary` | Ideia central em linguagem pública e concisa. |
| `proposal` | Proposição da entrada, sem apresentá-la como fato estabelecido. |
| `questions` | Perguntas abertas que orientam o desenvolvimento. |
| `concepts` | Termos indexáveis pela busca e pelos filtros. |
| `nextSteps` | Ações concretas de formalização, análise ou execução. |
| `referenceIds` | Chaves de referências cadastradas em `theory-references.js`. |
| `claimLinks` | Liga afirmações específicas a referências e ao campo público que sustentam. |
| `objections` | Objeções identificadas, estado editorial e resposta registrada. |
| `decisionBoundary` | Condições explícitas para revisar ou abandonar a formulação. |
| `review` | Leitura em quatro camadas: `known`, `focus`, `limit` e `test`, além de `assessment`. |
| `revisions` | Histórico individual de versões, datas e mudanças. |

As relações entre linhas não são duplicadas em cada registro. `THEORY_RELATIONS` mantém pares `sourceId`/`targetId`, tipo e justificativa em uma única fonte. Na exportação, cada entrada recebe `connections` derivado desse registro, além de `typeLabel`, `typeShortLabel`, `reviewStateLabel`, `claims`, `rubric`, `revisionHistory`, `revision`, `centralIdea`, `centralQuestion` e `theoreticalTension`.

## Leitura pública em quatro camadas

Todos os dossiês seguem a mesma ordem:

1. **Contexto conhecido:** o que pertence à literatura, às observações ou a resultados estabelecidos.
2. **Recorte em investigação:** a pergunta ou proposição específica da entrada.
3. **Limite atual:** onde a formulação é incompleta, especulativa ou incompatível com um resultado conhecido.
4. **Caminho verificável:** cálculo, dado, simulação ou critério capaz de fortalecer, revisar ou abandonar a proposta.

Essa estrutura substitui percentuais de maturidade. O sistema não usa números sem rubrica para sugerir credibilidade científica.

## Exemplo mínimo

```js
{
  id: 'nova-linha',
  slug: 'nova-linha',
  code: 'T-11',
  title: 'Nova Linha',
  shortTitle: 'Nova linha',
  subtitle: 'O problema em uma linha',
  kind: 'hipotese-cientifica',
  reviewState: 'formalizacao',
  independent: true,
  category: 'cosmologia',
  filters: ['cosmologia', 'tempo'],
  color: '#72ecff',
  glow: 'rgba(114, 236, 255, 0.58)',
  position: { x: 50, y: 50 },
  summary: 'Síntese pública da investigação.',
  proposal: 'Formulação provisória que ainda precisa ser testada.',
  questions: ['Qual pergunta precisa permanecer aberta?'],
  concepts: ['conceito principal'],
  nextSteps: ['Definir um observável e um critério de revisão.'],
  referenceIds: ['hogg-distance'],
  claimLinks: [
    { id: 'base', label: 'Base científica', field: 'review.known', referenceIds: ['hogg-distance'] },
  ],
  objections: [
    { id: 'objecao-principal', title: 'Qual é a objeção mais forte?', status: 'aberta', response: 'Resposta provisória e verificável.' },
  ],
  decisionBoundary: {
    revise: 'Condição que exige reformular a linha.',
    abandon: 'Resultado que encerra esta formulação específica.',
  },
  review: {
    assessment: 'Formalização necessária',
    known: 'Base científica relevante para a pergunta.',
    focus: 'Recorte específico que será investigado.',
    limit: 'Principal limitação ou objeção atual.',
    test: 'Resultado capaz de revisar a proposta.',
  },
  revisions: [
    { version: '1.0', reviewedAt: '2026-07-22', label: 'Primeiro registro', changeSummary: 'Escopo inicial documentado.' },
  ],
}
```

Uma relação tipada é cadastrada separadamente:

```js
{
  sourceId: 'nova-linha',
  targetId: 'observacao-nao-linear',
  type: 'contexto-metodologico',
  justification: 'Explica a aproximação sem sugerir validação ou equivalência.',
}
```

## Como adicionar ou revisar uma entrada

1. Preserve o material bruto fora do conteúdo público.
2. Registre o caminho somente em `scripts/theory-sources.mjs`.
3. Escreva a síntese pública em `assets/data/theories.js` com linguagem impessoal e verificável.
4. Classifique a natureza e o estado do trabalho antes de escolher categoria ou cor.
5. Preencha as quatro camadas da leitura crítica.
6. Cadastre referências em `assets/data/theory-references.js` e use apenas seus IDs na entrada.
7. Registre objeções, condição de revisão, condição de abandono e ao menos uma revisão individual.
8. Cadastre relações somente em `THEORY_RELATIONS`, escolhendo um tipo existente e uma justificativa que declare o limite da aproximação.
9. Defina `parentId` quando a entrada for uma derivação; não multiplique fichas para repetir o mesmo núcleo.
10. Preserve IDs e slugs existentes para não quebrar URLs.
11. Execute a verificação e revise home, arquivo, comparação, dossiê e mapa em desktop e mobile.

## Filtros e busca

O arquivo combina cinco dimensões:

- texto livre;
- eixo temático;
- natureza da entrada;
- estado do trabalho;
- conceito.

A busca cobre título, resumo, proposição, perguntas, limites, testes, referências e linhas relacionadas. Os selects são derivados dos registros centrais, portanto novas opções aparecem automaticamente.

## URLs diretas

O parâmetro `teoria` continua usando o `slug`:

```text
Teorias/teorias.html?teoria=nova-linha
Mapa/mapa.html?teoria=nova-linha
```

Entradas fundidas ou reclassificadas devem preservar seus slugs enquanto houver links externos apontando para elas.

## Radar de desenvolvimento

`assets/data/research-tracks.js` recebe ensaios, simuladores, trilhas de estudo e projetos quantitativos que ainda não justificam uma nova ficha. O radar evita transformar todo pensamento promissor em “teoria” e permite promover uma linha no futuro sem perder seu histórico.

## Privacidade e publicação

`npm run build` valida o projeto e gera `dist/` por uma lista explícita de caminhos públicos. O artefato inclui somente páginas, imagens, estilos, scripts e dados necessários à interface.

Não entram em `dist/`:

- `docs/`;
- `ia/`;
- `scripts/`;
- arquivos `.txt` da pasta `Teorias/`;
- pareceres, PDFs, builders ou renders de controle;
- caminhos de fontes editoriais.

Comentários HTML, CSS e JavaScript também são proibidos nos arquivos públicos pela verificação. Orientações técnicas pertencem à documentação; ressalvas relevantes ao visitante devem ser texto público finalizado.

## Critério editorial

- Distinguir fato estabelecido, proposta, metáfora e limite.
- Não apresentar referência como confirmação automática da entrada.
- Não usar elogios, validações genéricas ou bastidores de produção como conteúdo público.
- Não expor conversas, dados pessoais ou caminhos internos.
- Publicar datas, versões, fontes e métricas somente quando forem verificáveis.
- Tratar uma relação do mapa como afinidade conceitual, não causalidade ou evidência.
