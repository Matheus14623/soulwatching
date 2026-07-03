# Ajuste V2 — Visão estrutural

Este pacote contém somente os arquivos necessários para corrigir o botão **“Ativar visão estrutural”**.

## O que este ajuste corrige

Na versão anterior, a teia dependia de uma camada dentro de `.hero-media`. Em algumas situações ela podia ficar visualmente escondida pela vinheta, pelo `mix-blend-mode`, por cache do navegador ou por não sobrescrever corretamente o CSS/JS publicado.

Nesta V2, a visão estrutural ganhou uma camada explícita acima da imagem de chuva e abaixo do conteúdo principal:

- teia cósmica estática via `assets/images/cosmic-web.svg`;
- canvas próprio criado por `observer.js`, com filamentos, nós e sinais luminosos;
- imagem da chuva mais escurecida no modo estrutural;
- status alterado para `Teia cósmica estrutural`;
- query string em `index.html` e `main.js` para reduzir problema de cache.

## Arquivos incluídos

```text
index.html
assets/css/styles.css
assets/js/main.js
assets/js/observer.js
assets/images/cosmic-web.svg
AJUSTE_VISAO_ESTRUTURAL_V2.diff
```

## Como aplicar

Extraia o ZIP diretamente na raiz do projeto `matheus-observatorio-ideias` e aceite substituir os arquivos existentes.

Exemplo:

```bash
cd matheus-observatorio-ideias
unzip -o /caminho/para/ajuste-visao-estrutural-v2.zip
npm run verify
npm run dev
```

Depois faça um refresh forçado no navegador:

- Windows/Linux: `Ctrl + F5`
- Mac: `Cmd + Shift + R`

## O que deve acontecer ao clicar

1. O texto muda para **“Desativar visão estrutural”**.
2. O status muda para **“Teia cósmica estrutural”**.
3. A imagem da chuva fica bem mais escura.
4. Aparece uma teia cósmica em larga escala no fundo.
5. Filamentos, nós luminosos e pequenos sinais começam a se mover pela malha.
