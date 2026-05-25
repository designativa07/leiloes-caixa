# Header dinâmico, mapa e data de leilão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar header com stats filtradas, toggle Lista/Mapa com Leaflet, e exibição de data de leilão (scrapeada da Caixa).

**Architecture:** Migration única adiciona 6 colunas em `AuctionItem` (lat/lng/geocodedAt/auctionDate/auctionDateType/scrapedAt) + nova model `ImportBatch`. Two background scripts (`geocode-properties.ts` e `scrape-auction-dates.ts`) populam dados progressivamente; app trata `null` graciosamente. UI ganha toggle Lista/Mapa controlado por query param.

**Tech Stack:** Next.js 16, Prisma 7 (Postgres via `db:push`, sem migrations), Leaflet + react-leaflet + leaflet.markercluster, Nominatim para geocoding, fetch + regex para scraping.

**Notas para o implementador:**
- O projeto não usa test framework. Não introduzir Jest/Vitest. Para lógica crítica (parser de data, regex de scraping), criar pequenos scripts `scripts/verify-*.ts` rodáveis com `tsx`.
- Prisma usa `db:push` (não migrations). Mudanças de schema são aplicadas com `npm run db:push`.
- Dev server roda na porta 3060 (`npm run dev`).
- Após mudanças em schema, **sempre** rodar `npm run db:generate` antes de continuar.
- Cliente Prisma gerado em `src/generated/prisma`.
- Todos os commits seguem o padrão dos últimos: minúsculas, com tipo (feat/fix/chore), sem aspas, ex: `feat: header stats reflete filtros ativos`.

---

## Task 1: Schema — adicionar colunas e ImportBatch

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Editar `prisma/schema.prisma` — adicionar campos em `AuctionItem`**

Substituir o bloco `model AuctionItem { ... }` (linhas 92-118) por:

```prisma
model AuctionItem {
  id              Int        @id @default(autoincrement())
  source          String
  category        String
  externalId      String     @map("external_id")
  state           String
  city            String
  district        String
  address         String
  price           Decimal    @db.Decimal(14, 2)
  appraisalValue  Decimal?   @map("appraisal_value") @db.Decimal(14, 2)
  discountPercent Decimal?   @map("discount_percent") @db.Decimal(5, 2)
  allowsFinancing Boolean    @default(false) @map("allows_financing")
  description     String     @db.Text
  saleMode        String     @map("sale_mode")
  sourceUrl       String     @map("source_url") @db.Text
  importBatch     String     @map("import_batch")
  latitude        Float?
  longitude       Float?
  geocodedAt      DateTime?  @map("geocoded_at")
  auctionDate     DateTime?  @map("auction_date")
  auctionDateType String?    @map("auction_date_type")
  scrapedAt       DateTime?  @map("scraped_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  favorites       Favorite[]

  @@unique([source, category, externalId])
  @@index([city])
  @@index([saleMode])
  @@index([price])
  @@index([latitude, longitude])
  @@index([auctionDate])
  @@map("auction_items")
}
```

- [ ] **Step 2: Adicionar nova model `ImportBatch` ao final do arquivo**

Adicionar após o bloco `AuctionItem`:

```prisma
model ImportBatch {
  id          String   @id @default(cuid())
  source      String
  generatedAt DateTime @map("generated_at")
  itemCount   Int      @map("item_count")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("import_batches")
}
```

- [ ] **Step 3: Aplicar schema no DB**

Run: `npm run db:push`
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Regenerar cliente Prisma**

Run: `npm run db:generate`
Expected: `Generated Prisma Client...`

- [ ] **Step 5: Validar que o cliente compila**

