# Encharge email drafts: 2027 Annual Outlook

Drafted 2026-09-27 and revised 2026-09-29 with Jeff's Day 7, 14 and 24 notes. **Nothing sends until
Jeff approves the copy and the flows are switched on.** From: Jeff Seah <coaching@jeffseah.rocks>,
reply-to the same.

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

One more thing is included: **a sample month of your Power Calendar**, free. It is your best and hardest
days for next month, on a private web page beside your report. No card, nothing to do.

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

Read the Annual Compass first, then Before the Year Opens. That's what to do before 4 February.

You have one follow-up question with the outlook. When something in it makes you stop, reply to this
email and ask.

Jeff

### C2. Day 3
**Subject:** Three ways clients use their Outlook

Hi {{ person.firstName }},

After a few days with your outlook, here are three ways to put it to work:

1. **Before a big conversation**, check the month's Do / Avoid / Watch row.
2. **Before you commit money**, look up "review money" and "negotiate" in When To.
3. **When you feel stuck**, sit with your back to your clarity direction and write the decision down.

Reply if you have a question about your reading.

Jeff

### C3. Day 7
**Subject:** Your sample Power Calendar month

Hi {{ person.firstName }},

Your outlook gives you the shape of the year. The **Power Calendar** gives you the days.

**[Open your private Outlook and sample calendar]({{ person.reportUrl }})**

Follow the sample calendar link beside your report. This is a temporary private web page showing the
strongest and weakest days of the next full month for your chart. Try planning around those days and see
what you notice. The sample does not add anything to your Google Calendar or start a subscription. If
you join a monthly plan, I will share your ongoing Power Calendar directly with your Google account.

Jeff

### C4. Day 14
**Subject:** Try three months of Power Calendar at half price

Hi {{ person.firstName }},

If the sample is useful, I can set you up with three paid months at **50% off**:

- **Power Calendar:** keep the 30-day free trial, then USD 48.50 a month for the first three paid
  months, then USD 97 a month.
- **Calendar + Brief:** USD 98.50 a month for three paid months, then USD 197 a month. This adds a
  written brief on your month's theme.

Reply **CALENDAR** or **BRIEF** and I will send the right private offer and explain when your first
charge falls. Your ongoing Power Calendar will be shared into your Google Calendar. You can cancel
anytime.

You can [compare the plans](https://www.jeffseah.rocks/#pricing) before deciding. Please reply to
claim the discount rather than checking out through the standard pricing page.

Jeff

### C5. Day 24
**Subject:** Your Power Calendar invitation

Hi {{ person.firstName }},

The 50% invitation is still available if you want to keep using your personal timing calendar:

- Power Calendar: 30-day free trial, then USD 48.50 a month for the first three paid months,
  then USD 97 a month.
- Calendar + Brief: USD 98.50 a month for three paid months, then USD 197 a month.

Reply **CALENDAR** or **BRIEF** and I will arrange it and confirm the billing dates before you join.
Your free sample needs no cancellation and does not charge you.

Jeff

### C6. Day 40
**Subject:** The decision you wrote to me about

Hi {{ person.firstName }},

When you sent your details, you told me about the decisions you're weighing this year. If one of them
is close, a **Single Session** is an hour with me on exactly that: your chart, your timing, your options.

**[Book a Single Session](https://www.jeffseah.rocks/book)** (USD 197)

Jeff
