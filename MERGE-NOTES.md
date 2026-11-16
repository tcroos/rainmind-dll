# RainMind 改动说明与合并指南

> 生成时间：2026-11-16
> 仓库：`https://github.com/tcroos/rainmind-dll.git`（remote `origin`，分支 `main`）
> 对比基线：`rainmind/main`（`https://github.com/tcroos/rainmind-frontend.git`）@ `6e23dee`（2026-11-13）
> 本文覆盖范围：`6e23dee..4d61d26`（**34 个提交、132 个文件、+7526 / −2529**；新增 42、修改 90、删除 0）。本文档自身的提交不在统计内。

这份文档是给「把这个仓库合并回目标项目」用的。**第 2 节（接口）和第 7 节（全局样式）是必须逐条核对的**，其余是页面与交互改动。

---

## 0. 结论先说

| 项目 | 结论 |
| --- | --- |
| 删除/重命名的后端接口 | **没有** |
| 新增的后端接口 | **没有** |
| 改变请求/响应契约的接口 | **有 2 个**：`POST /api/auth/email-code`、`GET /api/canvas/projects` |
| 数据模型变化 | **1 个**：站点设置新增 `site.contactImageUrl`（`app_settings.site` JSON 内，无迁移） |
| 数据库结构变更 / 迁移脚本 | **没有**（无 SQL、无 Prisma 迁移、无新表新列） |
| 前端依赖变更 | **没有**（`package.json` / `pnpm-lock.yaml` 均未改动） |
| 新增环境变量 | **2 个**（均为 `NEXT_PUBLIC_*`，构建期内联）；另有开发期开关 `NEXT_DEV_BUNDLER` |
| 新增页面路由 | `/wallet`、`/about` |
| 行为变更的路由 | `/billing`、`/profile`、`/wallet?section=*`、`/announcements`、`/prompts`、`/my-prompts` |

**兼容性提醒**：如果目标项目后端还是旧版本，只合前端**不会报错**（旧成功响应本来就是 `{ "ok": true }`，新前端能通过校验），但会退回旧行为——邮件服务没配置时仍然提示「验证码已发送」。想拿到 503 + 真实原因，必须同时升级后端（见 2.1）。

---

## 1. 提交清单（按时间正序）

```text
5ff6b3c feat(web): 统一品牌主题、公告系统、登录链路与画布项目库
2fb2a33 feat(web): 展示页导航官网化并新增关于页
68f9c1f feat(web): 官网导航收敛到右侧并支持联系图片弹窗
c62afed feat(web): 精简官网导航、浅色改纯白并接入联系示例图
2ce3fe4 feat(web): 移除首屏滚动提示并让顶部胶囊随滚动收窄
0209b58 fix(web): 移除顶部导航的模糊效果
16c69ef feat(auth): 重排登录注册表单并增加确认密码
577dea8 fix(auth): 让登录注册输入框文字垂直居中
43ac1db fix(auth): 重置密码页统一到新版表单
aa53cf1 fix(auth): 验证码发送改为真实反馈
2610548 style(web): 精修联系我们弹窗
69f1c05 style(billing): 精修套餐弹窗与结算页
d0ad6e5 style(web): 首屏光效去掉底部渐隐，条纹铺到画面底部
619ca42 fix(web): 首屏底部改回轻量收口，登录链路不再弹公告
c9bd335 feat(agent): 对话页去头像、历史改右侧浮层并补新对话引导
bca39cf feat(agent): 橙色点阵、气泡消息、资产浮层重做与新对话封面
4f253f9 style(agent): 重排创作历史列表
147d7d0 fix(ui): 修深色输入亮带、主页工具按钮与默认头像
9c0cf06 feat(ui): 输入区两行排布、画布/短剧入口重排与账号浮层重做
77397fe feat(nav): 拆分钱包与个人中心并重排侧栏分组
7feeb19 fix(nav): 个人分组去掉个人中心与 API 外链箭头
fee8420 style(wallet): 重做钱包首屏与账单区
d8ad197 feat(wallet): 充值改为套餐弹窗，钱包首屏回归轻量
58eede8 fix(canvas): 新建画布卡片与项目卡同尺寸
85b1c39 fix(canvas): 提升项目卡悬浮控件的可读性
1a23fa2 style(home,canvas): 重做欢迎页介绍区并精简画布库初始态
039e6c2 style(home): 顶部导航去掉作品并把 API 更名为 API 服务
bd5102c fix(announcement): 关掉登录后弹窗后不再在其他页面重复弹出
71d371a fix(billing): 充值中心品牌文案改为 RainMind
28a8f25 feat(canvas): 画布库封面只展示一张素材，取消拼图
45c4a4b feat(prompts): 重做提示词库界面（胶囊筛选、封面卡片、骨架加载）
e84b332 feat(announcements): 重做网站公告页（编辑式页头、日期卡片、正文折叠、页码分页）
6bccd9c fix(prompts): 详情弹窗固定尺寸，长提示词折叠并在弹窗内滚动
4d61d26 feat(my-prompts): 我的提示词改为卡片网格（搜索/分类/骨架/空态），无封面走纯文字卡
```

