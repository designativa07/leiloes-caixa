# API-Football vs TheSportsDB - guia objetivo para IA

Fontes unicas deste arquivo:

- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [TheSportsDB API Documentation](https://www.thesportsdb.com/documentation)

## Objetivo

Este arquivo existe para responder de forma pratica:

- quando usar `API-Football`;
- quando usar `TheSportsDB`;
- qual contexto minimo vale passar para a IA em cada uma;
- como evitar poluir a IA com informacao desnecessaria.

## Resposta curta

Se o seu caso de uso e futebol com foco em fixture, evento, estatistica, lineup, injuries, predictions e odds, use primeiro:

- `API-Football`

Se o seu caso de uso e um catalogo esportivo mais amplo, com ligas, times, jogadores, eventos, agenda, TV e livescore em varios esportes, use primeiro:

- `TheSportsDB`

## Regra pratica de decisao

### Use `API-Football` quando

- o dominio principal e futebol;
- voce precisa de leitura forte de partida em andamento;
- voce precisa de `coverage` por competicao/temporada;
- voce precisa de `fixtures/events`, `fixtures/statistics`, `fixtures/lineups`, `fixtures/players`;
- voce precisa de `injuries`, `predictions` e `odds`.

### Use `TheSportsDB` quando

- voce quer uma API multi-esporte;
- voce quer um modelo mais simples de busca e lookup;
- voce precisa combinar catalogo + agenda + TV + highlights + livescore;
- voce quer um fluxo premium mais limpo e concentrado na `v2`;
- o problema e mais "descobrir e navegar entidades" do que "ler profundamente uma fixture de futebol".

## O que cada uma faz melhor

### API-Football

Melhor para:

- cobertura profunda de futebol;
- fixture como entidade central;
- eventos de jogo e estatisticas em granularidade alta;
- disponibilidade de jogadores por fixture;
- previsoes e odds.

Endpoint central:

- `/leagues`
  - porque entrega IDs, temporadas e principalmente `coverage`

Segundo endpoint central:

- `/fixtures`
  - porque vira a chave da maior parte do restante

### TheSportsDB

Melhor para:

- catalogo amplo multi-esporte;
- busca e lookup de entidades;
- agenda e TV;
- highlights e livescore;
- ingestao premium mais simples, com menos ramificacoes do que o `API-Football`.

Bloco central:

- `search/*`
- `lookup/*`
- `list/*`
- `schedule/*`
- `livescore/*`

## Contexto minimo para IA

### Contexto minimo recomendado para `API-Football`

Passe para a IA apenas:

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

Esse bloco cobre:

- descoberta de IDs;
- validacao de cobertura;
- estado do jogo;
- estatisticas centrais;
- disponibilidade de atletas;
- previsao.

### O que deixar fora do contexto base no `API-Football`

So carregue sob demanda:

- `/status`
- `/timezone`
- `/countries`
- `/teams/countries`
- `/teams/seasons`
- `/players/profiles`
- `/players/seasons`
- `/players/teams`
- `/players/top*`
- `/transfers`
- `/trophies`
- `/sidelined`
- todo o bloco `/odds*`

### Contexto minimo recomendado para `TheSportsDB`

Passe para a IA apenas:

- `search/league`
- `search/team`
- `search/player`
- `search/event`
- `all/leagues`
- `list/teams`
- `list/seasons`
- `list/players`
- `lookup/league`
- `lookup/team`
- `lookup/player`
- `lookup/event`
- `lookup/event_results`
- `lookup/event_lineup`
- `lookup/event_stats`
- `lookup/event_timeline`
- `schedule/next/league`
- `schedule/previous/league`
- `schedule/league/{idLeague}/{season}`
- `livescore/{idLeague}` ou `livescore/all`

Esse bloco cobre:

- descoberta;
- estrutura;
- agenda;
- enrichments principais de evento;
- tempo real.

### O que deixar fora do contexto base no `TheSportsDB`

So carregue sob demanda:

- `lookup/team_equipment`
- `lookup/player_contracts`
- `lookup/player_results`
- `lookup/player_honours`
- `lookup/player_milestones`
- `lookup/player_teams`
- `lookup/event_tv`
- `lookup/event_highlights`
- `filter/tv/*`

## Comparacao por tipo de problema

### Quero acompanhar uma partida de futebol com profundidade

Escolha:

- `API-Football`

Porque:

- fixture e a entidade principal da API;
- ha endpoints dedicados para evento, lineup, stats e player stats;
- `injuries` e `predictions` encaixam no mesmo fluxo;
- `odds` e `odds/live` completam o contexto.

### Quero montar uma base multi-esporte de ligas, times, jogadores e agenda

Escolha:

- `TheSportsDB`

Porque:

- a `v2` premium e mais simples de navegar por busca e lookup;
- o bloco `schedule/*` e limpo;
- `livescore/*` ja esta organizado na mesma familia.

### Quero reduzir a chance da IA alucinar

Regra:

- use poucos endpoints centrais;
- evite passar ranking especial, historico longo, TV, highlights e odds no prompt base;
- carregue essas familias apenas quando a tarefa realmente pedir.

Nessa comparacao:

- `API-Football` precisa mais disciplina por causa de `coverage`, paginacao e varios subdominios;
- `TheSportsDB` tende a ser mais simples para IA quando o problema nao exige profundidade de jogo.

## Melhor estrategia combinada

Se voce quiser usar as duas sem confundir a IA:

- use `API-Football` como fonte principal para leitura de futebol em profundidade;
- use `TheSportsDB` como fonte principal para catalogo multi-esporte, agenda geral, TV, highlights e livescore;
- nunca passe os dois catálogos completos ao mesmo tempo no prompt base;
- escolha uma API primaria por tarefa.

## Regra de ouro para prompts

Antes de enviar contexto para a IA, pergunte:

- a tarefa e sobre futebol em detalhe de jogo?
  - use `API-Football`
- a tarefa e sobre descoberta/catalogo/agenda multi-esporte?
  - use `TheSportsDB`

Se a resposta nao exigir ambos, nao envie ambos.

## Resumo final

`API-Football` ganha quando o problema e leitura profunda de futebol. `TheSportsDB` ganha quando o problema e navegar um catalogo esportivo premium mais amplo e mais simples.

Para reduzir alucinacao, a melhor pratica nao e dar "mais documentacao" para a IA, e sim dar:

- uma API por tarefa;
- poucos endpoints centrais;
- enrichments apenas sob demanda.
