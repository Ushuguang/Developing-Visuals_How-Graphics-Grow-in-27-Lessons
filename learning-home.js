import { readVisits, STORAGE_KEY } from './learning-progress.js?v=20261021-mapping';

const copy = (zh, en) => document.documentElement.lang === 'en' ? en : zh;
const titles = [['数据', 'Data'], ['数据可视化流程', 'Visualization Workflow'], ['色彩专题', 'Color'], ['低维数据可视化', 'Low-Dimensional Data'], ['时序数据可视化', 'Time Series Data']];
const count = document.getElementById('progress-count');
const title = document.getElementById('progress-title');
const detail = document.getElementById('progress-detail');
const resume = document.getElementById('progress-resume');
const clear = document.getElementById('progress-clear');

function showVisits() {
  const { visits, available } = readVisits();
  const visited = Object.keys(visits);
  const last = visited.sort((a, b) => visits[b].at - visits[a].at)[0];
  document.querySelectorAll('.map-node[data-lesson]').forEach(node => {
    const chapter = node.dataset.lesson;
    const isLast = chapter === last;
    node.dataset.last = String(isLast);
    let badge = node.querySelector('.map-visit');
    if (!badge) { badge = document.createElement('span'); badge.className = 'map-visit'; node.querySelector('div').append(badge); }
    badge.hidden = !visits[chapter];
    badge.textContent = isLast ? copy('上次访问', 'Last visited') : copy('已访问', 'Visited');
  });
  count.textContent = copy(`已访问 ${visited.length} / 5 章`, `${visited.length} / 5 chapters visited`);
  clear.hidden = !visited.length;
  if (last) {
    const record = visits[last];
    title.textContent = copy(`继续学习：第 ${last} 章 · ${titles[last - 1][0]}`, `Continue: Chapter ${last} · ${titles[last - 1][1]}`);
    const part = record.section.split('-').slice(1).join('.');
    const tab = { explain: copy('讲解', 'Explain'), code: copy('关键代码', 'Key code'), mapping: copy('映射', 'Mapping'), demo: copy('演示', 'Demo') }[record.tab];
    detail.textContent = copy(`上次阅读 ${part} · ${tab}，返回时恢复阅读位置。`, `Last view: ${part} · ${tab}. Return to your saved position.`);
    resume.href = `lesson-${String(last).padStart(2, '0')}/index.html?resume=1`;
    resume.textContent = copy('继续上次学习 ↗', 'Continue learning ↗');
  } else {
    title.textContent = copy('还没有访问记录，从第一章开始吧。', 'No visits yet. Start with Chapter 1.');
    detail.textContent = available ? copy('打开章节后，会在此记录最近阅读的小节与标签页。', 'Your latest section and tab will appear here after visiting a chapter.') : copy('浏览器暂不允许保存记录，你仍可正常浏览所有课程。', 'Browser storage is unavailable. All course content remains accessible.');
    resume.href = 'lesson-01/index.html';
    resume.textContent = copy('开始第一章 ↗', 'Start Chapter 1 ↗');
  }
  const heroStart = document.querySelector('.hero-enter');
  heroStart.href = resume.getAttribute('href');
  heroStart.querySelector('span').textContent = last ? copy(`继续学习：第 ${last} 章`, `Continue: Chapter ${last}`) : copy('开始学习：第 1 章', 'Start learning: Chapter 1');
  const row = document.getElementById('progress-chapters');
  row.replaceChildren();
  titles.forEach(([zh, en], index) => {
    const chapter = index + 1;
    const a = document.createElement('a');
    a.href = `lesson-${String(chapter).padStart(2, '0')}/index.html`;
    a.dataset.visited = String(Boolean(visits[chapter]));
    a.dataset.last = String(last === String(chapter));
    const number = document.createElement('span'); number.className = 'progress-number'; number.textContent = String(chapter).padStart(2, '0');
    const name = document.createElement('strong'); name.textContent = copy(zh, en);
    const state = document.createElement('small'); state.textContent = visits[chapter] ? copy('已访问', 'Visited') : copy('未访问', 'Not visited');
    a.append(number, name, state); row.append(a);
  });
}
clear.addEventListener('click', () => {
  try { localStorage.removeItem(STORAGE_KEY); showVisits(); }
  catch { detail.textContent = copy('暂时无法清除，请检查浏览器的站点存储设置。', 'Unable to clear records. Check browser site storage settings.'); }
});
window.addEventListener('pageshow', showVisits);
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) showVisits(); });
document.addEventListener('wbl:localechange', showVisits);
showVisits();
