import { createSoftBookIntro } from './soft-book.js';
import { initChapterExplorer } from './chapter-explorer.js';

/* Progressive enhancement: the complete course stays readable without this script. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const masthead = document.querySelector('.site-masthead');
  const nav = document.querySelector('.nav');
  nav.setAttribute('aria-label', '课程导航');
  masthead.querySelector('.masthead-nav-slot').append(nav);
  function placeLanguage() {
    const control = document.querySelector('.lang-switch');
    if (control && !masthead.contains(control)) {
      control.classList.remove('lang-switch-floating');
      masthead.querySelector('.masthead-language-slot').append(control);
    }
  }
  placeLanguage();
  // The existing language module injects its control after DOMContentLoaded.
  const languageObserver = new MutationObserver(placeLanguage);
  languageObserver.observe(document.body, { childList: true });
  if (!reducedMotion.matches) document.body.classList.add('motion-ready');

  initChapterExplorer();
  const revealElements = document.querySelectorAll('.howto-card, .about-item');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    revealElements.forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });
  }

  const stage = document.querySelector('.book-stage');
  const book = document.querySelector('.book-object');
  const entrance = document.querySelector('.book-entrance');
  const hero = document.querySelector('.hero');
  const replay = document.querySelector('.book-replay');
  const intro = createSoftBookIntro({
    hero, entrance, image: document.querySelector('.book-cover'), motion: reducedMotion,
    onFinish: () => resetBook()
  });
  function resetBook() {
    book.style.removeProperty('--rx');
    book.style.removeProperty('--ry');
    book.style.removeProperty('--rz');
  }
  stage.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || intro.running) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    book.style.setProperty('--rx', `${1 - y * 9}deg`);
    book.style.setProperty('--ry', `${-9 + x * 16}deg`);
    book.style.setProperty('--rz', `${-3 + x * 2}deg`);
  });
  stage.addEventListener('pointerleave', resetBook);
  stage.addEventListener('pointercancel', resetBook);

  replay.addEventListener('click', () => intro.play());
  window.addEventListener('scroll', () => { if (intro.running) intro.stop(); }, { passive: true });
  window.addEventListener('resize', () => { if (intro.running) intro.stop(); }, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') intro.stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) intro.stop(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) intro.stop(); });
  const onLoaded = () => requestAnimationFrame(() => requestAnimationFrame(() => intro.play()));
  if (document.readyState === 'complete') onLoaded();
  else window.addEventListener('load', onLoaded, { once: true });

  const canvas = document.querySelector('.hero-dots');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let points = [], width = 0, height = 0, frame = 0, start = 0;
  let assembled = reducedMotion.matches, inView = true;
  const duration = 1700;
  // Deterministic scatter keeps each load's composition consistent.
  const noise = value => {
    const n = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
    return n - Math.floor(n);
  };
  function resize() {
    width = hero.clientWidth; height = hero.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = [];
    const step = width < 760 ? 18 : 17;
    for (let y = 10; y < height; y += step) {
      for (let x = width * .26; x < width; x += step) {
        const id = points.length;
        const wave = Math.sin(x / width * 9 + Math.cos(y / height * 5) * 1.8);
        const envelope = Math.sin(y / height * Math.PI);
        points.push({ x, y, sx: x + (noise(id) - .5) * 460, sy: y + (noise(id + 81) - .5) * 330,
          radius: .6 + (wave + 1) * .8 * envelope, alpha: .12 + (wave + 1) * .12,
          delay: noise(id + 22) * .24 });
      }
    }
    if (assembled) draw(1); else requestDraw();
  }
  function draw(progress) {
    ctx.clearRect(0, 0, width, height);
    for (const dot of points) {
      const local = Math.max(0, Math.min(1, (progress - dot.delay) / (1 - dot.delay)));
      const ease = 1 - Math.pow(1 - local, 4);
      const x = dot.sx + (dot.x - dot.sx) * ease;
      const y = dot.sy + (dot.y - dot.sy) * ease;
      ctx.fillStyle = `rgba(37,72,50,${dot.alpha * (.15 + ease * .85)})`;
      ctx.beginPath(); ctx.arc(x, y, dot.radius, 0, Math.PI * 2); ctx.fill();
    }
  }
  function tick(time) {
    frame = 0;
    if (!inView || document.hidden) return;
    if (!start) start = time;
    const progress = Math.min(1, (time - start) / duration);
    draw(progress);
    if (progress < 1) requestDraw(); else assembled = true;
  }
  function requestDraw() {
    if (!frame && inView && !document.hidden && !assembled) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(resize).observe(hero);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) requestDraw();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', requestDraw);
  reducedMotion.addEventListener('change', () => {
    resetBook();
    if (reducedMotion.matches) {
      assembled = true;
      cancelAnimationFrame(frame); frame = 0; draw(1);
    }
  });
  resize();
})();
