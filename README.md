# Repertório de Louvor · Igreja da Família Cristã

Site público e estático sobre as músicas cantadas nos cultos da Igreja da Família Cristã (IFC) entre 2019 e 2026. O painel lê três arquivos JSON e não tem backend, banco nem segredo.

O site **não exibe e não busca letras**. O botão “Ver letra” só abre um endereço externo em uma nova aba. Links ainda não conferidos aparecem com o selo **sugestão**. Quando não há página de letra, o recuo é uma busca no Google.

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. O layout é pensado primeiro para o celular (cerca de 390 px): navegação inferior com alvos grandes, filtros num painel que sobe da base da tela e gráficos que rolam na horizontal.

Para gerar o site estático:

```bash
npm run build
```

O comando roda a checagem de TypeScript e o Vite. A pasta de saída é `dist/`. Para ver o build localmente: `npm run preview`.

## Deploy na Vercel

Projeto Vite, sem variável de ambiente.

| Campo | Valor |
| --- | --- |
| Framework | Vite |
| Build | `npm run build` |
| Diretório de saída | `dist` |
| Install | `npm install` |

O arquivo `vercel.json` devolve `index.html` para rotas como `/musicas/eu-me-rendo`, para o roteamento do navegador funcionar.

## Como atualizar os dados

Substitua os três arquivos, mantendo os nomes e o formato:

- `data/songs.json` — uma música por item, com o campo `id` único (slug)
- `data/events.json` — um culto por item, com `musicas` usando o mesmo texto do campo `musica` da canção
- `data/stats.json` — agregados usados nos números de destaque (totais, percentuais, data de geração, biblioteca)

Campos que a interface espera em cada música: `musica`, `titulo_canonico`, `artista_ministerio`, `versao_estrangeira` (`sim`, `não` ou `desconhecido`), `confianca` (`alta`, `média`, `baixa`), `artista_divergente` (`sim` ou `não`), `total_usos`, `primeiro_uso`, `ultimo_uso`, `usos_ultimos_12m`, `usos_por_ano`, `tipos_evento`, `estilo`, `decada`, `ano_lancamento`, `compositores`, `lyrics_url`, `link_letra`, `link_letra_verificado`, `letras_sugestao_nao_verificada`, `datas`, `id`.

Em cada culto: `id`, `data` (vazio se não houver), `evento`, `tipo`, `fonte_tipo`, `secoes`, `musicas`.

Não coloque o texto da letra em nenhum campo. O site ignora qualquer conteúdo que não seja metadado e só usa os links.

A data em `stats.json` → `gerado_em` é a referência de “últimos 12 meses” e do filtro **Esquecidas**.

Depois de trocar os arquivos:

```bash
npm run build
```

Faça o deploy de novo. Os gráficos são calculados na hora a partir de `songs.json` e `events.json`; os cartões do topo da página inicial usam os totais de `stats.json`.

## O que cada página faz

- **Início** — totais, gráficos por ano, corrida do top 12, top 20, mapa de calor, artistas, origem, década, tipo de culto, mês e dia.
- **Músicas** — busca, ordenação e filtros (período, artista, tipo de culto, estilo, versão estrangeira, confiança, esquecidas, usadas uma vez). Os gráficos da página seguem o filtro.
- **Música** — ficha, linha do tempo, usos por ano e link externo da letra.
- **Cultos** — lista e calendário, com a sequência de músicas de cada encontro.
- **Insights** — planejamento para o ministério de louvor. Saúde do repertório, rotação, esquecidas, estreias, culto típico, pares, sazonalidade e diversidade. Os números são recalculados a partir de `songs.json`, `events.json` e da data `gerado_em`.

O selo **dados aproximados** aparece quando `confianca` é `baixa` ou `artista_divergente` é `sim`.

## Identidade

Roxo `hsl(262 64% 48%)`, fundo claro `hsl(252 48% 96%)`, fundo escuro `hsl(262 50% 15%)`. Logos em `public/logo-ifc-roxo.png` (fundo claro e favicon) e `public/logo-ifc-branco.png` (fundo escuro e capa). Frase: “Uma Família para Pertencer”.

Dados extraídos do WorshipTools Presenter; metadados das músicas gerados por IA e podem conter imprecisões.
