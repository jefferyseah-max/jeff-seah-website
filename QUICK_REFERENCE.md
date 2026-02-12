# Quick Reference - Things to Update

## 🔴 BEFORE GOING LIVE - Update These:

### 1. Google Sheets Web App URL
**File:** `script.js` (line 7)
```javascript
const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE';
```
👉 Replace with your actual Google Apps Script Web App URL

---

### 2. Stripe Payment Links
**File:** `index.html`

#### Essential Package (line ~258)
```html
<a href="#calendar" class="pricing-cta-link">
```
👉 Replace `#calendar` with your Stripe payment link

#### Combo Package (line ~279)
```html
<a href="STRIPE_PAYMENT_LINK_COMBO" target="_blank">
```
👉 Replace `STRIPE_PAYMENT_LINK_COMBO` with your Stripe payment link

#### Premium Package (line ~294)
```html
<a href="STRIPE_PAYMENT_LINK_PREMIUM" target="_blank">
```
👉 Replace `STRIPE_PAYMENT_LINK_PREMIUM` with your Stripe payment link

---

## ✅ Already Configured:

- ✅ CalendarHero booking link: https://meeting.calendarhero.com/meeting/new/5f76b7f56d08b80020fec8d3/lifecoaching
- ✅ Site design and animations
- ✅ Responsive mobile layout
- ✅ SEO meta tags
- ✅ Form validation

---

## 📝 After Stripe Setup:

Once you create your Stripe payment links, they'll look like:
```
https://buy.stripe.com/xxxxxxxxxxxxx
```

Copy each one and paste it into the appropriate location in `index.html`.

---

## 🚀 Ready to Deploy?

Once you've updated the Google Sheets URL and Stripe links:

1. Test locally by opening `index.html` in a browser
2. Fill out the form to test Google Sheets integration
3. Click pricing buttons to verify Stripe links work
4. Follow the deployment steps in `SETUP_GUIDE.md`

**Need the full deployment instructions?** See `SETUP_GUIDE.md`
