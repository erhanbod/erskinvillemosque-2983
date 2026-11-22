# Auburn Prayer Screen — Design System

Digital signage board for a **portrait 1080 × 1920 TV** at Auburn Gallipoli Mosque.
Read at 3–6 metres, always on, no interaction. Everything is sized for glanceability.

Derived from the mosque website's prayer-times strip (navy field, faint geometric
tile pattern, gold rule under the active prayer, white numerals) and the white mosque logo.

## Canvas & scaling

- Design canvas is fixed at **1080 × 1920 px**. The whole board is rendered at that size and
  CSS-scaled (`transform: scale()`, `min(vw/1080, vh/1920)`) to fit whatever viewport it lands in,
  so a browser preview and the real TV are pixel-identical in proportion.
- Outer padding 56px. Vertical rhythm in multiples of 8.

## Colour

| Token | Value | Use |
|---|---|---|
| `--navy-950` | `#0a0f2b` | page base, vignette edges |
| `--navy-900` | `#111a45` | main field |
| `--navy-800` | `#1a2560` | panel fill / raised rows |
| `--navy-700` | `#26346f` | hairlines, dividers |
| `--gold-400` | `#e2b757` | active prayer, countdown, rules, key labels |
| `--gold-200` | `#f3dca6` | gold text on gold-tinted panels |
| `--gold-900` | `#5a441a` | gold used as a shadow/edge |
| `--ink-50` | `#f6f4ec` | primary numerals & names |
| `--ink-300` | `#c3cae8` | secondary (English names, cemaat) |
| `--ink-500` | `#7f8bc0` | tertiary (passed prayers, meta labels) |

Background is a layered navy: radial gold-tinted glow top-centre behind the logo, vertical
`--navy-900 → --navy-950` gradient, plus a repeating 8-point Islamic star SVG pattern at 4%
opacity — the same faint tile texture as the website strip. No pure black, no pure white.

**Passed prayers** drop to `--ink-500` at 55% opacity. **The next prayer** is the only gold
element in the list: gold 3px left bar, `--navy-800` fill with a gold-tinted inner glow,
gold numerals.

## Typography

- **Display / names / labels:** `Marcellus` (serif, elegant, high-contrast) — mosque name,
  prayer names, section labels. Uppercase with `0.18em` tracking for labels.
- **Numerals / body:** `Manrope` with `font-variant-numeric: tabular-nums` — clock, prayer
  times, countdown. Tabular so digits never jitter on a 1Hz tick.

| Role | Size / weight |
|---|---|
| Mosque name | 46 / Marcellus, tracking .16em, `--gold-400` |
| Live clock | 132 / Manrope 300, tabular |
| Countdown value | 88 / Manrope 600, `--gold-400` |
| Prayer name (TR) | 44 / Marcellus |
| Prayer name (EN) | 22 / Manrope 500, `--ink-500`, tracking .2em, uppercase |
| Prayer time | 78 / Manrope 300, tabular |
| Cemaat time | 26 / Manrope 500, `--ink-300` |
| Meta strip | 22 / Manrope 500, tracking .12em |

## Layout (top → bottom)

1. **Header** — white logo (168px) centred, mosque name under it, thin gold rule with a
   diamond node in the middle.
2. **Date strip** — Gregorian long date left, Hijri long date right, both on one hairline row.
3. **Hero** — live clock (HH:MM with seconds as a smaller superscript) and, beneath it, the
   next-prayer countdown: `SIRADAKİ · ÖĞLE` + `1s 14dk` in gold.
4. **Prayer list** — six full-width rows: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı.
   Left column TR name over EN name; right column adhan time with `Cemaat HH:MM` under it.
   Güneş has no cemaat (shows `—`).
5. **Jummah panel** — gold-edged panel, only two lines: `1. Cemaat 12:45`, `2. Cemaat 13:25`.
6. **Kerahat strip** — five compact cells: Güneş Doğuşu, İşrak, Kerahat, Kıble Saati, Güneş Batışı.

## Motion

