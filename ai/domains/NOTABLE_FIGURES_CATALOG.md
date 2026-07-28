---
id: "domains.notable-figures"
title: "Catálogo de grandes nomes"
scope: "domains"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "estrutura editorial, fontes, retratos e relações do catálogo Grandes Nomes"
triggers:
  - "Grandes Nomes"
  - "perfil histórico"
  - "cientista"
  - "filósofo da ciência"
  - "retrato licenciado"
  - "comparação de trajetórias"
  - "trilha temática"
  - "linha do tempo"
  - "Henri Poincaré"
  - "John Stewart Bell"
required_context:
  - "domains.index"
conditional_context:
  - id: "domains.theory-catalog"
    condition: "Quando um perfil receber, remover ou revisar uma conexão com uma linha do Observatório."
related_context:
  - "domains.editorial-model"
  - "domains.content-operations"
  - "frontend.pages-modules"
  - "frontend.user-flows"
evidence_sources:
  - "assets/data/notable-figures.js"
  - "assets/data/notable-figure-references.js"
  - "assets/js/notable-figures-model.js"
  - "assets/js/theory-figure-model.js"
  - "GrandesNomes/grandes-nomes.html"
  - "GrandesNomes/grandes-nomes.js"
  - "scripts/verify.mjs"
---

# Catálogo de grandes nomes

## Propósito

`Grandes Nomes` é um catálogo histórico e crítico de contribuições reconhecidas em astronomia, física, matemática, cosmologia e filosofia da ciência. Ele explica o que cada pessoa tornou possível, quais obras ou resultados sustentam essa relevância e onde existe uma relação editorial rastreável com o acervo do Observatório.

O catálogo não é um panteão de autoridade. A presença de uma pessoa, uma referência ou uma afinidade temática não valida, endossa nem atribui autoria sobre qualquer linha própria do site.

## Estrutura confirmada

`assets/data/notable-figures.js` é a fonte única dos 22 perfis e das três áreas públicas. Cada perfil possui `id`, `slug`, nome, período de vida, área, função, destaque opcional, retrato, resumo, impacto, pelo menos três contribuições, marcos, fontes e conexões editoriais. `assets/data/notable-figure-references.js` mantém as referências institucionais, acadêmicas ou primárias; `assets/js/notable-figures-model.js` resolve busca, filtros, fontes, áreas, teorias, comparação, trilhas e linha do tempo sem duplicar slugs do catálogo de teorias.

Os três destaques da home são definidos por `featuredRank` e renderizados a partir dos mesmos dados. A rota completa usa `?perfil=<slug>` para seleção direta, `?comparar=<slug>,<slug>` para duas trajetórias e `?trilha=<id>` para uma sequência temática.

Henri Poincaré integra o catálogo pela dinâmica qualitativa, estabilidade e mudança de métodos em sistemas dinâmicos; John Stewart Bell, pela desigualdade que tornou testável uma diferença entre previsões quânticas e teorias locais de variáveis ocultas. As inclusões possuem fontes e retratos locais com licença ou estado de direitos documentado e não são apresentadas como autoridades sobre linhas autorais.

`NOTABLE_METHOD_TIMELINE` reúne 15 eventos de método ou descoberta, filtráveis por observar, medir, modelar e testar. `NOTABLE_FIGURE_TRAILS` declara quatro percursos: medir distâncias, gravidade, quântica e filosofia do teste. Esses recortes referenciam perfis existentes; não criam biografias paralelas nem uma hierarquia de importância.

## Regras editoriais

- Descreva contribuições estabelecidas com linguagem verificável e proporcional à fonte.
- Separe descoberta, demonstração, medição, hipótese, conjectura e contexto histórico.
- Não use fama, prêmio ou autoridade como evidência de uma afirmação.
- Não atribua a uma única pessoa processos coletivos quando a própria história exigir predecessores, colaboradores ou disputas de crédito.
- Não publique comentários sobre bastidores, ferramentas, validação por IA ou relações pessoais do autor.
- Uma conexão com o Observatório precisa declarar `relationType`, rótulo e nota delimitadora.
- A comparação deve manter critérios equivalentes e linguagem descritiva; não produz ranking de pessoas.
- Linha do tempo e trilhas descrevem encadeamentos editoriais, não uma história completa nem crédito exclusivo por descobertas coletivas.

Tipos permitidos para conexões:

- `direct-reference`: o trabalho citado participa diretamente da formulação ou bibliografia da linha;
- `historical-foundation`: fornece base histórica ou técnica anterior;
- `methodological-context`: ajuda a examinar método, teste, observação ou revisão;
- `critical-boundary`: explicita uma diferença ou limite que impede equivalência;
- `conceptual-context`: compartilha um problema ou vocabulário sem implicar derivação.

## Retratos e fontes

Retratos são arquivos WebP locais. Cada entrada registra dimensões, texto alternativo, crédito, licença ou estado de direitos, alterações realizadas e URL de origem. Licenças Creative Commons também precisam de `licenseUrl`; a interface mostra o link da licença e informa adaptações. Não use retratos gerados de pessoas reais nem hotlink de imagens. Antes de substituir ou adicionar uma imagem, confirme a licença aplicável e preserve atribuição, indicação de alterações e compartilhamento pela mesma licença quando exigidos.

As referências devem preferir instituições científicas, universidades, academias, arquivos reconhecidos, publicações originais e enciclopédias acadêmicas. A disponibilidade externa é uma verificação editorial; o verificador local confirma estrutura, URL e associação, mas não prova permanência futura do recurso.

## Evolução do catálogo

Para adicionar um perfil, inclua dados, retrato otimizado e referência no catálogo central; só então defina conexões justificadas que resolvam para IDs existentes em `assets/data/theories.js`. `theoryLinks` pode permanecer vazio quando não houver uma relação pública rigorosa. `theory-figure-model.js` torna essas relações visíveis também no dossiê da teoria, sem edição duplicada. Revise destaque, filtros, índice, comparação, trilhas, linha do tempo, navegação por URL, crédito, build e comportamento responsivo. Não crie uma fonte paralela na home ou no HTML.

## Validação

`npm run verify` rejeita IDs ou slugs duplicados, áreas e tipos de relação inválidos, fontes ausentes, retratos incompletos, teorias inexistentes e um conjunto de destaques diferente de três posições únicas. Complete com teste visual, teclado, movimento reduzido, busca, filtros e navegação direta.

## To Verify

- Revisão periódica da disponibilidade das fontes externas e de mudanças de licença.
- Critério editorial para ampliar o catálogo além de 22 perfis sem reduzir comparação e desempenho.
