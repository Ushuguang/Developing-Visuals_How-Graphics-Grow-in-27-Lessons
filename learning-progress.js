// Browser-local visits, deliberately separate from completion or assessment.
export const STORAGE_KEY = 'vis-course-visits-v1';
const tabs = ['explain', 'code', 'mapping', 'demo'];
const sectionCounts = [0, 5, 4, 8, 5, 5];

export function parseVisits(raw) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !value.visits || typeof value.visits !== 'object') return {};
    const clean = {};
    for (let chapter = 1; chapter <= 5; chapter++) {
      const record = value.visits[chapter];
      if (!record || !Number.isFinite(record.at) || record.at <= 0) continue;
      clean[chapter] = {
        at: record.at,
        section: typeof record.section === 'string' && new RegExp(`^ch-${chapter}-[1-${sectionCounts[chapter]}]$`).test(record.section) ? record.section : `ch-${chapter}-1`,
        tab: tabs.includes(record.tab) ? record.tab : 'explain',
        offset: Number.isFinite(record.offset) ? Math.max(-2000, Math.min(100000, record.offset)) : 0
      };
    }
    return clean;
  } catch { return {}; }
}
export function readVisits() {
  try { return { visits: parseVisits(localStorage.getItem(STORAGE_KEY)), available: true }; }
  catch { return { visits: {}, available: false }; }
}
export function saveVisit(chapter, record) {
  try {
    const visits = readVisits().visits;
    visits[chapter] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, visits }));
    return true;
  } catch { return false; }
}

function trackLesson() {
  const chapter = Number(document.querySelector('.course-topbar')?.dataset.current);
  if (!(chapter >= 1 && chapter <= 5)) return;
  const articles = [...document.querySelectorAll('article.chapter[id]')];
  if (!articles.length) return;
  const saved = readVisits().visits[chapter];
  const shouldResume = new URLSearchParams(location.search).get('resume') === '1';
  let ready = false, timer, preferredSection;
  // An ordinary chapter link always starts normally; only Continue restores a view.
  saveVisit(chapter, { ...(saved || { section: articles[0].id, tab: 'explain', offset: 0 }), at: Date.now() });
  function capture(force = false) {
    if (!ready || (document.hidden && !force)) return;
    const readingLine = Math.max(160, Math.min(innerHeight * .4, 360));
    const preferredRect = preferredSection?.getBoundingClientRect();
    const section = (preferredRect && preferredRect.bottom > 160 && preferredRect.top < innerHeight ? preferredSection : null) || articles.find(el => {
      const rect = el.getBoundingClientRect();
      return rect.top <= readingLine && rect.bottom > readingLine;
    }) || articles.find(el => el.getBoundingClientRect().bottom > readingLine) || articles.at(-1);
    preferredSection = section;
    saveVisit(chapter, {
      at: Date.now(), section: section.id,
      tab: section.querySelector('.tab-btn.active')?.dataset.tab || 'explain',
      offset: -section.getBoundingClientRect().top
    });
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(capture, 220); };
  window.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('click', event => {
    const tab = event.target.closest('.tab-btn');
    const nav = event.target.closest('.chapter-nav a[data-chapter]');
    if (tab || nav) {
      preferredSection = tab?.closest('article.chapter') || document.getElementById(nav.dataset.chapter);
      requestAnimationFrame(() => capture());
      schedule();
    }
  });
  window.addEventListener('pagehide', () => { clearTimeout(timer); capture(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) capture(true); });
  function begin() {
    if (shouldResume && saved) {
      const section = document.getElementById(saved.section);
      if (section) {
        document.querySelectorAll('.chapter-nav a[data-chapter]').forEach(link => link.classList.toggle('active', link.dataset.chapter === saved.section));
        preferredSection = section;
        section.querySelector(`.tab-btn[data-tab="${saved.tab}"]`)?.click();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const offset = Math.min(saved.offset, Math.max(0, section.offsetHeight - 160));
          window.scrollTo({ top: Math.max(0, scrollY + section.getBoundingClientRect().top + offset), behavior: 'instant' });
          ready = true;
          capture();
        }));
        return;
      }
    }
    ready = true;
    capture();
  }
  if (document.readyState === 'complete') begin();
  else window.addEventListener('load', begin, { once: true });
}
if (typeof document !== 'undefined') trackLesson();
