# Encharge email drafts: Power Calendar 30-day trial (Flow D)

Drafted 2026-11-19 (Claude, with Jeff). **Built in Encharge 2026-11-19 (flows 415139 and 415144), switched off. Nothing sends until Jeff
switches them on.** From: Jeff Seah <coaching@jeffseah.rocks>, reply-to the same. Every
email signs off "Jeff" with jeffseah.rocks below and carries Encharge's unsubscribe link, with no postal address
(Jeff removed it 2026-11-19, accepting the US CAN-SPAM risk).

Customer-facing name: **Power Calendar** ("built on the Chinese Tong Shu almanac, read against your birth
chart"). The app page itself is still titled "My Tongshu"; the emails name both once so the link is clear.
Rulings D9 and D10 still apply: no email invites a question. Replying is offered only for form trouble.

Merge fields: `{{ person.firstName }}`. Review copy for Jeff (all series, editable): https://claude.ai/artifact/VnWF2pH2nGDWL2BGsSkCZk

---

## Flow map

```
Subscription Started (tag monthly-97)
  -> D1 Welcome .................................................. immediately
  -> wait 2 days -> has tag intake-received?
       yes -> D2 What your Power Calendar shows you ............ day 2
              wait 1 day -> D3 How to read a day ................ day 3
       no  -> D2R Birth details reminder ........................ day 2
              wait 1 day -> D2 ................................... day 3
              wait 1 day -> D3 ................................... day 4
  -> wait until day 25 -> no tag monthly-cancelled? -> D5 Trial ends in 5 days

Tag power-calendar-ready added (Jeff adds it when the account is set up)
  -> D4 Your Power Calendar is ready ............................ immediately
```

Timing basis: the 97 trial's first charge falls on the trial end, 30 days after sign-up (the webhook
keeps Calendar-only billing on the trial end, not the 15th), so day 25 gives five days' notice.

### Before activation (gates)

1. **Cancellations reach Encharge.** Built 2026-11-19: the webhook tags `monthly-cancelled` and fires
   "Subscription Cancelled" (or "Subscription Resumed") from `customer.subscription.deleted` / `.updated`,
   matching the contact by `userId` = Stripe customer, which checkouts now store. Still to do: Jeff adds those
   two events to the Stripe webhook destination. Contacts created before 2026-11-19 (only Jeff's own test
   trial) have no `userId`, so their cancellation would not find them.
2. **Intake email can differ from checkout email.** The `intake-received` tag lands on the email typed into
   `/welcome`; the flow runs on the Stripe checkout email. In the 18 Nov test they differed, so D2R would
   have gone to someone who had already sent the form. D2R's copy covers this ("if you've already sent
   them, ignore this"); a proper fix is to match on `stripeSessionId` in the Apps Script before tagging.
3. **Ready trigger.** D4 runs when Jeff adds the tag `power-calendar-ready` to the contact in Encharge after
   setting up access in `/members/apps/access`. Does D4 replace Jeff's manual sign-in email, or follow it?
   (Draft assumes it replaces it, so it carries the sign-in link.)
4. **Portal readiness for other clients.** The portal guide (`Client Monthly Workflow/docs/PERSONAL_BAZI_TONGSHU_PORTAL.md`)
   describes My Tongshu as a Jeffery-only pilot. D3 and D4 describe the app as it is for Jeffery; confirm a
   trial client sees the same sections before these send.
5. **Time zone.** Settled 2026-11-19 (Jeff): Tong Shu hours apply in the client's local time, so no conversion
   is needed anywhere; D3 says so.
6. **Stripe's own trial reminder.** If Settings > Billing > Subscriptions and emails > "trial ending"
   reminders is on, clients get Stripe's email and D5. Keep one; D5 is warmer and names what they keep.

---

## D1. Immediately: welcome
**Subject:** Your Power Calendar trial has started

Hi {{ person.firstName }},

Welcome. Your 30-day free trial of the Power Calendar has started, and nothing is charged until it ends.

Here is what happens next:

