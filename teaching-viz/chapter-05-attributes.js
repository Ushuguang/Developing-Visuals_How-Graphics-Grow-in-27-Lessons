import { el, svg, table, format } from './utils.js';
import { localKey, localDays } from './models-05.js';

export const CAMPUS_DAY = [
  { id:'breakfast', minute:480, label:['早餐','Breakfast'], place:['食堂','Canteen'] },
  { id:'lecture', minute:540, label:['上课','Lecture'], place:['教室','Classroom'] },
  { id:'lunch', minute:720, label:['午餐','Lunch'], place:['食堂','Canteen'] },
  { id:'run', minute:1080, label:['运动','Exercise'], place:['操场','Sports ground'] }
];
export const clockLabel = minute => `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(Math.floor(minute%60)).padStart(2,'0')}`;
export const dailyPhase = hour => ((hour%24)+24)%24;
export const minuteSubdivision = depth => 60 / 2 ** (Math.max(0,Math.min(4,depth))+1);
const IDS=['ordered','continuous','periodic','space','structured'];
const LABELS=[['有序','Order'],['连续','Continuity'],['周期','Periodicity'],['独立于空间','Time and space'],['结构','Structure']];
const EXPLAIN=[
  ['左侧定义 ordered；右侧同一组日程按时间排序，连线追踪同一个事件。先后顺序不能独自证明因果。','The ordered definition selects the same events sorted by time. Links retain event identity; order alone does not prove causality.'],
  ['左侧定义 continuous；右侧细分两个时刻之间的时间。中间时刻可以定位，中间温度没有观测，不能当作实测值。','The continuous definition selects a subdivided interval. A moment can be located without knowing an unmeasured temperature.'],
  ['左侧定义 periodic；右侧把两天相同日程投影到24小时钟，同相位不等于同一绝对时刻。','The periodic definition selects a 24-hour projection. Equal phase does not mean the same absolute time.'],
  ['左侧定义 spatial_independent；右侧两个地点共用09:00，但地点保持独立编码。','The spatial_independent definition selects two places sharing 09:00 while retaining separate spatial encoding.'],
  ['左侧 structured 与 timeDay.range；右侧用真实本地日历统计月份与日数。2023是补充对照输入。','The structured definition and timeDay.range select calendar structure and actual day counts. 2023 is a supplemental comparison input.']
];
export function attributesDefinition(d3){
  return {
    sectionId:'5.1',title:['从校园一天，理解时间五属性','Five time properties through a campus day'],
    goal:['用日程、温度采样、双地点记录和日历，把排序、细分、相位与层级变得可观察。','Use schedules, samples, two-place records and a calendar to observe order, subdivision, phase and hierarchy.'],
    source:['校园日程与温度端点为构造教学微案例；左侧属性配置来自原代码，右侧绘图为补充解释。不是实际校园记录或连续温度观测。','Campus events and temperature endpoints are constructed teaching examples. Original attribute configuration is shown on the left; diagrams are supplemental, not real campus logs or continuous measurements.'],
    steps:IDS.map((id,i)=>({id,label:LABELS[i],codeTargets:[{block:0,from:3+i*3,to:5+i*3},...(i===4?[{block:1,from:2,to:4}]:[])],explain:EXPLAIN[i]})),
    create(ctx){
      const {root,t,signal}=ctx;let stage='ordered',sorted=true,depth=0,phase=9,showPlaces=true,year=2024;
      root.replaceChildren();root.classList.add('ch5-scene');
      const heading=el('h4'),subtitle=el('p'),controls=el('div',{className:'tv-controls'}),chart=svg('svg',{viewBox:'0 0 420 300',role:'img'}),result=el('div',{className:'ch5-observation','aria-live':'polite'});
      root.append(heading,subtitle,chart,controls,result);
      const text=(x,y,value,attrs={})=>svg('text',{x,y,...attrs},value);
      const line=(x1,y1,x2,y2,attrs={})=>svg('line',{x1,y1,x2,y2,stroke:'#8eaa72','stroke-width':2,...attrs});
      function box(x,y,w,h,label,fill='#edf2d7',attrs={}){const g=svg('g',attrs);g.append(svg('rect',{x,y,width:w,height:h,rx:6,fill,stroke:'#a7bb8b'}),text(x+w/2,y+h/2+5,label,{'text-anchor':'middle'}));chart.append(g);return g;}
      const action=(target,label,fn)=>{const node=el('button',{type:'button'},label);node.onclick=fn;target.append(node);return node;};
      const colors=['#23594c','#708b2c','#aa623e','#466b9e'];
      function draw(){
        root.dataset.stage=stage;chart.dataset.stage=stage;chart.replaceChildren();controls.replaceChildren();result.replaceChildren();
        const index=IDS.indexOf(stage);heading.textContent=`${index+1} / 5 · ${t(...LABELS[index])}`;chart.setAttribute('aria-label',t(...LABELS[index]));
        if(stage==='ordered'){
          subtitle.textContent=t('读入顺序 ≠ 发生顺序：追踪同一个事件怎样换位置。','Input order differs from event order: trace each event to its time position.');
          action(controls,t(sorted?'切换为读入顺序':'按时间排序',sorted?'Use input order':'Sort by time'),()=>{sorted=!sorted;draw();},signal);
          const input=[CAMPUS_DAY[3],CAMPUS_DAY[0],CAMPUS_DAY[1],CAMPUS_DAY[2]],output=sorted?[...input].sort((a,b)=>a.minute-b.minute):input;
          chart.append(text(18,25,t('读入记录','Input records')),text(240,25,t('时间顺序','Time order')));
          input.forEach((event,i)=>{const j=output.indexOf(event),color=colors[CAMPUS_DAY.indexOf(event)];chart.append(line(178,58+i*55,238,58+j*55,{stroke:color,'data-event':event.id}));box(16,38+i*55,162,40,`${clockLabel(event.minute)} ${t(...event.label)}`);box(238,38+j*55,164,40,`${clockLabel(event.minute)} ${t(...event.label)}`,sorted?'#e0ebaf':'#edf2d7',{'data-event':event.id});});
          result.append(el('p',{},t(sorted?'四个事件的值没有改，只按minute升序重排；运动仍是同一个18:00事件。':'当前保留读入顺序。试着排序，再沿连线核对事件身份。',sorted?'Values stay unchanged; only the order by minute changes. Exercise remains the same 18:00 event.':'Input order is retained. Sort and follow each identity link.')));
        }
        if(stage==='continuous'){
          subtitle.textContent=t('两个采样点之间有时间，但不一定有测量。','There is time between two samples, but no guaranteed measurement.');
          action(controls,t(depth===4?'重置到30秒':'把时间间隔再分一半',depth===4?'Reset to 30 seconds':'Halve the time interval'),()=>{depth=(depth+1)%5;draw();},signal);
          const seconds=minuteSubdivision(depth),x=50+320*seconds/60;
          chart.append(text(40,35,t('教室传感器：仅两个构造采样点','Classroom sensor: two constructed samples')),line(50,200,370,200));
          [0,15,30,45,60].forEach(sec=>{const px=50+sec/60*320;chart.append(line(px,193,px,207),text(px,230,`${sec}s`,{'text-anchor':'middle'}));});
          [[50,21],[370,23]].forEach(([px,temp])=>{chart.append(svg('circle',{cx:px,cy:110,r:7,fill:'#23594c'}),line(px,118,px,200,{'stroke-dasharray':'3 3'}),text(px,85,`${temp}°C`,{'text-anchor':'middle'}));});
          chart.append(line(50,110,370,110,{'stroke-dasharray':'5 5',opacity:.4}),line(x,130,x,200,{stroke:'#aa623e','stroke-width':3}),svg('circle',{cx:x,cy:110,r:8,fill:'#fffef8',stroke:'#aa623e','stroke-width':3}),text(210,265,t('空心点：这一时刻的温度未知','Hollow point: temperature is unknown'),{'text-anchor':'middle'}));
          result.append(table([t('时刻','Moment'),t('观测状态','Observation')],[['09:00:00','21°C'],[`09:00:00 + ${format(seconds)}s`,t('未测量，不能编造数值','Unmeasured; no invented value')],['09:01:00','23°C']]));
        }
        if(stage==='periodic'){
          subtitle.textContent=t('把两天的上课时刻折叠到同一个24小时钟。','Fold two daily lecture times onto one 24-hour clock.');
          action(controls,t('日程后移3小时','Shift both events by 3 hours'),()=>{phase=(phase+3)%24;draw();},signal);
          const center={x:125,y:135},a=phase/24*Math.PI*2,px=center.x+78*Math.sin(a),py=center.y-78*Math.cos(a);
          chart.append(svg('circle',{cx:center.x,cy:center.y,r:78,fill:'#f5f8e7',stroke:'#a7bb8b'}));
          for(const h of [0,6,12,18]){const angle=h/24*Math.PI*2;chart.append(text(center.x+98*Math.sin(angle),center.y-98*Math.cos(angle)+5,`${h}h`,{'text-anchor':'middle'}));}
          chart.append(line(center.x,center.y,px,py,{stroke:'#23594c','stroke-width':4}),svg('circle',{cx:px,cy:py,r:9,fill:'#23594c'}));
          box(260,75,145,48,t('第1天','Day 1')+` · ${clockLabel(phase*60)}`);box(260,160,145,48,t('第2天','Day 2')+` · ${clockLabel(phase*60)}`);
          chart.append(line(260,100,px+12,py,{stroke:'#23594c','stroke-dasharray':'4 3'}),line(260,185,px+12,py,{stroke:'#aa623e','stroke-dasharray':'4 3'}));
          result.append(el('p',{className:'tv-result'},`${phase}h mod 24 = ${(phase+24)}h mod 24 = ${phase}h`),el('p',{},t('日程周期由微案例明确设为24小时。两天相距24小时，绝对时间不同，但相位相同。','This constructed schedule explicitly has a 24-hour period. The two moments differ by one day but have the same phase.')));
        }
        if(stage==='space'){
          subtitle.textContent=t('同一时刻发生在不同地点：把两个维度分开编码。','One moment at two places: encode time and place separately.');
          action(controls,t(showPlaces?'只保留时间':'加入地点编码',showPlaces?'Show time only':'Add place encoding'),()=>{showPlaces=!showPlaces;draw();},signal);
          chart.append(line(40,240,380,240),text(210,275,'09:00',{'text-anchor':'middle'}));
          const places=[[105,100,t('图书馆','Library')],[315,140,t('操场','Sports ground')]];
          places.forEach(([x,y,label],i)=>{if(showPlaces){box(x-65,y-25,130,50,label,i?'#e5edc9':'#e6eef6');chart.append(line(x,y+30,210,235,{'stroke-dasharray':'4 3'}));}else chart.append(svg('circle',{cx:210,cy:240,r:i?5:9,fill:colors[i],'data-shared-time':'09:00'}));});
          if(!showPlaces)chart.append(text(210,214,t('2条记录，同一时刻','2 records, one moment'),{'text-anchor':'middle'}));
          result.append(el('p',{},t('两项记录都在09:00；地点不是由时间坐标推算出来的。只看时间会重叠，加入地点后仍共享时间。','Both records occur at 09:00. Location cannot be inferred from time. They overlap on a time-only view and retain the same time when places are added.')));
        }
        if(stage==='structured'){
          subtitle.textContent=t('同一个range调用，放进不同年份，日历结构会改变。','Apply the same range operation to different calendar years.');
          action(controls,t(year===2024?'对照2023年':'返回2024年原例',year===2024?'Compare 2023':'Return to original 2024'),()=>{year=year===2024?2023:2024;draw();},signal);
          const days=localDays(year),months=Array.from({length:12},(_,month)=>days.filter(d=>d.getMonth()===month).length);
          box(140,10,140,45,`${year} · ${days.length}${t('天',' days')}`,'#dfeaa5');
          months.forEach((count,i)=>{const x=20+(i%4)*100,y=90+Math.floor(i/4)*58;chart.append(line(210,55,x+44,y,{opacity:.25}));box(x,y,88,46,`${i+1}${t('月','')} · ${count}`,i===1?'#dfeaa5':'#edf2d7',{'data-month':i+1});});
          const actual=d3.timeDay.range(new Date(year,0,1),new Date(year+1,0,1));
          result.append(el('p',{className:'tv-result'},`range(${year}-01-01, ${year+1}-01-01) → ${actual.length}\n${localKey(actual[0])} → ${localKey(actual.at(-1))}`),el('p',{},t('结束日期不包含在内。2024年2月有29天；2023年2月有28天。','The end date is excluded. February has 29 days in 2024 and 28 in 2023.')));
        }
      }
      draw();return {focus(id){stage=id;draw();},reset(){stage='ordered';sorted=true;depth=0;phase=9;showPlaces=true;year=2024;draw();},destroy(){root.replaceChildren();}};
    }
  };
}
