# 钓鱼服务平台 · 前端

> 基于 uni-app 的跨端应用，一套代码同时支持 H5 / 微信小程序 / App。

在线体验（H5）：**http://114.132.247.207**

后端仓库：[fishinglab_backend](https://github.com/Karvin-k/fishinglab_backend)

---

## 技术栈

| 项 | 说明 |
|---|---|
| 框架 | uni-app（Vue 2） |
| UI 库 | uView UI 1.8.4 |
| 状态管理 | Vuex（登录态、用户信息） |
| 请求封装 | 自写 `common/request.js`（自动带 token + 401 自动刷新） |
| 打包目标 | H5（当前部署形态）/ 微信小程序 / App |

---

## 页面结构（49 个页面）

```
pages/
├── home/            首页（轮播、排行榜、热门钓场、热销商品、社区动态）
├── shop/            商城（列表、详情、搜索、钓场详情、订单、评价）
├── cart/            购物车（含搜索）
├── social/          社区（信息流、发帖、帖子详情、个人主页）
├── chat/            聊天
├── mine/            个人中心（资料、余额、优惠券、收藏、订单、通知）
├── merchant/        商家端（入驻、商品管理、钓场管理、店铺编辑）
├── admin/           后台管理（登录、数据看板）
├── login/           登录、注册
└── dynamicRank/     排行榜
```

---

## 本地运行

需要 **HBuilderX**。

1. 打开项目目录
2. 菜单 **运行 → 运行到浏览器**
3. 默认跑在 `http://localhost:8080`

后端地址在 `common/config.js` 里配置：

```js
// 本地开发 -> http://localhost:5000
// 线上      -> 自动使用当前访问域名（同源）
export const BASE_URL = resolveBaseUrl();
```

**这个文件会自动判断环境**：访问 `localhost` 走本地后端，访问其它地址则用 `window.location.origin`，所以部署时不用改代码。

---

## 打包 H5

1. HBuilderX 菜单 **发行 → 网站-H5手机版**
2. 产物在 `unpackage/dist/build/web`
3. 整个目录丢到 Nginx 的站点根目录即可

---

## H5 在电脑浏览器上的适配

uni-app 默认按手机屏幕设计（`rpx` 单位按屏宽换算），直接跑在电脑上所有元素会被放大 2.5 倍。

做了两层处理：

**① `manifest.json` 限制 rpx 换算基准**

```json
"h5": {
    "rpxCalcMaxDeviceWidth": 750,
    "rpxCalcBaseDeviceWidth": 750
}
```

屏幕宽度超过 750px 时，按 `1rpx = 1px` 换算。

**② `App.vue` 里把页面限制成 750px 居中**

```css
@media screen and (min-width: 751px) {
  uni-app { max-width: 750px; margin: 0 auto; }

  /* 所有 position:fixed 的元素也要跟着收进来 */
  uni-tabbar, .uni-tabbar, .u-navbar, .u-navbar-fixed,
  .custom-navbar, .cart-footer, .footer {
    left: 0 !important; right: 0 !important;
    margin-left: auto !important; margin-right: auto !important;
    max-width: 750px !important;
  }
}
```

**一个坑**：`position: fixed` 的元素不会跟着父容器的 `max-width` 走，必须逐个限制宽度。而且 `uni-tabbar` 真正 fixed 的是**内部那层 `.uni-tabbar`**，只写元素选择器管不到。

---

## 与后端联调的接口约定

| 项 | 约定 |
|---|---|
| 前缀 | 全部接口以 `/api` 开头 |
| 鉴权 | 请求头 `Authorization: Bearer <token>` |
| 成功响应 | `{ "code": 0, "data": ... }` |
| 失败响应 | `{ "code": 4xx, "message": "..." }` |
| Token 失效 | 401 → 用 refresh_token 换新 token → 重放原请求 |

图片字段由后端返回**完整 URL**，前端用 `uni.$imgUrl()` 做兜底（已是 http 开头就原样返回，避免拼接两次）。
