# API-Football v3 - checklist operacional

Fonte unica deste arquivo: [documentacao oficial](https://www.api-football.com/documentation-v3), incluindo o `openapi.yaml` oficial citado pela pagina.

## Objetivo

Este arquivo transforma a documentacao oficial em backlog de ingestao objetivo, com foco em uso por IA. A ideia e separar:

- o que e essencial para descoberta e cobertura;
- o que e essencial para analise de jogo;
- o que e enriquecimento opcional;
- o que deve ficar fora do prompt base.

## Prioridades

- `P0`
  - descoberta, IDs e cobertura
- `P1`
  - cadastro e estado principal de competicao/time/jogador
- `P2`
  - enriquecimento de fixture e analise
- `P3`
  - historicos, rankings especiais e odds

## Pipeline recomendado

1. validar acesso e consumo com `/status`
2. descobrir competicoes e cobertura com `/leagues`
3. resolver times e jogadores
4. usar `/fixtures` como eixo central
5. enriquecer fixtures com eventos, stats, lineups e players
6. ligar standings, injuries e predictions
7. carregar historicos e odds apenas quando houver caso de uso claro

## P0 - descoberta e cobertura

- `/status`
  - Prioridade: `P0`
  - Uso: consumo, assinatura e conta

- `/timezone`
  - Prioridade: `P0`
  - Uso: timezones validos

- `/countries`
  - Prioridade: `P0`
  - Uso: paises e codigos de referencia

- `/leagues`
  - Prioridade: `P0`
  - Uso: IDs de liga, temporadas e `coverage`
  - Observacao: este e o endpoint mais importante da API para evitar chamadas desnecessarias

- `/leagues/seasons`
  - Prioridade: `P0`
  - Uso: anos de temporada

- `/teams/countries`
  - Prioridade: `P0`
  - Uso: paises aceitos no endpoint de times

- `/teams/seasons`
  - Prioridade: `P0`
  - Uso: temporadas de um time

## P1 - cadastro e estado principal

- `/teams`
  - Prioridade: `P1`
  - Uso: times, IDs, venue basico

- `/venues`
  - Prioridade: `P1`
  - Uso: detalhes de estadio/venue

- `/coachs`
  - Prioridade: `P1`
  - Uso: perfil de tecnico e carreira

- `/players/profiles`
  - Prioridade: `P1`
  - Uso: catalogo/perfil de jogadores
  - Atencao: 250 por pagina

- `/players/seasons`
  - Prioridade: `P1`
  - Uso: temporadas disponiveis para stats de jogadores

- `/players`
  - Prioridade: `P1`
  - Uso: stats de jogadores por time/liga/temporada
  - Atencao: 20 por pagina

- `/players/squads`
  - Prioridade: `P1`
  - Uso: elenco atual

- `/players/teams`
  - Prioridade: `P1`
  - Uso: historico de times/temporadas do jogador

- `/standings`
  - Prioridade: `P1`
  - Uso: classificacao

- `/teams/statistics`
  - Prioridade: `P1`
  - Uso: estatistica agregada do time

## P2 - fixture e analise de jogo

- `/fixtures/rounds`
  - Prioridade: `P2`
  - Uso: rodadas e filtro `round`

- `/fixtures`
  - Prioridade: `P2`
  - Uso: eixo central da API
  - Observacao: `fixture.id` e a chave principal para expandir o resto

- `/fixtures/headtohead`
  - Prioridade: `P2`
  - Uso: historico entre equipes

- `/fixtures/statistics`
  - Prioridade: `P2`
  - Uso: estatisticas do jogo

- `/fixtures/events`
  - Prioridade: `P2`
  - Uso: eventos da partida

- `/fixtures/lineups`
  - Prioridade: `P2`
  - Uso: escalacoes

- `/fixtures/players`
  - Prioridade: `P2`
  - Uso: stats individuais dos jogadores da fixture

- `/injuries`
  - Prioridade: `P2`
  - Uso: indisponibilidades

- `/predictions`
  - Prioridade: `P2`
  - Uso: previsoes pre-match

## P3 - enriquecimento avancado

### Rankings e historicos

- `/players/topscorers`
  - Prioridade: `P3`
  - Uso: ranking de artilheiros

- `/players/topassists`
  - Prioridade: `P3`
  - Uso: ranking de assistencias

- `/players/topyellowcards`
  - Prioridade: `P3`
  - Uso: ranking de amarelos

- `/players/topredcards`
  - Prioridade: `P3`
  - Uso: ranking de vermelhos

- `/transfers`
  - Prioridade: `P3`
  - Uso: historico de transferencias

- `/trophies`
  - Prioridade: `P3`
  - Uso: historico de trofeus

- `/sidelined`
  - Prioridade: `P3`
  - Uso: historico de afastamentos

### Odds

- `/odds`
  - Prioridade: `P3`
  - Uso: odds pre-match
  - Atencao: 10 por pagina e historico de 7 dias

- `/odds/mapping`
  - Prioridade: `P3`
  - Uso: mapping de fixtures para odds
  - Atencao: 100 por pagina

- `/odds/bookmakers`
  - Prioridade: `P3`
  - Uso: IDs de bookmakers

- `/odds/bets`
  - Prioridade: `P3`
  - Uso: IDs de tipos de aposta pre-match

- `/odds/live`
  - Prioridade: `P3`
  - Uso: odds live
  - Atencao: sem historico

- `/odds/live/bets`
  - Prioridade: `P3`
  - Uso: IDs de tipos de aposta live

## Core minimo para IA

Se a ideia e alimentar uma IA com o minimo necessario, use este conjunto:

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

Esse bloco costuma ser suficiente para:

- descobrir entidades e validar cobertura;
- acompanhar fixtures;
- analisar jogo e desempenho;
- considerar disponibilidade de jogador;
- adicionar previsao.

## O que deixar fora do prompt base

Para reduzir alucinacao por excesso de contexto, deixe fora do contexto padrao e consulte sob demanda:

- `/status`
- `/timezone`
- `/countries`
- `/teams/countries`
- `/teams/seasons`
- `/players/profiles`
- `/players/seasons`
- `/players/teams`
- todos os `/players/top*`
- `/transfers`
- `/trophies`
- `/sidelined`
- todo o bloco `/odds*`

## Pontos de atencao

- `leagues.coverage`
  - se voce ignorar isso, a IA vai sugerir chamadas para dados que podem nao existir naquela competicao/temporada

- Paginacao
  - `/players/profiles`: 250 por pagina
  - `/players`: 20 por pagina
  - `/odds`: 10 por pagina
  - `/odds/mapping`: 100 por pagina

- Historico curto
  - `/odds/live`: sem historico
  - `/odds`: 7 dias

- Frequencia relevante
  - `/fixtures` e `/fixtures/events`: 15 segundos
  - `/fixtures/statistics` e `/fixtures/players`: 1 minuto
  - `/fixtures/lineups`: 15 minutos
  - `/injuries`: 4 horas
  - `/predictions`: 1 hora
  - `/standings`: 1 hora

## Resumo final

Para um fluxo objetivo com IA, trate o `API-Football` em quatro camadas:

- `P0`: descoberta e cobertura
- `P1`: cadastro principal
- `P2`: fixture e analise
- `P3`: historicos e odds

Se o foco for reduzir ruido, passe apenas o bloco `Core minimo para IA` no prompt base e carregue o restante sob demanda.
