# 教师知识点保护记录

基线：`477706e3223ef43e66c79fd10f7abcd00d81a546`；核对日期：2026-10-21（Asia/Singapore）。以本地 Git 对象中的 HTML、lesson.js、lecture.md 与双语资源为事实来源，不以规格书反推已有实现。

本轮编码范围仅 2.2 试点；其余 26 节只盘点及回归，不代表增强已完成。原说明、代码块的哈希、各段 API、默认控件原始标记及数据路径见 `teaching-baseline.json`。

## 核对方法

- 原 article 顺序、三个 panel、demo 名称逐节提取。跨章局部 demo ID 不作为全局标识。
- 所有原 `pre > code` 的去标记、解实体文本按顺序计算 SHA-256；原 explain 文字作为不可删减原文核验。
- 原 lesson.js、lecture*.md、双语 blocks、数据及独立 demo 文件记录 Git 字节 SHA-256；核验时允许 LF/CRLF 等价。lesson.js 如有共享提取等语义保持变更单列人工复核，不伪称文件字节未改。
- `python docs/verify-knowledge-preservation.py` 核验原知识可访问性；新增代码旁标记允许保留原可复制文本。
- API 自动提取是词法索引而非 API 有效性证明；完整代码原文仍为准，不能因索引未列出函数就删除该函数。

## 27 节原有内容与默认行为

### 1.1 · 1.1 数据生成（P0）

- 页面：`lesson-01/index.html#ch-1-1`；demo：`lesson-01:d-3-1`。
- 原运行时中文标题：1.1 数据生成；英文：1.1 Data Generation。
- 原知识点（保持顺序和含义）：DeepSeek 合成新生 CSV；字段名映射 COLUMN_MAP；transformRow；一元 + 数值转换；trim；Date；await d3.csv 的 row 回调及类型验证。
- 原讲解标题顺序：你的原案例 → 嵌入理论：AI 合成数据的可信度边界。
- 原关键代码：3 个 pre/code 块；关键代码 ① 字段名映射；关键代码 ② 类型转换函数；关键代码 ③ d3.csv 第二参直接传 row 回调。
- API/方法词法索引：`.log`、`.trim`、`d3.csv`。
- 数据：`./data/newstudent.csv`；`./data/newstudent.csv...`。
- 原控件/默认值：加载./data/newstudent.csv，日志+前10行+字段映射，重新加载按钮。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 1.2 · 1.2 数据定义（P1）

- 页面：`lesson-01/index.html#ch-1-2`；demo：`lesson-01:d-3-2`。
- 原运行时中文标题：1.2 数据定义；英文：1.2 Data Definition。
- 原知识点（保持顺序和含义）：Data / Information / Knowledge / Wisdom 四层；可视化在 DIKW 的位置；SVG 梯形 M/L/Z；填充及 hover/click 高亮。
- 原讲解标题顺序：你的原案例 → 嵌入理论：可视化在 DIKW 中的位置。
- 原关键代码：2 个 pre/code 块；关键代码 ① SVG 金字塔路径；关键代码 ② 交互高亮（hover/click）。
- API/方法词法索引：`.append`、`.attr`、`.brighter`、`.duration`、`.on`、`.select`、`.style`、`.transition`、`d3.color`、`d3.select`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：四层金字塔；hover/click 显示详情；初始提示选择层。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 1.3 · 1.3 数据属性（P1）

- 页面：`lesson-01/index.html#ch-1-3`；demo：`lesson-01:d-3-3`。
- 原运行时中文标题：1.3 数据属性；英文：1.3 Data Attributes。
- 原知识点（保持顺序和含义）：原类别/序数/数值三类；Stevens 名义/序数/区间/比率四尺度；Mackinlay 视觉通道排序；比例尺及 colormap 选型。
- 原讲解标题顺序：你的原案例（3 大类） → 嵌入理论：Stevens 测量尺度（1946）—— 4 类 → 嵌入理论：Mackinlay 视觉通道排序（1986）。
- 原关键代码：2 个 pre/code 块；关键代码 ① 比例尺选型；关键代码 ② colormap 选型。
- API/方法词法索引：`.domain`、`.range`、`d3.interpolateRdBu`、`d3.interpolateViridis`、`d3.scaleBand`、`d3.scaleDiverging`、`d3.scaleLinear`、`d3.scaleOrdinal`、`d3.scaleSequential`、`d3.schemeTableau10`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：原三种数据属性卡/演示；点击选择解释（非新四尺度实验）。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 1.4 · 1.4 数据变换（P1）

