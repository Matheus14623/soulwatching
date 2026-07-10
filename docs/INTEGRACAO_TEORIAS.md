# Integração e escala das teorias

A página dedicada de teorias foi reorganizada para o caminho `Teorias/teorias.html`, com CSS e JavaScript específicos no mesmo diretório:

```text
Teorias/
├── teorias.html
├── teorias.css
└── teorias.js
```

Os documentos originais da pasta `Teorias` continuam preservados como material bruto. A camada navegável usa dados centralizados em `assets/data/theories.js`, permitindo que a home mostre apenas um recorte enquanto a página dedicada apresenta o arquivo completo.

## Decisões de estrutura

- `assets/css/styles.css` mantém identidade global, tokens visuais, navegação, botões e componentes compartilhados.
- `Teorias/teorias.css` adiciona apenas a camada específica da página dedicada: hero do arquivo, busca, trilha de filtros, cards, dossiê e estados vazios.
- `Teorias/teorias.js` controla apenas busca, filtros, seleção de teoria, dossiê e detalhes mobile.
- `assets/js/theory-lab.js` continua atendendo a home e agora usa o mesmo arquivo de dados compartilhados.
- O arquivo raiz `teorias.html` redireciona para `Teorias/teorias.html` para evitar links antigos quebrados.

## Conteúdo

As teorias permanecem marcadas como hipóteses em desenvolvimento. A interface evita tratar as entradas como verdades finais e privilegia estado, pergunta, hipótese central, conceitos conectados e pontos que ainda precisam amadurecer.
