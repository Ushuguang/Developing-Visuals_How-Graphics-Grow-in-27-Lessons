// Independent of D3: keep lecture navigation usable if the existing CDN fails.
const ready=()=>document.body.dataset.teachingReady==='1';
let notice;
function warn(){
  if(ready()||notice)return;
  notice=document.createElement('p'); notice.className='tv-loading-note';notice.setAttribute('role','status');
  notice.textContent=document.documentElement.lang.startsWith('en')?'Interactive scripts have not loaded. Notes and code remain available; check the network and refresh to restore mapping and demos.':'交互脚本尚未加载。讲解与代码仍可阅读；请检查网络并刷新以恢复映射和演示。';
  document.querySelectorAll('.tv-mapping-status').forEach(node=>{node.removeAttribute('data-i18n');node.textContent=notice.textContent;});
  document.querySelector('.lesson-header')?.append(notice);
}
const timer=setTimeout(warn,5000);
document.addEventListener('teaching:ready',()=>{clearTimeout(timer);notice?.remove();});
document.addEventListener('click',event=>{
  if(ready())return;
  const tab=event.target.closest('.tab-btn[data-tab]');
  if(tab){const article=tab.closest('.chapter');article.querySelectorAll('.tab-btn').forEach(n=>n.classList.toggle('active',n===tab));article.querySelectorAll('.tab-panel').forEach(n=>n.classList.toggle('active',n.dataset.panel===tab.dataset.tab));if(['mapping','demo'].includes(tab.dataset.tab))warn();}
  const link=event.target.closest('.chapter-nav a[data-chapter]');
  if(link){const article=document.getElementById(link.dataset.chapter);article?.querySelector('.tab-btn[data-tab="explain"]')?.click();warn();}
});
