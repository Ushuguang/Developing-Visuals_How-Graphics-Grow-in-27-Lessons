# 教学可视化改造前基线

核对日期：2026-10-21（Asia/Singapore）。基线 commit：`477706e3223ef43e66c79fd10f7abcd00d81a546`。开始盘点时工作树 clean，分支 `codex/book-cover-home`。本报告从固定 Git 对象取数，不包含正在并行编写的试点代码。

## 事实与范围

- 五章实际小节为 5 / 4 / 8 / 5 / 5，共 27；优先级 P0=9、P1=14、P2=4。
- 原 `article#ch-n-m`、三 tab、demo 名称、原始代码块与数据资源见 `teaching-baseline.json`；逐节人工知识点/默认控件见 `knowledge-preservation.md`。
- 规格已原样复制根目录 `codex_visualization_course_27_sections_spec.md`。当前仅实施 2.2 试点，其余 26 节不代表完成。
- 原首页交互实验已删除；本轮不恢复，不改变教材主题、课程地图、开始学习及访问记录。
- `learning-progress.js` 原 localStorage key 为 `vis-course-visits-v1`，它表示访问过而非完成课程；新状态不可覆写该结构。

## 生命周期实测源码核对

五章都有 `queueMicrotask(() => __renderAllDemos())`，会在模块注册结束后主动挂载本章所有 demo；不是仅渲染可见 tab 的严格懒加载。`data-rendered` 仅是挂载去重标志。

目录点击将 active 小节切至 demo tab，调用 `__renderDemo`，80ms 后将 mount `scrollIntoView({behavior:'smooth'})`；更新 URL 使用 replaceState。直接带 hash 时也通过 microtask 激活对应小节。新联动必须在代码 tab 的显式入口开启，保留这套既有导航语义。

| 章节 | 注册范围 / ID | 原异步挂载处理 |
|---|---|---|
| 1 | 页面局部 DEMOS，d-3-1…d-3-5 | fn(mount) 后立即 rendered=1，未统一 await/catch |
| 2 | 页面局部 DEMOS（另有空 window.DEMOS），d-4-1…d-4-4 | 同上；底部还有首 mount 的历史初始化逻辑，新增代码须避免借用这一入口重复初始化 |
| 3 | window.DEMOS，d-3-1…d-3-8 | 同上 |
| 4 | window.DEMOS，d-4-1…d-4-5 | Promise.resolve 后调用，完成再 rendered=1，catch 展示错误；缺 pending 锁，仍须注意加载中并发 |
| 5 | window.DEMOS，d-5-1…d-5-5 | fn(mount) 后立即 rendered=1，未统一 await/catch |

第 1/3 章重名 d-3-*；第 2/4 章重名 d-4-*。共享模块识别必须为章节页面 + sectionId，不可仅按 data-demo 全站绑定。本文仅记录既有风险，不在基线任务中重写全部 lesson.js。

2.2 原默认是 `gender / 无 / count`；第一层可选 gender/major/class/hometown，第二层无/gender/major/class，归约 count/ages/avgAge。新专业→班级教学预设必须独立，不改原默认。

## 数据与来源

- 第1章、第1章独立 demo、第2章 newstudent.csv 各80行，八列：序号、姓名、性别、生日、年龄、班级、籍贯、民族；维持 DeepSeek 合成数据标记。
- 专业解析按当前 demo replace：软件工程1班40人（均龄17.625）、软件工程2班30人（17.6）、数据科学1班10人（17.6）。专业总人数70/10；合计80。
- 第3/4章 Crime CSV 各50行，实际12列，不应按规格文字“8指标”猜测当前文件列数；4.1原代码展开 murder/robbery/burglary。
- weather_2024.csv 有366行，date/temp_max/rain_mm。french_names.json 顶层为 year_range/names。原来源未能仅从文件证明，保留课堂数据待确认边界。
- 色彩案例主要为内联常量/程序生成；5.1/5.5运行脚本也内联数据，目录存在 time-attributes.js/storyline.js 不代表它们被运行时 import。
- JSON 中 dataSummary 对一般 CSV 使用 DictReader；supplementary/data/terrain10.csv 为无表头网格，不能将其 DictReader 记录数当作网格行数；该文件不属于本次2.2试点。

## 资源体积（修改前，Git 跟踪文件）

| 项目 | 原始字节数 |
|---|---:|
| 文件总数 | 120 |
| 全部文件 | 3,984,719 |
| JS/MJS/CSS | 436,184 |
| HTML + JS/MJS/CSS | 941,130 |
| JS | 264,665 |
| CSS | 169,803 |
| HTML | 504,946 |
| JSON | 521,515 |
| CSV | 181,787 |

超过250KiB的既有资产：book-cover.jpg 602,621 B；lesson-02/img/01-mackinlay-ranking.png 444,545 B；supplementary/5. 低维数据可视化.pdf 909,976 B。既有媒体不等于本轮新增，禁止为节省空间删老师素材。基线没有 MP4/WebM/MOV/M4V/AVI/GIF/Lottie/GLB/GLTF/字体文件。

全站新增 JS/CSS 目标 ≤160KiB，按相对本基线的差值计，不用删除讲义抵预算。验收截图保存在开发工作目录，不发布到课程站点。

## 外部依赖边界

五章 lesson.js 均已有 D3 v7 `https://cdn.jsdelivr.net/npm/d3@7/+esm`；不是完整离线站点。supplementary 还含 d3js.org/d3.v7.min.js、jsDelivr D3 和 unpkg d3-regression（含固定版与 latest）的原入口。Color Oracle / Coblis 是原参考链接，不等同页面加载时必请求。

机器清单 `externalUrlLiterals` 是源码 URL 字面量（含讲义代码示例），不能冒称浏览器 Network 实测。新教学增强不增加图库/CDN/字体/视频。

## 已执行和未执行

- `node --test tests/learning.test.mjs`：真实执行 PASS，2 tests / 2 pass / 0 fail。
- `python docs/capture-teaching-baseline.py 477706e`：PASS，生成27小节及120文件哈希快照。
- 五章主要文件存在、article/demo/三 panel：静态核对 PASS。
- 本基线报告没有逐一操作全部27节，也没有测试所有五视口、断网和真实学生理解效果；这些均 NOT_RUN，后续逐节补齐。

## 最小实现与回滚边界

以小型 ES module 共享开关/步骤/状态/键盘/错误/清理；sectionId 绑定局部 adapter，使用同源真实 CSV 的缓存计算结果；原可复制代码留在原处，旁标记只调用预定义函数，不 eval。首次只在2.2代码 tab 新增可选入口及相邻微图，保留原三 tab/默认demo。

关闭或失败只隐藏新增微图即可恢复原代码阅读。当前阶段不自动推送或发布；以后每个阶段独立提交，回滚使用对应 commit 的 git revert。文件删除须移入回收站，无法则由用户操作，不使用永久删除。

复核命令：`python docs/verify-knowledge-preservation.py`。重新采样请给捕获器指定另一输出路径，不覆盖本基线。验收矩阵见 `teaching-viz-acceptance.md`。
