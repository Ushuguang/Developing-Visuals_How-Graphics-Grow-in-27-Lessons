# 教学增强独立集成审查

日期：2026-10-21（Asia/Singapore）；基线477706e。方法：只读应用代码、原lesson差异、真实数据文件；运行Node与Python静态核验。本审查员没有操控浏览器，不把主实施者的截图或其他执行结果冒称本人的浏览器验收。

## 待解决或须披露的项目

| 等级 | 问题 / 证据 | 建议与状态 |
|---|---|---|
| P1 | 净JS/CSS超过约160KiB目标，详见资源差值报告。 | 仍为OVER_TARGET，先给出重复削减和理由，不删原讲义/数据，不宣称达标。 |
| P1 | 4.5原bit/边编号与EDGE_TABLE不一致，例case1仅BL高，原连接上/左而不是左/下。 | 旧demo保留，新几何明确中性对照，整节NEEDS_TEACHER_REVIEW；不能在最终27行全填PASS隐去。 |
| P2 | 原1.1重新加载async run直接赋onclick，统一safeRenderDemo只包初次factory，原reload之后断网的reject不一定受保护。 | 已向主实施者提示；需要真实网络故障回归，不能仅凭初次挂载错误捕获通过就声称所有异步已覆盖。 |
| P2 | 2.3全树viewBox 1040×560在320px图框内可能把24px标签压至约5px、节点点击区极小。 | 已建议大号节点选择器或局部聚焦；必须以浏览器检查图内标签/触点，不只检查页面overflow。 |
| P2 | 5.5控制点circle带role=button/tabindex，但初审时未附Enter/Space处理。 | 已提示主实施者补齐；旁边select提供等价功能，不代表伪按钮自身可操作。 |
| 披露 | 1.4 merge/pairs/transpose/zip的原pre未有调用行，当前codeTargets=[]并在图内显示补充调用。1.5后四选择器指向原selectAll示意行并标“原讲解扩展”。 | 不伪造原代码是正确边界，但不得把这些项报告为原pre已有精确一对一高亮。后续可在原讲解知识点旁加真实补充代码标记。 |
| 披露 | 3.6原A名Jet实际Rainbow，C名12色实际8条；3.7派生L=112需要显示裁剪。 | 已显著说明并进入teacher-review；原pre未改。 |

## 初审已发现且主实施者已修复的共享问题

- `show()`旧实例清共享timeout，可能取消新实例加载超时：改为每次独立`waitForScene`，新增竞态测试。
- render中报错后scene继续写脱离DOM的root：showError现在abort/destroy、禁用步骤及重置，保留重试。
- labels()反复创建步骤按钮使用长生命周期signal：改为独立stepEvents，替换时abort；最终destroy一并清理。
- 关闭动态效果现在interrupt当前过渡并重绘；原生CSS reduced-motion仍保留。

这里只静态确认补丁存在并执行相关单测，不替代关闭/重开20次后的浏览器DOM/内存观察。

## 已执行检查

- `node --test tests/*.test.mjs`：初审执行时39项PASS、0FAIL；包含旧学习记录、各章纯计算、日期/几何、控制器状态及请求竞态。后续新增测试须由最终集成者再次运行并更新总数。
- `python docs/verify-knowledge-preservation.py`：27节/43保护文件PASS，五章lesson.js因为共享抽取/错误捕获/天气键修复列人工复核；原讲解、可复制代码、数据与独立demo按LF/CRLF等价核验。
- 全27节定义、130步、135个原代码范围静态核验：无块/行越界；逐项文本提取在`teaching-code-targets-review.json`。范围合法并不等于图形教学含义已经全部人工验证。
- `python scripts/audit-teaching-assets.py`：输出固定基线与当前工作树资源差值、逐文件哈希/大小、媒体扫描、数据完整性。预算仍OVER_TARGET。
- `innerHTML`只用于恢复原可信代码；新数据展示主要textContent。CVD解析只接受本站生成SVG；未见eval/new Function、任意用户HTML执行、外部上传入口或新远程运行依赖。

基线抓取器/核验器同时修正了一个审计工具问题：不能用过宽`<[^>]+>`剥离代码中的标签，否则原`day < 366`可能被误当HTML并吞掉后续行；现在只剥离合法字母起始标签。这个修正不改变应用或教师内容。

## 源数据与算法边界

新生80行、Crime50行和原三指标、天气366行、法国人名JSON及原Storyline点值保留。天气Date对象键与字符串查询不匹配属运行bug，loadWeather现在保留日期字符串，因此原图温度着色会从缺失变回真实CSV值；应在发布说明明确，不宣称原画面完全未变。

5.3新微图修正周偏移并列原简化公式；5.4借用原绑定SVG及同源几何，明确运行参数与讲义参数/圆弧路径的差别。5/10鞍点采用固定几何对照而非假称原算法包含渐近判别器。完整疑点见teacher-review。

## 本审查未执行

全部27节×3tab逐个真实浏览器操作、五视口完整截图、每个键盘焦点/触屏命中区、语言切换后全部图、所有断网重试、真实学生小测、Browser Network请求时间线、Lighthouse与内存性能均不是本审查员执行；必须在最终验收中逐项写PASS/FAIL/NOT_RUN，不能由单测通过推断。

新控制器启用/关闭移动原pre并恢复占位；借用螺旋SVG有placeholder和abort恢复，静态机制成立。仍须浏览器验证切tab/章节/语言/关闭与异步竞态后的最终DOM。

## 主实施者最终回归补记

此段由主实施者补记，不冒充以上独立审查员的浏览器操作：最终42项Node测试通过，27节/43保护文件通过。2.3已增加原生大号节点选择器；5.5图元已支持Enter/Space；1.1重新加载已catch并显示可读错误（未穷举每个控件的断网组合）。2.4原事件日志仅capture的问题已修复并实测阻止/放开冒泡分别5/9行。

27节原三tab/全部步骤/关闭后原pre文本逐一回归；9个P0实际五视口、其余18节320px；螺旋关闭重开20次无叠层或原路径增长。具体JSON/截图位置和NOT_RUN范围见teaching-viz-acceptance.md。未做堆内存测量，DOM节点不增长不等于已证明无内存泄漏。4.5教师确认与资源OVER_TARGET仍未解除。
