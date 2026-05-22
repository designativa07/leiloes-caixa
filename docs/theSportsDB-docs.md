# TheSportsDB Premium (v2) - referencia oficial

Fonte unica deste arquivo: [documentacao oficial](https://www.thesportsdb.com/documentation).

## Escopo

Este arquivo foi reduzido para uso premium, com foco objetivo na `v2`. Ele ignora deliberadamente a maior parte da `v1` para evitar ruido na ingestao por IA.

## Visao geral

- Base URL oficial: `https://www.thesportsdb.com/api/v2/json`
- Autenticacao oficial: header `X-API-KEY`
- A documentacao oficial informa que a `v2` e premium-only
- A documentacao oficial tambem diz que a `v2` e a versao que seguira evoluindo

## Rate limit oficial

- Premium: `100 per minute`
- Business: `120 per minute`
- A pagina tambem informa retorno `429` quando o limite e excedido

## Imagens

A documentacao oficial informa que:

- a API retorna URLs de imagem para ligas, eventos, jogadores e times;
- voce pode usar versoes menores adicionando `/medium`, `/small` e `/tiny` ao final da URL.

## Contagem de rotas v2 documentadas

Contando apenas o que aparece explicitamente na pagina oficial para a `v2`:

- `Search`: 5
- `Lookup`: 17
- `List`: 3
- `Filter`: 5
- `All`: 3
- `Schedule`: 8
- `Livescores`: 3
- Total: `44` rotas documentadas

## Inventario oficial v2

### Search

- `/api/v2/json/search/league/{query}`
  - Busca ligas por texto.

- `/api/v2/json/search/team/{query}`
  - Busca times por texto.

- `/api/v2/json/search/player/{query}`
  - Busca jogadores por texto.

- `/api/v2/json/search/event/{query}`
  - Busca eventos por texto.

- `/api/v2/json/search/venue/{query}`
  - Busca venues por texto.

### Lookup

- `/api/v2/json/lookup/league/{idLeague}`
  - Detalhe de liga.

- `/api/v2/json/lookup/team/{idTeam}`
  - Detalhe de time.

- `/api/v2/json/lookup/team_equipment/{idTeam}`
  - Equipment/artwork de time.

- `/api/v2/json/lookup/player/{idPlayer}`
  - Detalhe de jogador.

- `/api/v2/json/lookup/player_contracts/{idPlayer}`
  - Contratos do jogador.

- `/api/v2/json/lookup/player_results/{idPlayer}`
  - Resultados do jogador.

- `/api/v2/json/lookup/player_honours/{idPlayer}`
  - Honrarias do jogador.

- `/api/v2/json/lookup/player_milestones/{idPlayer}`
  - Milestones do jogador.

- `/api/v2/json/lookup/player_teams/{idPlayer}`
  - Historico de times do jogador.

- `/api/v2/json/lookup/event/{idEvent}`
  - Detalhe de evento.

- `/api/v2/json/lookup/event_lineup/{idEvent}`
  - Lineup do evento.

- `/api/v2/json/lookup/event_results/{idEvent}`
  - Resultado do evento.

- `/api/v2/json/lookup/event_stats/{idEvent}`
  - Estatisticas do evento.

- `/api/v2/json/lookup/event_timeline/{idEvent}`
  - Timeline do evento.

- `/api/v2/json/lookup/event_tv/{idEvent}`
  - TV schedule do evento.

- `/api/v2/json/lookup/event_highlights/{idEvent}`
  - Highlights do evento.

- `/api/v2/json/lookup/venue/{idVenue}`
  - Detalhe de venue.

### List

- `/api/v2/json/list/teams/{idLeague}`
  - Times da liga.

- `/api/v2/json/list/seasons/{idLeague}`
  - Temporadas da liga.

- `/api/v2/json/list/players/{idTeam}`
  - Jogadores do time.

### Filter

- `/api/v2/json/filter/tv/day/{dateEvent}`
  - TV por data.

- `/api/v2/json/filter/tv/country/{strCountry}`
  - TV por pais.

- `/api/v2/json/filter/tv/sport/{strSport}`
  - TV por esporte.

- `/api/v2/json/filter/tv/channel/{strChannel}`
  - TV por canal.

- `/api/v2/json/filter/tv/channelid/{idChannel}`
  - TV por ID do canal.

### All

- `/api/v2/json/all/countries`
  - Todos os paises.

- `/api/v2/json/all/sports`
  - Todos os esportes.

- `/api/v2/json/all/leagues`
  - Todas as ligas.

### Schedule

- `/api/v2/json/schedule/next/league/{idLeague}`
  - Proximos eventos da liga.

- `/api/v2/json/schedule/previous/league/{idLeague}`
  - Eventos anteriores da liga.

- `/api/v2/json/schedule/next/team/{idTeam}`
  - Proximos eventos do time.

- `/api/v2/json/schedule/previous/team/{idTeam}`
  - Eventos anteriores do time.

- `/api/v2/json/schedule/next/venue/{idVenue}`
  - Proximos eventos do venue.

- `/api/v2/json/schedule/previous/venue/{idVenue}`
  - Eventos anteriores do venue.

- `/api/v2/json/schedule/full/team/{idTeam}`
  - Temporada completa do time.

- `/api/v2/json/schedule/league/{idLeague}/{season}`
  - Temporada completa da liga.

### Livescores

- `/api/v2/json/livescore/{sport}`
  - Livescore por esporte.

- `/api/v2/json/livescore/{idLeague}`
  - Livescore por liga.

- `/api/v2/json/livescore/all`
  - Livescore global.

## Checklist rapido premium

Se voce quer manter a ingestao objetiva, use este conjunto minimo:

- Descoberta de IDs
  - `search/league`
  - `search/team`
  - `search/player`
  - `search/event`
  - `search/venue`

- Cadastro base
  - `lookup/league`
  - `lookup/team`
  - `lookup/player`
  - `lookup/venue`

- Relacionamentos
  - `list/teams`
  - `list/seasons`
  - `list/players`

- Evento enriquecido
  - `lookup/event`
  - `lookup/event_results`
  - `lookup/event_lineup`
  - `lookup/event_stats`
  - `lookup/event_timeline`
  - `lookup/event_tv`
  - `lookup/event_highlights`

- Jogador enriquecido
  - `lookup/player_contracts`
  - `lookup/player_results`
  - `lookup/player_honours`
  - `lookup/player_milestones`
  - `lookup/player_teams`

- Agenda
  - todo o bloco `schedule/*`

- Tempo real
  - todo o bloco `livescore/*`

## Fora de escopo intencional

Para manter este material objetivo para IA, a `v1` foi removida do fluxo principal. Se algum dia voce precisar cobrir excecoes da propria pagina oficial sem equivalente claro na `v2`, os principais candidatos sao:

- `lookuptable.php`
- `eventstv.php`
- `eventshighlights.php`

## Resumo final

Se voce paga o plano premium, a forma mais objetiva de trabalhar com o TheSportsDB e tratar a `v2` como fonte unica de implementacao. O nucleo real da API premium fica em 7 blocos: `Search`, `Lookup`, `List`, `Filter`, `All`, `Schedule` e `Livescores`.
