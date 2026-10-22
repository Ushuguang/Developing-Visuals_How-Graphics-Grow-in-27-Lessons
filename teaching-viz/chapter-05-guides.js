import { el } from './utils.js';

export const CHAPTER05_GUIDES = [
  {
    section:'5.1', title:['从校园一天，理解五种时间属性','Five time properties through a campus day'],
    intro:['以早餐、上课、午餐和运动的日程为主线，配合温度采样、双地点记录和全年日历，观察先后、细分、重复与分组。','Start with breakfast, class, lunch and exercise, then use samples, two-place records and a yearly calendar to explore order, subdivision, repetition and grouping.'],
    route:[['日程记录','Event log'],['时间属性','Time properties'],['合适的图形','A suitable view']],
    tasks:[['ordered','先后顺序：18:00为什么排在最后？','Order: why does 18:00 come last?'],['periodic','两天09:00为什么落在同一相位？','Why do two 09:00 events share a phase?'],['structured','2024年为什么多出一天？','Why does 2024 have one extra day?']],
    teacher:['先让学生按时间重排事件；再对照“时刻可细分”与“中间值未测量”。最后把24小时钟与年/月/日结构分开讲，避免把先后当因果、把插值当实测。','Sort the events first. Distinguish a subdividable moment from an unmeasured value, then separate a daily phase from calendar hierarchy. Order is not causality, and interpolation is not measurement.'],
    boundary:['构造教学案例：日程与温度端点不是实际校园记录。','Constructed teaching case: events and temperature endpoints are not real campus records.']
  },
  {
    section:'5.2', title:['人名流行的接力：同一年，谁的记录值更高？','Changing name patterns: compare the same year'],
    intro:['保留Marie、Jean、Camille原数据，把读图变成“解析年份→建立时间轴→追踪同一年→放大一个时间窗”的观察任务。','Keep the original Marie, Jean and Camille data. Parse years, build the time axis, track one year and zoom into a shared window.'],
    route:[['年份与记录值','Year and value'],['共同时间轴','Shared time axis'],['三条曲线比较','Compare three curves']],
    tasks:[['parse','1900这个数字怎样变成日期？','How does 1900 become a date?'],['track','固定一年，比较三条线的读数','Compare all three values at one year'],['window','缩小时间窗后，哪些关系更清楚？','What becomes clearer in a smaller window?']],
    teacher:['先隐藏曲线，只解释日期和坐标；再展示三条线并让学生核对追踪表。请学生比较两个年份或峰值所在年份，结论仅限本课文件，不能用名称曲线自行解释社会成因。','Start with dates and coordinates before revealing the curves. Verify the tracking table, compare two years or peak years, and keep conclusions within this file rather than inventing social causes.'],
    boundary:['原课堂JSON保留；原始统计出处与单位尚待教师补充。','Original classroom JSON retained; provenance and statistical units await instructor confirmation.']
  },
  {
    section:'5.3', title:['给闰日找座位：温度怎样变成日历格？','Find leap day: from temperature to a calendar cell'],
    intro:['纵向七行是星期，横向是周列。跟踪2024-02-29这一条记录：先找行列，再落到格子，最后加温度颜色与月界。每一步只引入一个新的视觉编码。','The seven rows are weekdays and columns are weeks. Track 2024-02-29 through row, column, cell, temperature color and month boundary. Add one encoding at a time.'],
    route:[['同一条日期记录','One date record'],['星期 × 周列','Weekday × week'],['温度色块','Temperature color']],
    tasks:[['weekday','周日起点与周一起点有什么不同？','What changes with Sunday or Monday first?'],['cell','把闰日定位到唯一格点','Locate leap day in exactly one cell'],['color','同一日期的温度对应什么颜色？','Which color represents this date’s temperature?']],
    teacher:['先让学生预测闰日位置，再切换周起点核对。观察同一温度数据的趋势小图与日历格：折线突出前后变化，日历便于按星期/月检查，不能据此虚构节假日效应。','Predict leap day’s position and test both week starts. Compare the trend overview with calendar cells: lines show change, while calendars support weekday/month inspection without inventing holiday effects.'],
    boundary:['沿用原2024天气CSV；缺失与0°C分开，来源待教师确认。','Original 2024 weather CSV; missing values remain distinct from 0°C, with provenance awaiting review.']
  },
  {
    section:'5.4', title:['同一天换个坐标：螺旋怎样被画出来？','Change coordinates: how is one spiral segment drawn?'],
    intro:['先拆解原日期扇环的半径、投影、角增量和闭合路径；再用14天构造微案例比较“周相位对齐”和“等弧长排列”。','Inspect the original segment’s radius, projection, angle increment and closed path, then compare weekly phase with equal-length placement in a constructed 14-day case.'],
    route:[['日期','Date'],['角度 / 半径','Angle / radius'],['扇环路径','Segment path']],
    tasks:[['radius','θ怎样决定半径？','How does θ determine radius?'],['projection','同一个点怎样得到x和y？','How does one point get x and y?'],['path','按路径命令逐段闭合扇环','Close the segment one path command at a time']],
    teacher:['固定一个日期，先画半径，再加两条投影线，最后逐段构建路径。明确原运行图的圆弧与讲义直边参数不同；原等弧长采样不自动保证一圈代表一年或一周。','Keep one date fixed: radius, projections, then path commands. Distinguish the original curved implementation from the lecture’s straight-edge example. Equal-length sampling does not automatically give a one-year or one-week revolution.'],
    boundary:['原图与几何保留；14天比较是明确构造的补充案例。','Original geometry retained; the 14-day comparison is an explicitly constructed supplement.']
  },
  {
    section:'5.5', title:['从电影角色到小组协作：线为什么聚在一起？','From film roles to teamwork: why do lines meet?'],
    intro:['保留《侏罗纪公园》，再切换校园小组协作：分工→会合→再分工。用可核对的控制点解释一条角色线与独立事件层。','Keep Jurassic Park and switch to a constructed campus teamwork case: split, meet and split again. Use control points to explain a character path and an independent event layer.'],
    route:[['多人的控制点','People’s control points'],['每人一条线','One line per person'],['会合与事件','Meetings and events']],
    tasks:[['points','一个角色由哪些控制点组成？','Which control points define one role?'],['datum','一组点为什么只绑定一条path？','Why is one point array bound to one path?'],['events','事件时刻如何与角色线对齐？','How do events align with character time?']],
    teacher:['让学生先点一个角色，再比较整组数组与一条path；随后显示同点的折线骨架和样条。事件按时间x对齐，y只是叙事布局；未采样的同刻位置不能冒称真实控制点。','Select a role and compare its point array with one path, then compare the linear skeleton and spline. Events align by time x; y is narrative layout, and unsampled positions are not observed control points.'],
    boundary:['电影轨迹为原课堂示意；校园协作为构造数据，不是电影事实或实际定位记录。','Film trajectories are original classroom illustrations; teamwork is constructed, not film fact or actual location data.']
  }
];

