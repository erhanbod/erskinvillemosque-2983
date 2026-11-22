# Authoritative replacement CSV
- Approved: 556 dates, 24-Jun-2026 through 31-Dec-2027; all 12 daily time values from attached CSV.
- Disable Aladhan response enrichment; use CSV Cuma lookup instead of automatic DST derivation.
- Backups saved outside app under /home/user/backups/timetable-before-replacement.
- Validate/import, reapply to cached API records, test all rows/cache/glow, lint/build, screenshots, deliver.

## Complete
- Imported 556 consecutive CSV dates and all 6,672 prayer/Kamet/Cuma values; full comparison against normalized attachment passed.
- Added immutable published-timetable overlay for cached API days. Removed Aladhan enrichment from live prayer route.
- Cuma lookup now reads compiled CSV sessions; no automatic DST adjustment overrides the file.
- 22 tests / 6,745 assertions pass; lint and build pass (existing bundle-size warning only).
- Live portrait and landscape both show 10-Nov-2026 Fajr 04:13 / Kamet 05:10 and Cuma 13:40 / 14:20, matching the replacement CSV. Other daily values match.
- 2027 sample/boundary data verified against supplied file, not independently against Diyanet. Old data backups retained outside app.

## Quiet reminder marquee — approved
Both layouts show the exact quiet reminder from adhan minus five minutes until Kamet for the five daily prayers. Cuma sessions do not trigger it. Archivo 32px, navy strip, warm-white text, gold divider; seamless right-to-left motion at 45 canvas px/sec with stationary reduced-motion fallback. Preserve all timetable and glow behaviour.
Implemented and verified: 27 tests / 6,790 assertions pass; lint and build pass (existing bundle-size warning). Both canvas sizes checked with active/hidden marquee and simulated offline notice, including reduced motion. Real-time motion measured ~45px/sec; repeated text groups span more than the full landscape width. Portrait active-window padding tightened to retain all content; reduced-motion text is 26px and wraps.
