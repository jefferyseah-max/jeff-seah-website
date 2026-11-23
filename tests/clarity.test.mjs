import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/clarity.js', import.meta.url), 'utf8');
function browser(options = {}) {
  const elements = [], listeners = {}, storage = new Map();
  let reloads = 0;
  function element(tagName) {
    const result = {tagName, dataset: {}, children: [], attributes: {}, events: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      appendChild(child) { this.children.push(child); elements.push(child); },
      addEventListener(name, handler) { this.events[name] = handler; },
      focus() { this.focused = true; },
      querySelector() { return this.querySelectorAll()[0]; },
      querySelectorAll() {
        return this.buttons ||= ['allow', 'decline'].map(choice => {
          const button = element('button'); button.dataset.clarityChoice = choice; return button;
        });
      }};
    return result;
  }
  const sensitive = element('form');
  const footer = element('footer');
  const quoteChoice = options.quoteChoice ? {hidden: false} : null;
  let quoteObserver;
  const document = {currentScript: {dataset: {clarityProject: 'test-project',
    clarityHosts: 'www.jeffseah.rocks', clarityPaths: '/,/2027,/privacy', clarityPrivacy: '/privacy'}},
    readyState: 'complete', referrer: options.referrer || '', body: element('body'), head: element('head'),
    createElement: element, querySelector: selector => selector === 'footer' ? footer : quoteChoice, querySelectorAll: () => [sensitive]};
  const location = {hostname: 'www.jeffseah.rocks', pathname: '/2027', search: '',
    reload: () => reloads++, ...options.location};
  const navigator = {webdriver: false, ...options.navigator};
  if (options.choice) storage.set('optional-clarity-v1', JSON.stringify({choice: options.choice, at: options.at ?? Date.now()}));
  const context = {document, location, navigator, URL, URLSearchParams, Date, console,
    MutationObserver: class { constructor(callback) { quoteObserver = callback; } observe() {} },
    localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)},
    addEventListener: (name, handler) => listeners[name] = handler};
  context.window = context;
  vm.runInNewContext(source, context);
  return {context, document, elements, listeners, storage, sensitive, footer, quoteChoice,
    updateQuote: () => quoteObserver(),
    panel: elements.find(el => el.tagName === 'aside'),
    scripts: () => elements.filter(el => el.tagName === 'script'),
    reloads: () => reloads};
}
test('no recorder loads before consent; decline retains the opt-out', () => {
  const page = browser();
  assert.equal(page.scripts().length, 0);
  page.panel.buttons[1].events.click();
  assert.equal(page.scripts().length, 0);
  assert.equal(JSON.parse(page.storage.get('optional-clarity-v1')).choice, 'decline');
  assert.equal(page.panel.hidden, true);
});
test('allow masks before injecting one recorder and denies advertising storage', () => {
  const page = browser();
  page.panel.buttons[0].events.click();
  page.panel.buttons[0].events.click();
  assert.equal(page.scripts().length, 1);
  assert.equal(page.scripts()[0].src, 'https://www.clarity.ms/tag/test-project');
  assert.equal(page.sensitive.attributes['data-clarity-mask'], 'true');
  const consent = page.context.clarity.q[0];
  assert.equal(consent[0], 'consentv2');
  assert.equal(consent[1].analytics_Storage, 'granted');
  assert.equal(consent[1].ad_Storage, 'denied');
});
test('withdrawal stops recording and reloads into the declined state', () => {
  const page = browser({choice: 'allow'});
  page.panel.buttons[1].events.click();
  assert.equal(page.context.clarity.q.at(-1)[0], 'stop');
  assert.equal(page.context.clarity.q.at(-2)[1].analytics_Storage, 'denied');
  assert.equal(page.reloads(), 1);
});
test('declined, expired and malformed saved choices never start recording', () => {
  assert.equal(browser({choice: 'decline'}).scripts().length, 0);
  assert.equal(browser({choice: 'allow', at: Date.now() - 181 * 86400000}).scripts().length, 0);
  assert.equal(browser({choice: 'invalid'}).scripts().length, 0);
});
test('private routes, sensitive URLs, previews and privacy signals never load or show tracking', () => {
  for (const options of [
    {location: {hostname: 'reports.jeffseah.rocks'}},
    {location: {hostname: 'preview.vercel.app'}},
    ...['/welcome', '/2027-next', '/members/portal/', '/r/private', '/unknown'].map(pathname => ({location: {pathname}})),
    ...['?session_id=cs_private', '?email=private@example.invalid', '?noanalytics=1', '?exit=1', '?utm_source=private%40example.invalid'].map(search => ({location: {search}})),
    {navigator: {webdriver: true}}, {navigator: {globalPrivacyControl: true}}, {navigator: {doNotTrack: '1'}},
    {referrer: 'https://www.jeffseah.rocks/welcome?session_id=cs_private'}
  ]) {
    const page = browser({...options, choice: 'allow'});
    assert.equal(page.scripts().length, 0, JSON.stringify(options));
    assert.equal(page.panel, undefined, JSON.stringify(options));
  }
});
test('marketing URLs remain supported; explicit review mode never transmits', () => {
  assert.equal(browser({choice: 'allow', location: {search: '?utm_source=linkedin&utm_campaign=tongshu'}}).scripts().length, 1);
  const preview = browser({choice: 'allow', location: {hostname: 'preview.vercel.app', search: '?claritypreview=1'}});
  assert.ok(preview.panel);
  assert.equal(preview.scripts().length, 0);
});
test('another tab can grant and revoke consent', () => {
  const page = browser({choice: 'decline'});
  page.storage.set('optional-clarity-v1', JSON.stringify({choice: 'allow', at: Date.now()}));
  page.listeners.storage({key: 'optional-clarity-v1'});
  assert.equal(page.scripts().length, 1);
  page.storage.set('optional-clarity-v1', JSON.stringify({choice: 'decline', at: Date.now()}));
  page.listeners.storage({key: 'optional-clarity-v1'});
  assert.equal(page.reloads(), 1);
});
test('the optional notice waits until the separate advertising choice is resolved', () => {
  const page = browser({quoteChoice: true});
  assert.equal(page.panel.hidden, true);
  assert.equal(page.scripts().length, 0);
  page.quoteChoice.hidden = true;
  page.updateQuote();
  assert.equal(page.panel.hidden, false);
  assert.equal(page.scripts().length, 0);
});
