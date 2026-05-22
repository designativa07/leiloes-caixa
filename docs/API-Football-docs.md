# API-Football v3 - referencia objetiva

Fonte unica deste arquivo: [documentacao oficial](https://www.api-football.com/documentation-v3), incluindo o `openapi.yaml` oficial carregado pela pagina.

## Escopo

Este arquivo foi reduzido para uso objetivo com IA. O foco nao e catalogar cada detalhe textual da documentacao, e sim deixar claro:

- quais endpoints importam;
- quais sao centrais para descoberta e cobertura;
- quais enriquecem contexto;
- quais devem ficar fora do prompt base para nao poluir a IA.

## Visao geral

- Base URL oficial: `https://v3.football.api-sports.io`
- Autenticacao: header `x-apisports-key`
- Metodo aceito: `GET`
- Headers de rate limit citados pela documentacao:
  - `x-ratelimit-requests-limit`
  - `x-ratelimit-requests-remaining`
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`

## Observacao sobre `/status`

A introducao oficial cita `/status` como endpoint para consumo, assinatura e conta, sem contar na cota diaria. Ele nao aparece na secao `paths` do `openapi.yaml`, mas faz parte do material oficial da pagina.

## Quantidade de endpoints

- `38` endpoints em `paths`
- `1` endpoint adicional citado na introducao: `/status`

## Endpoint mais importante

Se voce quiser um unico endpoint para orquestrar a IA, ele e:

- `/leagues`
  - porque entrega IDs de competicoes, temporadas e principalmente o objeto `coverage`
  - e ele que informa se vale a pena chamar `standings`, `injuries`, `predictions`, `odds`, `fixtures/statistics`, `fixtures/players` e outros

## Inventario objetivo

### Descoberta e validacao

- `/status`
  - consumo, assinatura e conta

- `/timezone`
  - timezones validos

- `/countries`
  - paises e codigos usados na API

- `/leagues`
  - ligas, copas, temporadas e `coverage`

- `/leagues/seasons`
  - anos de temporada disponiveis

- `/teams/countries`
  - paises validos para filtros de times

- `/teams/seasons`
  - temporadas disponiveis para um time

### Cadastro estrutural

- `/teams`
  - times e venue basico associado

- `/venues`
  - venues/estadios

- `/coachs`
  - tecnicos e carreira

- `/players/profiles`
  - catalogo/perfis de jogadores

### Competicoes e desempenho agregado

- `/standings`
  - classificacoes

- `/teams/statistics`
  - desempenho agregado do time em competicao/temporada

### Fixtures e jogo

- `/fixtures/rounds`
  - rodadas

- `/fixtures`
  - fixture central: ids, status, times, score, datas, liga

- `/fixtures/headtohead`
  - historico entre dois times

- `/fixtures/statistics`
  - estatisticas do jogo

- `/fixtures/events`
  - eventos da partida

- `/fixtures/lineups`
  - escalacoes

- `/fixtures/players`
  - estatisticas individuais dos jogadores da partida

### Jogadores

- `/players/seasons`
  - temporadas disponiveis para stats

- `/players`
  - estatisticas de jogadores

- `/players/squads`
  - elenco atual

- `/players/teams`
  - historico de times e temporadas do jogador

- `/players/topscorers`
  - top artilheiros

- `/players/topassists`
  - top assistencias

- `/players/topyellowcards`
  - top amarelos

- `/players/topredcards`
  - top vermelhos

### Lesoes, previsoes e historico

- `/injuries`
  - indisponibilidades

- `/predictions`
  - previsoes da fixture

- `/transfers`
  - transferencias

- `/trophies`
  - trofeus

- `/sidelined`
  - historico de afastamentos

### Odds

- `/odds`
  - odds pre-match

- `/odds/mapping`
  - fixtures mapeadas para odds

- `/odds/bookmakers`
  - bookmakers disponiveis

- `/odds/bets`
  - tipos de aposta pre-match

- `/odds/live`
  - odds live

- `/odds/live/bets`
  - tipos de aposta live

## Core minimo para IA

Se a ideia e passar o minimo necessario para uma IA trabalhar bem sem alucinacao por excesso de contexto, use este bloco:

- `/leagues`
- `/teams`
- `/fixtures`
- `/standings`
- `/players`
- `/fixtures/events`
- `/fixtures/statistics`
- `/fixtures/lineups`
- `/fixtures/players`
- `/injuries`
- `/predictions`

Esse conjunto cobre:

- descoberta de IDs;
- validacao de cobertura;
- agenda e estado do jogo;
- estatisticas de time e jogador em nivel pratico;
- disponibilidade de atletas;
- previsao pre-match.

## O que manter fora do prompt base

Para nao inflar contexto da IA sem necessidade, deixe fora do prompt padrao e carregue sob demanda:

- `/timezone`
- `/countries`
- `/teams/countries`
- `/teams/seasons`
- `/players/seasons`
- `/players/profiles`
- `/players/teams`
- `/players/topscorers`
- `/players/topassists`
- `/players/topyellowcards`
- `/players/topredcards`
- `/transfers`
- `/trophies`
- `/sidelined`
- todo o bloco `/odds*`

## Pontos criticos para nao perder dados

- `leagues.coverage`
  - sem isso voce chama endpoints que podem nao ter dados para a competicao/temporada

- Paginacao
  - `/players/profiles`: 250 por pagina
  - `/players`: 20 por pagina
  - `/odds`: 10 por pagina
  - `/odds/mapping`: 100 por pagina

- Historico curto
  - `/odds/live`: sem historico
  - `/odds`: historico de 7 dias

- Frequencia de atualizacao
  - `/fixtures` e `/fixtures/events`: 15 segundos
  - `/fixtures/statistics` e `/fixtures/players`: 1 minuto
  - `/fixtures/lineups`: 15 minutos
  - `/injuries`: 4 horas
  - `/predictions`: 1 hora
  - `/standings`: 1 hora

## Resumo final

Para uso objetivo por IA, trate o `API-Football` em tres camadas:

- base de descoberta: `leagues`, `teams`, `fixtures`
- camada de analise: `standings`, `players`, `fixtures/events`, `fixtures/statistics`, `fixtures/players`, `injuries`, `predictions`
- camada sob demanda: rankings especiais, historicos longos e todo o bloco de odds