Deliberately minimal — this runs 24/7 on a panel that can burn in.
- One staggered fade-up on load (rows 60ms apart).
- The active row's gold glow breathes on a 4s ease-in-out loop.
- Countdown digits cross-fade; nothing slides or bounces.
- Full-screen "prayer time now" state: the active row's glow intensifies for the adhan minute.

## Data

Diyanet times via the public mirror `ezanvakti.emushaf.net`, Auburn NSW district `11432`,
fetched server-side, cached in SQLite so the board never blanks if the upstream is down.
Cemaat rules: Fajr = sunrise − 30m, Öğle/İkindi/Yatsı = +6m, Akşam = +2m, Friday Öğle replaced
by the two Jummah sessions. All clock logic pinned to `Australia/Sydney`, never the TV's clock.

## Time source (updated 2026-08-30)
The mosque's published CSV timetable is the **single source of truth** for all prayer times.
It is compiled into `packages/web/src/api/routes/salah-timetable.ts` (191 days, 24-Jun-2026 → 31-Dec-2026),
keyed by ISO date with `[fajrAthan, fajrIqamah, dhuhrAthan, dhuhrIqamah, asrAthan, asrIqamah, maghribAthan, maghribIqamah, ishaAthan, ishaIqamah]`.
Dates outside the range clamp to the first/last covered day.
No derived offsets remain. The Diyanet mirror is fetched only for Gregorian/Hijri date strings.
Jummah: 12:40 and 13:20. Sunrise row removed — five prayers only (portrait rows 192 px, landscape 180 px).

## Typography weight pass (2026-09-11)
Display face switched Marcellus → **Playfair Display 500–900** (Marcellus ships a single 400 weight and could not go heavier).
Body face stays Manrope, loaded at 300–800. Every board element was re-weighted for TV legibility:
extralight/light → **bold**, medium/semibold → **extrabold**, and all uppercase caption labels now carry **extrabold**.
"İkame" is now labelled **Kamet** everywhere.

## Typography — Archivo Expanded (11 Sep 2026)
- All serif type removed. Playfair Display (display) and Manrope (body) both replaced by **Archivo**, loaded from Google Fonts with the expanded width instance: `family=Archivo:wdth,wght@125,300..900`.
- Google serves that axis as static `font-stretch: expanded` faces (not a variable axis), so `styles.css` selects them with `font-stretch: expanded` on `body`, `.font-sans` and `.font-display`. `--font-display` keeps an extra `letter-spacing: 0.01em`.
- Wider letterforms forced small size reductions so nothing collides: portrait title 42→40px (tracking 0.17→0.13em), next-prayer label 38→34px, countdown 66→58px, Jummah label 38→34px, Iqamah times 56→52px, Iqamah gap 14→10. Landscape: title 30→29px (tracking 0.16→0.12em), subtitle tracking 0.3→0.24em, next-prayer 30→28px, Jummah label 30→27px, Iqamah times 44→40px, gap 8→6.

## Travelling border glow — athan to Kamet (16 Sep 2026)
- Between a prayer's athan and its Kamet, that row's border carries a single light travelling **clockwise**, one lap every **5s**: a gold arc (`#e2b757`, 3px, 16% of the perimeter, 7px gold bloom) with a shorter **white-hot core** (`#fffaee`, 2px, 5%) centred inside it.
- Its window is the real gathering window (`glow` on `Slot`, athan → Kamet: Fajr ~49m, Dhuhr/Asr/Isha ~6m, Maghrib ~2m) and is **independent of** the 25-minute `active` highlight, which is unchanged. The `breathe` pulse still means *next prayer*; the travelling light means *gathering now*. The 5px gold left accent bar stays lit throughout.
- Drawn as an SVG `<rect>` stroke with an animated `stroke-dashoffset`, `pathLength="100"` so one set of dash numbers fits both row heights (portrait 192, landscape 180). A conic gradient was tried first and rejected: on a 5:1 row its angular sweep whips across the long edges and crawls on the short ones, so the light never reads as moving. Stroke-dash travel is constant speed along real arc length and follows the `rounded-[14px]` corners exactly.
- `.glow-track` is sized by CSS (`top/left: 3px`, `calc(100% - 6px)`), not by the SVG `width`/`height` attributes — attributes would win over `auto` and push the bottom/right edges outside the row's overflow clip.
- A glowing row that has aged past the `active` window holds the lit treatment instead of dimming to `past`, so Fajr's long window does not grey out mid-gathering. Honours `prefers-reduced-motion`.
- Test clock: `?now=HH:MM` on the board URL offsets Sydney time for verification (inert when absent).

