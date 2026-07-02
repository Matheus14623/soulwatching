# Matheus Camargo de Alencar — O Observador Cósmico

Projeto estático, responsivo e interativo criado a partir do HTML original **O Observador | 11º Andar** e do documento de personalidade de Matheus Camargo.

## Como rodar localmente

```bash
cd matheus-observador-cosmico
npm run dev
```

Abra `http://localhost:5173`.

Também é possível abrir com qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 5173
```

## Verificação

```bash
npm run verify
```

Esse comando valida a existência dos arquivos principais, referências locais, remoção de URLs `blob:`, remoção de placeholders e ausência dos CDNs antigos de Tailwind/Tone.js.

## Deploy

O projeto não precisa de build.

- **Netlify:** arraste a pasta do projeto ou conecte o repositório; diretório de publicação: raiz do projeto; build command: vazio.
- **Vercel:** importe como projeto estático; output directory: raiz; build command: vazio.
- **GitHub Pages:** publique a raiz do repositório ou a pasta em uma branch configurada para Pages.
- **Servidor próprio:** envie todos os arquivos mantendo a estrutura de pastas.

## Configuração de contato

Nenhum e-mail público foi fornecido. Por isso, o formulário gera/copia a mensagem por padrão. Para habilitar `mailto:`, edite:

```js
// assets/js/config.js
export const SITE_CONFIG = Object.freeze({
  contactEmail: 'seu-email-publico@dominio.com',
});
```

## Estrutura

```text
matheus-observador-cosmico/
├── assets/
│   ├── css/styles.css
│   ├── icons/favicon.svg
│   ├── images/*.webp
│   └── js/
│       ├── config.js
│       ├── contact.js
│       ├── main.js
│       ├── navigation.js
│       ├── observer.js
│       ├── philosophy.js
│       ├── resonance.js
│       └── utils.js
├── docs/PROJECT_REPORT.md
├── index.html
├── package.json
├── robots.txt
└── scripts/
    ├── serve.mjs
    └── verify.mjs
```

## Principais interações

- Menu responsivo com estado ativo.
- Modo “visão estrutural” no hero.
- Canvas de partículas inspirado na teia cósmica.
- Bússola filosófica interativa com controles acessíveis.
- Cordas visuais com áudio opcional via Web Audio API.
- Formulário de contato com validação e fallback sem inventar canais.
