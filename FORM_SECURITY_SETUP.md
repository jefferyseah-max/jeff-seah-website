# Power Calendar Form — Spam Protection & Verification Setup

This adds four layers of protection to the lead form so junk submissions like
gibberish names / fake emails don't reach your working queue:

1. **Front-end guards** — honeypot, time-trap, and sanity checks (already live in `index.html`).
2. **Double opt-in** — the requester must click a confirmation link in their email before you're notified. This is the real "verify it's genuine before I start" gate.
3. **Spam auto-scoring** — every submission is scored and flagged in the Sheet (gibberish name, disposable email, city-is-a-date, dot-obfuscated Gmail).
4. **Cloudflare Turnstile** — a free invisible CAPTCHA (optional, strongest bot wall).

Layers 1 needs nothing from you (it's in the site). Layers 2 & 3 are the Apps
Script below. Layer 4 needs two keys from Cloudflare (Part C).

---

## Part A — Update your Google Sheet columns

Open your **"Power Calendar Leads"** sheet and make Row 1 headers read:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Full Name | Email | Birth Date | Birth Time | Birth City | Status | Spam Score | Flags | Token | Confirmed At |

You're just adding **G–K**. Existing rows can stay as they are.

**How to read Status:**
- `Pending Confirmation` — submitted, but the requester hasn't clicked the confirm link yet. **Do not work on these.**
- `Confirmed` — email verified, requester confirmed. You get an email. **Safe to work on** (still glance at the Spam Score).

---

## Part B — Replace the Apps Script

In your Sheet: **Extensions → Apps Script**, delete everything in the editor,
paste this in full, then **Save**.

> Before saving, set `TURNSTILE_SECRET` in Part C (or leave it as-is to skip Turnstile for now — the other three layers still work).

```javascript
/**
 * Power Calendar form handler — v2
 * Honeypot + time-trap re-check, Cloudflare Turnstile verification,
 * spam scoring, and double opt-in (email confirmation) before Jeff is notified.
 */

// ==== CONFIG ====
const NOTIFY_EMAIL     = 'jefferyseah@gmail.com';
const TURNSTILE_SECRET = 'YOUR_TURNSTILE_SECRET_KEY'; // paste your Cloudflare SECRET key (Part C), or leave to skip
const MIN_FILL_MS      = 3000;

// Throwaway email domains — extend anytime
const DISPOSABLE_DOMAINS = [
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com',
  'temp-mail.org','yopmail.com','trashmail.com','sharklasers.com',
  'getnada.com','dispostable.com','maildrop.cc','fakeinbox.com'
];

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1) Honeypot — invisible field only bots fill
    if (data.website && String(data.website).trim() !== '') {
      return json({ result: 'ignored' });
    }

    // 2) Time-trap — nobody fills real birth details in under 3s
    if (typeof data.elapsedMs === 'number' && data.elapsedMs < MIN_FILL_MS) {
      return json({ result: 'ignored' });
    }

    // 3) Turnstile — only hard-drop a token that is PRESENT but INVALID
    //    (a missing token just gets flagged, so a blocked widget never locks out a real person)
    if (TURNSTILE_SECRET && TURNSTILE_SECRET !== 'YOUR_TURNSTILE_SECRET_KEY' && data.turnstileToken) {
      if (!verifyTurnstile(data.turnstileToken)) return json({ result: 'ignored' });
    }

    // 4) Spam scoring
    const assessment = scoreSubmission(data);

    // 5) Token + append row as Pending Confirmation
    const token = Utilities.getUuid();
    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.name, data.email, data.birthDate, data.birthTime, data.birthCity,
      'Pending Confirmation', assessment.score, assessment.flags.join('; '), token, ''
    ]);

    // 6) Double opt-in — email the requester a confirm link
    const confirmUrl = ScriptApp.getService().getUrl() + '?action=confirm&token=' + token;
    MailApp.sendEmail({
      to: data.email,
      subject: 'Confirm your Power Calendar request',
      htmlBody:
        '<p>Hi ' + escapeHtml(firstName(data.name)) + ',</p>' +
        '<p>Thanks for requesting your personalised Power Calendar from Jeff Seah.</p>' +
        '<p>To confirm this request really came from you, please click below:</p>' +
        '<p><a href="' + confirmUrl + '" style="background:#d4af37;color:#111;padding:12px 22px;' +
        'border-radius:6px;text-decoration:none;font-weight:bold;">Confirm my request</a></p>' +
        '<p>If you didn\'t request this, just ignore this email — nothing happens.</p>' +
        '<p>— Jeff Seah &middot; jeffseah.rocks</p>'
    });

    return json({ result: 'pending' });
  } catch (error) {
    return json({ result: 'error', error: error.toString() });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'confirm' && e.parameter.token) {
    const ok = confirmByToken(e.parameter.token);
    return HtmlService.createHtmlOutput(
      ok
        ? '<div style="font-family:sans-serif;max-width:520px;margin:60px auto;text-align:center">' +
          '<h2 style="color:#b8860b">Request confirmed &#10004;</h2>' +
          '<p>Thank you — your Power Calendar request is confirmed. ' +
          'Jeff will prepare it and email it to you within 7 days.</p></div>'
        : '<div style="font-family:sans-serif;max-width:520px;margin:60px auto;text-align:center">' +
          '<h2>Link expired or already used</h2>' +
          '<p>If you think this is a mistake, email jefferyseah@gmail.com.</p></div>'
    );
  }
  return HtmlService.createHtmlOutput('Power Calendar form handler is running.');
}

function confirmByToken(token) {
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();
  // 0-indexed columns: 1=Name 2=Email 3=Date 4=Time 5=City 6=Status 7=Score 8=Flags 9=Token 10=Confirmed
  for (let r = 1; r < values.length; r++) {
    if (values[r][9] === token) {
      if (values[r][6] === 'Confirmed') return false;                 // already used
      sheet.getRange(r + 1, 7).setValue('Confirmed');                 // G Status
      sheet.getRange(r + 1, 11).setValue(new Date().toISOString());   // K Confirmed At

      const name = values[r][1], email = values[r][2];
      const score = values[r][7], flags = values[r][8];
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: '✅ CONFIRMED Power Calendar Request — ' + name,
        body:
          'A requester CONFIRMED their Power Calendar request (email verified).\n\n' +
          'Name: ' + name + '\nEmail: ' + email + '\n' +
          'Birth Date: ' + values[r][3] + '\nBirth Time: ' + values[r][4] +
          '\nBirth City: ' + values[r][5] + '\n\n' +
          'Spam score: ' + score + (flags ? '\nFlags: ' + flags : '') + '\n\n' +
          (Number(score) >= 3
            ? '⚠️ High spam signals — review carefully before working on it.\n'
            : 'Looks clean.\n')
      });
      return true;
    }
  }
  return false;
}

function verifyTurnstile(token) {
  if (!token) return false;
  try {
    const res = UrlFetchApp.fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'post', payload: { secret: TURNSTILE_SECRET, response: token }, muteHttpExceptions: true }
    );
    return JSON.parse(res.getContentText()).success === true;
  } catch (err) { return false; }
}

function scoreSubmission(data) {
  let score = 0;
  const flags = [];
  const name  = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const city  = String(data.birthCity || '').trim();

  // Gibberish name: any word with a 5+ consonant run, or 4+ letters and no vowel
  const words = name.split(/\s+/).filter(Boolean);
  const gibberish = words.some(function (w) {
    const letters = w.toLowerCase().replace(/[^a-z]/g, '');
    if (letters.length >= 4 && !/[aeiouy]/.test(letters)) return true;
    return /[bcdfghjklmnpqrstvwxz]{5,}/.test(letters);
  });
  if (gibberish)        { score += 2; flags.push('gibberish-name'); }
  if (words.length < 2) { score += 1; flags.push('single-word-name'); }

  // City that looks like a date/number
  if (/\d/.test(city)) { score += 2; flags.push('city-contains-number'); }

  // Email checks
  const at     = email.indexOf('@');
  const domain = at > -1 ? email.slice(at + 1) : '';
  const local  = at > -1 ? email.slice(0, at) : '';
  if (DISPOSABLE_DOMAINS.indexOf(domain) > -1) { score += 3; flags.push('disposable-email'); }
  if ((domain === 'gmail.com' || domain === 'googlemail.com') &&
      (local.match(/\./g) || []).length >= 3) { score += 1; flags.push('dot-obfuscated-gmail'); }

  // Turnstile token missing (widget blocked or request bypassed the site)
  if (!data.turnstileToken) { score += 1; flags.push('no-turnstile-token'); }

  return { score: score, flags: flags };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || 'there'; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
```

### Re-deploy after pasting

Apps Script serves the **last deployed version**, so you must redeploy:

1. **Deploy → Manage deployments**
2. Click the ✏️ pencil on your existing deployment
3. **Version → New version**
4. **Deploy**

Keep **Execute as: Me** and **Who has access: Anyone** (the confirm link is an
anonymous GET, so "Anyone" is required). The Web App URL stays the same — no
change needed in `index.html`.

The first time it runs it'll ask you to **Authorize** (it now sends email to
requesters and calls Cloudflare, so it re-requests permissions). Allow it.

