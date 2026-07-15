# Integração e escala das teorias

As teorias públicas do observatório são mantidas em `assets/data/theories.js`. Esse arquivo é a fonte compartilhada por três experiências:

- a home mostra um recorte de seis cards;
- `Teorias/teorias.html` oferece busca, filtros e dossiês completos;
- `Mapa/mapa.html` calcula os nós e as relações conceituais.

Os textos originais da pasta `Teorias/` permanecem como material editorial bruto. Eles não são importados nem publicados automaticamente.

## Contrato de uma teoria

Cada entrada de `THEORIES` usa estes campos:

| Campo | Função |
| --- | --- |
| `id` | Identificador estável usado nas relações internas. |
| `slug` | Identificador legível usado em `?teoria=...`. Deve ser único. |
| `code` | Código editorial curto, como `T-11`. |
| `title` | Título completo do dossiê. |
| `shortTitle` | Rótulo compacto usado no mapa. |
| `subtitle` | Uma linha que delimita o problema. |
| `status` | Estado editorial exibido como sinal curto. |
| `phase` | Fase usada no filtro avançado. |
| `sourceFile` | Caminho relativo do material que originou a síntese. |
| `stage` | Nota editorial mais específica sobre maturidade. |
| `progress` | Número inteiro de `0` a `100`; indica maturação editorial, não validade científica. |
| `category` | Eixo principal; deve existir em `THEORY_FILTERS`. |
| `filters` | Um ou mais eixos relacionados. |
| `color` e `glow` | Acentos visuais usados nos cards e no mapa. |
| `position` | Coordenadas percentuais `{ x, y }` para o mapa desktop. |
| `summary` | Ideia central em linguagem pública e concisa. |
| `hypothesis` | Hipótese central, distinguindo proposta de fato estabelecido. |
| `questions` | Perguntas abertas que orientam o refinamento. |
| `concepts` | Termos indexáveis pela busca e pelo filtro de conceito. |
| `needs` | Tensões, limites e próximos passos editoriais. |
| `connections` | Lista de `id` de teorias relacionadas. |

Na exportação, cada teoria recebe também aliases imutáveis para consumo das interfaces: `centralIdea`, `centralQuestion`, `theoreticalTension`, `developmentNotes` e `updatedAt`.

## Exemplo mínimo

```js
{
  id: 'nova-hipotese',
  slug: 'nova-hipotese',
  code: 'T-11',
  title: 'Nova Hipótese',
  shortTitle: 'Nova hipótese',
  subtitle: 'O problema em uma linha',
  status: 'hipótese inicial',
  phase: 'hipótese inicial',
  sourceFile: 'Teorias/NOVA_FONTE.txt',
  stage: 'Síntese inicial aguardando objeções',
  progress: 25,
  category: 'cosmologia',
  filters: ['cosmologia', 'tempo'],
  color: '#72ecff',
  glow: 'rgba(114, 236, 255, 0.58)',
  position: { x: 50, y: 50 },
  summary: 'Síntese pública da ideia.',
  hypothesis: 'Formulação provisória da hipótese.',
  questions: ['Qual é a pergunta que precisa permanecer aberta?'],
  concepts: ['conceito principal'],
  needs: ['Qual limite ou objeção precisa ser trabalhado?'],
  connections: ['observacao-nao-linear'],
}
```

## Como adicionar uma teoria

1. Preserve o arquivo bruto em `Teorias/` e registre seu caminho em `sourceFile`.
2. Crie a síntese pública em `assets/data/theories.js` sem copiar automaticamente conversas ou rascunhos.
3. Use `id`, `slug` e `code` inéditos. Não renomeie os existentes sem planejar compatibilidade de URLs e relações.
4. Escolha `category` e `filters` entre os ids de `THEORY_FILTERS`; adicione um novo eixo ao catálogo antes de usá-lo.
5. Conecte apenas ids existentes. Relações podem ser declaradas por uma das pontas; o mapa remove duplicatas.
6. Posicione o nó entre `0` e `100` nos eixos `x` e `y` e revise sobreposições no desktop.
7. Execute `npm run verify` e teste home, arquivo e mapa em desktop e mobile.

## Filtros e busca

O arquivo combina cinco dimensões sem duplicar os dados:

- texto livre;
- categoria;
- fase;
- status;
- conceito.

A busca cobre título, resumo, hipótese, pergunta central, tensões, origem, conceitos e títulos relacionados. Os valores dos selects de fase, status e conceito são derivados do próprio conjunto de teorias, portanto novas entradas aparecem automaticamente.

## URLs diretas

O parâmetro `teoria` usa o `slug`:

```text
Teorias/teorias.html?teoria=nova-hipotese
Mapa/mapa.html?teoria=nova-hipotese
```

Se o slug não existir, a interface mantém uma seleção válida. A escolha do usuário é sincronizada com `history.replaceState`, sem exigir um roteador de SPA.

## Responsabilidades por arquivo

- `assets/data/theories.js`: schema e conteúdo público estruturado.
- `assets/js/theory-lab.js`: recorte de teorias da home.
- `Teorias/teorias.js`: filtros, busca, cards, dossiês e URLs diretas.
- `Mapa/mapa.js`: relações únicas, nós, filtros e detalhe contextual.
- `scripts/verify.mjs`: regras estruturais e integridade dos dados.

## Critério editorial

`progress` mede o quanto a entrada foi organizada editorialmente; não é nota de credibilidade. `status`, `phase` e `stage` devem deixar explícito quando algo é rascunho, metáfora, hipótese inicial ou linha em revisão. Publicações, datas, fontes externas e métricas só entram quando forem verificáveis.
