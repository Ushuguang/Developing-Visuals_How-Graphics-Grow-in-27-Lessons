import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeStudent, parseClassNotes, mapToCountTree, treeCount, loadStudents, identifyTree, countHierarchy } from '../teaching-viz/models-02.js';
import { chapter02 } from '../teaching-viz/chapter-02.js';

test('student normalization preserves original field and major conversion', () => {
  const row = normalizeStudent({ 序号: '1', 姓名: ' 张明 ', 性别: ' 男 ', 生日: '2007-08-15', 年龄: '18', 班级: ' 软件工程12班 ', 籍贯: '山东', 民族: '汉' });
  assert.deepEqual(row, { id: 1, name: '张明', gender: '男', birthday: '2007-08-15', age: 18, class: '软件工程12班', hometown: '山东', nation: '汉', major: '软件工程' });
  assert.equal(normalizeStudent({ 班级: '软件工程班' }).major, '软件工程');
  assert.equal(normalizeStudent({}).major, '');
});

test('lecture match fallback is explicitly distinct from the demo replace rule', () => {
  assert.deepEqual(parseClassNotes(' 软件工程12班 '), { input: '软件工程12班', matched: true, lectureMajor: '软件工程', suffix: '12班', demoMajor: '软件工程' });
  assert.deepEqual(parseClassNotes('软件工程班'), { input: '软件工程班', matched: false, lectureMajor: '软件工程班', suffix: '', demoMajor: '软件工程' });
  assert.equal(parseClassNotes('实验组').lectureMajor, '实验组');
  assert.equal(parseClassNotes('').matched, false);
});

test('actual CSV has conserved counts in Map and derived read-only tree', async () => {
  const raw = await readFile(new URL('../lesson-02/data/newstudent.csv', import.meta.url), 'utf8');
  const [header, ...records] = raw.trim().split(/\r?\n/).map(line => line.split(','));
  const rows = records.map(values => normalizeStudent(Object.fromEntries(header.map((key, i) => [key, values[i]]))));
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.major)) map.set(row.major, new Map());
    const group = map.get(row.major); group.set(row.class, (group.get(row.class) || 0) + 1);
  }
  const tree = mapToCountTree(map);
  assert.equal(rows.length, 80);
  assert.equal(treeCount(tree), rows.length);
  assert.equal(tree.children.length, map.size);
  for (const child of tree.children) assert.equal(treeCount(child), rows.filter(row => row.major === child.name).length);
  assert.ok(map instanceof Map);
  assert.throws(() => mapToCountTree({}), TypeError);
  tree.children[0].children[0].value = -1;
  assert.ok([...map.values()][0].values().next().value > 0, 'view mutation cannot alter original Map');
});

test('legacy demos and linked scene share one pending CSV request', async () => {
  let requests = 0;
  const d3 = { csv: async (path, transform) => {
    requests++; assert.equal(path, './data/newstudent.csv');
    return [transform({ 序号: '1', 班级: '软件工程1班' })];
  } };
  const [a, b] = await Promise.all([loadStudents(d3), loadStudents(d3)]);
  assert.equal(requests, 1); assert.equal(a, b);
  assert.equal(a[0].major, '软件工程');
});

test('hierarchy identities distinguish same labels under different parents', () => {
  const source={name:'students',children:[{name:'A',children:[{name:'same',value:2}]},{name:'B',children:[{name:'same',value:3}]}]};
  const first=identifyTree(source), second=identifyTree(source);
  const ids=node=>[node.id,...(node.children??[]).flatMap(ids)];
  assert.deepEqual(ids(first),ids(second));
  assert.equal(new Set(ids(first)).size,5);
  assert.equal(treeCount(first),5);
  assert.equal(source.id,undefined);
});

test('tree model forwards real keys and reducer to rollup and retains leaf counts', () => {
  const rows=[{major:'A',class:'one'},{major:'A',class:'two'},{major:'A',class:'one'},{major:'B',class:'one'}];
  const d3={rollup:(input,reduce,...keys)=>{
    const group=(members,depth)=>{
      if(depth===keys.length)return reduce(members);
      const map=new Map();for(const row of members){const k=keys[depth](row);if(!map.has(k))map.set(k,[]);map.get(k).push(row);}
      return new Map([...map].map(([k,v])=>[k,group(v,depth+1)]));
    };return group(input,0);
  }};
  const tree=countHierarchy(d3,rows);
  assert.equal(treeCount(tree),4);assert.equal(tree.children.length,2);
  assert.deepEqual(tree.children[0].children.map(n=>n.value),[2,1]);
  const reverse=countHierarchy(d3,rows,['class','major']);
  assert.equal(treeCount(reverse),4);assert.equal(reverse.children[0].name,'one');
});

test('failed CSV requests are retriable instead of permanently caching a rejected promise', async () => {
  const isolated=await import('../teaching-viz/models-02.js?retry-test');
  let requests=0;
  const d3={csv:async()=>{if(++requests===1)throw new Error('offline');return [];}};
  await assert.rejects(isolated.loadStudents(d3),/offline/);
  assert.deepEqual(await isolated.loadStudents(d3),[]);assert.equal(requests,2);
});

test('all Chapter 2 steps point to existing nonempty original code lines', async () => {
  const html=await readFile(new URL('../lesson-02/index.html',import.meta.url),'utf8');
  const definitions=chapter02({});
  assert.deepEqual(definitions.map(d=>d.sectionId),['2.1','2.2','2.3','2.4']);
  for(const definition of definitions){
    assert.ok(definition.steps.length>=3&&definition.steps.length<=6);
    const start=html.indexOf(`id="ch-${definition.sectionId.replace('.','-')}"`);
    const article=html.slice(start,html.indexOf('</article>',start));
    const codeStart=article.search(/<div[^>]+data-panel="code"/),demoStart=article.search(/<div[^>]+data-panel="demo"/);
    const blocks=[...article.slice(codeStart,demoStart).matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(match=>match[1].replace(/<[^>]*>/g,'').replace(/\r\n/g,'\n').split('\n'));
    for(const step of definition.steps)for(const target of step.codeTargets){
      const lines=blocks[target.block];assert.ok(lines,`${definition.sectionId}/${step.id} block exists`);
      assert.ok(target.from>=1&&target.to>=target.from&&target.to<=lines.length,`${definition.sectionId}/${step.id} valid range`);
      assert.ok(lines.slice(target.from-1,target.to).join('').trim());
    }
  }
});