---

## Part C — Cloudflare Turnstile (optional, strongest bot wall)

1. Go to the Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name it "Power Calendar", add domain `jeffseah.rocks` (and `www.jeffseah.rocks`).
3. Widget type: **Managed** (recommended).
4. You'll get two keys:
   - **Site Key** (public) → paste into `index.html`, in the line
     `const TURNSTILE_SITE_KEY = '';` (inside the `<script>` near the form).
   - **Secret Key** (private) → paste into the Apps Script `TURNSTILE_SECRET`.
5. Redeploy the Apps Script (Part B) and commit the `index.html` change.

Until you set the Site Key, the widget simply doesn't appear and isn't
enforced — the other three layers keep working.

---

## What each layer stops

| Layer | Stops | Friction for real clients |
|---|---|---|
| Honeypot | Dumb form bots | None (invisible) |
| Time-trap | Auto-submitters | None |
| Sanity checks | Dates in the city box, fake DOBs, URLs-as-names | None |
| Spam scoring | Nothing on its own — it *flags* so you can eyeball | None |
| **Double opt-in** | **Fake/mistyped emails, bots without a real inbox, unintended submits** | One extra click on a confirmation email |
| Turnstile | Automated/scripted bots at scale | None (managed mode is usually invisible) |

The submission you flagged today ("Dpehcces Zjollgkpq", date in the city box,
dot-obfuscated Gmail) would now: fail the city sanity check on the front-end;
and if it somehow reached the Sheet, score high (`gibberish-name`,
`city-contains-number`, `dot-obfuscated-gmail`) **and** never send you a
notification unless that inbox actually clicked confirm.