复现范围：

```bash
git fetch rainmind
git diff --stat rainmind/main...HEAD
```

---

## 2. 接口变更（合并前必须读完）

### 2.1 `POST /api/auth/email-code`（行为变更 + 响应新增字段）

- 文件：`web/src/app/api/auth/email-code/route.ts`
- 依赖：`web/src/lib/mail/smtp.ts` 新增导出 `isMailServiceConfigured()`、`verifySmtpConnection()`
- 鉴权：不变（`email-change` 需要登录，其余为公开接口）
- 限流：调用与参数不变（`checkAuthRateLimit("email-code:<purpose>", …, 5 次 / 60 分钟)`）；实际按 IP、设备指纹、「邮箱 + 来源」三个维度分别计数，任一维度超限即返回 429（这是既有安全模块的行为，本次未改）。

**请求体（未变）**

```json
{ "purpose": "register | email-change | password-reset", "email": "user@example.com" }
```

**变更点（按执行顺序）**

1. 新增「配置完整性」预检：`isMailServiceConfigured(settings.mail)` 要求 `host`、`username`、`password` 非空，且 `fromEmail || username` 是合法邮箱。不满足直接返回 **503**，不再生成验证码、不消耗限流额度。
2. 新增「SMTP 真实连接探测」：`verifySmtpConnection()` 只做 `connect → EHLO → (STARTTLS) → AUTH LOGIN → QUIT`，不发信。认证失败/端口错误等会把真实原因拼进错误信息，返回 **503**。
3. 成功响应新增 `delivered` 字段：`{ "ok": true, "delivered": true }`。
   - `password-reset` 且邮箱不存在时，仍按防枚举策略静默成功，但返回 `{ "ok": true, "delivered": false }`，且**不写验证码记录、不触发 60 秒重发冷却**。
4. 其余逻辑不变：`register` 邮箱已注册仍 400；重发冷却仍 400；限流仍 429。

**真实返回示例（本地未配置邮件服务时实测）**

```http
POST /api/auth/email-code
Content-Type: application/json

{"purpose":"register","email":"merge-check@example.com"}

HTTP/1.1 503
{"error":"邮件服务尚未配置，暂时无法发送验证码，请联系管理员"}
```

**错误码表**

| 状态码 | 场景 | 响应体 |
| --- | --- | --- |
| 400 | `purpose` 非法 / 邮箱格式错 / 邮箱已注册 / 60 秒内重发 | `{ "error": "..." }` |
| 401 | `purpose=email-change` 未登录 | `{ "error": "..." }` |
| 429 | 超出限流 | `{ "error": "...", "retryAfter": 秒 }` |
| 503 | 邮件服务未配置 | `{ "error": "邮件服务尚未配置，暂时无法发送验证码，请联系管理员" }` |
| 503 | SMTP 连不上 / 授权码失效 | `{ "error": "邮件服务不可用：<SMTP 原始原因>" }` |
| 400 | 其余异常（含探测通过但真正发信失败） | `{ "error": "发送验证码失败，请稍后重试" }` |

**前端调用点（都已按新契约改造）**

- `web/src/components/auth/auth-form.tsx`（注册）
- `web/src/app/forgot-password/page.tsx`（找回密码）
- `web/src/app/(user)/profile/account-center.tsx`（修改邮箱）

前两处校验 `response.ok && payload.ok === true` 并读取 `delivered`；修改邮箱处只校验 `response.ok`（`email-change` 不会返回 `delivered=false`）。

**合并要求（按目标后端版本选择）**

- **推荐**：前后端一起合。新前端只在 `response.ok && payload.ok === true` 时提示成功，后端 503/400 的错误文案能原样展示。
- 只合前端、后端保持旧版：可运行，成功响应 `{ ok: true }` 能通过校验；但 `delivered` 不生效，且「邮件服务没配置却提示已发送」的旧问题会保留。
- 只合后端、前端保持旧版：可运行（旧前端只判断 HTTP 状态码），但拿不到 `delivered=false` 的防枚举提示。
- 如果目标项目改写了验证码接口：最低要求是**成功时仍返回 `ok: true`**；否则要么同步改前端校验，要么把前端改回只判断 HTTP 状态。

---

### 2.2 `GET /api/canvas/projects`（新增可选参数 + 响应新增字段）

- 路由：`web/src/app/api/canvas/projects/route.ts`
- 服务：`web/src/lib/server/canvas-project-service.ts` → `web/src/lib/server/canvas-project-store.ts`
- 契约：`web/src/lib/canvas-project-contract.ts`
- 前端：`web/src/services/api/canvas-projects.ts`、`web/src/app/(user)/canvas/stores/use-canvas-store.ts`

**查询参数**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `page` | 否 | 默认 1；超过 1,000,000 按 1,000,000 处理 |
| `pageSize` | 否 | 默认 12；超过 100 按 100 处理 |
| `keyword` | 否 | **新增**。服务端 `trim` 并截断到 60 字符；对 `title` 做不区分大小写的子串匹配；`total` 也会按关键词过滤后统计 |

**响应（`data` 部分）**