Run: `npx tsc --noEmit`
Expected: Sem erros. (Pode haver warnings de imports não usados em arquivos não tocados — ignorar.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/generated/prisma
git commit -m "feat: schema lat/lng + auction date + import_batches"
```

---

## Task 2: Header dinâmico — stats refletem filtros

**Files:**
- Modify: `src/lib/auction-items.ts`
- Modify: `src/app/imoveis/page.tsx`

- [ ] **Step 1: Modificar `getPropertySummary` para aceitar filtros**

Em `src/lib/auction-items.ts`, substituir a função `getPropertySummary` (linhas 172-188) por:

```ts
export async function getPropertySummary(filters?: PropertyListFilters) {
  const where = filters
    ? buildAuctionItemWhere(filters)
    : { source: "caixa", category: "imovel" };

  const [count, cheapest] = await Promise.all([
    db.auctionItem.count({ where }),
    db.auctionItem.findFirst({
      where,
      orderBy: { price: "asc" },
      select: { price: true },
    }),
  ]);

  return {
    count,
    cheapestPrice: cheapest?.price ? Number(cheapest.price) : null,
  };
}
```

- [ ] **Step 2: Adicionar helper `hasActiveFilters` no mesmo arquivo**

Após `getPropertySummary`, adicionar:

```ts
export function hasActiveFilters(filters: PropertyListFilters): boolean {
  const n = normalizeFilters(filters);
  return Boolean(
    n.search || n.state || n.city || n.saleMode || n.financing || n.minPrice || n.maxPrice,
  );
}
```

(Note: `sort` e `page` não contam — sort tem default e page é sempre presente.)

- [ ] **Step 3: Atualizar `src/app/imoveis/page.tsx` para passar filtros e label dinâmico**

Substituir a chamada `getPropertySummary()` (linha 37) por `getPropertySummary(filters)`.

Importar `hasActiveFilters` no topo (adicionar na linha 6):

```ts
import { getPropertyFilterOptions, getPropertyList, getPropertySummary, hasActiveFilters, normalizeFilters } from "@/lib/auction-items";
```

Logo após `const normalizedFilters = normalizeFilters(filters);` (linha 40), adicionar:

```ts
const filtersActive = hasActiveFilters(filters);
const totalLabel = filtersActive ? "Resultados encontrados" : "Total de Imóveis";
const cheapestLabel = filtersActive ? "Menor preço (filtros)" : "A partir de";
```

Substituir nos dois cards (linhas 98 e 103):
- `Total de Imóveis` → `{totalLabel}`
- `A partir de` → `{cheapestLabel}`

- [ ] **Step 4: Verificar tipos compilam**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 5: Verificar no browser**

Run em background: `npm run dev`
Abrir `http://localhost:3060/imoveis`:
- Sem filtros: deve mostrar "Total de Imóveis: 29.830" e "A partir de: R$ 6.200,00"
- Com filtro `?state=SC`: deve mostrar "Resultados encontrados: <N>" e "Menor preço (filtros): R$ <valor>"
- Verificar que ao limpar filtros, labels voltam ao original

- [ ] **Step 6: Commit**

```bash
git add src/lib/auction-items.ts src/app/imoveis/page.tsx
git commit -m "feat: stats do hero refletem filtros aplicados"
```

---

## Task 3: CSV parser — extrair generatedAt e popular ImportBatch

**Files:**
- Modify: `src/lib/importers/caixaCsv.ts`
- Modify: `src/lib/importers/caixaImport.ts`
- Modify: `src/lib/auction-items.ts`
- Modify: `src/app/imoveis/page.tsx`
- Create: `scripts/verify-csv-parser.ts`

- [ ] **Step 1: Criar verificador do parser ANTES de modificar**

Criar `scripts/verify-csv-parser.ts`:

```ts
import { parseCaixaCsvContent } from "../src/lib/importers/caixaCsv";

const sample = `Lista de Imóveis da Caixa;;Data de geração:;22/05/2026;;;;;;;
 N° do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;Financiamento;Descrição;Modalidade de venda;Link de acesso

 1444411617560 ;SC ;ABELARDO LUZ ;CENTRO ;R BAHIA, N. 569, QD 14 LT 22 ;500.000,00;500.000,00;0.00;Não;Casa, 0.00 de área total.;Leilão SFI - Edital Único;https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=1444411617560
`;

const result = parseCaixaCsvContent(sample);

if (!result.generatedAt) {
  console.error("FAIL: generatedAt ausente");
  process.exit(1);
}

const dateStr = result.generatedAt.toISOString().slice(0, 10);
if (dateStr !== "2026-05-22") {
  console.error(`FAIL: generatedAt esperado 2026-05-22, recebido ${dateStr}`);
  process.exit(1);
}

if (result.items.length !== 1) {
  console.error(`FAIL: esperado 1 item, recebido ${result.items.length}`);
  process.exit(1);
}

if (result.items[0].externalId !== "1444411617560") {
  console.error(`FAIL: externalId errado: ${result.items[0].externalId}`);
  process.exit(1);
}

console.log("OK: parser extrai generatedAt e items corretamente.");
```

- [ ] **Step 2: Rodar o verificador — deve falhar pois `parseCaixaCsvContent` ainda retorna array**

Run: `npx tsx scripts/verify-csv-parser.ts`
Expected: Erro de tipo (`result.generatedAt` não existe em `ParsedAuctionItem[]`), ou crash.

- [ ] **Step 3: Modificar `src/lib/importers/caixaCsv.ts` para extrair data e mudar tipo de retorno**

Adicionar logo após `import { readFile }` (linha 3):

```ts
const GENERATED_AT_REGEX = /Data de gera[çc][ãa]o[^0-9]*?(\d{2})\/(\d{2})\/(\d{4})/i;

function parseGeneratedAt(headerLine: string): Date {
  const match = headerLine.match(GENERATED_AT_REGEX);
  if (!match) {
    throw new Error(`Cabecalho do CSV nao contem 'Data de geracao': ${headerLine.slice(0, 100)}`);
  }
  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}
```

Modificar `parseCaixaCsvFile` (linhas 94-97) para retornar o novo formato:

```ts
export async function parseCaixaCsvFile(filePath: string): Promise<{ generatedAt: Date; items: ParsedAuctionItem[] }> {
  const fileContent = await readFile(filePath, "latin1");
  return parseCaixaCsvContent(fileContent);
}
```

Modificar `parseCaixaCsvContent` (linha 99) — mudar a assinatura e capturar a primeira linha antes do `slice(3)`:

```ts
export function parseCaixaCsvContent(fileContent: string): { generatedAt: Date; items: ParsedAuctionItem[] } {
  const rows = parse(fileContent, {
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: false,
  }) as string[][];

  const firstLine = rows[0]?.join(";") ?? "";
  const generatedAt = parseGeneratedAt(firstLine);

  const dataRows = rows.slice(3).filter((row) => row.some((cell) => normalizeText(cell ?? "") !== ""));

  const items = dataRows.map((row, index) => {
    // ...corpo existente do map, sem alterações...
  });

  return { generatedAt, items };
}
```

(Não esquecer de manter o corpo do `.map` igual ao atual — só está sendo extraído para `items` em vez de retorno direto.)

- [ ] **Step 4: Rodar o verificador — deve passar**

Run: `npx tsx scripts/verify-csv-parser.ts`
Expected: `OK: parser extrai generatedAt e items corretamente.`

- [ ] **Step 5: Atualizar `src/lib/importers/caixaImport.ts` para criar `ImportBatch`**

Substituir as três funções `replaceCaixaAuctionItemsFromFile`, `replaceCaixaAuctionItemsFromContent` e `replaceCaixaAuctionItemsFromUrl` para passar o objeto inteiro:

```ts
export async function replaceCaixaAuctionItemsFromFile(filePath: string) {
  const parsed = await parseCaixaCsvFile(filePath);
  return replaceCaixaAuctionItems(parsed);
}

export async function replaceCaixaAuctionItemsFromContent(fileContent: string) {
  const parsed = parseCaixaCsvContent(fileContent);
  return replaceCaixaAuctionItems(parsed);
}

export async function replaceCaixaAuctionItemsFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao baixar a lista da Caixa: ${response.statusText} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const decoder = new TextDecoder("iso-8859-1");
  const fileContent = decoder.decode(arrayBuffer);
  return replaceCaixaAuctionItemsFromContent(fileContent);
}
```

Substituir `replaceCaixaAuctionItems` (linhas 27-57) por:

```ts
async function replaceCaixaAuctionItems(
  parsed: { generatedAt: Date; items: Awaited<ReturnType<typeof parseCaixaCsvFile>>["items"] },
) {
  const { generatedAt, items } = parsed;
  const importBatch = `caixa-import-${new Date().toISOString()}`;

  await db.auctionItem.deleteMany({
    where: { source: "caixa", category: "imovel" },
  });

  const chunkSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await db.auctionItem.createMany({
      data: chunk.map((item) => ({ ...item, importBatch })),
    });
    totalInserted += chunk.length;
  }

  await db.importBatch.create({
    data: {
      source: "caixa",
      generatedAt,
      itemCount: totalInserted,
    },
  });

  try {
    await sendEmailAlerts();
  } catch (err) {
    console.error("Email alerts failed (non-fatal):", err);
  }

  return { count: totalInserted, importBatch, generatedAt };
}
```

- [ ] **Step 6: Adicionar `getLatestImportBatch` em `src/lib/auction-items.ts`**

Adicionar ao final do arquivo:

```ts
export async function getLatestImportBatch() {
  return db.importBatch.findFirst({
    where: { source: "caixa" },
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **Step 7: Exibir "Listagem atualizada em" no hero**

Em `src/app/imoveis/page.tsx`, importar a função (linha 6):

```ts
import { getLatestImportBatch, getPropertyFilterOptions, getPropertyList, getPropertySummary, hasActiveFilters, normalizeFilters } from "@/lib/auction-items";
```

Adicionar `getLatestImportBatch()` no `Promise.all` (linha 34):

```ts
const [options, result, summary, latestBatch] = await Promise.all([
  getPropertyFilterOptions(),
  getPropertyList(filters),
  getPropertySummary(filters),
  getLatestImportBatch(),
]);
```

Logo abaixo do `<span className="badge">Caixa Econômica Federal</span>` (linha 90), adicionar:

```tsx
{latestBatch && (
  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
    Listagem atualizada em {new Date(latestBatch.generatedAt).toLocaleDateString("pt-BR")}
  </div>
)}
```

- [ ] **Step 8: Popular ImportBatch para a importação atual (one-shot)**

Como a base atual foi importada antes da criação da `ImportBatch`, criar um seed manual:

Criar `scripts/seed-import-batch.ts`:

```ts
import { db } from "../src/lib/db";

async function main() {
  const existing = await db.importBatch.findFirst({ where: { source: "caixa" } });
  if (existing) {
    console.log("ImportBatch já existe, pulando seed.");
    return;
  }

  const count = await db.auctionItem.count({
    where: { source: "caixa", category: "imovel" },
  });

  const newest = await db.auctionItem.findFirst({
    where: { source: "caixa", category: "imovel" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  await db.importBatch.create({
    data: {
      source: "caixa",
      generatedAt: newest?.createdAt ?? new Date(),
      itemCount: count,
    },
  });

  console.log(`Seed criou ImportBatch com ${count} items, generatedAt=${newest?.createdAt?.toISOString()}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
```

Run: `npx tsx scripts/seed-import-batch.ts`
Expected: `Seed criou ImportBatch com 29830 items, generatedAt=...`

- [ ] **Step 9: Verificar no browser**

Run em background: `npm run dev` (se não estiver rodando)
Abrir `http://localhost:3060/imoveis`:
- Deve mostrar "Listagem atualizada em DD/MM/AAAA" logo abaixo do badge "Caixa Econômica Federal"

- [ ] **Step 10: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 11: Commit**

```bash
git add src/lib/importers/caixaCsv.ts src/lib/importers/caixaImport.ts src/lib/auction-items.ts src/app/imoveis/page.tsx scripts/verify-csv-parser.ts scripts/seed-import-batch.ts
git commit -m "feat: parser extrai data de geracao + import_batch no hero"
```

---

## Task 4: Geocoding job

**Files:**
- Create: `scripts/geocode-properties.ts`

- [ ] **Step 1: Criar `scripts/geocode-properties.ts`**

```ts
import { db } from "../src/lib/db";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "leilaodb/1.0 (contato@designa.tec.br)";
const THROTTLE_MS = 1100;
const BATCH_SIZE = 100;

type NominatimResult = { lat: string; lon: string };

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(address: string, city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  const q = `${address}, ${city}, ${state}, Brasil`;
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      console.warn(`HTTP ${response.status} para "${q}"`);
      return null;
    }
    const data = (await response.json()) as NominatimResult[];
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) {
    console.warn(`Falha geocodando "${q}":`, (err as Error).message);
    return null;
  }
}

async function main() {
  let processed = 0;
  let geocoded = 0;
  let failed = 0;

  while (true) {
    const batch = await db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel", geocodedAt: null },
      select: { id: true, address: true, city: true, state: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    for (const item of batch) {
      const result = await geocode(item.address, item.city, item.state);
      const now = new Date();

      if (result) {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { latitude: result.lat, longitude: result.lon, geocodedAt: now },
        });
        geocoded++;
      } else {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { geocodedAt: now },
        });
        failed++;
      }

      processed++;
      if (processed % 50 === 0) {
        console.log(`Processados: ${processed} (geocodados: ${geocoded}, falhas: ${failed})`);
      }

      await sleep(THROTTLE_MS);
    }
  }

  console.log(`\nFinalizado. Total: ${processed}, geocodados: ${geocoded}, falhas: ${failed}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
```

- [ ] **Step 2: Adicionar script no `package.json`**

Em `package.json`, na seção `scripts`, adicionar logo após `"import:caixa"`:

```json
"geocode": "tsx scripts/geocode-properties.ts",
```

- [ ] **Step 3: Testar com SIGINT (rodar 30s, interromper, verificar persistência)**

Run em background: `npm run geocode`
Aguardar ~30 segundos. Interromper com Ctrl+C.

Verificar no DB que alguns imóveis foram geocodados:

```bash
npx tsx -e "import('./src/lib/db.js').then(async ({db}) => { const n = await db.auctionItem.count({where:{geocodedAt:{not:null}}}); console.log('Geocodados:', n); await db.\$disconnect(); })"
```

Expected: número > 0 e < 50.

- [ ] **Step 4: Rodar em background completo (longa duração)**

Run: `npm run geocode` em background, deixar rodando ~10 horas. Pode prosseguir com as próximas tasks em paralelo — Map view só precisa de _alguns_ pontos pra demonstrar funcionalidade.

- [ ] **Step 5: Commit**

```bash
git add scripts/geocode-properties.ts package.json
git commit -m "feat: script de geocoding com nominatim e throttle"
```

---

## Task 5: Mapa — instalar deps e configurar Leaflet

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Instalar dependências do Leaflet**

Run: `npm install leaflet react-leaflet leaflet.markercluster`
Expected: `added X packages...`

- [ ] **Step 2: Instalar tipos**

Run: `npm install -D @types/leaflet @types/leaflet.markercluster`
Expected: `added X packages...`

- [ ] **Step 3: Importar CSS do Leaflet no layout global**

Abrir `src/app/layout.tsx` e adicionar no topo (após outros imports CSS, se houver):

```ts
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
```

- [ ] **Step 4: Verificar build não quebra**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/layout.tsx
git commit -m "chore: adiciona leaflet + react-leaflet + markercluster"
```

---

## Task 6: Componente PropertyMap

**Files:**
- Create: `src/components/imoveis/property-map.tsx`
- Modify: `src/lib/auction-items.ts`

- [ ] **Step 1: Adicionar `getPropertiesForMap` em `src/lib/auction-items.ts`**

Adicionar ao final do arquivo:

```ts
const MAP_HARD_LIMIT = 2000;

export type MapProperty = {
  id: number;
  externalId: string;
  address: string;
  city: string;
  price: number;
  discountPercent: number | null;
  latitude: number;
  longitude: number;
};

export async function getPropertiesForMap(filters: PropertyListFilters): Promise<{ items: MapProperty[]; truncated: boolean; totalWithCoords: number }> {
  const baseWhere = buildAuctionItemWhere(filters);
  const where = {
    AND: [
      ...(Array.isArray((baseWhere as { AND?: unknown[] }).AND) ? (baseWhere as { AND: unknown[] }).AND : [baseWhere]),
      { latitude: { not: null } },
      { longitude: { not: null } },
    ],
  } as Prisma.AuctionItemWhereInput;

  const [rows, totalWithCoords] = await Promise.all([
    db.auctionItem.findMany({
      where,
      select: {
        id: true,
        externalId: true,
        address: true,
        city: true,
        price: true,
        discountPercent: true,
        latitude: true,
        longitude: true,
      },
      take: MAP_HARD_LIMIT,
    }),
    db.auctionItem.count({ where }),
  ]);

  const items: MapProperty[] = rows.map((r) => ({
    id: r.id,
    externalId: r.externalId,
    address: r.address,
    city: r.city,
    price: Number(r.price),
    discountPercent: r.discountPercent ? Number(r.discountPercent) : null,
    latitude: r.latitude!,
    longitude: r.longitude!,
  }));

  return {
    items,
    truncated: totalWithCoords > MAP_HARD_LIMIT,
    totalWithCoords,
  };
}
```

- [ ] **Step 2: Criar `src/components/imoveis/property-map.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";

import { formatCurrency, formatPercent, getPropertyImage } from "@/lib/format";
import type { MapProperty } from "@/lib/auction-items";
import type * as LType from "leaflet";

type Props = {
  items: MapProperty[];
  truncated: boolean;
  totalWithCoords: number;
};

export function PropertyMap({ items, truncated, totalWithCoords }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!containerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current);
      mapInstanceRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (items.length === 0) {
        map.setView([-14.235, -51.9253], 4);
        return;
      }

      const cluster = (L as unknown as { markerClusterGroup: () => LType.LayerGroup }).markerClusterGroup();

      const markers = items.map((item) => {
        const marker = L.marker([item.latitude, item.longitude]);
        const popupHtml = `
          <div style="min-width:180px;">
            <img src="${getPropertyImage(item.externalId)}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none';" />
            <div style="font-weight:700;font-size:0.85rem;line-height:1.3;margin-bottom:4px;">${escapeHtml(item.address)}</div>
            <div style="font-size:0.75rem;color:#666;margin-bottom:6px;">${escapeHtml(item.city)}</div>
            <div style="font-weight:700;color:#16a34a;margin-bottom:2px;">${formatCurrency(item.price)}</div>
            ${item.discountPercent ? `<div style="font-size:0.75rem;color:#16a34a;">${formatPercent(item.discountPercent)} OFF</div>` : ""}
            <a href="/imoveis/${item.id}" style="display:inline-block;margin-top:8px;color:#2563eb;font-size:0.8rem;font-weight:600;text-decoration:none;">Ver detalhes →</a>
          </div>
        `;
        marker.bindPopup(popupHtml);
        cluster.addLayer(marker);
        return marker;
      });

      map.addLayer(cluster);

      const bounds = L.featureGroup(markers).getBounds();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    setup();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items]);

  return (
    <div>
      {truncated && (
        <div style={{
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fbbf24",
          padding: "10px 14px",
          borderRadius: "10px",
          fontSize: "0.85rem",
          marginBottom: 12,
        }}>
          Mostrando 2000 de {totalWithCoords.toLocaleString("pt-BR")} imóveis no mapa. Refine os filtros para ver todos.
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      />
      {items.length === 0 && (
        <div className="muted" style={{ marginTop: 12, textAlign: "center" }}>
          Nenhum imóvel com coordenadas para os filtros atuais. O geocoding pode ainda estar em andamento.
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: Sem erros. (Se aparecer erro de typing em `markerClusterGroup`, é coberto pelo cast em `as unknown as ...`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/imoveis/property-map.tsx src/lib/auction-items.ts
git commit -m "feat: componente PropertyMap com leaflet + clustering"
```

---

## Task 7: View toggle Lista/Mapa

**Files:**
- Create: `src/components/imoveis/view-toggle.tsx`
- Modify: `src/app/imoveis/page.tsx`

- [ ] **Step 1: Criar `src/components/imoveis/view-toggle.tsx`**

```tsx
import Link from "next/link";

import { buildPageHref } from "@/lib/format";

type Props = {
  currentView: "list" | "map";
  filters: Record<string, string | undefined>;
};

export function ViewToggle({ currentView, filters }: Props) {
  const baseFilters = { ...filters, page: "1" };
  const listHref = buildPageHref("/imoveis", { ...baseFilters, view: undefined });
  const mapHref = buildPageHref("/imoveis", { ...baseFilters, view: "map" });

  return (
    <div style={{
      display: "inline-flex",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "4px",
      gap: "2px",
    }}>
      <Link href={listHref} style={toggleStyle(currentView === "list")}>
        📋 Lista
      </Link>
      <Link href={mapHref} style={toggleStyle(currentView === "map")}>
        🗺️ Mapa
      </Link>
    </div>
  );
}

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: "9px",
    fontSize: "0.88rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s",
    color: active ? "#fff" : "rgba(255,255,255,0.6)",
    background: active ? "rgba(37,99,235,0.5)" : "transparent",
  };
}
```

- [ ] **Step 2: Integrar ViewToggle e PropertyMap em `src/app/imoveis/page.tsx`**

Atualizar imports (linha 1-7):

```ts
import Link from "next/link";

import { PropertyCard } from "@/components/imoveis/property-card";
import { PropertyFilters } from "@/components/imoveis/filters";
import { PropertyTable } from "@/components/imoveis/property-table";
import { PropertyMap } from "@/components/imoveis/property-map";
import { ViewToggle } from "@/components/imoveis/view-toggle";
import { getLatestImportBatch, getPropertiesForMap, getPropertyFilterOptions, getPropertyList, getPropertySummary, hasActiveFilters, normalizeFilters } from "@/lib/auction-items";
import { buildPageHref, formatCurrency } from "@/lib/format";
```

Adicionar `view` no objeto `filters` (linha 22-32):

```ts
const filters = {
  search: getSingleValue(resolvedSearchParams.search),
  state: getSingleValue(resolvedSearchParams.state),
  city: getSingleValue(resolvedSearchParams.city),
  saleMode: getSingleValue(resolvedSearchParams.saleMode),
  financing: getSingleValue(resolvedSearchParams.financing),
  minPrice: getSingleValue(resolvedSearchParams.minPrice),
  maxPrice: getSingleValue(resolvedSearchParams.maxPrice),
  sort: getSingleValue(resolvedSearchParams.sort),
  page: getSingleValue(resolvedSearchParams.page),
};

const view: "list" | "map" = getSingleValue(resolvedSearchParams.view) === "map" ? "map" : "list";
```

Atualizar o Promise.all para incluir map data condicionalmente:

```ts
const [options, result, summary, latestBatch, mapData] = await Promise.all([
  getPropertyFilterOptions(),
  getPropertyList(filters),
  getPropertySummary(filters),
  getLatestImportBatch(),
  view === "map" ? getPropertiesForMap(filters) : Promise.resolve(null),
]);
```

No JSX, dentro do bloco `<section className="panel">` (linha 118), modificar o `<div className="panel-header">` para incluir o toggle:

```tsx
<div className="panel-header">
  <div>
    <h2 className="section-title">Resultados</h2>
    <div className="muted">
      {result.total} imoveis encontrados. {view === "list" && `Pagina ${result.page} de ${result.totalPages}.`}
    </div>
  </div>
  <ViewToggle currentView={view} filters={normalizedFilters as Record<string, string | undefined>} />
</div>
```

Substituir o bloco que renderiza `mobile-only` + `desktop-only` + paginação por:

```tsx
{view === "map" && mapData ? (
  <PropertyMap items={mapData.items} truncated={mapData.truncated} totalWithCoords={mapData.totalWithCoords} />
) : result.items.length === 0 ? (
  <div className="muted">Nenhum imovel encontrado com os filtros atuais.</div>
) : (
  <>
    <div className="mobile-only">
      <div className="cards-grid">
        {result.items.map((item) => (
          <PropertyCard key={item.id} item={item} />
        ))}
      </div>
    </div>

    <div className="desktop-only">
      <PropertyTable items={result.items} filters={normalizedFilters} />
    </div>

    <nav className="pagination" aria-label="Paginacao" style={{ marginTop: 32, gap: 6 }}>
      {currentPage > 1 && (
        <Link
          className="pagination-link"
          href={buildPageLink(currentPage - 1)}
          title="Página Anterior"
          style={{ padding: "0 14px", minWidth: "auto" }}
        >
          &larr; Ant
        </Link>
      )}

      {pagesToShow.map((page, idx) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              ...
            </span>
          );
        }

        return (
          <Link
            key={page}
            className={`pagination-link ${page === currentPage ? "active" : ""}`.trim()}
            href={buildPageLink(page)}
          >
            {page}
          </Link>
        );
      })}

      {currentPage < totalPages && (
        <Link
          className="pagination-link"
          href={buildPageLink(currentPage + 1)}
          title="Próxima Página"
          style={{ padding: "0 14px", minWidth: "auto" }}
        >
          Próx &rarr;
        </Link>
      )}
    </nav>
  </>
)}
```

(O conteúdo da paginação acima é idêntico ao que já existe nas linhas 144-197 do arquivo atual — basta deixá-lo intacto.) `buildPageLink`, `currentPage`, `totalPages` e `pagesToShow` já estão definidos acima no arquivo, não precisam de mudança.

- [ ] **Step 3: Garantir que `panel-header` permita o toggle ao lado**

Verificar visualmente que o toggle aparece. Se o CSS atual de `.panel-header` não suporta dois elementos (ex: usa `flex-direction: column`), adicionar style inline:

```tsx
<div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 5: Verificar no browser**

Run em background: `npm run dev`
- Abrir `http://localhost:3060/imoveis` → modo lista funciona normal
- Clicar em "Mapa" → URL muda para `?view=map`, mapa carrega
- Aplicar filtro (ex: estado=SC) → mapa atualiza, bounding box ajusta para SC
- Clicar em um pin → popup aparece com foto, endereço, preço, link "Ver detalhes"
- Clicar em "Lista" → volta pra tabela mantendo filtros

(Se geocoding ainda não rodou em quantidade suficiente, mapa pode aparecer vazio. Aceitável durante implementação.)

- [ ] **Step 6: Commit**

```bash
git add src/components/imoveis/view-toggle.tsx src/app/imoveis/page.tsx
git commit -m "feat: toggle Lista/Mapa com visualizacao Leaflet"
```

---

## Task 8: Scraping de data de leilão

**Files:**
- Create: `scripts/auction-date-parser.ts` (função pura, sem side effects)
- Create: `scripts/scrape-auction-dates.ts`
- Create: `scripts/verify-scrape-regex.ts`

- [ ] **Step 1: Criar `scripts/auction-date-parser.ts` (módulo puro)**

```ts
const DATE_PATTERN = String.raw`(\d{2})\/(\d{2})\/(\d{4})(?:[^0-9]+(?:às\s+)?(\d{1,2}):(\d{2}))?`;
const PRACA_1_REGEX = new RegExp(`1[ªa]\\s*Pra[çc]a[^0-9]*?${DATE_PATTERN}`, "i");
const PRACA_2_REGEX = new RegExp(`2[ªa]\\s*Pra[çc]a[^0-9]*?${DATE_PATTERN}`, "i");
const LICITACAO_REGEX = new RegExp(`(?:prazo\\s+final|encerramento|fim\\s+do\\s+prazo)[^0-9]*?${DATE_PATTERN}`, "i");

export type AuctionInfo = { date: Date | null; type: string | null };

function buildDate(match: RegExpMatchArray): Date {
  const [, day, month, year, hour, minute] = match;
  const h = hour ?? "00";
  const m = minute ?? "00";
  return new Date(`${year}-${month}-${day}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`);
}

export function extractAuctionInfo(html: string, now: Date = new Date()): AuctionInfo {
  const m1 = html.match(PRACA_1_REGEX);
  const m2 = html.match(PRACA_2_REGEX);

  if (m1) {
    const date1 = buildDate(m1);
    if (date1 > now) return { date: date1, type: "leilao_1praca" };
    if (m2) {
      const date2 = buildDate(m2);
      return { date: date2, type: "leilao_2praca" };
    }
    return { date: date1, type: "leilao_1praca" };
  }

  if (m2) {
    return { date: buildDate(m2), type: "leilao_2praca" };
  }

  const ml = html.match(LICITACAO_REGEX);
  if (ml) {
    return { date: buildDate(ml), type: "licitacao_fim" };
  }

  return { date: null, type: null };
}

export function isContinuousSaleMode(saleMode: string): boolean {
  const m = saleMode.toLowerCase();
  return m.startsWith("venda direta") || m === "venda online";
}
```

- [ ] **Step 2: Criar verificador com amostras de HTML**

Criar `scripts/verify-scrape-regex.ts`:

```ts
import { extractAuctionInfo } from "./auction-date-parser";

const fixedNow = new Date("2026-05-01T00:00:00");

const samples: { name: string; html: string; expected: { dateISO: string | null; type: string | null } }[] = [
  {
    name: "Leilao SFI 1a Praca futura",
    html: `<html><body>1ª Praça: 15/06/2026 às 14:00 horas</body></html>`,
    expected: { dateISO: "2026-06-15T14:00:00.000Z", type: "leilao_1praca" },
  },
  {
    name: "Leilao SFI 2a Praca",
    html: `<html><body>2ª Praça: 22/06/2026 às 14:00 horas</body></html>`,
    expected: { dateISO: "2026-06-22T14:00:00.000Z", type: "leilao_2praca" },
  },
  {
    name: "Licitacao com prazo final",
    html: `<html><body>Prazo final para envio de propostas: 30/06/2026</body></html>`,
    expected: { dateISO: "2026-06-30T00:00:00.000Z", type: "licitacao_fim" },
  },
  {
    name: "HTML sem data",
    html: `<html><body>nada aqui</body></html>`,
    expected: { dateISO: null, type: null },
  },
];

let failures = 0;
for (const s of samples) {
  const result = extractAuctionInfo(s.html, fixedNow);
  // Comparamos em UTC; o construtor `new Date('YYYY-MM-DDTHH:mm:ss')` interpreta como horário local,
  // então o ISO virá com offset. Para o teste, usamos um Date fixo construído via UTC e comparamos a string ISO.
  const dateISO = result.date ? new Date(Date.UTC(
    result.date.getFullYear(), result.date.getMonth(), result.date.getDate(),
    result.date.getHours(), result.date.getMinutes(), result.date.getSeconds()
  )).toISOString() : null;
  if (dateISO !== s.expected.dateISO || result.type !== s.expected.type) {
    console.error(`FAIL [${s.name}]: esperado ${JSON.stringify(s.expected)}, recebido { dateISO: ${dateISO}, type: ${result.type} }`);
    failures++;
  } else {
    console.log(`OK [${s.name}]`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} falhas.`);
  process.exit(1);
}
console.log("\nTodos os casos passaram.");
```

- [ ] **Step 3: Criar `scripts/scrape-auction-dates.ts`**

```ts
import { db } from "../src/lib/db";
import { extractAuctionInfo, isContinuousSaleMode } from "./auction-date-parser";

const THROTTLE_MS = 500;
const BATCH_SIZE = 100;
const USER_AGENT = "leilaodb/1.0 (contato@designa.tec.br)";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) return await response.text();
      if (response.status === 429 || response.status === 503) {
        await sleep(2000 * Math.pow(2, i));
        continue;
      }
      return null;
    } catch {
      if (i === retries - 1) return null;
      await sleep(2000 * Math.pow(2, i));
    }
  }
  return null;
}

