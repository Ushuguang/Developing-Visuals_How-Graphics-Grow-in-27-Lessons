// Preserve original demo factories while preventing duplicate asynchronous mounts.
export function renderDemo(mount, factory) {
  if (!factory || mount.dataset.rendered || mount.dataset.rendering) return;
  mount.dataset.rendering = '1';
  function failed() {
    delete mount.dataset.rendering;
    const english = document.documentElement.lang.startsWith('en');
    const message = document.createElement('p'); message.setAttribute('role','status');
    message.textContent = english ? 'Demo data is unavailable. The notes and code remain readable.' : '演示数据暂不可用，仍可阅读讲解与关键代码。';
    const retry = document.createElement('button'); retry.type='button';
    retry.textContent = english ? 'Retry' : '重试'; retry.onclick=()=>{message.remove();retry.remove();renderDemo(mount,factory);};
    mount.append(message,retry);
  }
  try {
    Promise.resolve(factory(mount)).then(()=>{mount.dataset.rendered='1';delete mount.dataset.rendering;},failed);
  } catch { failed(); }
}
