/**
 * 侧边栏章节目录高亮兜底
 *
 * 站点主体使用 ES modules。在 file:// 下浏览器会以 CORS 拦截模块脚本,
 * lesson.js 整个不执行, 章节目录的"当前小节"高亮就停在 HTML 里写死的第一项。
 * 这个普通脚本不依赖模块加载, 负责让"高亮跟随"在任何环境下都成立。
 *
 * 与 lesson.js 的关系是补充而不是替代: 模块正常加载时两者给出同一个结果。
 */
(function () {
  'use strict';

  function navLinks() {
    return Array.prototype.slice.call(
      document.querySelectorAll('.chapter-nav a[data-chapter]')
    );
  }

  function mark(id) {
    if (!id) return;
    navLinks().forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-chapter') === id);
    });
  }

  function fromHash() {
    var m = /^#(ch-\d+-\d+)$/.exec(window.location.hash || '');
    if (m) mark(m[1]);
  }

  function onClick(event) {
    var t = event.target;
    if (!t || !t.closest) return;
    var a = t.closest('.chapter-nav a[data-chapter]');
    if (a) mark(a.getAttribute('data-chapter'));
  }

  function init() {
    fromHash();
    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', fromHash);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