1. **Your birth details.** Your calendar is built from your date, time and place of birth. If you closed
   the page before sending them, it takes two minutes:
   **[Send my birth details](https://www.jeffseah.rocks/welcome?plan=97)**
2. **I set up your calendar.** Your Power Calendar is built on the Tong Shu, the Chinese almanac people
   have planned by for centuries, but every day is read against your own chart, not a generic sign.
3. **You get your sign-in link** within 5 working days of your details reaching me.

Over the next few days I'll send two short notes on what your calendar shows and how to read it, so you
can use it from the first morning.

You can manage or cancel your plan anytime here:
[Manage your plan](https://billing.stripe.com/p/login/aFa28t3Uz6Oq6A2fCFbwk00)

Jeff  
[jeffseah.rocks](https://www.jeffseah.rocks)

---

## D2R. Day 2, only if tag `intake-received` is missing
**Subject:** I can't start your calendar yet

Hi {{ person.firstName }},

A quick nudge: I don't have your birth details yet, so your Power Calendar hasn't started.

**[Send my birth details](https://www.jeffseah.rocks/welcome?plan=97)**

Date, time and place of birth is all I need. If you don't know your birth time, send the rest and tick
the box; your calendar still works.

If you've already sent them, thank you, and please ignore this. If the form gives you any trouble, reply
and I'll help you complete it.

Jeff  
[jeffseah.rocks](https://www.jeffseah.rocks)

---

## D2. What your Power Calendar shows you
**Subject:** What your Power Calendar will show you

Hi {{ person.firstName }},

While I set up your calendar, here is what to expect when you sign in.

**It is your days, not everyone's.** A printed almanac gives the same good and bad days to everyone.
Yours starts from the same Tong Shu, then checks every day against your birth chart: when a day supports
you, when it clashes with your chart, and why.

**Each day carries a coloured marker.** At a glance across the month:

- **Green**: your power days, the ones that back you. Good for the things that matter.
- **Black**: caution days. Not bad luck; days to keep simple, finish rather than start, and say less.
- **Red**: auspicious and activation days, plus the full and new moons.
- **Purple**: TLC days, tender loving care for your body. Your immunity runs lower, so rest, eat well
  and don't push it.
- **Gold**: reference days, such as solar terms and festivals.

**My Week sits at the top.** It lists only the days that matter this week, Monday to Sunday, so you can plan
the important meeting, the launch or the hard conversation in advance, instead of finding out on the day.

Tomorrow: how to read a single day, down to the hour.

Jeff  
[jeffseah.rocks](https://www.jeffseah.rocks)

---

## D3. How to read a day
**Subject:** How to read a day in your Power Calendar

Hi {{ person.firstName }},

Tap any date in your calendar and it opens in full. Here is how to read it, top to bottom:

1. **Your calendar.** The entries I've written for that day. Tap one to open it: what the day is for,
   and what to do with it.
2. **Day and chart interactions.** Short labels showing how the day meets your chart, such as a clash
   or a combination with one of your pillars. Open **Interaction details** for the plain-English reason.
3. **Suitable activities and Activities to avoid.** The traditional almanac lists for the day, useful
   for timing things like signing, moving or starting a new job.
4. **Day stars.** The helpful and difficult stars on duty that day, for those who like the detail.
5. **Hours.** Swipe along the strip: **Best** hours in red, **Usable** in green, **Avoid** in dark. When
   a day is mixed, the hours tell you when within it to act.

Every time is your own local time, wherever you live: a Best hour of 1pm to 3pm means 1pm to 3pm where you are,
with no converting.

A simple way to start: open **My Week** on Monday morning, mark the one or two days that suit what you
most need to do, and check the hours before anything important.

Jeff  
[jeffseah.rocks](https://www.jeffseah.rocks)

---

## D4. When tag `power-calendar-ready` is added
**Subject:** Your Power Calendar is ready

Hi {{ person.firstName }},

Your Power Calendar is ready.

**[Sign in to your Power Calendar](https://reports.jeffseah.rocks/members/portal/tongshu/)**

Start with **My Week** at the top: it shows the days that matter this week. Tap any date for the full
reading, down to the best hours.

Your calendar updates on its own. If you have it open, the Refresh button at the bottom picks up any
new entries straight away.

Your free trial runs until 30 days after you signed up. I'll remind you before it ends.

Jeff  
[jeffseah.rocks](https://www.jeffseah.rocks)

---

## D5. Day 25, only if tag `monthly-cancelled` is missing
**Subject:** Your Power Calendar trial ends in 5 days

Hi {{ person.firstName }},

A heads-up: your free trial ends in 5 days. After that your Power Calendar continues at USD 97 a month,
and you don't need to do anything to keep it.

If you'd rather stop, you can cancel before then and you won't be charged:
[Manage your plan](https://billing.stripe.com/p/login/aFa28t3Uz6Oq6A2fCFbwk00)

Before you decide, open your calendar and look at next week: the days that suit what you need to do,
and the ones to keep simple. That is what each month brings.

Jeff  
[jeffseah.rocks](https://www.jeffseah.rocks)
