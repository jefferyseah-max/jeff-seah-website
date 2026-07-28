# Google Sheets Setup - Step by Step

> **Already set up and want to add spam protection + email verification?**
> See **[FORM_SECURITY_SETUP.md](FORM_SECURITY_SETUP.md)** — it upgrades the Apps
> Script below with a honeypot check, double opt-in confirmation, spam scoring,
> and optional Cloudflare Turnstile. The front-end guards are already live in
> `index.html`.


## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it: **"Power Calendar Leads"**
4. Add these column headers in Row 1:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Timestamp | Full Name | Email | Birth Date | Birth Time | Birth City |

---

## Step 2: Create the Apps Script

1. In your Google Sheet, click **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy and paste this EXACT code:

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

    // Send email notification
    MailApp.sendEmail({
      to: "jefferyseah@gmail.com",
      subject: "🌟 New Power Calendar Request",
      body: `New submission from ${data.fullName}\n\nEmail: ${data.email}\n\nBirth Details:\nDate: ${data.birthDate}\nTime: ${data.birthTime}\nCity: ${data.birthCity}\n\nSubmitted: ${data.submittedAt}`
    });

    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (💾 disk icon)
5. Name the project: **"Power Calendar Form Handler"**

---

## Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure these settings:
   - **Description**: "Form submission handler"
   - **Execute as**: **Me** (jefferyseah@gmail.com)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced** (if you see a warning)
9. Click **Go to Power Calendar Form Handler (unsafe)** - this is normal
10. Click **Allow**

---

## Step 4: Copy the Web App URL

After deployment, you'll see a screen with:
- **Deployment ID**: (ignore this)
- **Web app URL**: **COPY THIS!** It looks like:
  ```
  https://script.google.com/macros/s/AKfycbz.../exec
  ```

**Copy the entire URL** - you'll need it in the next step!

---

## Step 5: Update Your Website

1. Go to your GitHub repository: `jeff-seah-website`
2. Click on the file **`script.js`**
3. Click the **pencil icon** (✏️) to edit
4. Find line 92:
   ```javascript
   const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE';
   ```
5. Replace `YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE` with your actual Web App URL:
   ```javascript
   const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz.../exec';
   ```
6. Scroll down and click **Commit changes**
7. Add commit message: "Add Google Sheets integration"
8. Click **Commit changes**

---

## Step 6: Vercel Auto-Deploy

Vercel will automatically detect the change and redeploy your site (takes ~30 seconds).

You can watch the deployment at: https://vercel.com/jefferyseah-max/jeff-seah-website

---

## Step 7: Test It!

1. Go to your live site: **jeffseah.rocks** (or www.jeffseah.rocks)
2. Scroll to the form
3. Fill it out with test data
4. Submit
5. Check your Google Sheet - new row should appear!
6. Check your email - you should get a notification!

---

## ✅ Success Checklist:

- [ ] Google Sheet created with correct headers
- [ ] Apps Script code pasted and saved
- [ ] Web app deployed with "Anyone" access
- [ ] Web App URL copied
- [ ] `script.js` updated in GitHub with the URL
- [ ] Vercel redeployed (automatic)
- [ ] Form tested and working
- [ ] Data appears in Google Sheet
- [ ] Email notification received

---

## 🆘 Troubleshooting:

### Form submits but nothing happens:
- Check browser console (F12) for errors
- Verify the Web App URL is correct in `script.js`
- Make sure deployment is set to "Anyone" access

### "Authorization required" error:
- You need to authorize the script (Step 3, points 6-10)
- Make sure you chose "Allow" for all permissions

### No email notification:
- Check your Gmail spam folder
- Verify the email address in the script is correct

---

## 📧 Need Help?

If you get stuck, check:
1. Browser console (F12) for error messages
2. Apps Script execution logs (View > Executions in Apps Script editor)
3. Your Google Sheet permissions (should be accessible by you)

---

**Ready?** Follow these steps and your form will be live! 🚀
