# Travel BNPL

Солонгосын 20–30 насны залуучуудад Монголын багц аялал зарах mobile-first вэб апп: багц сонгох → 동행 бүлэгт нэгдэх → онгоцны билетийн төлбөрөөр суудал баталгаажуулах → үлдсэнийг явахаас өмнө 0%-ийн хуваан төлөлтөөр.

Repo: `hogjuulelt1-cmyk/Travel-APP`. Апп root-д байрлана.

## Демо горим

Одоогоор апп бүхэлдээ **mock** горимоор ажиллана: нэвтрэлт cookie (нэр л оруулна), захиалга cookie-д, Toss checkout нь `src/components/toss-checkout.tsx` дээрх дууриамал дэлгэц, бүлгийн гишүүд/чат `src/server/members.ts`-ийн mock өгөгдөл + localStorage. DB, Auth.js, Toss SDK ирэхээр `src/server/session.ts`, `actions.ts`, `catalog.ts` гурван файлыг л солино.

## Нэг файлт preview

`pnpm preview` (`tools/build-preview.ts`) — бүх демо урсгалыг (багц → нэгдэх → Toss checkout → 내 여행 → 동행 그룹) нэг статик HTML болгож гаргана; ижил `messages/*.json`, `seed/*.json`-оос уншина, `src/lib/art.ts` (зураглал, маршрутын зураг) болон `src/lib/matching.ts`-г esbuild-ээр bundle хийж ашиглана, төлөв localStorage-д. Vercel-гүйгээр хуваалцахад (claude.ai artifact, GitHub Pages г.м.) зориулсан.

## Ажиллуулах

```bash
pnpm install
pnpm db:generate          # Prisma client → src/generated/prisma
cp .env.example .env.local  # DATABASE_URL гэх мэт
pnpm dev
```

Шалгалт: `pnpm lint && pnpm typecheck && pnpm test` (+ `pnpm test:e2e` Playwright, iPhone 13 профайл). Stack, data model: `docs/tech-stack.md`; дараагийн алхмууд: `docs/roadmap.md` (M0 дууссан).
