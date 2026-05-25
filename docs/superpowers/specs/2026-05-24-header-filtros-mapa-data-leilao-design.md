# Header dinâmico, visualização de mapa e data de leilão

**Data:** 2026-05-24
**Escopo:** três features entregues numa única evolução, compartilhando a infra de import em fases.

## Objetivo

Aumentar a utilidade do painel de oportunidades em três frentes:

1. **Header dinâmico** — os cards do hero ("Total de Imóveis" e "A partir de") passam a refletir os filtros ativos, dando ao usuário feedback imediato sobre o resultado da busca.
2. **Visualização em mapa** — usuário pode alternar entre lista e mapa interativo (Leaflet + OpenStreetMap) e ver os imóveis filtrados geograficamente.
3. **Data de leilão** — exibida na lista e no detalhe, extraída via scraping da página de detalhe da Caixa.

## Restrições e descobertas relevantes

- O CSV `Lista_imoveis_geral.csv` da Caixa **não** contém data de leilão por imóvel. O CSV traz uma única "Data de geração" (do próprio CSV) na primeira linha. As datas reais de cada leilão estão na página de detalhe de cada imóvel no site da Caixa.
- A modalidade de venda define a semântica temporal:
  - **Leilão SFI - Edital Único** → tem data de 1ª e 2ª praça.
  - **Licitação Aberta** → tem prazo final de propostas.
  - **Venda Direta Online / Venda Online** → não tem data; disponível continuamente até ser comercializado.
- O schema atual do `AuctionItem` não tem `latitude`/`longitude`. Os 29.830 imóveis precisarão ser geocodados.
- Decisão arquitetural: o import passa a operar em **fases independentes** que rodam em background e populam dados progressivamente. App nunca quebra por dados parciais.

## Mudanças de schema

Migration única que cobre as três features.

### `AuctionItem` ganha 6 colunas nullable

```prisma
model AuctionItem {
  // ...campos existentes...
  latitude        Float?
  longitude       Float?
  geocodedAt      DateTime? @map("geocoded_at")
  auctionDate     DateTime? @map("auction_date")
  auctionDateType String?   @map("auction_date_type")
  scrapedAt       DateTime? @map("scraped_at")

  @@index([latitude, longitude])
}
```

`auctionDateType` é um discriminador textual com domínio: `"leilao_1praca"`, `"leilao_2praca"`, `"licitacao_fim"`, `"continua"`, ou `null` (ainda não processado).

`geocodedAt` e `scrapedAt` marcam que o item passou pelos jobs respectivos (mesmo que tenha falhado), permitindo retomada incremental e refresh seletivo no futuro.

### Nova model `ImportBatch`

```prisma
model ImportBatch {
  id          String   @id @default(cuid())
  source      String                                // "caixa"
  generatedAt DateTime @map("generated_at")         // extraído do CSV
  itemCount   Int      @map("item_count")
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("import_batches")
}
```

Uma linha por execução de import. Usada para exibir "Listagem atualizada em DD/MM/AAAA" no header global.

## Feature 1 — Header dinâmico

### Comportamento

Os dois cards do hero passam a refletir os filtros ativos:

- **"Total de Imóveis"** → contagem dos resultados filtrados (`COUNT(*) WHERE filters`).
- **"A partir de"** → preço mínimo entre os resultados filtrados (`MIN(price) WHERE filters`).
- Quando não há filtros aplicados, mostram os totais globais (comportamento atual).
- Label muda para "Resultados encontrados" quando há filtros ativos (visual feedback discreto).

### Implementação

- `getPropertySummary` em [src/lib/auction-items.ts](src/lib/auction-items.ts) muda assinatura para aceitar `PropertyListFilters`, reusando `buildAuctionItemWhere`.
- `getPropertySummary` faz `COUNT` + `findFirst` ordenado por `price asc`, ambos com mesmo `where`.
- [src/app/imoveis/page.tsx](src/app/imoveis/page.tsx) chama `getPropertySummary(filters)` em vez de `getPropertySummary()`.
- Label do card adapta-se baseado em `Object.values(normalizedFilters).some(v => v && v !== "discount_desc")`.

### Arquivos tocados

`src/lib/auction-items.ts`, `src/app/imoveis/page.tsx`.

## Feature 2 — Visualização em mapa

### Job de geocoding

Novo script `scripts/geocode-properties.ts`:

- Seleciona `AuctionItem` com `geocodedAt IS NULL`, em lotes de 100.
- Pra cada um, query no Nominatim:
  - URL: `https://nominatim.openstreetmap.org/search?q=<address>,<city>,<state>,Brasil&format=json&limit=1&countrycodes=br`
  - Headers: `User-Agent: leilaodb/1.0 (contato@designa.tec.br)` (obrigatório pelo Nominatim).
