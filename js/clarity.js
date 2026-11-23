// Optional Clarity recording. Existing analytics remain independent.
(function () {
  'use strict';
  var tag = document.currentScript;
  if (!tag || window.__optionalClarity) return;
  var project = tag.dataset.clarityProject;
  var hosts = (tag.dataset.clarityHosts || '').split(',');
  var paths = (tag.dataset.clarityPaths || '').split(',');
  var path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  var params = new URLSearchParams(location.search);
  // Review mode shows the consent UI on owned previews, but never loads Clarity.
  var preview = params.get('claritypreview') === '1' &&
    (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /\.(pages\.dev|vercel\.app)$/.test(location.hostname));
  var unsafeQuery = Array.from(params).some(function (entry) {
    if (preview && entry[0] === 'claritypreview') return false;
    return !/^(utm_(source|medium|campaign|content|term)|fbclid|gclid|msclkid|oppref)$/.test(entry[0]) ||
      entry[1].length > 250 || /@|%40/i.test(entry[1]);
  });
  // A same-site intake page can put private URL fields in document.referrer.
  var unsafeReferrer = false;
  try {
    var referrer = new URL(document.referrer);
    unsafeReferrer = Array.from(referrer.searchParams.keys()).some(function (name) {
      return /session|token|email|name|birth|code|key|password/i.test(name);
    });
  } catch (_) { /* Empty referrers are normal. */ }
  if (!project || (!preview && !hosts.includes(location.hostname)) || unsafeQuery || unsafeReferrer ||
      (paths[0] && !paths.includes(path)) ||
      /^\/(api|members|portal|r|_portal|_staging|welcome|2027-next|thank-you|thankyou|quote)(\/|$)/i.test(path) ||
      (!preview && navigator.webdriver) || navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
  window.__optionalClarity = true;
  var key = 'optional-clarity-v1';
  var lifetime = 180 * 86400000;
  var loaded = false;
  var panel;
  var preferences;
  function savedChoice() {
    try {
      var value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && Date.now() - value.at >= 0 && Date.now() - value.at < lifetime &&
        (value.choice === 'allow' || value.choice === 'decline') ? value.choice : null;
    } catch (_) { return null; }
  }
  function mask() {
    document.querySelectorAll('form,input,textarea,select,[contenteditable],#teaser,#when-to,#dial,#window,#month,[data-personal]').forEach(function (element) {
      element.setAttribute('data-clarity-mask', 'true');
    });
  }
  function start() {
    if (preview) return;
    if (loaded) return;
    loaded = true;
    mask();
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    // Analytics is optional; Microsoft advertising use is always denied.
    window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(project);
    document.head.appendChild(script);
  }
  function choose(choice) {
    try { localStorage.setItem(key, JSON.stringify({ choice: choice, at: Date.now() })); } catch (_) { /* Applies to this page even when storage is unavailable. */ }
    panel.hidden = true;
    preferences.hidden = false;
    if (choice === 'allow') start();
    else if (loaded && window.clarity) {
      window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
      window.clarity('stop');
      // Remove the loaded recorder and its listeners before any further browsing.
      location.reload();
    }
  }
  function setup() {
    var style = document.createElement('style');
    style.textContent = '.clarity-choice[hidden],.clarity-preferences[hidden]{display:none!important}.clarity-choice{position:fixed;bottom:110px;left:16px;right:16px;z-index:60;max-width:360px;box-sizing:border-box;padding:18px;border:1px solid #a8adb6;border-radius:12px;background:#fff;color:#181818;box-shadow:0 8px 32px #0003;font:16px/1.5 system-ui,sans-serif}.clarity-choice p{margin:0 0 12px;color:inherit;font:inherit}.clarity-choice a{color:#25496b;text-decoration:underline}.clarity-choice-actions{display:flex;gap:12px}.clarity-choice button{flex:1;min-height:44px;padding:8px 12px;border:1px solid #444;border-radius:6px;background:#fff;color:#181818;font:inherit;cursor:pointer}.clarity-choice button:focus-visible,.clarity-preferences:focus-visible{outline:3px solid #2864a6;outline-offset:3px}.clarity-preferences{display:block;margin:16px auto;padding:8px 12px;border:0;background:transparent;color:inherit;text-decoration:underline;font:15px/1.5 system-ui,sans-serif;cursor:pointer}';
    document.head.appendChild(style);
    panel = document.createElement('aside');
    panel.className = 'clarity-choice';
    panel.setAttribute('aria-label', 'Optional website insights');
    panel.innerHTML = '<p><strong>Help improve this website?</strong></p><p>Allow Microsoft Clarity to record clicks and scrolling on public pages? Form content is masked. This is optional.</p><p><a href="' + tag.dataset.clarityPrivacy + '#clarity">Privacy details</a></p><div class="clarity-choice-actions"><button type="button" data-clarity-choice="allow">Allow</button><button type="button" data-clarity-choice="decline">No thanks</button></div>';
    panel.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () { choose(button.dataset.clarityChoice); });
    });
    preferences = document.createElement('button');
    preferences.type = 'button';
    preferences.className = 'clarity-preferences';
    preferences.textContent = 'Website insights preferences';
    preferences.addEventListener('click', function () {
      panel.hidden = false;
      panel.querySelector('button').focus();
    });
    document.body.appendChild(panel);
    (document.querySelector('footer') || document.body).appendChild(preferences);
    var choice = savedChoice();
    panel.hidden = choice !== null;
    // Avoid stacking this notice over Home Reno's separate ad-measurement choice.
    var quoteChoice = document.querySelector('#quote-measurement-choice');
    if (quoteChoice) {
      function updateNotice() { panel.hidden = savedChoice() !== null || !quoteChoice.hidden; }
      updateNotice();
      new MutationObserver(updateNotice).observe(quoteChoice, { attributes: true, attributeFilter: ['hidden'] });
    }
    if (choice === 'allow') start();
    window.addEventListener('storage', function (event) {
      if (event.key !== key) return;
      var current = savedChoice();
      if (current === 'allow') start();
      else if (loaded) {
        window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
        window.clarity('stop');
        location.reload();
      }
      panel.hidden = current !== null;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
