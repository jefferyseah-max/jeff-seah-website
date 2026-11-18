"""Generate a calm instrumental bed for the Tong Shu walkthrough via Lyria 3 Clip (Vertex AI)."""
import base64, json, sys
from pathlib import Path
import google.auth, google.auth.transport.requests
import requests as req

OUT = Path(sys.argv[1])
PROJECT_ID = "project-180a0b28-e601-4645-8be"
MODEL_ID = "lyria-3-clip-preview"
PROMPT = (
    "Create a 30-second calm instrumental background track for a short product walkthrough of a "
    "personal Chinese almanac app. Mood: serene, warm, quietly confident, elegant. "
    "Instrumentation: soft felt piano, gentle guzheng plucks, warm low string pad, very light "
    "hand percussion. Steady slow tempo around 80 BPM with an even energy throughout so it can loop. "
    "Leave space for speech. No vocals, no lyrics, no big drums, no trailer hits, no busy lead melody."
)

cred, _ = google.auth.default()
cred.refresh(google.auth.transport.requests.Request())
h = {"Authorization": f"Bearer {cred.token}", "Content-Type": "application/json"}
url = f"https://aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/global/interactions"
r = req.post(url, json={"model": MODEL_ID, "input": [{"type": "text", "text": PROMPT}]}, headers=h, timeout=240)
if r.status_code != 200:
    print("interactions", r.status_code, r.text[:300])
    url2 = (f"https://us-central1-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/us-central1/"
            f"publishers/google/models/{MODEL_ID}:generateContent")
    r = req.post(url2, json={"contents": [{"role": "user", "parts": [{"text": PROMPT}]}]}, headers=h, timeout=240)
if r.status_code != 200:
    sys.exit(f"Error {r.status_code}: {r.text[:500]}")
res = r.json()
data = None
for o in res.get("outputs", []):
    if "data" in o:
        data = o["data"]; break
if not data:
    for c in res.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            if "inlineData" in p:
                data = p["inlineData"]["data"]; break
if not data:
    OUT.with_suffix(".json").write_text(json.dumps(res, indent=2, default=str)[:20000])
    sys.exit("no audio in response")
OUT.write_bytes(base64.b64decode(data))
print("saved", OUT, OUT.stat().st_size)