- 页面：`lesson-01/index.html#ch-1-4`；demo：`lesson-01:d-3-4`。
- 原运行时中文标题：1.4 数据变换；英文：1.4 Data Transformation。
- 原知识点（保持顺序和含义）：map、reduce、cross、merge、pairs、transpose、zip、filter 全八操作；函数式数据流；group/rollup 延伸。
- 原讲解标题顺序：你的原案例（8 个函数） → 嵌入理论：函数式数据流。
- 原关键代码：3 个 pre/code 块；关键代码 ① map / reduce 的链式组合；关键代码 ② cross（笛卡尔积）；关键代码 ③ group / rollup（聚合）。
- API/方法词法索引：`.filter`、`.map`、`.reduce`、`d3.cross`、`d3.group`、`d3.rollup`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：select 首项 map；原列表还提供 group/rollup 延伸。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 1.5 · 1.5 D3 数据选择器（P0）

- 页面：`lesson-01/index.html#ch-1-5`；demo：`lesson-01:d-3-5`。
- 原运行时中文标题：1.5 D3 数据选择器；英文：1.5 D3 Selectors。
- 原知识点（保持顺序和含义）：d3.select / d3.selectAll / selection.select / selection.selectAll / selectChild / selectChildren 六类；Data-Join 三态；join；key 身份；与命令式 DOM 对照。
- 原讲解标题顺序：你的原案例（6 个选择器方法） → 嵌入理论：Data-Join 三态模型（Mike Bostock） → Data-Join vs 命令式 DOM。
- 原关键代码：3 个 pre/code 块；关键代码 ①.join(enter, update, exit) 三态；关键代码 ② key 函数保身份；关键代码 ③ d3.select vs d3.selectAll。
- API/方法词法索引：`.append`、`.attr`、`.data`、`.join`、`.remove`、`.selectAll`、`d3.select`、`d3.selectAll`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：原添加/更新/删除/重置按钮；稳定 key 及 DOM 演示。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 2.1 · 2.1 数据可视化流程（P1）

- 页面：`lesson-02/index.html#ch-2-1`；demo：`lesson-02:d-4-1`。
- 原运行时中文标题：2.1 数据可视化流程；英文：2.1 Visualization Workflow。
- 原知识点（保持顺序和含义）：Card 1999、Mackinlay 1986、van Wijk 原模型及顺序；原始数据、变换、视觉映射、渲染与交互反馈；SVG 节点及箭头。
- 原讲解标题顺序：你的原案例 → 嵌入理论：可视化流程的三个经典模型。
- 原关键代码：1 个 pre/code 块；关键代码 ① SVG 流程图节点 + 箭头。
- API/方法词法索引：`.append`、`.attr`、`.classed`、`.data`、`.getElementById`、`.join`、`.on`、`.selectAll`、`d3.data`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：SVG 流程图节点点击显示三模型对应说明。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 2.2 · 2.2 数据分类树（d3.rollup 多层聚合）（P0）

- 页面：`lesson-02/index.html#ch-2-2`；demo：`lesson-02:d-4-2`。
- 原运行时中文标题：2.2 数据变换：原数据 → 数据表；英文：2.2 Data Transformation: Raw → Data Table。
- 原知识点（保持顺序和含义）：数据变换在流程中的位置；四大操作；新生专业/班级聚合；双层 d3.rollup；Map；函数式聚合与 OLAP slice/dice/drill；正则提取专业。
- 原讲解标题顺序：📌 本节在流程中的位置：数据变换（Data Transformation） → 你的原案例 → 理论补丁：数据变换的四大操作（Card 1999 D 层） → 嵌入理论：函数式聚合与 OLAP 切片 → 理论补丁：OLAP 切片/切块/钻取。
- 原关键代码：2 个 pre/code 块；关键代码 ① 双层 rollup；关键代码 ② 用正则提取专业。
- API/方法词法索引：`.log`、`.match`、`.trim`、`d3.csv`、`d3.rollup`。
- 数据：`./data/newstudent.csv (via loadStudents)`。
- 原控件/默认值：第一级 gender；第二级空字符串（无）；归约 count。第一级 gender/major/class/hometown，第二级无/gender/major/class，归约 count/ages/avgAge。
- 本轮新增计划：共享联动外壳及专业→班级→聚合微图；原 demo 默认不变。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 2.3 · 2.3 树布局（Reingold-Tilford 算法）（P0）

