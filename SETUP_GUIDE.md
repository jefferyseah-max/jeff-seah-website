# Jeff Seah Website - Setup Guide

This guide will help you complete the integrations and deploy your website to Vercel.

## 🎯 Overview

Your website is ready to deploy with:
- ✅ CalendarHero booking link (already connected)
- ⏳ Google Sheets form integration (needs setup)
- ⏳ Stripe payment links (needs setup)

---

## 📋 Step 1: Set Up Google Sheets Integration

### Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **"Power Calendar Leads"**
4. Add these column headers in row 1:
   - A1: `Timestamp`
   - B1: `Full Name`
   - C1: `Email`
   - D1: `Birth Date`
   - E1: `Birth Time`
   - F1: `Birth City`

### Create the Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Paste the following code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Add row with form data
    sheet.appendRow([
      data.submittedAt,
      data.fullName,
      data.email,
      data.birthDate,
      data.birthTime,
      data.birthCity
    ]);

    // Optional: Send yourself an email notification
    MailApp.sendEmail({
      to: "jefferyseah@gmail.com",
      subject: "New Power Calendar Request",
      body: `New submission from ${data.fullName} (${data.email})\n\nBirth Details:\nDate: ${data.birthDate}\nTime: ${data.birthTime}\nCity: ${data.birthCity}`
    });

    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (disk icon)
5. Click **Deploy > New deployment**
6. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
7. Configure:
   - **Description**: "Form submission handler"
   - **Execute as**: Me
   - **Who has access**: Anyone
8. Click **Deploy**
9. **Copy the Web App URL** - you'll need this!

### Update Your Website Code

1. Open `script.js` in your website files
2. Find this line (near the top):
   ```javascript
   const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE';
   ```
3. Replace `YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE` with your Web App URL
4. Save the file

✅ **Google Sheets integration complete!**

---

## 💳 Step 2: Set Up Stripe Payment Links

### Create Stripe Account (if you haven't)

1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete business verification

### Create Payment Links

1. In your Stripe Dashboard, go to **Products > Add product**
2. Create three products:

#### Essential Package
- Name: **Power Calendar - Essential**
- Price: **$150 USD**
- Billing: **Recurring monthly**
- After creation, click **Create payment link**
- Copy the payment link

#### Combo Package
- Name: **Power Calendar - Combo**
- Price: **$297 USD**
- Billing: **Recurring monthly**
- After creation, click **Create payment link**
- Copy the payment link

#### Premium Package
- Name: **Power Calendar - Premium**
- Price: **$397 USD**
- Billing: **Recurring monthly**
- After creation, click **Create payment link**
- Copy the payment link

### Update Your Website Code

1. Open `index.html`
2. Find these lines and replace with your Stripe payment links:

```html
<!-- Essential Package - around line 258 -->
<a href="#calendar" class="pricing-cta-link">

Replace #calendar with your Stripe link for Essential


<!-- Combo Package - around line 279 -->
<a href="STRIPE_PAYMENT_LINK_COMBO" target="_blank">

Replace STRIPE_PAYMENT_LINK_COMBO with your actual Stripe link


<!-- Premium Package - around line 294 -->
<a href="STRIPE_PAYMENT_LINK_PREMIUM" target="_blank">

Replace STRIPE_PAYMENT_LINK_PREMIUM with your actual Stripe link
```

3. Save the file

✅ **Stripe integration complete!**

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Create a GitHub account** (if you don't have one): [github.com](https://github.com)

2. **Create a new repository**:
   - Go to github.com and click **New repository**
   - Name: `jeff-seah-website`
   - Make it **Public**
   - Click **Create repository**

3. **Upload your files**:
   - Click **uploading an existing file**
   - Drag and drop these files:
     - `index.html`
     - `styles.css`
     - `script.js`
   - Click **Commit changes**

4. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click **Sign Up** and choose **Continue with GitHub**
   - Click **Import Project**
   - Select your `jeff-seah-website` repository
   - Click **Deploy**

5. **Get your URL**:
   - Vercel will give you a URL like: `jeff-seah-website.vercel.app`
   - Your site is now live! 🎉

### Option B: Deploy via Vercel CLI (Faster)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd /path/to/your/website/folder
   vercel
   ```

3. Follow the prompts:
   - **Set up and deploy?** Yes
   - **Which scope?** Your account
   - **Link to existing project?** No
   - **Project name?** jeff-seah-website
   - **Directory?** ./
   - **Deploy?** Yes

4. Your site will be live at the URL shown!

✅ **Site is live on Vercel!**

---

## 🌐 Step 4: Connect Your Custom Domain (jeffseah.rocks)

### Add Domain to Vercel

1. In your Vercel dashboard, go to your project
2. Click **Settings > Domains**
3. Add domain: `jeffseah.rocks`
4. Vercel will give you DNS records to add

### Update Your DNS Settings

1. Go to your domain registrar (where you bought jeffseah.rocks)
2. Find DNS settings
3. Add these records (Vercel will give you the exact values):

**For apex domain (jeffseah.rocks):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Save changes
5. Wait 5-60 minutes for DNS propagation

✅ **Your site will be live at jeffseah.rocks!**

---

## 📧 Step 5: Test Everything

### Test Form Submission
1. Go to your live site
2. Fill out the "Get Your Free Power Calendar" form
3. Submit it
4. Check your Google Sheet - new row should appear
5. Check your email - you should get a notification

### Test Booking Links
1. Click "Book Session" button
2. Should open CalendarHero booking page
3. Verify all pricing tier buttons work

### Test Stripe Payments
1. Click each pricing tier "Get Started" button
2. Should open Stripe payment page
3. Test with Stripe's test card: `4242 4242 4242 4242`

---

## 🎨 Customization Tips

### Change Colors
In `styles.css`, update these variables:
```css
--color-gold: #d4af37;      /* Main accent color */
--color-deep-space: #0a0e27; /* Background */
```

### Update Contact Email
In `script.js` (Google Apps Script):
```javascript
to: "jefferyseah@gmail.com"  // Change to your email
```

### Add Google Analytics
In `index.html`, add before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>
```

---

## 🔧 Troubleshooting

### Form submissions not appearing in Google Sheets
- Check the Web App URL in `script.js` is correct
- Verify the Apps Script deployment is set to "Anyone"
- Check browser console for errors (F12)

### Stripe links not working
- Verify payment links are published in Stripe
- Check the URLs don't have typos
- Make sure products are active in Stripe

### Domain not working
- DNS can take up to 24 hours to propagate
- Verify DNS records match Vercel's requirements exactly
- Try clearing browser cache or using incognito mode

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Verify all URLs and API keys are correct
3. Test in incognito mode to rule out cache issues

---

## 🎉 You're All Set!

Your professional website is now live with:
- ✅ Beautiful, animated design
- ✅ Google Sheets form integration
- ✅ CalendarHero booking
- ✅ Stripe payment processing
- ✅ Custom domain (jeffseah.rocks)
- ✅ Free hosting forever

Congratulations! 🚀