```json
{
  "code": 0,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "title": "RainMind 画布 1",
        "nodeCount": 4,
        "connectionCount": 1,
        "createdAt": "2026-11-16T11:00:00.000Z",
        "updatedAt": "2026-11-16T11:30:00.000Z",
        "previews": [{ "kind": "image", "url": "https://.../output.webp" }]
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 12
  },
  "msg": "OK"
}
```

- `previews` 为**新增的可选数组**：最多 4 条，`kind` 只会是 `"image"` / `"video"`，`url` 已去重且排除 `data:`、`blob:`。
- 排序规则：`metadata.status === "success"` 优先 → 图片/全景优先于视频 → 节点顺序 → 同一节点内 `serverUrl` > `remoteUrl` > `content`。
- `sourceHandoffId`、`creativeConversationId` 只在有值时出现（`JSON.stringify` 会省略 `undefined`）。
- 未登录仍为 `401`：`{ "code": 401, "data": null, "msg": "请先登录" }`。
- **SQL 只读**：从既有 `canvas_projects.project_json` 聚合，`app_settings` / 表结构均未改，无迁移。
- JSON 文件存储分支（`VOZEB_PRO_DATABASE_PROVIDER=file`）同样支持关键词与 `previews`。
- 性能说明：关键词过滤发生在 `user_id` 过滤之后、`LIMIT` 之前，用 `strpos(lower(title), lower($4))` 做子串匹配，没有为 `lower(title)` 建索引。单用户画布数量级较小时无感；若目标项目单用户画布很多，需要评估是否加索引。

**兼容性**

| 组合 | 结果 |
| --- | --- |
| 新前端 + 旧后端 | 请求里的 `keyword` 被忽略（搜索不生效）；响应没有 `previews`，列表卡走「空白封面」降级，不报错 |
| 旧前端 + 新后端 | 完全兼容，旧前端忽略 `previews` |
| 新前端 + 新后端 | 搜索 + 单图封面正常 |

---

### 2.3 站点设置新增 `site.contactImageUrl`（公共设置 + 后台设置）

`SiteSettings` 新增字段（`web/src/lib/auth/store-types.ts`）：

```ts
contactImageUrl: string; // 首页「联系我们」弹窗的图片；空字符串表示未配置
```

涉及 4 个后端/共享文件，缺任何一个字段都会被丢弃或读不到：

| 文件 | 作用 |
| --- | --- |
| `web/src/lib/auth/store-types.ts` | 类型定义 |
| `web/src/lib/auth/store-foundation.ts` | 默认值 `""` |
| `web/src/lib/auth/store-normalizers.ts` | `normalizeLinkUrl(value, "")`：只接受 `/` 开头、`http://`、`https://`、`mailto:`，最长 2000；其他值回落 `""` |
| `web/src/lib/auth/session.ts` | `serializePublicSettings()` 把字段带进 `/api/auth/session` 的 `settings.site` |

**受影响的接口**

1. `GET /api/auth/session`：`settings.site` 新增 `contactImageUrl`。实测字段顺序/键：
   `title, logoUrl, iconUrl, contactImageUrl, seoDescription, footerCopyright, termsUrl, termsVersion, privacyUrl, privacyVersion, friendLinks, socials`
2. `PATCH /api/admin/settings`：请求体 `{ "site": { ...原有字段, "contactImageUrl": "/contact-preview.jpg" } }`。该接口按 `Partial<AuthSettings>` 接收整个 `site` 对象，因此**不需要新增参数解析代码**；字段随 `setAuthSettings` 写入 `app_settings.site`（JSON provider 写入设置文件）。

**存储与迁移**

- Postgres：`app_settings` 表 `id='default'` 行的 `site` JSONB 列。
- 文件模式：原 settings JSON 文件。
- **无 schema 变更**；旧数据读取时 `normalizeSiteSettings` 自动补 `contactImageUrl: ""`。
- 后台表单：`web/src/components/admin/admin-configuration-sections.tsx` 新增「联系图片 URL」输入框（maxLength 2000），提示建议 3:4 竖图。

**前端消费方**

- 首页服务端首屏：`web/src/app/home/home-data.ts` 的 `HomeSiteSettings` 增加该字段。
- 客户端会话：`web/src/stores/use-public-session-store.ts` 的 `PublicSiteSettings.contactImageUrl?: string`。
- 弹窗：`web/src/app/home/home-actions.tsx` → `web/src/app/home/home-contact-modal.tsx`（3:4 相框式弹窗；空值显示「待配置」提示）。

**合并要求**

- 若目标项目后端没有这 4 处改动：后台输入框会是 `undefined`（非受控告警），保存时字段被 normalizer 丢弃，首页弹窗永远显示未配置。
- 若目标项目数据库沿用旧库：无需迁移；保存一次设置即写入。

---

### 2.4 明确未改动的接口（避免误判）

以下均**未修改**（文件未出现在 diff 中，或仅改了 UI 文案）：