- Throttle: 1 req/segundo (limite Nominatim).
- Salva `latitude`, `longitude`, `geocodedAt = now()` ao concluir cada um.
- Se falhar (sem resultado, erro de rede, timeout): salva `geocodedAt = now()` mas deixa `latitude`/`longitude` null — não retenta no próximo run.
- Idempotente, retomável (pode parar e retomar).
- Estimativa: 29.830 × 1.2s = ~10 horas para a carga inicial. Imports incrementais (apenas novos imóveis) ficam rápidos.

### UI: toggle Lista/Mapa

Acima da seção "Resultados", barra com dois botões:

```
[ Lista ▌ ]  [ Mapa ]
```

- Estado controlado pelo query param `view=map` (server-side, sem JS pra setting inicial).
- Filtros e paginação são preservados quando alterna.
- Clicou em "Mapa" → re-renderiza a página com `<PropertyMap />` no lugar da tabela/cards.

### Componente do mapa

Novo `src/components/imoveis/property-map.tsx` (`"use client"`):

- Carrega Leaflet dinamicamente (`next/dynamic` com `ssr: false`).
- Tile layer: OpenStreetMap (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) com atribuição obrigatória.
- Bounding box automático: zoom e center calculados a partir dos imóveis filtrados (via `L.featureGroup(markers).getBounds()`).
- Pins clusterizados com `leaflet.markercluster` — essencial, pode ter 1000+ pins na view.
- Click em pin → popup com: foto pequena (`getPropertyImage(externalId)`), endereço, preço, desconto, link "Ver detalhes" pra `/imoveis/[id]`.
- Altura fixa: 600px desktop, 450px mobile (via media query).

### Data fetch server-side

Nova função `getPropertiesForMap(filters)` em [src/lib/auction-items.ts](src/lib/auction-items.ts):

- Aplica mesmo `where` que `getPropertyList`, mas adiciona `latitude: { not: null }` e `longitude: { not: null }`.
- Sem paginação. Limite hard de 2000 imóveis (`take: 2000`).
- Retorna apenas campos necessários: `id`, `externalId`, `address`, `city`, `price`, `discountPercent`, `latitude`, `longitude`.
- Se total > 2000, retorna também flag `truncated: true` para exibir aviso na UI: "Mostrando 2000 de N imóveis no mapa. Refine os filtros para ver todos."

### Arquivos novos

- `scripts/geocode-properties.ts`
- `src/components/imoveis/property-map.tsx`
- `src/components/imoveis/view-toggle.tsx`

### Arquivos tocados

- `prisma/schema.prisma`
- `src/lib/auction-items.ts`
- `src/app/imoveis/page.tsx`
- `package.json` (adiciona `leaflet`, `react-leaflet`, `leaflet.markercluster`, `@types/leaflet`)

## Feature 3 — Data de leilão

### Mudanças no parser do CSV

[src/lib/importers/caixaCsv.ts](src/lib/importers/caixaCsv.ts) passa a:

- Extrair `Data de geração: DD/MM/AAAA` da primeira linha (atualmente descartada por `rows.slice(3)`).
- Retornar `{ generatedAt: Date, items: ParsedAuctionItem[] }` em vez de só os items.

[src/lib/importers/caixaImport.ts](src/lib/importers/caixaImport.ts) passa a:

- Criar uma row em `ImportBatch` com `generatedAt` e `itemCount` antes de inserir os items.
- Manter o resto do fluxo (deleteMany + createMany em chunks).

### Job de scraping

Novo script `scripts/scrape-auction-dates.ts`:

- Filtra `AuctionItem` com `scrapedAt IS NULL`.
- Pra imóveis com `saleMode` começando com "Venda Direta" ou "Venda Online": marca `auctionDateType = "continua"`, `auctionDate = null`, `scrapedAt = now()` direto, sem scraping. Resolve ~metade dos imóveis instantaneamente.
- Pra "Leilão SFI..." ou "Licitação Aberta": `fetch(sourceUrl)` → parse HTML via regex (não justifica adicionar cheerio para um único campo).
- Regex tolerantes que buscam:
  - "1ª Praça" próximo a `DD/MM/AAAA HH:MM` → `auctionDateType = "leilao_1praca"`.
  - "2ª Praça" próximo a `DD/MM/AAAA HH:MM` → se 1ª já passou, usa 2ª como ativa.
  - Para "Licitação Aberta": "encerramento" / "prazo final" próximo a data → `auctionDateType = "licitacao_fim"`.
