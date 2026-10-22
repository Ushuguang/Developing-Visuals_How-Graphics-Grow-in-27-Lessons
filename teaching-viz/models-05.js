export const localKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const weatherKey = value => value instanceof Date ? value.toISOString().slice(0,10) : String(value).slice(0,10);
export function parseLocalDate(key) { const [y,m,d]=String(key).split('-').map(Number); return new Date(y,m-1,d); }
export function localDays(year=2024) {
  const days=[]; for(let date=new Date(year,0,1);date.getFullYear()===year;date=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1))days.push(date);
  return days;
}
const serial = d => Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000;
export function calendarCell(date,weekStart=0,cellSize=16) {
  const first=new Date(date.getFullYear(),0,1), day=serial(date)-serial(first), row=(date.getDay()-weekStart+7)%7;
  const column=Math.floor((day+(first.getDay()-weekStart+7)%7)/7);
  return {day:day+1,row,column,x:column*cellSize,y:row*cellSize};
}
export function createSpiralGeometry({boxSize=22,coilGap=boxSize*1.4,ringT=1.4,startRadius=60}={}) {
  const b=coilGap/(2*Math.PI);
  const pos=t=>{const r=b*t;return{x:r*Math.cos(t),y:r*Math.sin(t),r};};
  const angleDelta=r=>boxSize/Math.sqrt(b*b+r*r);
  const vertices=(t0,t1)=>{const r0=pos(t0).r,r1=pos(t1).r;return[[r0+ringT,t0],[r1+ringT,t1],[r1,t1],[r0,t0]].map(([r,t])=>({x:r*Math.cos(t),y:r*Math.sin(t)}));};
  const arcPath=(t0,t1)=>{const [a,b1,c,d]=vertices(t0,t1),r0=pos(t0).r,r1=pos(t1).r;return `M ${a.x} ${a.y} A ${r0+ringT} ${r0+ringT} 0 0 1 ${b1.x} ${b1.y} L ${c.x} ${c.y} A ${r1} ${r1} 0 0 0 ${d.x} ${d.y} Z`;};
  return {b,boxSize,coilGap,ringT,startTheta:startRadius/b,pos,angleDelta,vertices,arcPath};
}
let weatherPromise,namesPromise;
export function loadWeather(d3) {
  return weatherPromise??=d3.csv('./data/weather_2024.csv',d=>({...d,date:weatherKey(d.date),temp_max:d.temp_max==null||String(d.temp_max).trim()===''?null:+d.temp_max})).catch(error=>{weatherPromise=null;throw error;});
}
export function loadNames() {
  return namesPromise??=fetch('./data/french_names.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).catch(error=>{namesPromise=null;throw error;});
}
export function yearWindow(series,start,end) { return series.filter(d=>d.year>=start&&d.year<=end); }

// Exact characters, points and events from the running original Chapter 5 demo.
export const STORY_DATA={title:'侏罗纪公园 (Jurassic Park, 1993)',duration_min:127,characters:[
  {name:'Alan Grant & Kids',color:'#1976d2',width:4,points:[{time:5,y:80},{time:18,y:130},{time:38,y:180},{time:65,y:150},{time:78,y:80},{time:88,y:110},{time:105,y:60},{time:125,y:40}]},
  {name:'T-REX',color:'#d32f2f',width:6,points:[{time:75,y:280},{time:78,y:130},{time:88,y:200},{time:100,y:250},{time:120,y:290}]},
  {name:'Raptors',color:'#f57c00',width:4,points:[{time:50,y:320},{time:80,y:290},{time:95,y:230},{time:108,y:180},{time:118,y:100}]},
  {name:'Malcolm',color:'#7b1fa2',width:3,points:[{time:22,y:40},{time:45,y:90},{time:70,y:120},{time:82,y:130},{time:95,y:200},{time:120,y:240}]},
  {name:'Dilophosaurus',color:'#388e3c',width:3,points:[{time:38,y:350},{time:48,y:320},{time:58,y:340}]}
],events:[{time:78,x:78,y:105,name:'T-REX 攻击',desc:'T-REX 冲出围栏攻击 Alan & Kids 的车'},{time:48,x:48,y:335,name:'Nedry 事件',desc:'Dilophosaurus 攻击 Nedry'}]};