async function main() {
  let processed = 0;
  let scraped = 0;
  let marked_continuous = 0;
  let failed = 0;

  while (true) {
    const batch = await db.auctionItem.findMany({
      where: { source: "caixa", category: "imovel", scrapedAt: null },
      select: { id: true, sourceUrl: true, saleMode: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    for (const item of batch) {
      const now = new Date();

      if (isContinuousSaleMode(item.saleMode)) {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { auctionDateType: "continua", scrapedAt: now },
        });
        marked_continuous++;
        processed++;
        continue;
      }

      const html = await fetchWithRetry(item.sourceUrl);
      if (!html) {
        await db.auctionItem.update({
          where: { id: item.id },
          data: { scrapedAt: now },
        });
        failed++;
      } else {
        const info = extractAuctionInfo(html);
        await db.auctionItem.update({
          where: { id: item.id },
          data: {
            auctionDate: info.date,
            auctionDateType: info.type,
            scrapedAt: now,
          },
        });
        if (info.date) scraped++;
        else failed++;
      }

      processed++;
      if (processed % 50 === 0) {
        console.log(`Processados: ${processed} (scraped: ${scraped}, contínuos: ${marked_continuous}, falhas: ${failed})`);
      }

      await sleep(THROTTLE_MS);
    }
  }

  console.log(`\nFinalizado. Total: ${processed}, scraped: ${scraped}, contínuos: ${marked_continuous}, falhas: ${failed}.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
```

- [ ] **Step 4: Rodar verificador de regex**

Run: `npx tsx scripts/verify-scrape-regex.ts`
Expected: `Todos os casos passaram.`

- [ ] **Step 5: Adicionar script no `package.json`**

Em `package.json` na seção `scripts`, após `"geocode"`:

```json
"scrape:dates": "tsx scripts/scrape-auction-dates.ts",
```

- [ ] **Step 6: Testar com SIGINT**

Run em background: `npm run scrape:dates`
Aguardar ~60 segundos. Interromper com Ctrl+C.

Verificar progresso:

```bash
npx tsx -e "import('./src/lib/db.js').then(async ({db}) => { const n = await db.auctionItem.count({where:{scrapedAt:{not:null}}}); const c = await db.auctionItem.count({where:{auctionDateType:'continua'}}); console.log('Scraped:', n, 'Continuos:', c); await db.\$disconnect(); })"
```

Expected: Scraped > 0, Contínuos > 0 (porque "Venda Direta" são marcados instantaneamente).

- [ ] **Step 7: Rodar em background completo**

Run: `npm run scrape:dates` em background, deixar concluir (~2.5h). Pode prosseguir com tasks 9 e 10 em paralelo.

- [ ] **Step 8: Commit**

```bash
git add scripts/auction-date-parser.ts scripts/scrape-auction-dates.ts scripts/verify-scrape-regex.ts package.json
git commit -m "feat: scraping de data de leilao da pagina da caixa"
```

---

## Task 9: UI da data — tabela e card mobile

**Files:**
- Create: `src/lib/format.ts` (modify, add formatter)
- Modify: `src/components/imoveis/property-table.tsx`
- Modify: `src/components/imoveis/property-card.tsx`

- [ ] **Step 1: Adicionar formatter de data de leilão em `src/lib/format.ts`**

Adicionar ao final do arquivo:

```ts
const AUCTION_TYPE_LABELS: Record<string, string> = {
  leilao_1praca: "1ª Praça",
  leilao_2praca: "2ª Praça",
  licitacao_fim: "Fim das propostas",
  continua: "Contínua",
};

export function formatAuctionDate(date: Date | null, type: string | null): { primary: string; secondary?: string; kind: "date" | "continua" | "none" } {
  if (type === "continua") {
    return { primary: "Contínua", kind: "continua" };
  }
  if (!date || !type) {
    return { primary: "-", kind: "none" };
  }
  const d = new Date(date);
  const primary = d.toLocaleDateString("pt-BR");
  const secondary = AUCTION_TYPE_LABELS[type] ?? type;
  return { primary, secondary, kind: "date" };
}
```

- [ ] **Step 2: Atualizar `src/components/imoveis/property-table.tsx` — adicionar coluna "Data"**

Em `src/components/imoveis/property-table.tsx`, importar o helper (linha 4):

```ts
import { buildPageHref, formatAuctionDate, formatCurrency, formatFinancing, formatPercent, getPropertyImage } from "@/lib/format";
```

Adicionar `<th>Data</th>` na thead entre "Modalidade" e o `<th></th>` final (após linha 66):

```tsx
<th>Modalidade</th>
<th>Data</th>
<th></th>
```

Adicionar `<td>` correspondente entre `{item.saleMode}` e o último `<td>` (após linha 99):

```tsx
<td>{item.saleMode}</td>
<td>
  {(() => {
    const auction = formatAuctionDate(item.auctionDate, item.auctionDateType);
    if (auction.kind === "continua") {
      return (
        <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "3px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
          Contínua
        </span>
      );
    }
    return (
      <>
        <strong style={{ fontSize: "0.9rem" }}>{auction.primary}</strong>
        {auction.secondary && <div className="muted" style={{ fontSize: "0.75rem" }}>{auction.secondary}</div>}
      </>
    );
  })()}
</td>
<td>
  <Link className="filters-clear" href={`/imoveis/${item.id}`}>
    Detalhes
  </Link>
</td>
```

- [ ] **Step 3: Atualizar `src/components/imoveis/property-card.tsx` — adicionar data discreta**

Importar o helper (linha 4):

```ts
import { formatAuctionDate, formatCurrency, formatFinancing, formatPercent, getPropertyImage } from "@/lib/format";
```

Dentro do `<div className="property-meta">` (linha 45-52), adicionar uma nova entry após o "Modalidade":

```tsx
<div className="property-meta">
  <div>
    <span className="muted font-small">Cód:</span> <span className="font-small">{item.externalId}</span>
  </div>
  <div>
    <span className="muted font-small">Modalidade:</span> <span className="font-small">{item.saleMode}</span>
  </div>
  {(() => {
    const auction = formatAuctionDate(item.auctionDate, item.auctionDateType);
    if (auction.kind === "none") return null;
    return (
      <div>
        <span className="muted font-small">Leilão:</span>{" "}
        <span className="font-small">
          {auction.primary}
          {auction.secondary && ` (${auction.secondary})`}
        </span>
      </div>
    );
  })()}
</div>
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 5: Verificar no browser**

Run em background: `npm run dev`
- Lista desktop: nova coluna "Data" aparece. Imóveis ainda não scrapeados mostram "-". Imóveis "Venda Direta" mostram badge verde "Contínua". Imóveis com data mostram data + sub-label.
- Mobile/cards: linha "Leilão: ..." aparece quando dado existe; não aparece quando ainda não scrapeado.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts src/components/imoveis/property-table.tsx src/components/imoveis/property-card.tsx
git commit -m "feat: exibir data de leilao na tabela e cards"
```

---

## Task 10: UI da data — card no detalhe

**Files:**
- Create: `src/components/imoveis/auction-date-card.tsx`
- Modify: `src/app/imoveis/[id]/page.tsx`

- [ ] **Step 1: Criar `src/components/imoveis/auction-date-card.tsx`**

```tsx
import { formatAuctionDate } from "@/lib/format";

type Props = {
  auctionDate: Date | null;
  auctionDateType: string | null;
  saleMode: string;
};

export function AuctionDateCard({ auctionDate, auctionDateType, saleMode }: Props) {
  const info = formatAuctionDate(auctionDate, auctionDateType);

  return (
    <section className="detail-card">
      <h2 className="section-title">📅 Detalhes do Leilão</h2>

      {info.kind === "date" && (
        <div className="detail-list">
          <div>
            <span className="muted font-small">Data</span>
            <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#fbbf24" }}>
              {info.primary}
              {auctionDate && new Date(auctionDate).getHours() > 0 && (
                <span style={{ fontWeight: 500, fontSize: "1rem", marginLeft: 8 }}>
                  às {new Date(auctionDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="muted font-small">Tipo</span>
            <div style={{ fontWeight: 600 }}>{info.secondary}</div>
          </div>
          <div>
            <span className="muted font-small">Modalidade</span>
            <div style={{ fontWeight: 600 }}>{saleMode}</div>
          </div>
        </div>
      )}

      {info.kind === "continua" && (
        <div className="detail-list">
          <div>
            <span className="muted font-small">Modalidade</span>
            <div style={{ fontWeight: 700 }}>{saleMode}</div>
          </div>
          <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px", fontSize: "0.88rem", color: "#86efac" }}>
            Imóvel disponível para compra direta até ser comercializado. Não há data de leilão específica.
          </div>
        </div>
      )}

      {info.kind === "none" && (
        <div className="detail-list">
          <div>
            <span className="muted font-small">Modalidade</span>
            <div style={{ fontWeight: 700 }}>{saleMode}</div>
          </div>
          <div className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Data de leilão ainda não disponível. Consulte o anúncio oficial na Caixa.
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Integrar `AuctionDateCard` em `src/app/imoveis/[id]/page.tsx`**

Importar (linha 8, após `BackButton`):

```ts
import { AuctionDateCard } from "@/components/imoveis/auction-date-card";
```

Na sidebar (aside), antes do "Resumo" (linha 103), inserir:

```tsx
<AuctionDateCard
  auctionDate={item.auctionDate}
  auctionDateType={item.auctionDateType}
  saleMode={item.saleMode}
/>
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: Sem erros.

- [ ] **Step 4: Verificar no browser**

Run em background: `npm run dev`
Abrir um imóvel "Venda Direta": deve mostrar card com badge contínua.
Abrir um imóvel "Leilão SFI" com data scrapeada: deve mostrar data + tipo + modalidade.
Abrir um imóvel ainda não scrapeado: deve mostrar só modalidade + aviso "ainda não disponível".

- [ ] **Step 5: Commit**

```bash
git add src/components/imoveis/auction-date-card.tsx src/app/imoveis/[id]/page.tsx
git commit -m "feat: card de detalhes do leilao na pagina do imovel"
```

---

## Verificação final (depois de todas as tasks)

- [ ] **Smoke test completo**

Run em background: `npm run dev`

1. Abrir `http://localhost:3060/imoveis` — header mostra "Listagem atualizada em DD/MM/AAAA" + stats globais
2. Aplicar filtro estado=SC, preço 100k-500k — header passa a mostrar "Resultados encontrados" e "Menor preço (filtros)"
3. Clicar em "Mapa" — mapa carrega, ajusta para SC, pins clusterizados
4. Clicar em um pin — popup aparece com foto, preço, link
5. Clicar em "Ver detalhes" no popup — vai pra página do imóvel, com card "Detalhes do Leilão"
6. Voltar pra lista — coluna "Data" no desktop, "Leilão: ..." no mobile

- [ ] **Verificar progresso dos jobs**

```bash
npx tsx -e "import('./src/lib/db.js').then(async ({db}) => { const total = await db.auctionItem.count(); const g = await db.auctionItem.count({where:{geocodedAt:{not:null}}}); const s = await db.auctionItem.count({where:{scrapedAt:{not:null}}}); console.log('Total:', total, 'Geocodados:', g, 'Scrapeados:', s); await db.\$disconnect(); })"
```

Se geocoding/scraping ainda não terminaram em 100%, isso é OK — app trata `null` graciosamente.
