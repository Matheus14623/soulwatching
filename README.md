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

## Deploy na Vercel

O projeto é estático. A raiz do projeto é o diretório de publicação.

Configuração recomendada na Vercel:

```text
Framework Preset: Other
Build Command: vazio
Output Directory: .
```

O arquivo `vercel.json` já está incluído para orientar a Vercel a publicar a raiz sem build.

## Estrutura

```text
matheus-observatorio-ideias/
├── assets/
│   ├── css/styles.css
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
│   ├── PROJECT_REPORT.md
│   └── TEORIAS_ORIGINAIS.txt
├── index.html
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
- Seção de teorias alimentada por `assets/js/theories.js`.
- Busca, filtros, cards, status, progresso e painel de detalhes.
- Mapa de ideias em formato de constelação interativa.
- Estrutura editorial para artigos e ensaios futuros sem inventar publicações.
- Bússola filosófica interativa.
- Experimento de ressonância com canvas e áudio opcional via Web Audio API.
- Área de contato com foto, imagem de perfil técnico, e-mail, telefone, LinkedIn, GitHub e formulário com `mailto:`.
- SEO, Open Graph, favicon e imagem social atualizados.

## Contato e presença profissional

A seção final reúne as coordenadas externas do observatório:

- E-mail: `Matheuscamargodealencar@gmail.com`
- Telefone: `11 91363-9989`
- LinkedIn: `https://www.linkedin.com/in/gomin/`
- GitHub: `https://github.com/Matheus14623`

O formulário utiliza `mailto:` e abre o cliente de e-mail com a mensagem organizada. Os dados ficam centralizados em `assets/js/config.js`.

## Observações de conteúdo

As teorias são apresentadas como hipóteses em desenvolvimento, não como verdades finais. O site evita depoimentos, métricas e publicações não comprovadas; os canais exibidos são apenas os fornecidos nesta atualização.
