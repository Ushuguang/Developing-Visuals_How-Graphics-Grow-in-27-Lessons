/**
 * 补充 demo 的数据读取兜底
 *
 * 背景: 浏览器在 file:// 下会用 CORS 拦截 d3.csv / d3.json / d3.text 的本地读取,
 * 旧版 demo 只把错误写进 console, 页面会静默留白。
 *
 * 这里做两件事:
 *   1. 拦一层 window.fetch: 正常读取失败时, 改用 data-inline.js 里内联的同一份数据;
 *      正常读取成功时完全不介入, 所以 http:// 下的行为与原来一致。
 *   2. 统一接管旧版 demo 的错误分支 (window.__suppError), 让失败可见而不是留白。
 *
 * 注意: 不能直接改写 d3.csv / d3.json —— 打包出来的 d3 命名空间是只读 getter,
 * 赋值会抛 "Cannot set property csv"。d3-fetch 走的是 fetch, 所以拦 fetch 即可。
 */
(function () {
  'use strict';

  function keyOf(url) {
    return String(url).split('?')[0].split('#')[0].split('/').pop();
  }

  function inline() {
    return window.__SUPP_DATA__ || {};
  }

  function mountPoint() {
    return (
      document.querySelector('#tree-container') ||
      document.getElementById('app') ||
      document.body
    );
  }

  function showNotice(text) {
    if (document.querySelector('.supp-error-notice')) return;
    var box = document.createElement('div');
    box.className = 'supp-error-notice';
    box.style.cssText =
      'margin:20px;padding:16px 18px;border:1px solid #c0392b;border-radius:3px;' +
      'color:#c0392b;background:#fff6f5;font:14px/1.75 "Microsoft YaHei",sans-serif;';
    box.textContent = text;
    var mount = mountPoint();
    if (mount && mount.prepend) mount.prepend(box);
    else if (mount) mount.appendChild(box);
  }

  // 旧版 demo 的错误分支统一走这里
  window.__suppError = function (message) {
    showNotice(
      '加载失败：' +
        (message || '未知错误') +
        '。这个 demo 需要通过 HTTP 打开才能读取数据（file:// 下浏览器会拦截本地数据请求），' +
        '请双击仓库根目录的 start-local.bat 后改用 http://localhost:8080/ 访问。'
    );
  };

  if (!window.d3) {
    document.addEventListener('DOMContentLoaded', function () {
      showNotice(
        'D3.js 未能加载：本地备份与 CDN 都不可用。请确认 vendor/d3.iife.min.js 存在，或改用 start-local.bat 以 HTTP 方式打开。'
      );
    });
    return;
  }

  var data = inline();
  var origFetch = window.fetch;

  if (typeof origFetch === 'function') {
    window.fetch = function (input) {
      var url =
        typeof input === 'string'
          ? input
          : input && typeof input.url === 'string'
          ? input.url
          : '';
      return origFetch.apply(window, arguments).catch(function (err) {
        var key = keyOf(url);
        if (!key || !(key in data)) throw err;
        var body = data[key];
        if (typeof Response === 'function') {
          return Promise.resolve(
            new Response(body, {
              status: 200,
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            })
          );
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: function () {
            return Promise.resolve(body);
          },
          json: function () {
            return Promise.resolve(JSON.parse(body));
          }
        });
      });
    };
  }
})();
