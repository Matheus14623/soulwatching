# Relatório do Projeto — Matheus Camargo de Alencar, O Observador Cósmico

## 1. Análise do HTML original

O HTML original era uma experiência single-page chamada **“O Observador | 11º Andar”**, construída com Tailwind via CDN, Tone.js via CDN, CSS inline, JavaScript inline e várias URLs `blob:` geradas por ambiente externo. A experiência tinha uma direção visual forte: fundo escuro, tipografia serifada para o tom poético, fonte monoespaçada para dados/sistema, acentos em ciano, roxo e amarelo, e atmosfera de observatório urbano-cósmico.

### Principais seções preservadas

- Hero com chuva, janela do 11º andar e toggle “Ativar visão estrutural”.
- Modo observador com camada de estrutura, canvas de partículas e pontos de dados.
- Seção “A Matéria / A Mente”, contrapondo cotidiano prático e abstração cósmica.
- Bússola filosófica com Estoicismo, Niilismo Otimista e Absurdismo.
- Seção de ressonância com cordas interativas e notas de violão.
- Conclusão com FUVEST/USP e busca pela resposta.

### Problemas encontrados

- Projeto inteiro concentrado em um único arquivo.
- CSS e JavaScript inline, difíceis de manter.
- Dependência de Tailwind CDN e Tone.js CDN.
- URLs `blob:` quebráveis fora do ambiente original.
- Scripts injetados de pré-processamento de imagem, irrelevantes para produção.
- Partículas com loop `1000 x 1000`, pesado em telas grandes.
- Ausência de metadados SEO completos.
- Ausência de estrutura de projeto, README, instruções e verificação.
- Formulário de contato inexistente.
- Acessibilidade limitada em alguns controles interativos.

### O que foi preservado

- Conceito do observador, janela, chuva e visão estrutural.
- Paleta escura com ciano/roxo/amarelo.
- A tensão “matéria versus mente”.
- Bússola filosófica.
- Canvas de partículas como teia/sistema.
- Cordas interativas e áudio opcional.
- Imagens fornecidas pelo usuário, agora convertidas para WebP e organizadas em `assets/images`.

## 2. Análise do documento de personalidade

O documento define Matheus Camargo de Alencar como um jovem desenvolvedor full-stack cuja identidade combina programação, pensamento sistêmico, filosofia existencial e fascínio por astronomia. A mensagem central é a de alguém que vive a fricção entre o corpo em rotina prática e uma mente orientada ao macro: galáxias, entropia, espaço-tempo e “backend” do universo.

### Núcleo de identidade

- Desenvolvedor Full-Stack.
- Arquiteto de sistemas.
- Observador silencioso, analítico e cósmico.
- Pensamento em escala macro.
- Busca por conhecimento fundamental, não por fama.

### Posicionamento

O site deve funcionar como um manifesto interativo, não como portfólio corporativo genérico. A marca pessoal de Matheus combina código, filosofia e cosmologia como uma linguagem única.

### Tom de voz

- Profundo, poético e analítico.
- Técnico quando fala de sistemas.
- Filosófico quando fala de dor, sentido e escala.
- Sem promessas infladas ou fatos biográficos não fornecidos.

### Conteúdos estratégicos usados

- Universo como sistema distribuído e assíncrono.
- Física como código-fonte.
- Tripé filosófico: Estoicismo, Niilismo Otimista e Absurdismo.
- FUVEST/USP como jornada para ferramentas matemáticas.
- “Input > Output” como métrica existencial.
- Solidão intelectual e documentação como tentativa de preservar pensamento.

## 3. Estratégia final

O projeto final virou uma landing page-manifesto estática, modular e pronta para deploy. A decisão técnica foi usar **HTML, CSS e JavaScript vanilla** para manter simplicidade, performance, portabilidade e facilidade de edição. Não há framework porque a experiência não exige roteamento, estado complexo ou build obrigatório.

### Estrutura de experiência

1. **Hero:** apresentação da marca e modo “visão estrutural”.
2. **Manifesto:** tensão entre matéria e mente.
3. **Sistema:** áreas de identidade/atuação e algoritmo de progressão.
4. **Bússola Filosófica:** interação com os três paradigmas.
5. **Backend do Universo:** conceitos cósmicos convertidos em cartões visuais.
6. **Ressonância:** cordas interativas com áudio opcional.
7. **Jornada:** próximos passos e princípio de constância.
8. **Contato:** formulário funcional sem inventar e-mail público.

