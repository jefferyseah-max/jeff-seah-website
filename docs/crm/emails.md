# Encharge email drafts: 2027 Annual Outlook

Drafted 2026-09-27 by Claude for Jeff's review. **Nothing sends until Jeff approves the copy and the
flows are switched on.** From: Jeff Seah <jeff@jeffseah.rocks>, reply-to the same.

Merge fields (Encharge syntax): `{{ person.firstName }}`, `{{ person.reportDue }}` (for example
"Sunday 4 October", set at intake), `{{ person.reportUrl }}` (set at delivery), `{{ person.edition }}`.
Every email carries Encharge's unsubscribe footer and the mailing address.

---

## Flow A: payment to intake

Trigger: event **Outlook Purchased**. Filter: tag `outlook-2027-buyer`.

### A1. Immediately
**Subject:** Your 2027 Outlook: one step left

Hi {{ person.firstName }},

Thank you for ordering your 2027 Annual Outlook. I'm looking forward to reading your chart.

If you have not sent your birth details yet, it takes two minutes:
**[Send my birth details](https://www.jeffseah.rocks/2027-next)**

Date, time and place of birth is all I need. If you don't know your birth time, send the rest; the
outlook still works, and only the directions section gets shorter.

Your report arrives within 7 days of your details reaching me.

Jeff

### A2. 48 hours later, only if tag `intake-received` is missing
**Subject:** I can't start your chart yet

Hi {{ person.firstName }},

A quick nudge: I don't have your birth details yet, so your 2027 Outlook hasn't started.

**[Send my birth details](https://www.jeffseah.rocks/2027-next)**

If the form gives you any trouble, just reply with your birth date, time and city.

Jeff

---

## Flow B: intake to delivery (the 7-day wait)

Trigger: event **Intake Submitted**. Filters: tags `outlook-2027-buyer` and `annual-intake`.
Exit: tag `report-delivered`.

### B1. Immediately
**Subject:** Got it. Your 2027 Outlook arrives by {{ person.reportDue }}

Hi {{ person.firstName }},

Your birth details are in, and your chart is on my desk. Your outlook will be with you by
**{{ person.reportDue }}**.

Here is what happens now. I calculate your four pillars and how 2027 meets each of them, then I read
it and write your year. You'll get a private page and a PDF.

One more thing is included: **your first Power Calendar month**, free. It is your best and hardest days
for the month, in your own Google Calendar. It starts on the 1st of next month. No card, nothing to do.

Jeff

### B2. Day 3
**Subject:** How to read your Outlook when it lands

Hi {{ person.firstName }},

Your outlook is coming together. Here is how to get the most from it in twenty minutes:

1. **Start with the Annual Compass.** Seven lines that hold the whole year.
2. **Check your Year at a Glance.** Mark the Push months for the decisions you told me about.
3. **Keep When To open when you plan.** Launch, negotiate, ask, rest: best window, also good, avoid.

You chose the {{ person.edition }} edition to open first. Both editions are on the same page, so you can
switch any time.

Jeff

### B3. Day 6
**Subject:** Nearly there

Hi {{ person.firstName }},

I'm on the final read of your 2027 Outlook. You'll get an invitation to your private page (with the PDF
inside) by {{ person.reportDue }}.

If anything has changed since you wrote to me, a new decision on the table or a date you're weighing,
reply and tell me. I'll make sure the reading covers it.

Jeff

---

## Flow C: after delivery (warm, then the Calendar plans)

Trigger: event **Report Delivered**. Filter: tag `outlook-2027-buyer`.
Exit: tag `monthly-subscriber` (they bought a plan) or unsubscribed.

### C1. Immediately
**Subject:** Your 2027 Outlook is here

Hi {{ person.firstName }},

Your 2027 Annual Outlook is ready:
**[Open my 2027 Outlook]({{ person.reportUrl }})**

Read the Annual Compass first, then Before the Year Opens: that's what to do before 4 February.

You have one follow-up question with the outlook. When something in it makes you stop, reply to this
email and ask.

Jeff

### C2. Day 3
**Subject:** Three ways clients actually use their Outlook

Hi {{ person.firstName }},

After a few days with it, this is what tends to stick:

- **Before a big conversation**, check the month's Do / Avoid / Watch row.
- **Before you commit money**, look up "review money" and "negotiate" in When To.
- **When you feel stuck**, sit with your back to your clarity direction and write the decision down.

Jeff

### C3. Day 7
**Subject:** Your free Power Calendar month is on its way

Hi {{ person.firstName }},

Your outlook gives you the shape of the year. The **Power Calendar** gives you the days.

Your free month starts on the 1st: the strongest and weakest days of the month for your own chart, in
your Google Calendar, with a short note on each. Put the important things on the good days and see what
changes.

Jeff

### C4. Day 14
**Subject:** Keep the days coming after your free month

Hi {{ person.firstName }},

When your free month ends, you can keep your Power Calendar running every month:

- **Power Calendar, USD 97 a month.** Your days, every month.
- **Calendar + Brief, USD 197 a month.** The days, plus a written brief on the month's theme for your chart.

**[See the plans](https://www.jeffseah.rocks/#pricing)**

Cancel any time from the billing link in every receipt.

Jeff

### C5. Day 24
**Subject:** Your free month is nearly over

Hi {{ person.firstName }},

Your complimentary Power Calendar month is nearly done. To keep next month's days coming, pick a plan
before the 1st:

**[Keep my Power Calendar](https://www.jeffseah.rocks/#pricing)**

If it's not for you, no action needed; nothing is charged.

Jeff

### C6. Day 40
**Subject:** The decision you wrote to me about

Hi {{ person.firstName }},

When you sent your details, you told me about the decisions you're weighing this year. If one of them
is close, a **Single Session** is an hour with me on exactly that: your chart, your timing, your options.

**[Book a Single Session](https://www.jeffseah.rocks/book)** (USD 197)

Jeff
