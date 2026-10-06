// js/measure.js : funnel measurement for /2027 and /2027-next (plan step 1, 2026-10-06).
// 1. Vercel Web Analytics: page views with UTM breakdown (cookieless). Switch it on in the
//    Vercel dashboard (project > Analytics > Enable) or /_vercel/insights/script.js 404s.
// 2. Remembers the first-party UTM tags of the latest tagged visit (localStorage, 30 days).
// 3. Order click: "Checkout" event, and the Stripe link gets client_reference_id=<source>_<campaign>
//    so every paid Checkout Session in Stripe shows where the buyer came from.
// 4. /2027-next?paid=1&session_id=cs_...: one "Purchase" event per session id.
// 5. ChatGPT Ads pixel (oaiq): off until OPENAI_PIXEL_ID is filled in (Ads Manager > Conversions).
//    It loads only for visitors who arrived from a ChatGPT ad (oppref in the URL or the
//    __oppref cookie the pixel set on landing), so organic visitors get no ad cookie.
(function () {
  var OPENAI_PIXEL_ID = 'WszgasoEPAiE21zUpcFH6N'; // ChatGPT Ads Manager pixel, 2026-10-06
  var PRICE_STEP_AT = Date.UTC(2026, 11, 31, 16, 0, 0); // same as 2027.js and 2027.html
  var price = function () { return Date.now() >= PRICE_STEP_AT ? 138 : 88; };
  var ATTR_KEY = 'js_attr';
  var ATTR_DAYS = 30;
  var params = new URLSearchParams(location.search);

  function store(get, key, val) {
    try { return get ? localStorage.getItem(key) : localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function load(src) {
    var s = document.createElement('script');
    s.defer = true; s.src = src;
    document.head.appendChild(s);
  }

  // -- 1. Vercel Web Analytics --
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  load('/_vercel/insights/script.js');

  // -- 2. Attribution (last tagged visit wins) --
  var attr = null;
  try { attr = JSON.parse(store(true, ATTR_KEY) || 'null'); } catch (e) {}
  if (attr && Date.now() - attr.at > ATTR_DAYS * 864e5) attr = null;
  var fromAd = params.has('oppref') || /(?:^|;\s*)__oppref=/.test(document.cookie);
  if (params.has('utm_source') || params.has('oppref')) {
    attr = {
      source: params.get('utm_source') || 'chatgpt',
      medium: params.get('utm_medium') || (params.has('oppref') ? 'cpc' : ''),
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      at: Date.now()
    };
    store(false, ATTR_KEY, JSON.stringify(attr));
  }
  var tags = attr ? { source: attr.source, medium: attr.medium, campaign: attr.campaign, content: attr.content } : {};
  function withTags(data) { for (var k in tags) if (tags[k]) data[k] = tags[k]; return data; }

  // -- 5. ChatGPT Ads pixel --
  var pixel = !!OPENAI_PIXEL_ID && fromAd;
  if (pixel) {
    (function (w, d, s, u) {
      if (w.oaiq) return;
      var q = function () { q.q.push(arguments); };
      q.q = [];
      w.oaiq = q;
      var js = d.createElement(s);
      js.async = true;
      js.src = u;
      var f = d.getElementsByTagName(s)[0];
      f.parentNode.insertBefore(js, f);
    })(window, document, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
    window.oaiq('init', { pixelId: OPENAI_PIXEL_ID });
    window.oaiq('measure', 'page_viewed', { type: 'contents' });
  }
  var OUTLOOK = { id: 'outlook-2027', name: '2027 Annual Outlook', content_type: 'product', quantity: 1 };

  // -- 3. Order clicks (any Stripe Payment Link on the page) --
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://buy.stripe.com/"]');
    if (!a) return;
    if (attr) {
      // Stripe allows letters, digits, dashes and underscores, up to 200 characters.
      var ref = [attr.source, attr.campaign].filter(Boolean).join('_').replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 200);
      var url = new URL(a.href);
      url.searchParams.set('client_reference_id', ref);
      a.href = url.toString();
    }
    window.va('event', { name: 'Checkout', data: withTags({ price: price() }) });
    if (pixel) window.oaiq('measure', 'checkout_started', { type: 'contents', amount: price() * 100, currency: 'USD', contents: [OUTLOOK] });
  }, true);

  // -- 4. Purchase, on the Stripe success page --
  var sid = params.get('session_id') || '';
  if (params.get('paid') === '1' && sid.indexOf('cs_') === 0) {
    var seenKey = 'js_paid_' + sid;
    if (!store(true, seenKey)) {
      store(false, seenKey, '1');
      window.va('event', { name: 'Purchase', data: withTags({ price: price() }) });
      if (pixel) window.oaiq('measure', 'order_created', { type: 'contents', amount: price() * 100, currency: 'USD', contents: [OUTLOOK] }, { event_id: sid });
    }
  }
})();