- 页面：`lesson-02/index.html#ch-2-3`；demo：`lesson-02:d-4-3`。
- 原运行时中文标题：2.3 视觉映射：数据表 → 视觉结构；英文：2.3 Visual Mapping: Data → Visual Structure。
- 原知识点（保持顺序和含义）：视觉映射；图元与通道；幅度/标识；Mackinlay 排名；Reingold–Tilford；d3.hierarchy/tree/size/separation/descendants/links；层级模块家族。
- 原讲解标题顺序：📌 本节在流程中的位置：视觉映射（Visual Mapping） → 你的原案例 → 理论核心：什么是视觉通道？Mackinlay 的排名 → 理论核心：图元（marks）与视觉通道的构成 → 理论核心：两类通道 —— 幅度 vs 标识 → 嵌入理论：Reingold-Tilford 算法（d3.tree 的核心） → 理论补丁：d3-hierarchy 模块全家桶。
- 原关键代码：2 个 pre/code 块；关键代码 ① hierarchy + tree 三步走；关键代码 ② separation 控制父子间距。
- API/方法词法索引：`.append`、`.attr`、`.data`、`.descendants`、`.join`、`.links`、`.selectAll`、`.separation`、`.size`、`.text`、`.x`、`.y`、`d3.hierarchy`、`d3.linkHorizontal`、`d3.tree`。
- 数据：`./data/newstudent.csv (via loadStudents)`。
- 原控件/默认值：首项 专业→班级；还可三层等；separation=0.6，范围0.1–2，步长0.05。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 2.4 · 2.4 树形列表渲染（classed + 事件委托）（P1）

- 页面：`lesson-02/index.html#ch-2-4`；demo：`lesson-02:d-4-4`。
- 原运行时中文标题：2.4 视图渲染与用户交互；英文：2.4 View Rendering & User Interaction。
- 原知识点（保持顺序和含义）：视图渲染及交互；DOM 捕获/目标/冒泡；事件委托；classed；stopPropagation；递归 buildList；transition/duration；动画时长滑块。
- 原讲解标题顺序：📌 本节在流程中的位置：视图渲染 + 用户交互 → 你的原案例 → 嵌入理论：DOM 事件三阶段 + 事件委托 → 理论补丁：动画 —— 视图渲染的"时间维"（van Wijk 反馈的直观体现） → 理论补丁：事件委托 (Event Delegation) → 关键 API：D3 classed()。
- 原关键代码：4 个 pre/code 块；关键代码 ① 事件委托（一对多监听）；关键代码 ② 嵌套递归 buildList；关键代码 ③ D3 过渡动画（transition + duration）；关键代码 ④ 动画时长滑块（直接在 HTML/CSS 里控制）。
- API/方法词法索引：`.addEventListener`、`.append`、`.appendChild`、`.attr`、`.classed`、`.data`、`.duration`、`.each`、`.forEach`、`.getElementById`、`.join`、`.node`、`.on`、`.querySelectorAll`、`.remove`、`.selectAll`、`.stopPropagation`、`.transition`、`d3.create`、`d3.select`。
- 数据：`./data/newstudent.csv (via loadStudents)`。
- 原控件/默认值：全部展开/折叠；duration=500ms，范围0–1500，步长50；toggle 阻断冒泡与 li 选择。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.1 · 3.1 颜色模型基础（P1）

- 页面：`lesson-03/index.html#ch-3-1`；demo：`lesson-03:d-3-1`。
- 原运行时中文标题：3.1 颜色模型基础；英文：3.1 Color Model Basics。
- 原知识点（保持顺序和含义）：RGB/HSL/CIE Lab/CMYK 四模型；rgbToHsl；D3 颜色对象转换；CVD 类型和矩阵。
- 原讲解标题顺序：为什么要学颜色模型？ → 4 大颜色空间 → CVD（色觉缺陷）。
- 原关键代码：3 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.hcl`、`.hsl`、`.lab`、`.map`、`.max`、`.min`、`.rgb`、`.round`、`d3.color`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：RGB 默认100/50/200，范围各0–255。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.2 · 3.2 colormap 三类选择（P0）

- 页面：`lesson-03/index.html#ch-3-2`；demo：`lesson-03:d-3-2`。
- 原运行时中文标题：3.2 colormap 三类选择；英文：3.2 Colormap: 3 Types。
- 原知识点（保持顺序和含义）：顺序/发散/定性三类及语义；典型错误；CVD 检查清单；pickColormap；sequential/ordinal/插值器。
- 原讲解标题顺序：三类 colormap 对应不同数据语义 → 典型错误 → CVD 友好检查清单。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`d3.interpolateBrBG`、`d3.interpolateRdBu`、`d3.interpolateViridis`、`d3.scaleOrdinal`、`d3.scaleSequential`、`d3.schemeTableau10`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：原三种 colormap 示例与语义说明（非新联动实验）。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.3 · 3.3 CIE Lab 色域图（P1）