### Arquitetura técnica

- `index.html`: marcação semântica e SEO.
- `assets/css/styles.css`: sistema visual completo.
- `assets/js/main.js`: bootstrap da aplicação.
- `assets/js/navigation.js`: menu, header, links ativos e voltar ao topo.
- `assets/js/observer.js`: modo observador e partículas.
- `assets/js/philosophy.js`: bússola filosófica.
- `assets/js/resonance.js`: cordas e áudio via Web Audio API.
- `assets/js/contact.js`: validação e fallback de contato.
- `assets/js/config.js`: configuração de e-mail público.
- `scripts/serve.mjs`: servidor local sem dependências.
- `scripts/verify.mjs`: verificação de integridade.

## 4. Árvore de arquivos

```text
matheus-observador-cosmico/
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── icons/
│   │   └── favicon.svg
│   ├── images/
│   │   ├── calabi-yau-wireframe.webp
│   │   ├── celta-2010.webp
│   │   ├── cosmic-scale.webp
│   │   ├── ford-focus.webp
│   │   ├── og-observador.jpg
│   │   ├── rain-window.webp
│   │   ├── sisyphus-absurdism.webp
│   │   └── stoic-rock.webp
│   └── js/
│       ├── config.js
│       ├── contact.js
│       ├── main.js
│       ├── navigation.js
│       ├── observer.js
│       ├── philosophy.js
│       ├── resonance.js
│       └── utils.js
├── docs/
│   └── PROJECT_REPORT.md
├── index.html
├── package.json
├── README.md
├── robots.txt
└── scripts/
    ├── serve.mjs
    └── verify.mjs
```

## 5. Como rodar

```bash
cd matheus-observador-cosmico
npm run dev
```

Abra `http://localhost:5173`.

## 6. Como testar

```bash
npm run verify
```

Também foram executadas verificações de sintaxe com `node --check` nos módulos JavaScript.

## 7. Como fazer deploy

O projeto é estático e não precisa de build. Publique a raiz do projeto em qualquer hospedagem estática.

- Netlify: publish directory = raiz do projeto; build command vazio.
- Vercel: configuração estática sem build.
- GitHub Pages: publicar a raiz.
- Servidor próprio: enviar a pasta mantendo a estrutura.

## 8. Melhorias realizadas

- Separação de HTML, CSS e JS.
- Remoção de Tailwind CDN, Tone.js e scripts injetados.
- Substituição de URLs `blob:` por assets locais.
- Otimização de imagens para WebP.
- Criação de OG image e favicon SVG.
- Modo observador preservado e otimizado.
- Partículas com contagem adaptativa, animação pausada fora da viewport e respeito a `prefers-reduced-motion`.
- Cordas interativas reescritas com Web Audio API nativa.
- Navegação mobile funcional.
- Links ativos por seção.
- Formulário de contato funcional com validação e fallback.
- Metadados SEO e Open Graph.
- Sem placeholders bloqueantes.
- Verificação automatizada.

## 9. Assumptions / decisões controladas

- Nenhum e-mail público foi fornecido; por isso o formulário copia/baixa a mensagem. O e-mail pode ser configurado em `assets/js/config.js`.
- Os carros Celta e Focus foram preservados porque estavam no HTML original e nas imagens fornecidas, mas não foram tratados como biografia confirmada pelo documento de personalidade.
- A idade de Matheus não foi destacada no site para evitar conteúdo temporalmente frágil.
- O site foi mantido em português, pois o projeto original e o documento estão em português.
- Não foram adicionados depoimentos, métricas comerciais ou links sociais por falta de dados fornecidos.

## 10. Checklist de verificação

- [x] Projeto roda localmente com `npm run dev`.
- [x] `npm run verify` passa.
- [x] HTML sem URLs `blob:`.
- [x] Imagens locais existem e têm alt text quando informativas.
- [x] Menu mobile funciona.
- [x] Smooth scroll ativo.
- [x] Toggle de visão estrutural funciona.
- [x] Bússola filosófica funciona com clique e teclado.
- [x] Cordas visuais funcionam.
- [x] Áudio só inicia após consentimento.
- [x] Formulário valida campos e tem fallback sem e-mail público.
- [x] CSS responsivo para desktop, tablet e mobile.
- [x] Metadados SEO e Open Graph incluídos.
- [x] Código modular e editável.
