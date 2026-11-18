# Tong Shu walkthrough video (short cut, `/2027` exit offer)

Live file: `media/tongshu/tongshu-walkthrough.mp4` (960x720, 56 s, about 3 MB) and poster
`media/tongshu/tongshu-walkthrough-poster.webp`. Used only in the `/2027` exit offer (`#exit-offer`):
fetched when the offer opens, autoplays muted, "Sound on" button for the voice, click to pause or replay.

## Sources (outside the repo)
- Raw screen recording: `C:\Users\jeffe\Desktop\Personal Tongshu.mp4` (1008x886, 123 s, silent).
  It is Jeff's own portal. The eyebrow "JEFFERY'S PERSONAL CALENDAR" is blurred in the opening shot
  and every later shot is cropped below it. Day text still shows Jeff's chart details (Tiger day branch,
  Rat month, Dragon hour), but no name.
- Working folder: `C:\Users\jeffe\Desktop\Personal Tongshu edit\` (voice lines `vo/vo1..8.mp3`,
  `music.mp3`, `master.mp4`, `build/timeline.json`).
- Voice: Unmixr, Jeff's clone, preset `jeff_c_singlish`, one request per line (about 640 credits).
- Music: Lyria 3 Clip on Vertex (`scripts/video/gen_tongshu_music.py`), 30 s, looped with a 4 s crossfade.

## Rebuild
```
python scripts/video/build_tongshu_walkthrough.py "C:/Users/jeffe/Desktop/Personal Tongshu edit"
```
Then encode for the web (crf 27, faststart) into `media/tongshu/`. Scene list, crops (source pixels),
captions and the blur box are at the top of the script.

## Script (one line per scene)
1. This is your personal Tong Shu. Not the generic almanac everyone reads, but one read against your own birth chart.
2. Tap This Week, and you see the notable days ahead, the good ones and the tricky ones, so you can plan in advance.
3. Open any entry, and it tells you why the day matters, and exactly what to do with it.
4. Caution days are spelled out too: what to avoid, and how to move through them.
5. Pick any date in the month to read it in full.
6. Every day is checked against your natal chart. When a day clashes with your chart, it tells you so, and why.
7. Even the hours are ranked: your best hours, and the ones to avoid.
8. Try it free for thirty days. (end card: seal, "Your personal Tong Shu", "Free for 30 days")

## Later
The longer cut belongs on `/power-calendar`, with a "Find out more" link from the homepage subscribe card.
