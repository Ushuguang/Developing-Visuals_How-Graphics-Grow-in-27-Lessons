# 教学增强资源差值与超预算说明

基线：`477706e3223ef43e66c79fd10f7abcd00d81a546`。本报告是最终实现工作树的静态快照；代码变更后可重跑 `python -B scripts/audit-teaching-assets.py`。不代表发布后 Network/Lighthouse 实测。

| 范围 | 基线字节 | 当前字节 | 净增字节 | 净增KiB |
|---|---:|---:|---:|---:|
| 全部JS/MJS/CSS（含测试） | 436,184 | 752,011 | 315,827 | 308.425 |
| 运行时JS/MJS/CSS（不含tests/docs/scripts） | 434,468 | 701,350 | 266,882 | 260.627 |

目标160KiB = 163,840B。当前运行时超出 103,042B；含测试超出 151,987B。状态：**OVER_TARGET**。
旧工作树中既有CRLF与Git对象LF存在差异；统一换行后净增：全部代码313,655B，运行时代码264,710B，仍超目标。

## 新增运行时文件

| 文件 | 当前字节 |
|---|---:|
| `teaching-viz/chapter-02.js` | 33,713 |
| `teaching-viz/chapter-05-names-calendar.js` | 32,891 |
| `teaching-viz/chapter-01.js` | 30,161 |
| `teaching-viz/chapter-04.js` | 26,591 |
| `teaching-viz/chapter-03.js` | 20,295 |
| `teaching-viz/chapter-05-spiral.js` | 18,917 |
| `teaching-viz/chapter-05-story.js` | 18,629 |
| `teaching-viz/linked-learning.js` | 14,149 |
| `teaching-viz/chapter-03-extra.js` | 13,303 |
| `teaching-viz/chapter-05-attributes.js` | 11,923 |
| `teaching-viz/chapter-05-guides.js` | 9,667 |
| `teaching-viz/linked-learning.css` | 5,156 |
| `teaching-viz/models-04.js` | 4,912 |
| `teaching-viz/chapter-05-spiral-model.js` | 4,031 |
| `teaching-viz/models-01.js` | 3,431 |
| `teaching-viz/models-05.js` | 3,386 |
| `teaching-viz/models-05-story.js` | 2,691 |
| `teaching-viz/utils.js` | 2,558 |
| `teaching-viz/chapter-05.css` | 2,422 |
| `teaching-viz/models-03.js` | 2,395 |
| `teaching-viz/models-05-names-calendar.js` | 2,104 |
| `teaching-viz/models-02.js` | 1,962 |
| `teaching-viz/fallback.js` | 1,585 |
| `teaching-viz/render-demo.js` | 1,015 |
| `teaching-viz/chapter-05.js` | 497 |

## 已排除的资源增长风险

- 新增视频/GIF/Lottie/模型/字体：0；新增位图/音频：0。
- 原CSV/JSON按LF/CRLF等价比较：0个值或列改变。字节变化里部分CSV仅换行差异，不能当作数据改造。
- 新URL字面量仅 `http://www.w3.org/2000/svg`，是createElementNS使用的命名空间，不是网络下载地址。未发现新增远程图库/数据/CDN导入。
- 首页文件及其依赖未引用teaching-viz；打开某章仅导入本章adapter、共享控制器及纯模型。浏览器请求次数仍由主实施者检查。
- 截图未加入站点；审计忽略.git、node_modules、__pycache__及本报告自身。

## 已做与可继续做的重复削减

1. 已做：学生/色彩/天气与几何纯函数提取；共享控制器、DOM工具和async demo保护；原demo继续使用抽取后的同源函数，避免另造并行算法。
2. 可继续：合并各章重复frame/shell、图形读数和range控件（预估3–5KiB，需对每章重置/布局回归）。
3. 可继续：把重复的键盘Enter/Space、图元选择绑定、焦点保持改为统一小工具（预估2–4KiB，不增加框架）。
4. 可继续：压缩重复双语过程说明、将共同数据来源边界引用为共用字典（预估4–7KiB；保留学生必须看到的原值、结果及边界，不能删英文或老师讲义）。
5. 可继续：缩减章节2解析页DOM构建重复、章节4/5表格/追踪线控制代码（预估3–5KiB）。
6. 最后才考虑手动移除开发冗余空白/重复临时变量；不能为了数字换新构建链或牺牲可维护性，也不删除测试冒充运行预算达标。

上述估计不是已实现节省。当前27节同时具有双语目标/步骤/原代码绑定、数值表、错误处理与清理，所以总量超过最初目标；规格把160KiB定义为建议目标并要求超出先说明，而非允许删除知识点。当前预算未达建议目标，不应宣称资源门禁PASS。