- 页面：`lesson-03/index.html#ch-3-3`；demo：`lesson-03:d-3-3`。
- 原运行时中文标题：3.3 CIE Lab 色域图；英文：3.3 CIE Lab Gamut。
- 原知识点（保持顺序和含义）：L*/a*/b*；Lab 切片；sRGB/Adobe RGB/Rec.2020 色域比较；颜色转换；RGB/Lab 插值对照。
- 原讲解标题顺序：为什么需要 Lab 色域图？ → 三个色域（嵌套关系） → 实战用法。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.formatHex`、`.lab`、`.log`、`.rgb`、`d3.color`、`d3.interpolateLab`、`d3.interpolateRgb`、`d3.lab`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：L*=60，范围20–90。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.4 · 3.4 色系搭配规则（5 大类）（P2）

- 页面：`lesson-03/index.html#ch-3-4`；demo：`lesson-03:d-3-4`。
- 原运行时中文标题：3.4 色系搭配规则（5 大类）；英文：3.4 Color Harmony Rules (5 Types)。
- 原知识点（保持顺序和含义）：单色/类比/互补/三等分/分裂互补五类；HUE_OFFSETS；色轮角度；palette、HSL 及模 360。
- 原讲解标题顺序：5 大色系规则 → 选择原则。
- 原关键代码：1 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.formatHex`、`.map`、`d3.hsl`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：baseH=210，范围0–360；五类方案。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.5 · 3.5 科研经典配色（P2）

- 页面：`lesson-03/index.html#ch-3-5`；demo：`lesson-03:d-3-5`。
- 原运行时中文标题：3.5 科研经典配色；英文：3.5 Classic Research Palettes。
- 原知识点（保持顺序和含义）：Wong、Paul Tol、Okabe–Ito、Tableau、Paired、Viridis、RdBu 等原色板和 HEX；离散/连续/发散语义。
- 原讲解标题顺序：3 大黄金标准 → 商业 / 通用 → 顺序型 / 发散型 → 实战原则。
- 原关键代码：1 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.map`、`d3.interpolateRdBu`、`d3.interpolateViridis`、`d3.range`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：CLASSIC_PALETTES 原数组；原色板卡展示。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.6 · 3.6 对错案例对比（P1）

- 页面：`lesson-03/index.html#ch-3-6`；demo：`lesson-03:d-3-6`。
- 原运行时中文标题：3.6 对错案例对比；英文：3.6 Right vs Wrong Comparison。
- 原知识点（保持顺序和含义）：四张原对错案例与竞猜；cases.forEach；点击选择和反馈；配色错误原因。
- 原讲解标题顺序：4 个典型错误 → 教学要点。
- 原关键代码：1 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.add`、`.addEventListener`、`.appendChild`、`.createElement`、`.forEach`、`.remove`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：原四卡竞猜与反馈。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.7 · 3.7 鲜艳 + 低饱和 哲学生成器（P2）

- 页面：`lesson-03/index.html#ch-3-7`；demo：`lesson-03:d-3-7`。
- 原运行时中文标题：3.7 鲜艳 + 低饱和 哲学生成器；英文：3.7 Vivid + Low-Sat Palette Generator。
- 原知识点（保持顺序和含义）：鲜艳+低饱和原哲学三规则；genPalette 的七色公式；H/S/L、类比/互补、饱和/亮度派生。
- 原讲解标题顺序：你的配色哲学（落地到 3 条规则） → 经验公式 → 7 色生成规则。
- 原关键代码：1 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：手写公式/函数，详见原代码及快照。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：H=220/S=70/L=55，原范围0–360/20–100/30–80。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 3.8 · 3.8 CVD 论文图测（P1）

