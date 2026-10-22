# 显影：27 节课里，图形是怎么长出来的——《可视化导论》课程门户

基于 HTML、CSS、ES modules 与 D3.js 的静态课程网站，包含数据、可视化流程、色彩、低维数据、时序数据五章。首页提供学习入口、章节目标和图形预览；章节内提供讲解 / 关键代码 / → 映射 / 演示。

## 本地预览

**不要直接双击 `index.html`。** 本项目使用 ES modules 与 `fetch` 读取章节数据，浏览器会拦截 `file://` 下的模块脚本与数据请求：首页看着正常，但点进章节后图解、映射与演示会全部加载失败。

双击仓库根目录的 `start-local.bat` 即可启动本地服务并自动打开浏览器（优先使用 Python，其次使用 Node.js，均无需安装依赖）：

```bat
start-local.bat
```

手动方式（二选一，在仓库根目录运行）：

```bash
python -m http.server 8080
```

```bash
node serve-local.mjs
```

访问 http://localhost:8080/；第一章位于 http://localhost:8080/lesson-01/index.html。

若要让同一局域网中的设备访问，可运行 `python -m http.server 8080 --bind 0.0.0.0`，通过主机局域网 IP 与端口 8080 访问。

## 发布

线上地址：
源码仓库：https://github.com/Ushuguang/Developing-Visuals_How-Graphics-Grow-in-27-Lessons

GitHub Pages 从 `main` 分支的根目录发布。推送到 `main` 后，由 GitHub 自动构建并更新网站；发布状态以仓库的 Pages 构建结果为准。

## 目录

- `index.html`：首页学习入口、五章目标与原有知识介绍
- `start-local.bat` / `serve-local.mjs`：一键启动本地预览服务（不依赖 npm 安装）
- `home-theme.css` / `home-theme.js`：教材主题与首页动效
- `soft-book.js`：封面软翻页动画
- `chapter-explorer.css` / `chapter-explorer.js`：章节目录与 SVG 预览
- `i18n.js`：中英文切换
- `lesson-01/` 至 `lesson-05/`：五章讲解、代码、演示与数据
- `lesson-theme.css`：章节共用主题
- `lesson-nav-fallback.js`：左侧章节目录高亮的无依赖兜底
- `data-fallback.js`：站点通用的数据读取兜底（本地读取失败时改用内联数据）
- `vendor/d3.esm.min.js`：章节页用的 D3.js v7 ESM 备份
- `vendor/d3.iife.min.js`：独立 demo 用的 D3.js v7 普通脚本备份
- `vendor/d3-regression.min.js`：回归 demo 用的 d3-regression 备份
- `supplementary/`：补充演示
- `supplementary/data-inline.js`：补充 demo 的离线数据副本（自动生成）
- `lesson-01/demo/data-inline.js`：第一章独立 demo 的离线数据副本（自动生成）

桌面端悬停章节名称或用键盘聚焦可预览，点击章节名称直接进入讲解；触屏端点击同样直接进入章节。

## 依赖与离线使用

无需 npm 或构建工具。章节演示优先加载仓库内的 `vendor/d3.esm.min.js`（D3.js v7，ESM 打包版，约 276 KB，gzip 后约 94 KB）；该文件缺失或加载失败时才回退到 jsDelivr CDN（`https://cdn.jsdelivr.net/npm/d3@7/+esm`）。因此在 jsDelivr 不可达的网络中，交互演示仍可运行。

课程数据随各章的 `data/` 目录提供，需通过 HTTP 服务读取。本地托管页面不等于完全离线可用：断网时若本地 D3 备份也缺失，交互演示不能保证运行。

`file://` 下浏览器会用 CORS 拦截 ES modules，章节页的交互逻辑不会执行。为此站点另附 `lesson-nav-fallback.js`（普通脚本，不依赖模块加载），让左侧章节目录的高亮跟随与锚点跳转在双击打开时也照常工作；标签切换、图解联动与数据加载仍需通过 HTTP 服务访问。

补充 demo 是更早的独立课件，同样做了加固：优先加载仓库内的 `vendor/d3.iife.min.js` 与 `vendor/d3-regression.min.js`，CDN 只作兜底；数据在 `file://` 下被 CORS 拦截时，改由 `data-inline.js` 里内联的同一份数据接管（由仓库根目录的 `data-fallback.js` 负责）；页面再出错时会在正文里显示可操作的提示，而不是静默留白。

`lesson-01/demo/` 下的 5 个独立 demo 原先用 ES module 加载 D3，而浏览器在 `file://` 下会用 CORS 拦截模块脚本，因此已改为普通脚本 + 本地 D3 备份，双击打开也能运行。

## 学习地图与访问记录

- 首页知识地图展示共同基础、色彩方法与图表应用的关系，所有节点均可直接进入课程。
- `learning-progress.js` 使用 `localStorage` 的 `vis-course-visits-v1` 键，仅保存章节号、小节、标签页、滚动偏移与时间。数据留在本浏览器，已访问不代表完成，可在首页清除。
- 只有“继续上次学习”链接（`?resume=1`）会恢复位置。普通章节入口仍正常进入，且学习记录不依赖 D3 网络加载成功。

验证命令：`node --test tests/learning.test.mjs`（使用 Node 内置测试，无需安装依赖）。

## 章节图解联动

五章 27 小节均有独立的 **→ 映射** 标签，位于关键代码与演示之间，点击即进入图解联动。左侧保留原代码，右侧展示同一数据的输入、转换与结果；选择步骤或图元可定位代码。支持上一步/下一步、重置、放大图形、关闭动态效果和返回原完整演示。切回其他标签时原代码恢复原位。小屏幕按顺序排列代码与图形，四个标签可换行。继续学习能够恢复映射标签。

`teaching-viz/linked-learning.js` 管理生命周期，`chapter-01.js` 至 `chapter-05.js` 提供各章图形，`models-*.js` 提供可测试的同源计算。没有新增前端框架、媒体或远程依赖；首页保持原样。

运行 `node --test tests/*.test.mjs` 和 `python -B docs/verify-knowledge-preservation.py` 检查计算与内容保护。当前入口变更与发布范围见 [映射标签记录](docs/mapping-tab-release.md)；首轮浏览器验收、资源增量、教师待确认问题和回滚方式见 [交付报告](docs/teaching-viz-release-report.md)。4.5 原 Marching Squares 边表尚需教师确认；新增运行代码超过建议体积目标，不代表所有验收项目均通过。

第五章新增案例探究、可直接定位步骤的课堂任务和[案例讲解手册](lesson-05/casebook.md)。时间属性、折线、日历、螺旋和Storyline的映射均按阶段构建；新增校园日程/小组协作与14天周期比较均明确为构造微例。原讲义与数据保留，具体对应检查与桌面验收见[第五章精修报告](docs/chapter05-refinement-report.md)。
