# Observatório de Ideias — Matheus Camargo

Site estático, responsivo e interativo criado como um **observatório de ideias**, não como página pessoal genérica. O projeto organiza teorias em desenvolvimento, hipóteses, mapa conceitual, estrutura editorial para artigos futuros e experimentos visuais ligados ao universo mental de Matheus Camargo.

## Como rodar localmente

```bash
npm run dev
```

Abra:

```text
http://localhost:5173
```

Também é possível usar qualquer servidor estático:

```bash
python3 -m http.server 5173
```

## Como verificar

```bash
npm run verify
```

O comando valida arquivos obrigatórios, referências locais, âncoras, remoção de URLs `blob:`, ausência de CDNs antigos de Tailwind/Tone.js e ausência de placeholders nos arquivos principais.

## Build

Não há build obrigatório. O comando abaixo roda a verificação para ambientes que esperam um script de build:

```bash
npm run build
```

irectory: .
```
## Estrutura

```text
matheus-observatorio-ideias/
├── assets/
│   ├── css/styles.css
│   ├── data/
│   │   └── theories.js
│   ├── icons/favicon.svg
│   ├── images/
│   │   ├── calabi-yau-wireframe.webp
│   │   ├── cosmic-scale.webp
│   │   ├── cosmic-web.svg
│   │   ├── github-profile.webp
│   │   ├── matheus-camargo.webp
│   │   ├── og-observatorio.jpg
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
│       ├── theories.js
│       ├── theory-lab.js
│       └── utils.js
├── docs/
│   └── INTEGRACAO_TEORIAS.md
├── Teorias/
│   ├── teorias.html
│   ├── teorias.css
│   ├── teorias.js
│   ├── # Cosmologia Lógica O Backend da Ex.md.txt
│   ├── Agora erabole e fale sobre esse tex.txt
│   ├── Novo(a) Documento de Texto.md.txt
│   ├── TEORIAS_ORIGINAIS.txt
│   └── backup gpt universo.txt
├── index.html
├── teorias.html
├── package.json
├── package-lock.json
├── robots.txt
├── scripts/
│   ├── serve.mjs
│   └── verify.mjs
├── vercel.json
└── README.md
```

## Principais recursos

- Hero com atmosfera cósmica, sistema orbital em CSS e modo de visão estrutural otimizado.
- Home como recorte/gateway das teorias, com CTA para `Teorias/teorias.html`.
- Dados de teorias centralizados em `assets/data/theories.js`, consumidos pela home e pela página dedicada.
- Página dedicada em `Teorias/` com `teorias.html`, `teorias.css` e `teorias.js`.
- Busca client-side por título, resumo, categoria, status, conceitos, perguntas e pontos de desenvolvimento.
- Filtros em trilha horizontal escalável para receber mais categorias sem quebrar o layout.
- Dossiê de teoria selecionada no desktop e detalhes expandidos no próprio card no mobile.
- Mapa de ideias em formato de constelação interativa.
- Estrutura editorial para artigos e ensaios futuros sem inventar publicações.
- Bússola filosófica interativa.
- Experimento de ressonância com canvas e áudio opcional via Web Audio API.
- Área de contato refinada no desktop como sistema de órbitas, preservando o empilhamento limpo no mobile.
- SEO, Open Graph, favicon e imagem social atualizados.

## Página dedicada de teorias

A página principal do arquivo agora está em `Teorias/teorias.html`. Ela carrega primeiro o CSS global (`../assets/css/styles.css`) e depois a camada específica da página (`./teorias.css`). A lógica da página fica em `./teorias.js`, que renderiza cards, filtros, busca e dossiê usando os dados compartilhados de `../assets/data/theories.js`.

O arquivo raiz `teorias.html` foi mantido apenas como redirecionamento de compatibilidade para evitar links antigos quebrados.

## Contato e presença profissional

A seção final reúne as coordenadas externas do observatório:

- E-mail: `Matheuscamargodealencar@gmail.com`
- Telefone: `11 91363-9989`
- LinkedIn: `https://www.linkedin.com/in/gomin/`
- GitHub: `https://github.com/Matheus14623`

O formulário utiliza `mailto:` e abre o cliente de e-mail com a mensagem organizada. Os dados ficam centralizados em `assets/js/config.js`.

## Observações de conteúdo

As teorias são apresentadas como hipóteses em desenvolvimento, não como verdades finais. O site evita depoimentos, métricas e publicações não comprovadas; os canais exibidos são apenas os fornecidos nesta atualização.
