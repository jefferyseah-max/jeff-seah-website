"""Build the short Tong Shu walkthrough for the /2027 exit offer.
Usage: python build.py <work_dir>   (work_dir holds vo/vo1..8.mp3, music.mp3; outputs land there)
"""
import json, shutil, subprocess, sys
from pathlib import Path

W = Path(sys.argv[1])
SRC = "C:/Users/jeffe/Desktop/Personal Tongshu.mp4"
SEAL = str(Path(__file__).resolve().parents[2] / "img" / "seal-mark.png")
OW, OH, FPS = 960, 720, 30
XF = 0.4          # crossfade between scenes
TEMPO = 1.07      # voice slightly brisker
GAP = 0.55        # breathing room after each line

def run(args):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", *args], cwd=W)
    if r.returncode:
        sys.exit("ffmpeg failed: " + " ".join(args))

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)], cwd=W).decode().strip())

(W / "build").mkdir(exist_ok=True)
(W / "fonts").mkdir(exist_ok=True)
for f in ("georgia.ttf", "georgiai.ttf", "segoeui.ttf"):
    shutil.copy(f"C:/Windows/Fonts/{f}", W / "fonts" / f)

# 1. Voice: trim head and tail silence, speed up a touch.
vo = []
for i in range(1, 9):
    out = f"build/vo{i}.wav"
    run(["-i", f"vo/vo{i}.mp3", "-af",
         f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
         f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo={TEMPO},"
         f"aresample=48000", "-ac", "1", out])
    vo.append(dur(W / out))
print("vo", [round(v, 2) for v in vo])

# 2. Scenes. crop = (w, h, x, y) in source pixels, always 4:3.
#    vo = index of the line that starts on this scene; share = part of that line's time.
S = [
    dict(src=(0.0, 3.8), crop=(1008, 756, 0, 0), vo=0, share=1.0, blur=(12, 104, 232, 40), lead=0.5,
         cap=["Your personal Power Calendar", "the Tong Shu, read against your birth chart"]),
    dict(src=(5.0, 13.0), crop=(672, 504, 0, 150), vo=1, share=1.0,
         cap=["This Week: your notable good", "and challenging days, ahead of time"]),
    dict(src=(20.3, 25.0), crop=(672, 504, 0, 100), vo=2, share=1.0,
         cap=["Every entry says why the day matters", "and what to do with it"]),
    dict(src=(33.0, 39.5), crop=(800, 600, 0, 140), vo=3, share=1.0,
         cap=["Caution days come with a plan:", "what to avoid, and your best hours"]),
    dict(src=(61.6, 65.6), crop=(1008, 756, 0, 80), vo=4, share=1.0,
         cap=["Tap any date in the month", "to read it in full"]),
    dict(src=(72.3, 76.8), crop=(480, 360, 528, 470), vo=5, share=0.55,
         cap=["Not generic almanac entries:", "each day is read against your natal chart"]),
    dict(src=(81.3, 84.8), crop=(480, 360, 528, 340), vo=None, share=0.45,
         cap=["Not generic almanac entries:", "each day is read against your natal chart"]),
    dict(src=(95.5, 103.5), crop=(480, 360, 528, 400), vo=6, share=1.0,
         cap=["Your best hours,", "and the hours to avoid"]),
]

# Line durations -> scene durations (each scene also carries the crossfade overlap).
line_len = [v + GAP for v in vo]
line_len[0] += 0.5  # lead-in
scene_d = []
for s in S:
    li = s["vo"] if s["vo"] is not None else 5
    scene_d.append(line_len[li] * s["share"] + XF)
END_D = vo[7] + 1.6 + XF

_n = [0]
def esc(t):
    # Write the text to a file and return a textfile= reference: no filtergraph escaping needed.
    _n[0] += 1
    p = f"build/t{_n[0]}.txt"
    (W / p).write_text(t, encoding="utf-8")
    return p

def caption_filter(lines, d):
    # Soft dark band at the bottom, ivory line one, gold italic line two, fade in.
    a = f"if(lt(t\\,0.35)\\,t/0.35\\,if(gt(t\\,{d-XF-0.1:.2f})\\,max(0\\,1-(t-{d-XF-0.1:.2f})/0.3)\\,1))"
    f = [f"drawbox=x=0:y={OH-170}:w={OW}:h=170:color=0x0b1416@0.78:t=fill"]
    f.append(f"drawtext=fontfile=fonts/georgia.ttf:textfile={esc(lines[0])}:fontsize=40:fontcolor=0xEDE6D6:"
             f"x=(w-text_w)/2:y={OH-150}:alpha='{a}'")
    if len(lines) > 1:
        f.append(f"drawtext=fontfile=fonts/georgiai.ttf:textfile={esc(lines[1])}:fontsize=36:fontcolor=0xD4AF37:"
                 f"x=(w-text_w)/2:y={OH-92}:alpha='{a}'")
    return ",".join(f)