- 登录 `POST /api/auth/login`、注册 `POST /api/auth/register`、登出、密码 `PATCH /api/auth/password`、资料 `PATCH /api/auth/profile`
- 公告：`GET /api/announcements`、后台公告 CRUD（`popupHome` 字段仍保留并仍可读写，只是后台 UI 不再提供开关，弹窗逻辑不再使用它）
- 套餐/订单/优惠券/积分/消费：`GET /api/billing/products`、结算与支付回跳、钱包数据接口
- 素材、提示词库 `GET /api/prompts`、我的提示词 `GET/POST /api/my-prompts`、`DELETE /api/my-prompts/[id]`
- 画布保存/读取单项目、导入、删除
- 上传、对象存储、模型渠道、后台其他接口

**注册请求体的前端变化（后端无变化）**：`web/src/components/auth/auth-form.tsx` 不再发送 `displayName`。后端 `createUser` / `createFirstAdmin` 里是 `normalizeDisplayName(input.displayName || username)`，缺失时回退为用户名，**属兼容变更**。

---

## 3. 数据库与存储

- 无迁移脚本、无表结构变化。
- 画布列表新增的 `previews` 完全由 `canvas_projects.project_json` 聚合查询得到，只读。
- 站点设置新增字段写入既有 `app_settings.site`（Postgres）或 settings JSON 文件。
- 兼容两种 provider：`listCanvasProjectSummaries` 的 Postgres 与 file 两个分支都实现了关键词过滤与 `previews`。

---

## 4. 环境变量、构建与启动

### 4.1 新增环境变量（`.env.example`）

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_AUTH_SHOWCASE_VIDEO_URL` | 否 | 登录/注册页左栏展示视频（mp4 直链）。**代码默认值是一个第三方 CDN 地址**：`https://v4-kling.kechuangai.com/kcdn/cdn-kcdn112452/login/zh.mp4`（`web/src/lib/auth-showcase.ts`）。想换片必须显式设置；留空仍会用这个默认地址 |
| `NEXT_PUBLIC_AUTH_SHOWCASE_POSTER_URL` | 否 | 视频加载前的封面图，留空用主题渐变兜底 |

- 两个都是 `NEXT_PUBLIC_*`，**构建期内联**：改了必须重新构建，运行时改环境变量不生效。
- 布局：≥1024px 左视频（55%）+ 右表单（45%）；**<1024px 直接把视频列隐藏**、只留表单；<640px 收紧表单内边距。视频列 `min-height: 100dvh`，`object-fit: cover` 裁切；尊重 `prefers-reduced-motion`，该模式下不自动播放。
- 未配置变量时登录页会请求上述第三方 CDN。**如果目标项目不允许外部媒体请求，请先把 `DEFAULT_AUTH_SHOWCASE_VIDEO_URL` 改成本地文件或设置环境变量。**

### 4.2 启动脚本

`web/scripts/run-app.mjs`：开发模式默认从 `--webpack` 改为 `--turbopack`；可用 `NEXT_DEV_BUNDLER=webpack` 回退。生产构建命令未变。

### 4.3 `.gitignore`

新增 `.devtools/`、`.pgdata/`（本地嵌入式 PostgreSQL 的二进制与数据目录）。

---

## 5. 路由与页面

### 5.1 新增

| 路由 | 文件 | 说明 |
| --- | --- | --- |
| `/wallet` | `web/src/app/(user)/wallet/page.tsx` | 钱包：余额卡 + 账单（订单/积分分段），充值走弹窗；`?section=billing` 落地即开套餐弹窗并 `replace` 成 `/wallet`；`?section=` 属于个人中心时 302 到 `/profile` |
| `/about` | `web/src/app/about/page.tsx` | 关于页（编辑式排版，导航含作品广场 / 登录 / 开始创作） |

### 5.2 行为变更

| 路由 | 变更 |
| --- | --- |
| `/billing` | 由「重定向到 `/profile?section=billing`」改为：带 `?product=` → `/billing/checkout?product=...`；不带 → `/wallet` |
| `/profile` | 只保留「账户概览 / 个人资料 / 账户与安全 / 帮助中心」；`?section=` 属于资金类（wallet、billing、coupons、orders、points、consume、referrals）时 302 到 `/wallet?section=...` |
| `/wallet` | 资金类分区的唯一入口；余额卡、订单/积分账单；`/billing` 旧链接全部收口到这里 |
| `/announcements` | 服务端渲染的公告列表重做：编辑式页头、日期栏卡片、长正文折叠（客户端组件）、页码分页；越界页码会夹回最后一页；每页 20 条 |
| `/prompts` | 提示词库重做：分类胶囊 + 标签下拉 + 搜索；卡片封面单图、无封面纯文字卡；每页 16 条 |
| `/my-prompts` | 从 antd Table 改为同一套卡片网格 + 搜索/分类；每页 12 条 |
| `/canvas` | 列表支持标题搜索（`keyword`，320ms 防抖）；封面只显示一张素材；新建画布直接进编辑器（`insertIntoList:false`） |
| `/create` | 无参数 = 主页；`?new=1` = 新建对话（清空消息但留在对话视图）；`?conversationId=` = 打开指定对话；历史/资产改为右侧浮层 |
| `/`（官网） | 顶部导航只剩「API 服务」（外链 `https://api.rainmind.net/`）与「联系我们」（锚点 `#contact`，弹窗展示 `contactImageUrl`）；作品/定价/关于只在页脚 |
| `/drama`、`/gallery`、`/help`、`/u/[id]` 等 | 只改样式/入口，无路由或接口契约变化 |

