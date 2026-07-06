# Relatório do Projeto — Observatório de Ideias

## Direção aplicada

A versão anterior funcionava como uma experiência pessoal sobre “O Observador Cósmico”, mas ainda colocava Matheus como centro da página. A nova versão reorganiza o projeto como um observatório intelectual: um arquivo vivo de hipóteses, teorias, mapas, fragmentos e experimentos.

O foco passou a ser:

- ideias em desenvolvimento;
- teorias e hipóteses;
- conexões conceituais;
- artigos futuros sem conteúdo inventado;
- Matheus como autor e origem humana do campo, não como monumento.

## Stack preservada

O projeto continua em HTML, CSS e JavaScript vanilla modular. Não há framework, backend ou build obrigatório. A escolha mantém o site rápido, fácil de editar e simples de publicar na Vercel, Netlify, GitHub Pages ou servidor estático.

## Arquivos principais alterados

- `index.html`: estrutura e copy reescritas para Observatório de Ideias.
- `assets/css/styles.css`: design system renovado, atmosfera cósmica, componentes de teorias, constelação e roadmap.
- `assets/js/theories.js`: base estruturada das teorias do arquivo `teorias.txt`.
- `assets/js/theory-lab.js`: renderização de cards, filtros, busca, painel de detalhes e mapa conceitual.
- `assets/js/philosophy.js`: linguagem menos egocêntrica e mais instrumental.
- `assets/js/observer.js`: status e modo estrutural adaptados ao novo conceito.
- `assets/js/contact.js`: origem do formulário atualizada para Observatório de Ideias.
- `README.md`: instruções e arquitetura atualizadas.
- `vercel.json`: configuração estática para deploy.

## Teorias estruturadas

As teorias foram organizadas como objetos com:

- título;
- subtítulo;
- status;
- estágio;
- progresso inferido;
- resumo;
- hipótese central;
- perguntas abertas;
- conceitos conectados;
- pontos que ainda precisam amadurecer;
- conexões com outras teorias;
- posição no mapa conceitual.

## Funcionalidades adicionadas

- Busca textual por teorias.
- Filtros por categoria: cosmologia, tempo, vazio, informação e topologia.
- Cards com status e maturidade conceitual.
- Painel de detalhes para teoria selecionada.
- Mapa de ideias em estilo constelação.
- Estrutura editorial para artigos futuros sem criar artigos falsos.
- Linha de desenvolvimento mais clara e intencional.
- Nova imagem Open Graph.

## Melhorias de UX/UI

- Atmosfera mais elegante e menos “template espacial”.
- Elementos cósmicos integrados ao conceito: órbitas, constelação, estrela central, sonda, coordenadas e campos visuais.
- Melhor hierarquia textual.
- Redução da linguagem de autobiografia exagerada.
- Layout responsivo revisado para mobile.
- Componentes reutilizáveis por CSS variables.
- Acessibilidade preservada: skip link, ARIA, foco visível, botões com estados, formulário validado.

## Assumptions

- Não foram inventados e-mail, redes sociais, depoimentos, métricas ou artigos já publicados.
- A maturidade de cada teoria foi inferida pela completude do material textual, não por validação científica.
- As teorias são tratadas como hipóteses, fragmentos e linhas de pensamento em desenvolvimento.
- O projeto continua one-page por simplicidade e facilidade de deploy.

## Verificação

Comando usado:

```bash
npm run verify
```

Também foram verificados os módulos JavaScript com `node --check`.
## Atualização — contato e visão estrutural otimizada

Esta atualização preserva a identidade de observatório intelectual e adiciona uma área final de coordenadas profissionais. A seção de contato agora integra a foto de Matheus, a imagem cósmica associada ao perfil técnico, links diretos para e-mail, telefone, LinkedIn e GitHub, além do formulário com abertura por `mailto:`.

A visão estrutural foi refatorada para reduzir custo de CPU/GPU. A versão anterior desenhava uma malha em canvas com loop contínuo. A nova versão usa um SVG estático da teia cósmica, poucos sinais animados apenas por `transform` e `opacity`, classe de baixo consumo em telas menores, pausa por `IntersectionObserver` quando o hero sai da viewport e respeito a `prefers-reduced-motion`.

Arquivos principais alterados nesta atualização:

- `index.html`: nova área de contato e integração das imagens enviadas.
- `assets/css/styles.css`: estilos da constelação de contato e modo estrutural leve.
- `assets/js/observer.js`: remoção do canvas animado contínuo e troca por overlay estático com sinais controlados por classe.
- `assets/js/config.js`: contatos profissionais centralizados.
- `assets/images/matheus-camargo.webp` e `assets/images/github-profile.webp`: imagens otimizadas para uso no site.