for i, (s, d) in enumerate(zip(S, scene_d)):
    a, b = s["src"]
    srcd = b - a
    speed = max(0.5, min(1.35, srcd / d))
    w, h, x, y = s["crop"]
    pre = f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{speed:.4f},fps={FPS}"
    if s.get("blur"):
        bx, by, bw, bh = s["blur"]
        pre += (f",format=gbrp,split[m][k];[k]crop={bw}:{bh}:{bx}:{by},gblur=sigma=9:steps=3[bl];"
                f"[m][bl]overlay={bx}:{by}")
    vf = (f"{pre},crop={w}:{h}:{x}:{y},scale={OW}:{OH}:flags=lanczos,"
          f"tpad=stop_mode=clone:stop_duration={d:.3f},trim=duration={d:.3f},"
          f"{caption_filter(s['cap'], d)},format=yuv420p[v]")
    run(["-i", SRC, "-filter_complex", vf, "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "16",
         "-preset", "medium", f"build/s{i}.mp4"])
    print(f"scene {i}: {d:.2f}s speed {speed:.2f}")

# End card: obsidian background, seal, offer line.
d = END_D
end_vf = (f"color=c=0x0b1416:s={OW}x{OH}:d={d:.3f}:r={FPS}[bg];"
          f"movie=seal.png,scale=170:-1,format=rgba[s];[bg][s]overlay=(W-w)/2:150[v1];"
          f"[v1]drawtext=fontfile=fonts/georgia.ttf:text='Your personal Power Calendar':fontsize=50:"
          f"fontcolor=0xEDE6D6:x=(w-text_w)/2:y=370:alpha='min(1\\,t/0.6)',"
          f"drawtext=fontfile=fonts/georgiai.ttf:text='Free for 30 days':fontsize=42:fontcolor=0xD4AF37:"
          f"x=(w-text_w)/2:y=445:alpha='min(1\\,max(0\\,(t-0.4)/0.6))',"
          f"drawtext=fontfile=fonts/segoeui.ttf:text='jeffseah.rocks':fontsize=26:fontcolor=0xA8ADB6:"
          f"x=(w-text_w)/2:y=540:alpha='min(1\\,max(0\\,(t-0.8)/0.6))',format=yuv420p[v]")
shutil.copy(SEAL, W / "seal.png")
run(["-f", "lavfi", "-i", "anullsrc", "-filter_complex", end_vf, "-map", "[v]", "-t", f"{d:.3f}",
     "-c:v", "libx264", "-crf", "16", "build/s_end.mp4"])

# 3. Join with crossfades.
clips = [f"build/s{i}.mp4" for i in range(len(S))] + ["build/s_end.mp4"]
durs = scene_d + [END_D]
inputs, chain, off, last = [], [], 0.0, "0:v"
for c in clips:
    inputs += ["-i", c]
starts = [0.0]
for i in range(1, len(clips)):
    off += durs[i - 1] - XF
    starts.append(off)
    out = f"x{i}"
    chain.append(f"[{last}][{i}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}[{out}]")
    last = out
total = starts[-1] + durs[-1]
run([*inputs, "-filter_complex", ";".join(chain), "-map", f"[{last}]", "-c:v", "libx264", "-crf", "16",
     "-r", str(FPS), "build/video.mp4"])

# 4. Audio: each line starts just after its scene's crossfade; music loops underneath, ducked.
vo_start = {}
for i, s in enumerate(S):
    if s["vo"] is not None:
        vo_start[s["vo"]] = starts[i] + (0.5 if i == 0 else XF * 0.6)
vo_start[7] = starts[-1] + 0.5
ain, amix = ["-i", "build/video.mp4"], []
for k in range(8):
    ain += ["-i", f"build/vo{k+1}.wav"]
    ms = int(vo_start[k] * 1000)
    amix.append(f"[{k+1}:a]adelay={ms}|{ms},apad[a{k}]")
ain += ["-i", "music.mp3", "-i", "music.mp3"]
vo_mix = "".join(f"[a{k}]" for k in range(8))
fc = ";".join(amix) + (
    f";{vo_mix}amix=inputs=8:normalize=0,atrim=duration={total:.3f},volume=1.0[voice];"
    f"[9:a][10:a]acrossfade=d=4:c1=tri:c2=tri,atrim=duration={total:.3f},volume=0.16,afade=t=in:d=1.0,"
    f"afade=t=out:st={total-2.2:.3f}:d=2.2[mus];"
    f"[voice][mus]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]")
run([*ain, "-filter_complex", fc, "-map", "0:v", "-map", "[aout]", "-c:v", "copy",
     "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-t", f"{total:.3f}", "master.mp4"])
json.dump(dict(starts=starts, durs=durs, vo=vo, vo_start=vo_start, total=total),
          open(W / "build/timeline.json", "w"), indent=2)
print("total", round(total, 2))