### 5.3 侧栏与账号入口（`web/src/constant/navigation-tools.ts`）

```text
创作：Agent
项目：画布、短剧
资产：作品、素材、提示词、词库、广场
个人：主页(/me)、钱包(/wallet)、API(https://api.rainmind.net，外链，无箭头)
```

- 侧栏底部是「头像 + 昵称 → 个人中心」账号条；右上角头像浮层是第二入口（个人中心 / 钱包 / 帮助中心 / 管理员后台 / 官网首页 / 退出登录）。
- `/profile` 本身不在侧栏列表里。

---

## 6. 行为变更（非接口，但影响验收）

### 6.1 公告

- 只保留「登录后弹窗」：`popupHome` 字段仍在数据模型与后台接口里，但**不再有 UI 开关，也不再触发弹窗**（旧数据里为 `true` 也不会弹）。
- 营销页 `/`、`/login`、`/register`、`/forgot-password` 均不挂载公告弹窗（`web/src/lib/announcement-routes.ts`）。
- 「关闭」状态存 `sessionStorage`：
  - 横幅标记：`vozeb-pro:announcement-bar-dismissed`
  - 弹窗逐条标记：`vozeb-pro:announcement-dismissed:<context>:<id>`
  - 会话级「已看过」：`vozeb-pro:announcement-popup-seen:<context>`
- 登录/注册成功、退出登录都会调用 `clearAnnouncementDismissState()`，保证下次登录重新展示；旧版写在 `localStorage` 的永久关闭标记会在读取时清理。
- 顶部新增 36px 公告滚动条（`announcement-marquee.tsx`），仅在工作台外壳渲染。

### 6.2 登录 / 注册 / 找回密码

- 注册去掉「昵称」字段与请求体里的 `displayName`；新增「确认密码」前端一致性校验（不通过不发请求）。
- 注册前必须勾选服务条款/隐私政策（`policyAccepted` 校验前端也拦一次）。
- 验证码改为输入框内文字按钮，发送结果按 `delivered` 给出真实提示。
- 登录/注册/重置密码页改为满屏左右布局：左栏视频（见 4.1），右栏表单 384px；标题左对齐，输入框 46px 高。
- 每次登录会清空公告关闭状态（`clearAnnouncementDismissState()`）。

### 6.3 钱包 / 充值

- `/wallet` 首屏只有「余额卡（积分大字 / 套餐胶囊 / 今日 / 永久 / 立即充值 / 优惠券）」+「账单」。
- 「立即充值」打开 `BillingPlansModal`（与官网一致的 7 卡弹窗），不再把套餐卡铺在页面里。
- `/wallet?section=billing`（账户面板「续费套餐」、旧链接）落地即开弹窗并清空 query。
- 结算页只改了视觉与文案；**金额计算、下单、回跳逻辑未动**。

### 6.4 画布

- 列表封面只展示 `previews[0]`，整块铺满（不再拼图）；无素材时显示点阵占位。
- 新建画布直接进入编辑器，不先往列表插空卡片。
- 项目卡悬浮控件改为白底 + 细边 + 落影，选中态品牌橙描边；深浅主题都走内联色，避免全局 `button{color}` 覆盖。
- 列表搜索会调用 2.2 的关键词参数。

### 6.5 Agent / 创作页

- 用户消息改为白底气泡；去掉两侧头像。
- 创作历史与资产改为右侧浮层（复用公告抽屉的尺寸变量），点遮罩/×关闭。
- 主页背景点阵改为品牌橙（`--create-dot-rgb`），范围扩到「灵感发现」上方。
- 空态改为三张斜叠封面（`/empty-cover-1..3.jpg`）+ 示例提示。
- 头像兜底改为单字 + 品牌橙渐变（`web/src/lib/user-avatar.ts` 新增 `userAvatarInitial`）。

### 6.6 词库 / 我的提示词

- `/prompts`：分类胶囊 + 标签下拉；卡片单图封面、无封面走「引言图标 + 分类 + 4 行正文」纯文字卡；骨架加载；分页 16。
- 详情弹窗固定 `min(78dvh, 620px)`，正文超 220 字折叠为 6 行，展开后弹窗内滚动；底部按钮固定可见。
- `/my-prompts`：Table → 卡片网格，支持搜索/分类/删除（Popconfirm）。

---

## 7. 全局样式与设计令牌（合并高风险）

本次新增了两个全局样式文件，**必须随代码一起合并，并保持 `globals.css` 里的 import 顺序**：

```css
/* web/src/app/globals.css */
@import "./styles/global-surfaces.css";      /* 新增 */
@import "./styles/global-create-ambient.css"; /* 新增 */
@import "./styles/global-foundation.css";
@import "./styles/global-hero.css";
...
```

`global-surfaces.css` 定义了本次所有新页面依赖的令牌：