- Throttle: 2 req/s.
- Retry com backoff exponencial em 429/503 (3 tentativas, 2s/4s/8s).
- Falha definitiva: marca `scrapedAt = now()` mas deixa `auctionDate`/`auctionDateType` null + log.
- Idempotente, retomável.
- Estimativa: ~15k imóveis com leilão real × 0.6s = ~2.5h. Rodável em paralelo ao geocoding (serviços diferentes).

**Risco:** Caixa pode mudar HTML. Mitigações:
- Regex tolerantes (não dependem de classes CSS).
- Logs detalhados de falhas (URL + saleMode + amostra do HTML).
- Campo `scrapedAt` permite re-tentativa em massa: `UPDATE auction_items SET scraped_at = NULL` força reprocessamento.

### UI — lista (tabela desktop)

Adicionar coluna "Data" entre "Modalidade" e o botão "Detalhes" em [src/components/imoveis/property-table.tsx](src/components/imoveis/property-table.tsx):

- Se `auctionDate` definido: `DD/MM/AAAA` em destaque + label discreto abaixo (`1ª Praça` / `2ª Praça` / `Fim das propostas`).
- Se `auctionDateType === "continua"`: badge verde "Contínua".
- Se ambos null (ainda não processado): `-`.

### UI — card mobile

Em [src/components/imoveis/property-card.tsx](src/components/imoveis/property-card.tsx), adicionar label discreto abaixo do preço (para não competir com a foto):

- Data formatada se houver, ou "Contínua" se for o caso.

### UI — página de detalhe

Novo card na sidebar em [src/app/imoveis/[id]/page.tsx](src/app/imoveis/[id]/page.tsx) (novo componente `src/components/imoveis/auction-date-card.tsx`):

```
Detalhes do Leilão
─────────────────
Data: 15/06/2026 às 14h
Tipo: 1ª Praça
Modalidade: Leilão SFI - Edital Único
```

Para imóveis contínuos:

```
Detalhes do Leilão
─────────────────
Modalidade: Venda Direta Online
Disponível para compra direta até ser comercializado.
```

### UI — header global

Logo abaixo do badge "Caixa Econômica Federal" no hero, em texto pequeno e discreto:

```
Listagem atualizada em 22/05/2026
```

Vem da `ImportBatch` mais recente (ordenada por `createdAt desc`). Carregado server-side via uma nova função `getLatestImportBatch()`.

### Arquivos novos

- `scripts/scrape-auction-dates.ts`
- `src/components/imoveis/auction-date-card.tsx`

### Arquivos tocados

- `prisma/schema.prisma`
- `src/lib/importers/caixaCsv.ts`
- `src/lib/importers/caixaImport.ts`
- `src/lib/auction-items.ts`
- `src/app/imoveis/page.tsx`
- `src/app/imoveis/[id]/page.tsx`
- `src/components/imoveis/property-table.tsx`
- `src/components/imoveis/property-card.tsx`

## Ordem de implementação

Cada fase é shippable independente.

1. **Schema migration** — adiciona todas as 6 colunas em `AuctionItem` + cria `ImportBatch`. Migration única. App não muda.
2. **Feature 1 (header dinâmico)** — refator de `getPropertySummary` + uso em `page.tsx`. Sem deps, shippable sozinho.
3. **CSV parser + ImportBatch** — extrai `generatedAt`, popula `ImportBatch`. Header global ganha "Listagem atualizada em".
4. **Geocoding job** — script + roda inicial em background. Mapa ainda não existe.
5. **Map view** — componente Leaflet, toggle Lista/Mapa, `getPropertiesForMap`. Funciona com qualquer subset que já tenha coords.
6. **Scraping job** — script + roda inicial em background.
7. **UI da data de leilão** — coluna na tabela + card no detalhe + label no card mobile.

## Pontos não cobertos (fora de escopo)

- **Parsing estruturado do campo `description`** — o CSV traz tipo (Casa/Apartamento), áreas, quartos, vagas dentro da descrição. Poderia virar filtros muito úteis, mas adiciona escopo significativo. Adiar.
- **Refresh automático dos jobs** — primeira versão será triggered manualmente após cada import. Coolify cron pode ser adicionado depois.
- **Cache de tiles do mapa** — Leaflet usa cache do browser; pra produção pesada, considerar self-hosted tiles. Não é urgente.
- **Mapa em mobile com gestos avançados** (drag-to-search, etc.) — feature-creep. Mantém touch básico do Leaflet.
