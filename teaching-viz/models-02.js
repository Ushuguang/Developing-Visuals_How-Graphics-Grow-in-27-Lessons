const text = value => String(value ?? '').trim();

// Same row conversion as the original Chapter 2 demo, including its replace rule.
export function normalizeStudent(d) {
  const cls = text(d['班级']);
  return {
    id: +d['序号'], name: text(d['姓名']), gender: text(d['性别']),
    birthday: text(d['生日']), age: +d['年龄'], class: cls,
    hometown: text(d['籍贯']), nation: text(d['民族']),
    major: cls.replace(/[\d班]+$/, '').trim()
  };
}

let studentsPromise;
export function loadStudents(d3) {
  if (!studentsPromise) {
    studentsPromise = d3.csv('./data/newstudent.csv', normalizeStudent)
      .catch(error => { studentsPromise = null; throw error; });
  }
  return studentsPromise;
}

export function parseClassNotes(value) {
  const cls = text(value);
  const match = cls.match(/^(.+?)(\d+班)$/);
  return {
    input: cls, matched: !!match, lectureMajor: match ? match[1] : cls,
    suffix: match ? match[2] : '', demoMajor: cls.replace(/[\d班]+$/, '').trim()
  };
}

// The original rollup is a Map. This separate object is only a read-only tree view.
export function mapToCountTree(map, name = 'students') {
  if (!(map instanceof Map)) throw new TypeError('Expected a nested Map');
  return { name, children: [...map].map(([key, value]) => value instanceof Map
    ? mapToCountTree(value, String(key)) : { name: String(key), value }) };
}

export function treeCount(node) {
  return node.children ? node.children.reduce((sum, child) => sum + treeCount(child), 0) : node.value;
}

export function identifyTree(node, path = []) {
  const copy = { ...node, id: JSON.stringify([...path, node.name]) };
  if (node.children) copy.children = node.children.map(child => identifyTree(child, [...path, node.name]));
  return copy;
}

export function countHierarchy(d3, rows, keys = ['major', 'class']) {
  const map = d3.rollup(rows, v => v.length, ...keys.map(key => d => d[key]));
  return identifyTree(mapToCountTree(map));
}