- `--surface-canvas / --surface-rail / --surface-panel / --surface-soft / --surface-inset / --surface-hover`
- `--hairline`、`--ink-1/2/3`
- `--brand-500/600/700`、`--brand-soft`、`--brand-line`、`--brand-glow`
- 公告抽屉尺寸令牌：`--announcement-drawer-width/top/right/bottom`

**如果目标项目已有同名令牌（例如 `--brand-500`），合并时会出现两套定义，后导入的覆盖先导入的。** 必须人工确认取值；否则会出现「某些页面颜色突然变了」而代码看不出问题。

其他被修改的全局样式：

- `global-auth.css`：登录/注册满屏布局、46px 输入框、autofill 覆盖、深色输入亮带修复。
- `global-scroll-utilities.css`：新增 `.scroll-fade-x`（小屏横向滚动右缘淡出）。
- `global-hero.css`、`global-admin-controls.css`：展示页与后台局部调整。

---

## 8. 文件清单

完整清单可用下面的命令随时导出（合并前建议再跑一次核对）：

```bash
git diff --name-status rainmind/main...HEAD
```

### 8.1 新增文件（42 个）

```text
web/public/contact-preview.jpg
web/public/empty-cover-1.jpg
web/public/empty-cover-2.jpg
web/public/empty-cover-3.jpg
web/src/app/(user)/canvas/canvas-library-layout.test.ts
web/src/app/(user)/canvas/components/canvas-project-cover.tsx
web/src/app/(user)/canvas/components/canvas-project-create-card.tsx
web/src/app/(user)/canvas/components/canvas-project-format.test.ts
web/src/app/(user)/canvas/components/canvas-project-format.ts
web/src/app/(user)/create/components/create-dot-field.tsx
web/src/app/(user)/create/components/create-side-panel.tsx
web/src/app/(user)/create/components/creative-empty-chat.tsx
web/src/app/(user)/create/create-ambient.test.ts
web/src/app/(user)/create/create-home-dock.test.ts
web/src/app/(user)/create/create-home-dock.ts
web/src/app/(user)/create/create-theme-accent.test.ts
web/src/app/(user)/profile/account-center.tsx
web/src/app/(user)/profile/account-sections.test.ts
web/src/app/(user)/profile/account-sections.ts
web/src/app/(user)/prompts/prompts-library-layout.test.ts
web/src/app/(user)/wallet/page.tsx
web/src/app/about/page.tsx
web/src/app/announcements/announcement-item.tsx
web/src/app/announcements/announcements-page.test.ts
web/src/app/home/home-contact-modal.tsx
web/src/app/home/home-login-flow.test.ts
web/src/app/styles/global-create-ambient.css
web/src/app/styles/global-surfaces.css
web/src/components/auth/auth-page-split.test.ts
web/src/components/auth/auth-showcase-video.tsx
web/src/components/layout/announcement-drawer.test.ts
web/src/components/layout/announcement-glyph.tsx
web/src/components/layout/announcement-marquee.test.ts
web/src/components/layout/announcement-marquee.tsx
web/src/components/layout/marketing-announcement-popup.test.ts
web/src/components/layout/user-status-actions.test.ts
web/src/components/my-prompts/my-prompts-page.test.ts
web/src/components/prompts/prompt-detail-dialog.test.ts
web/src/lib/announcement-dismiss.ts
web/src/lib/announcement-routes.ts
web/src/lib/auth-showcase.ts
web/src/lib/user-avatar.test.ts
```

### 8.2 修改文件（90 个，按目录）