export function registerChapter05Guides(controllers) {
  const word = pair => pair[document.documentElement.lang.startsWith('en') ? 1 : 0];
  const render = () => CHAPTER05_GUIDES.forEach((guide,index) => {
    const article=document.getElementById('ch-'+guide.section.replace('.','-'));
    const panel=article?.querySelector('[data-panel="explain"]'); if(!panel)return;
    const card=el('section',{className:'ch5-guide','data-learning-case':guide.section});
    card.append(el('p',{className:'ch5-guide-kicker'},word(['案例探究 · 先猜，再操作验证','CASE INQUIRY · Predict, then test'])),el('h3',{},word(guide.title)),el('p',{},word(guide.intro)));
    const route=el('div',{className:'ch5-guide-route'});
    guide.route.forEach((pair,i)=>{if(i)route.append(el('span',{'aria-hidden':'true'},'→'));route.append(el('strong',{},word(pair)));});card.append(route);
    const tasks=el('div',{className:'ch5-guide-tasks'});
    guide.tasks.forEach(([step,zh,en],i)=>{
      const task=el('button',{type:'button','data-focus-step':step,'aria-controls':'linked-lesson-'+guide.section.replace('.','-')},`${i+1}. ${word([zh,en])} →`);
      task.onclick=()=>{const tab=article.querySelector('[data-tab="mapping"]');tab?.click();tab?.focus();tab?.scrollIntoView({behavior:'instant',block:'center'});controllers[index]?.selectStep(step,true);};tasks.append(task);
    });card.append(tasks);
    const teacher=el('details'),summary=el('summary',{},word(['教师讲解提示','Teaching prompts']));teacher.append(summary,el('p',{},word(guide.teacher)));
    card.append(teacher,el('small',{className:'ch5-case-source'},word(guide.boundary)),el('a',{href:'./casebook.md'},word(['阅读案例讲解手册 →','Read the casebook (Chinese) →'])));
    const previous=panel.querySelector('.ch5-guide');if(previous)previous.replaceWith(card);else panel.prepend(card);
  });
  render();document.addEventListener('wbl:localechange',render);
}