- 页面：`lesson-03/index.html#ch-3-8`；demo：`lesson-03:d-3-8`。
- 原运行时中文标题：3.8 CVD 论文图测；英文：3.8 CVD Paper Figure Test。
- 原知识点（保持顺序和含义）：原三类论文风格图测；CVD 检测流程与矩阵；DOMParser；扫描 fill；simulateCVD；XMLSerializer。
- 原讲解标题顺序：3 个"经典论文图"案例 → CVD 测试流程 → 实测结论。
- 原关键代码：1 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.forEach`、`.getAttribute`、`.join`、`.parseFromString`、`.querySelectorAll`、`.rgb`、`.round`、`.serializeToString`、`.setAttribute`、`d3.color`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：原三个程序图与色觉近似视角。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 4.1 · 4.1 数据转换（P0）

- 页面：`lesson-04/index.html#ch-4-1`；demo：`lesson-04:d-4-1`。
- 原运行时中文标题：4.1 数据转换；英文：4.1 Data Transformation。
- 原知识点（保持顺序和含义）：1985 Crime 宽表/长表；d3.csv + d3.autoType；flatMap/map；state/metric/value；原表格及热图。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.flatMap`、`.log`、`.map`、`d3.autoType`、`d3.csv`、`d3.group`。
- 数据：`./data/crime.csv`。
- 原控件/默认值：读取 Crime 并展开 murder/robbery/burglary 三指标。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 4.2 · 4.2 坐标轴变换（P0）

- 页面：`lesson-04/index.html#ch-4-2`；demo：`lesson-04:d-4-2`。
- 原运行时中文标题：4.2 坐标轴变换；英文：4.2 Axis Transformation。
- 原知识点（保持顺序和含义）：数据/坐标系/屏幕三级空间；xData/xScreen；domain/range；margin；linear/log/sqrt 原控件。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.attr`、`.domain`、`.range`、`d3.max`、`d3.scaleLinear`、`d3.scaleLog`。
- 数据：`./data/crime.csv`。
- 原控件/默认值：xscale=linear（radio checked）；可 log/sqrt。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 4.3 · 4.3 曲线拟合（P1）

- 页面：`lesson-04/index.html#ch-4-3`；demo：`lesson-04:d-4-3`。
- 原运行时中文标题：4.3 曲线拟合；英文：4.3 Curve Fitting。
- 原知识点（保持顺序和含义）：保留十种曲线；d3.line().curve；datum 全数组绑定；path d；插值与回归区别；原 regression 示例知识。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.append`、`.attr`、`.curve`、`.datum`、`.domain`、`.x`、`.y`、`d3.curveCatmullRom`、`d3.line`、`d3.max`、`d3.regressionLinear`、`d3.regressionLoess`。
- 数据：`./data/crime.csv`。
- 原控件/默认值：原十种 curve 按钮；初始 render(0)。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 4.4 · 4.4 倾角感知（45° 黄金角）（P2）

- 页面：`lesson-04/index.html#ch-4-4`；demo：`lesson-04:d-4-4`。
- 原运行时中文标题：4.4 倾角感知（45° 黄金角）；英文：4.4 Slope Perception (45° Sweet Spot)。
- 原知识点（保持顺序和含义）：Cleveland 倾角感知；45°；lineAtAngle；角度/弧度；sin/cos；原 5–85° 滑块。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.addEventListener`、`.cos`、`.getElementById`、`.sin`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：angle=45，范围5–85。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 4.5 · 4.5 等值线（Marching Squares）（P0）

- 页面：`lesson-04/index.html#ch-4-5`；demo：`lesson-04:d-4-5`。
- 原运行时中文标题：4.5 等值线（Marching Squares）；英文：4.5 Marching Squares (Contour Lines)。
- 原知识点（保持顺序和含义）：二维标量场；阈值；四角 bit 编码；16 case；EDGE_TABLE；原合成场演示；三维扩展原文。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：手写公式/函数，详见原代码及快照。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：threshold=0.5，范围0.05–0.95，步长0.05。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 5.1 · 5.1 时间属性（P1）