```text
# 后端 / 共享层
web/src/app/api/auth/email-code/route.ts
web/src/app/api/auth/email-code/route.test.ts
web/src/app/api/canvas/projects/route.ts
web/src/lib/canvas-project-contract.ts
web/src/lib/canvas-project-summary.ts
web/src/lib/server/canvas-project-service.ts
web/src/lib/server/canvas-project-store.ts
web/src/lib/server/canvas-project-store.test.ts
web/src/lib/auth/session.ts
web/src/lib/auth/site-settings.test.ts
web/src/lib/auth/store-foundation.ts
web/src/lib/auth/store-normalizers.ts
web/src/lib/auth/store-types.ts
web/src/lib/mail/smtp.ts
web/src/lib/client-session-reset.ts
web/src/lib/user-avatar.ts
web/src/services/api/canvas-projects.ts
web/src/stores/use-public-session-store.ts

# 官网 / 公开页
web/src/app/page.tsx
web/src/app/globals.css
web/src/app/announcements/page.tsx
web/src/app/forgot-password/page.tsx
web/src/app/home/hero-backdrop.module.css
web/src/app/home/hero-backdrop.tsx
web/src/app/home/home-actions.tsx
web/src/app/home/home-agent-hero.module.css
web/src/app/home/home-agent-hero.tsx
web/src/app/home/home-data.ts
web/src/app/home/home-footer.tsx
web/src/app/home/home-gallery.tsx
web/src/app/home/home-header.tsx
web/src/app/home/home-static-sections.tsx
web/src/app/home/home.module.css

# 工作台外壳 / 导航 / 公告
web/src/components/layout/announcement-notification-center.tsx
web/src/components/layout/app-sidebar.tsx
web/src/components/layout/app-workspace-shell.tsx
web/src/components/layout/app-workspace-shell.test.ts
web/src/components/layout/client-root-init.tsx
web/src/components/layout/mobile-nav-drawer.tsx
web/src/components/layout/site-announcement-popup.tsx
web/src/components/layout/user-status-actions.tsx
web/src/constant/navigation-tools.ts
web/src/constant/navigation-tools.test.ts

# 登录 / 计费 / 账户
web/src/components/auth/auth-form.tsx
web/src/app/(user)/billing/billing-result-page.tsx
web/src/app/(user)/billing/page.tsx
web/src/app/(user)/billing/checkout/checkout-client.tsx
web/src/components/billing/billing-plan-grid.tsx
web/src/components/billing/billing-plan-grid.test.tsx
web/src/components/billing/billing-plans-modal.tsx
web/src/app/(user)/profile/page.tsx
web/src/app/(user)/profile/profile-elements.tsx
web/src/app/(user)/profile/use-profile-data.ts
web/src/app/(user)/profile/profile-account-security-layout.test.ts
web/src/app/(user)/profile/profile-community-layout.test.ts
web/src/app/(user)/profile/profile-coupon-pagination.test.ts

# 创作 / 画布 / 短剧
web/src/app/(user)/create/page.tsx
web/src/app/(user)/create/components/create-inspiration-gallery.tsx
web/src/app/(user)/create/components/create-workbench-overview.tsx
web/src/app/(user)/create/components/creative-asset-mention-picker.tsx
web/src/app/(user)/create/components/creative-assets-panel.tsx
web/src/app/(user)/create/components/creative-assets-panel.test.tsx
web/src/app/(user)/create/components/creative-composer.tsx
web/src/app/(user)/create/components/creative-composer-styles.test.ts
web/src/app/(user)/create/components/creative-conversation-list.tsx
web/src/app/(user)/create/components/creative-generation-controls.tsx
web/src/app/(user)/create/components/creative-messages.tsx
web/src/app/(user)/create/components/creative-messages.test.tsx
web/src/app/(user)/create/create-home-layout.test.ts
web/src/components/creative-composer-styles.ts
web/src/components/creative-generation-preferences.tsx
web/src/app/(user)/canvas/page.tsx
web/src/app/(user)/canvas/components/canvas-project-card.tsx
web/src/app/(user)/canvas/stores/use-canvas-store.ts
web/src/app/(user)/drama/page.tsx
web/src/app/(user)/drama/components/drama-project-card.tsx

# 词库 / 帖子
web/src/app/(user)/prompts/page.tsx
web/src/components/prompts/prompt-card.tsx
web/src/components/prompts/prompt-detail-dialog.tsx
web/src/components/my-prompts/my-prompts-page.tsx

# 全局样式 / 后台
web/src/app/styles/global-admin-controls.css
web/src/app/styles/global-auth.css
web/src/app/styles/global-hero.css
web/src/app/styles/global-scroll-utilities.css
web/src/components/admin/admin-configuration-sections.tsx
web/src/components/admin/admin-content-sections.tsx

# 工程
.env.example
.gitignore
CHANGELOG.md
web/scripts/run-app.mjs
```

---

## 9. 建议的合并顺序

1. **先合全局样式**：`global-surfaces.css`、`global-create-ambient.css` + `globals.css` 两行 import。合完先看首页/工作台是否仍正常，避免后面所有页面颜色都「不对但查不出原因」。
2. **再合后端/共享层**（第 2 节）：`smtp.ts`、email-code route、canvas 三个文件、site settings 四件套。合完先跑接口自测（见 10.1）。
3. **合路由与页面**：`/wallet`、`/about`、`/billing` 重定向、`/profile` 拆分、`/announcements`、`/prompts`、`/my-prompts`。
4. **合外壳与导航**：`navigation-tools.ts`、`app-sidebar`、`user-status-actions`、`app-workspace-shell`、公告组件。这一步冲突概率最高，建议以本仓库版本为准整体替换，再按目标项目补差异。
5. **合创作/画布/短剧**：注意 `use-canvas-store` 的 `hydrate(force, page, keyword)` 签名与 `createProject(title, { insertIntoList })` 新参数，调用方必须同步改。
6. **最后合后台表单与 `.env.example`**，补环境变量。

冲突高发文件（建议直接以本仓库为准，再人工补目标项目独有逻辑）：

```text
web/src/app/(user)/profile/page.tsx        （357 行 → 27 行，整页重写）
web/src/components/layout/app-sidebar.tsx
web/src/components/layout/user-status-actions.tsx
web/src/constant/navigation-tools.ts
web/src/app/home/*                          （导航、页脚、联系我们）
web/src/app/styles/global-*.css
web/src/components/billing/*
web/src/app/(user)/prompts/page.tsx
web/src/components/prompts/prompt-card.tsx
```

---

## 10. 验收清单

### 10.1 接口