## Jummah & daylight saving (4 Oct 2026)
- Jummah is **12:40 / 13:20** in standard time (AEST) and **13:40 / 14:20** while NSW daylight saving (AEDT) is on, matching the timetable's own one-hour Dhuhr jump.
- Worked out on the board for each displayed date by `jummahFor()` in `web/lib/prayer-board.ts`: it reads the real `Australia/Sydney` offset (`GMT+11:00` = DST) through `Intl`, so no changeover dates are hard-coded. Base times live only in `JUMMAH_STANDARD`. The API no longer serves a `jummah` field.

## Logo proportions by orientation (8 Nov 2026)
- Landscape header: original image aspect ratio, 120px high with automatic width (approximately 135.4px). Centred position, opacity, and shadow are unchanged.
- Portrait header: keep the stretched 338×150px treatment. The shared image asset and loading splash are unchanged.

## Fajr Kamet — daily Sunrise reference (10 Nov 2026)
- Fajr Kamet uses Aladhan method=13 `timings.Sunrise` for Auburn, NSW, Australia, explicitly in `Australia/Sydney`, plus a single `SUNRISE_OFFSET_MINUTES` (default 0), minus 30 minutes. No astronomical sunrise/sunset field is read. This is a calibratable proxy for Diyanet’s published Güneş, not a verified exact match.
- Other adhan and Kamet times remain on the mosque CSV; Jummah is unchanged. Both layouts use the existing Fajr Kamet field.
- Daily results are cached separately from the Diyanet feed, with location/method/offset/date keys. Invalid ordering falls back to Fajr adhan with a warning. Aladhan outages retain that date’s CSV Kamet with a diagnostic and throttled retries. Refresh the query at Sydney midnight.

## Authoritative replacement CSV (10 Nov 2026)
- Supersedes the earlier automatic Fajr Sunrise and Cuma DST rules: use the uploaded CSV's exact prayer, Kamet, and both Cuma session values, covering **24 June 2026–31 December 2027 (556 days)**.
- Convert dates to ISO and times to HH:MM for consistent display; no minute shifts or recalculation. For 2026, Fajr Kamet is 8 minutes later than the previous file. Use 2027 values as supplied; they have not been independently validated against Diyanet.
- Aladhan enrichment is disabled. The Diyanet mirror supplies date labels only; reapply the authoritative timetable to cached response rows on every read so stale cached times cannot win.
- Cuma is looked up by displayed date from the compiled CSV session table, not recalculated from timezone offsets. Preserve existing out-of-range first/last-date clamping. All layouts, Sydney clock, highlight rules and glow behaviour remain unchanged; the glow follows the new Kamet.

## Quiet reminder marquee — approved
Both layouts show the exact quiet reminder from adhan minus five minutes until Kamet for the five daily prayers. Cuma sessions do not trigger it. Archivo 32px, navy strip, warm-white text, gold divider; seamless right-to-left motion at 45 canvas px/sec with stationary reduced-motion fallback. Preserve all timetable and glow behaviour.
Implemented and verified: 27 tests / 6,790 assertions pass; lint and build pass (existing bundle-size warning). Both canvas sizes checked with active/hidden marquee and simulated offline notice, including reduced motion. Real-time motion measured ~45px/sec; repeated text groups span more than the full landscape width. Portrait active-window padding tightened to retain all content; reduced-motion text is 26px and wraps.