- 页面：`lesson-05/index.html#ch-5-1`；demo：`lesson-05:d-5-1`。
- 原运行时中文标题：5.1 时间属性；英文：5.1 Time Attributes。
- 原知识点（保持顺序和含义）：有序/连续/周期/独立于空间/结构性五属性；TIME_ATTRIBUTES；Date 月份零基；timeDay.range；闰年。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论 → 为什么 5 个属性都重要？。
- 原关键代码：2 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.log`、`d3.timeDay.range`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：五属性卡；初始提示点击查看详情。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 5.2 · 5.2 标准时间可视化（折线图）（P1）

- 页面：`lesson-05/index.html#ch-5-2`；demo：`lesson-05:d-5-2`。
- 原运行时中文标题：5.2 标准时间可视化（折线图）；英文：5.2 Standard Time Viz (Line Chart)。
- 原知识点（保持顺序和含义）：Marie/Jean/Camille 法国人名序列；scaleTime/timeParse/timeFormat；折线、datum、时间 hover/年份定位。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论。
- 原关键代码：3 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.append`、`.attr`、`.call`、`.domain`、`.invert`、`.left`、`.on`、`.range`、`.style`、`.ticks`、`d3.axisBottom`、`d3.bisector`、`d3.pointer`、`d3.scaleTime`、`d3.timeFormat`、`d3.timeParse`。
- 数据：`./data/french_names.json`。
- 原控件/默认值：三名称 checkbox 默认 checked；原 hover。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 5.3 · 5.3 日历热图（van Wijk）（P1）

- 页面：`lesson-05/index.html#ch-5-3`；demo：`lesson-05:d-5-3`。
- 原运行时中文标题：5.3 日历热图（van Wijk）；英文：5.3 Calendar Heatmap (van Wijk)。
- 原知识点（保持顺序和含义）：2024 北京日历热图；timeDay.range；getDay；周列；格点 x/y；colormap；月分隔；日期边界。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论 → isMonthDivider 的巧妙之处。
- 原关键代码：3 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.attr`、`.data`、`.floor`、`.get`、`.getDate`、`.getDay`、`.getFullYear`、`.getMonth`、`.join`、`.map`、`.selectAll`、`d3.timeDay.count`、`d3.timeDay.offset`、`d3.timeDay.range`、`d3.timeFormat`、`d3.timeYear.floor`。
- 数据：`./data/weather_2024.csv`。
- 原控件/默认值：palette 首项 RdYlBu；可 Viridis/Cividis；周日行索引。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 5.4 · 5.4 周期时间可视化（阿基米德螺旋）（P0）

- 页面：`lesson-05/index.html#ch-5-4`；demo：`lesson-05:d-5-4`。
- 原运行时中文标题：5.4 周期时间可视化（阿基米德螺旋）；英文：5.4 Cyclic Time Viz (Archimedean Spiral)。
- 原知识点（保持顺序和含义）：阿基米德 r=a+bθ；pos(t)；cos/sin；angleDelta；segmentPath 四角闭合；日期与周起始；颜色映射。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论 → 关键路径生成。
- 原关键代码：3 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.cos`、`.sin`、`.sqrt`。
- 数据：`./data/weather_2024.csv`。
- 原控件/默认值：周起始首项周日，可周一；原 boxSize/coilGap 常量及366日循环。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。

### 5.5 · 5.5 Storyline 时间线（侏罗纪公园）（P1）

- 页面：`lesson-05/index.html#ch-5-5`；demo：`lesson-05:d-5-5`。
- 原运行时中文标题：5.5 Storyline 时间线（侏罗纪公园）；英文：5.5 Storyline (Jurassic Park)。
- 原知识点（保持顺序和含义）：侏罗纪公园角色线/事件；时间 scaleLinear；datum；CatmullRom.alpha；骨架和平滑；事件圈叠加。
- 原讲解标题顺序：你的原案例 → 嵌入教材理论 → 为什么 Catmull-Rom 不用 monotoneX？。
- 原关键代码：3 个 pre/code 块；⭐ 关键代码。
- API/方法词法索引：`.append`、`.attr`、`.curve`、`.data`、`.datum`、`.domain`、`.each`、`.enter`、`.forEach`、`.on`、`.range`、`.selectAll`、`.style`、`.text`、`.x`、`.y`、`d3.curveCatmullRom.alpha`、`d3.line`、`d3.scaleLinear`、`d3.select`。
- 数据：`inline constants / generated data; inspect demo body`。
- 原控件/默认值：alpha=0.5，范围0–1、步长0.1。
- 本轮新增计划：无（尚未实施）；按对应阶段逐节验收。
- 保护状态：`preserved`（基线记录）；理论/来源疑点见 `teacher-review.md`，不作静默修订。