```bash
# 1) 验证码：未配置邮件服务时应为 503，而不是 200「已发送」
curl -i -X POST http://127.0.0.1:3000/api/auth/email-code \
  -H 'Content-Type: application/json' \
  -d '{"purpose":"register","email":"merge-check@example.com"}'

# 2) 画布列表：带 keyword 时 total 应随之变化；项目对象应含 previews 字段
curl -s 'http://127.0.0.1:3000/api/canvas/projects?page=1&pageSize=2&keyword=Rain' -b '<session cookie>'

# 3) 公共设置：站点设置应包含 contactImageUrl
curl -s http://127.0.0.1:3000/api/auth/session -b '<session cookie>'
```

### 10.2 自动化

```bash
cd web
node --max-old-space-size=6144 ./node_modules/typescript/bin/tsc --noEmit
npx eslint .
npx vitest run     # 合并前基线：2747 passed / 9 skipped / 0 failed
```

### 10.3 手工用例（必须走一遍）

- 未配置邮件服务时点「获取验证码」：应提示「邮件服务尚未配置…」，不能出现「已发送」。
- 配置正确的 SMTP 后：注册 / 找回密码 / 修改邮箱三条链路都能收到验证码；错误授权码时提示里能看到 SMTP 原因。
- 登录后进入工作台：公告弹窗最多弹一次；关闭后站内跳转、刷新都不再弹；退出再登录会重新弹；营销页与登录页不弹。
- `/billing`、`/billing?product=<id>`、`/profile?section=billing`、`/wallet?section=billing` 四条旧地址都能落到正确页面（钱包 / 结算 / 弹窗），不再出现白页。
- 首页「联系我们」：后台填 `/contact-preview.jpg` 后弹窗显示 3:4 图片；清空后显示未配置提示。
- 画布库：搜索中文标题能过滤；封面只显示一张；无素材显示点阵；新建直接进编辑器。
- 钱包：余额卡、订单/积分切换；「立即充值」打开的套餐弹窗按后台已上架套餐渲染；结算页金额与套餐卡一致。
- 词库：分类/标签筛选、卡片详情弹窗固定高度、长文本「展开全部」后弹窗内滚动。
- 我的提示词：新建 → 列表刷新；删除有二次确认；清空后显示空态。
- 深色模式抽查：登录页、钱包、画布库、词库弹窗、公告页。

---

## 11. 已知风险与不一致（请勿忽略）

1. **品牌仍是混用状态**
   - 数据库站点标题当前为 `RainMind`（本地库实测），但代码默认值仍是 `VOZEB PRO`：`web/src/lib/site-brand.ts`、`web/src/lib/auth/store-foundation.ts`（含页脚版权）。
   - 结算页硬编码了 `RainMind`：`RainMind 安全结算`、`RAINMIND CHECKOUT`、`RainMind PASS`。
   - `web/public/logo.svg` 仍是 VOZEB PRO 的标志（`aria-label="VOZEB PRO logo"`）。
   - 合并到其他品牌时，需要统一这三处，否则会出现「标题 RainMind、版权 VOZEB PRO、Logo 另一个」的混搭。
2. **登录页默认加载第三方视频**
   - 默认值是 `v4-kling.kechuangai.com` 的 mp4。若目标环境不允许外链媒体，请改常量或设置 `NEXT_PUBLIC_AUTH_SHOWCASE_VIDEO_URL`，并重新构建。
3. **联系图片是「数据库设置 + 静态文件」两段式**
   - 本地库的 `site.contactImageUrl` 已设为 `/contact-preview.jpg`，该文件已随仓库提交。
   - 如果合并后沿用旧数据库，需要**在后台重新填一次**；如果沿用本仓库数据库，确保 `public/contact-preview.jpg` 一起合并。
4. **公共提示词图片代理不稳定（与本次改动无关）**
   - 本地实测 `/api/public/prompt-images` 偶发 `502 提示词图片加载失败`，或单张要 15 秒左右才返回（上游图源问题）。
   - 影响词库/我的提示词封面与详情弹窗预览；前端已有加载呼吸与「预览图加载失败」兜底，但验收时不要把它当成合并引入的 bug。
5. **`popupHome` 成为「只读兼容字段」**
   - 后台已无开关，弹窗逻辑不再读它；若目标项目仍有首页弹窗需求，需要单独恢复，不能只合前端。
6. **画布 `previews` 依赖 `project_json` 结构**
   - 只识别节点 `metadata.serverUrl / remoteUrl / content` 且 `status !== "error"` 的图片/视频；其他来源（如自定义字段）不会出现在封面里。
7. **`/profile` 与 `/wallet` 互相 302**
   - 若目标项目的 Nginx/CDN 对 302 做了缓存，改版后旧链接可能长期跳到旧地址；上线后建议清理一次缓存。

---

## 12. 回滚

- 本次无数据库迁移，回滚代码即可；新增的 `site.contactImageUrl` 字段留在 JSON 里不会影响旧代码（旧 normalizer 会忽略未知键）。
- 若只回滚前端，注意新前端写入的 `sessionStorage` 公告标记不影响旧代码。
- 回滚点：`rainmind/main`（`6e23dee`）为合并前基线；本次改动全部在 `6e23dee..4d61d26`。
