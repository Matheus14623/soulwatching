# Ajuste — Visão estrutural

Este pacote contém apenas os arquivos alterados para deixar o botão **“Ativar visão estrutural”** realmente visual.

## Arquivos incluídos

```text
assets/css/styles.css
assets/js/observer.js
assets/images/cosmic-web.svg
AJUSTE_VISAO_ESTRUTURAL.diff
```

## Como aplicar

Extraia este pacote diretamente na raiz do projeto `matheus-observatorio-ideias` e aceite substituir os arquivos existentes.

Depois rode:

```bash
npm run verify
npm run dev
```

## O que muda

- O modo estrutural agora ativa uma teia cósmica de fundo.
- Foi adicionado um SVG leve de cosmic web.
- O canvas foi refeito para desenhar filamentos, nós gravitacionais e sinais luminosos em movimento.
- A imagem normal da chuva escurece mais quando a visão estrutural está ativa.
- O status muda para “Teia cósmica estrutural”.
- Em dispositivos com redução de movimento, o SVG estático ainda aparece mesmo sem animação.
