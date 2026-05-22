# TheSportsDB Premium (v2) - checklist operacional

Fonte unica deste arquivo: [documentacao oficial](https://www.thesportsdb.com/documentation).

## Objetivo

Este arquivo e o backlog objetivo de ingestao para uso premium. O foco aqui e apenas a `v2`, para reduzir ruido e evitar contexto desnecessario para IA.

## Prioridades

- `P0`
  - descoberta de IDs e estrutura base
- `P1`
  - cadastro detalhado e relacionamentos
- `P2`
  - agenda e enriquecimento de eventos
- `P3`
  - tempo real

## Pipeline premium recomendado

1. descobrir IDs com `search/*`
2. consolidar catalogos com `all/*` e `list/*`
3. enriquecer entidades com `lookup/*`
4. montar agenda com `schedule/*`
5. ligar tempo real com `livescore/*`

## P0 - descoberta e estrutura

### Descoberta de IDs

- `/api/v2/json/search/league/{query}`
  - Prioridade: `P0`
  - Uso: resolver `idLeague`

- `/api/v2/json/search/team/{query}`
  - Prioridade: `P0`
  - Uso: resolver `idTeam`

- `/api/v2/json/search/player/{query}`
  - Prioridade: `P0`
  - Uso: resolver `idPlayer`

- `/api/v2/json/search/event/{query}`
  - Prioridade: `P0`
  - Uso: resolver `idEvent`

- `/api/v2/json/search/venue/{query}`
  - Prioridade: `P0`
  - Uso: resolver `idVenue`

### Catalogo global

- `/api/v2/json/all/leagues`
  - Prioridade: `P0`
  - Uso: catalogo global de ligas

- `/api/v2/json/all/sports`
  - Prioridade: `P0`
  - Uso: catalogo global de esportes

- `/api/v2/json/all/countries`
  - Prioridade: `P0`
  - Uso: catalogo global de paises

### Relacoes basicas

- `/api/v2/json/list/teams/{idLeague}`
  - Prioridade: `P0`
  - Uso: times de uma liga

- `/api/v2/json/list/seasons/{idLeague}`
  - Prioridade: `P0`
  - Uso: temporadas de uma liga

- `/api/v2/json/list/players/{idTeam}`
  - Prioridade: `P0`
  - Uso: jogadores de um time

## P1 - cadastro e relacionamentos

### Ligas, times e venues

- `/api/v2/json/lookup/league/{idLeague}`
  - Prioridade: `P1`
  - Uso: detalhe de liga

- `/api/v2/json/lookup/team/{idTeam}`
  - Prioridade: `P1`
  - Uso: detalhe de time

- `/api/v2/json/lookup/team_equipment/{idTeam}`
  - Prioridade: `P1`
  - Uso: artwork/equipment do time

- `/api/v2/json/lookup/venue/{idVenue}`
  - Prioridade: `P1`
  - Uso: detalhe de venue

### Jogadores

- `/api/v2/json/lookup/player/{idPlayer}`
  - Prioridade: `P1`
  - Uso: detalhe de jogador

- `/api/v2/json/lookup/player_contracts/{idPlayer}`
  - Prioridade: `P1`
  - Uso: contratos

- `/api/v2/json/lookup/player_results/{idPlayer}`
  - Prioridade: `P1`
  - Uso: resultados

- `/api/v2/json/lookup/player_honours/{idPlayer}`
  - Prioridade: `P1`
  - Uso: honrarias

- `/api/v2/json/lookup/player_milestones/{idPlayer}`
  - Prioridade: `P1`
  - Uso: milestones

- `/api/v2/json/lookup/player_teams/{idPlayer}`
  - Prioridade: `P1`
  - Uso: historico de times

## P2 - agenda e enriquecimento de evento

### Evento base

- `/api/v2/json/lookup/event/{idEvent}`
  - Prioridade: `P2`
  - Uso: detalhe central do evento

### Evento enriquecido

- `/api/v2/json/lookup/event_results/{idEvent}`
  - Prioridade: `P2`
  - Uso: resultado

- `/api/v2/json/lookup/event_lineup/{idEvent}`
  - Prioridade: `P2`
  - Uso: lineup

- `/api/v2/json/lookup/event_stats/{idEvent}`
  - Prioridade: `P2`
  - Uso: estatisticas

- `/api/v2/json/lookup/event_timeline/{idEvent}`
  - Prioridade: `P2`
  - Uso: timeline

- `/api/v2/json/lookup/event_tv/{idEvent}`
  - Prioridade: `P2`
  - Uso: TV schedule do evento

- `/api/v2/json/lookup/event_highlights/{idEvent}`
  - Prioridade: `P2`
  - Uso: highlights do evento

### Agenda

- `/api/v2/json/schedule/next/league/{idLeague}`
  - Prioridade: `P2`
  - Uso: proximos eventos da liga

- `/api/v2/json/schedule/previous/league/{idLeague}`
  - Prioridade: `P2`
  - Uso: eventos anteriores da liga

- `/api/v2/json/schedule/next/team/{idTeam}`
  - Prioridade: `P2`
  - Uso: proximos eventos do time

- `/api/v2/json/schedule/previous/team/{idTeam}`
  - Prioridade: `P2`
  - Uso: eventos anteriores do time

- `/api/v2/json/schedule/next/venue/{idVenue}`
  - Prioridade: `P2`
  - Uso: proximos eventos do venue

- `/api/v2/json/schedule/previous/venue/{idVenue}`
  - Prioridade: `P2`
  - Uso: eventos anteriores do venue

- `/api/v2/json/schedule/full/team/{idTeam}`
  - Prioridade: `P2`
  - Uso: temporada completa do time

- `/api/v2/json/schedule/league/{idLeague}/{season}`
  - Prioridade: `P2`
  - Uso: temporada completa da liga

### TV agregada

- `/api/v2/json/filter/tv/day/{dateEvent}`
  - Prioridade: `P2`
  - Uso: TV por data

- `/api/v2/json/filter/tv/country/{strCountry}`
  - Prioridade: `P2`
  - Uso: TV por pais

- `/api/v2/json/filter/tv/sport/{strSport}`
  - Prioridade: `P2`
  - Uso: TV por esporte

- `/api/v2/json/filter/tv/channel/{strChannel}`
  - Prioridade: `P2`
  - Uso: TV por canal

- `/api/v2/json/filter/tv/channelid/{idChannel}`
  - Prioridade: `P2`
  - Uso: TV por ID do canal

## P3 - tempo real

- `/api/v2/json/livescore/{sport}`
  - Prioridade: `P3`
  - Uso: livescore por esporte

- `/api/v2/json/livescore/{idLeague}`
  - Prioridade: `P3`
  - Uso: livescore por liga

- `/api/v2/json/livescore/all`
  - Prioridade: `P3`
  - Uso: livescore global

## Core minimo para IA

Se a ideia e alimentar uma IA com o minimo necessario, o conjunto mais objetivo e:

- IDs
  - `search/league`
  - `search/team`
  - `search/player`
  - `search/event`

- Estrutura
  - `all/leagues`
  - `list/teams`
  - `list/seasons`
  - `list/players`

- Entidades
  - `lookup/league`
  - `lookup/team`
  - `lookup/player`
  - `lookup/event`

- Evento enriquecido
  - `lookup/event_results`
  - `lookup/event_lineup`
  - `lookup/event_stats`
  - `lookup/event_timeline`

- Agenda
  - `schedule/next/league`
  - `schedule/previous/league`
  - `schedule/league/{idLeague}/{season}`

- Tempo real
  - `livescore/{idLeague}` ou `livescore/all`

## O que manter fora do contexto padrao

Para nao inflar o contexto da IA sem necessidade, deixe fora do prompt base e consulte apenas quando precisar:

- `lookup/team_equipment`
- `lookup/player_contracts`
- `lookup/player_honours`
- `lookup/player_milestones`
- `lookup/player_teams`
- `lookup/event_tv`
- `lookup/event_highlights`
- `filter/tv/*`

## Excecoes opcionais fora da v2

Este checklist e premium/v2-first. Mesmo assim, a propria pagina oficial ainda expone alguns casos da `v1` sem equivalente claro na `v2`. So consulte isso se realmente precisar:

- `lookuptable.php`
- `eventstv.php`
- `eventshighlights.php`

## Resumo final

Para um fluxo premium objetivo, trate a `v2` como fonte unica e divida o trabalho em quatro blocos: descoberta, cadastro, agenda/evento e tempo real. Se o foco for IA, passe apenas o `Core minimo para IA` como contexto padrao e carregue o resto sob demanda.
