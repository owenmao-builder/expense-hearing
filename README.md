# 费用会审室 · Expense Hearing

四个角色会审一句话经营解释，用证据把结论改掉。

[在线体验（无需登录）](https://owenmao-builder.github.io/expense-hearing/) · [MIT License](LICENSE) · [GitHub 仓库](https://github.com/owenmao-builder/expense-hearing)

两个可点击、可重放的合成费用会审案件。四个 Bot 是固定协作角色，发言由剧本驱动；未连接 ERP、Grok 或模型服务。

## 演示

- 点击「开始会审」，每案约 40 秒，完成后自动打开结论卡。
- 「暂停」冻结播放与打字；「单步」完整显示下一条发言；「重放」从当前案件重新开始。
- 原始材料随节拍解锁，点击可查看内容和审批状态。
- 切换案件或刷新页面会重置进度，不使用数据库或浏览器持久存储。
- 手机显示顶部案件切换，金额与材料在记录上方，底部固定播放按钮。

CASE 01：广告差异 3 万、软件差异 17 万；取得 7 万分摊批准单后，销售管理实际 113 万、超支 13 万，客服 7 万，公司本案费用池仍为 120 万。

CASE 02：账面预算 80 万、实际 72 万；18 万跨期仅有未签字草稿，按本演示的固定管理规则恢复至 8 月，管理实际 90 万、超支 10 万；本案全年费用池仍为 90 万。

「公司合计」仅指本案合成费用池；其他部门、月份不在数据范围。期间归属规则是验收剧本规则，并非完整会计政策判断。结论均标注待人工确认。

## 本地运行

需要 Node.js 22.13+。

```sh
git clone https://github.com/owenmao-builder/expense-hearing.git
cd expense-hearing
npm ci
npm run dev
```

打开终端显示的本地地址。支持 `?case=01` 或 `?case=02`。

```sh
npm run typecheck
npm test
npm run build
```

## 实现

- React / TypeScript / Zustand：所有案件与播放状态在内存中。
- `lib/hearing/ledger.ts`：整数分运算、账面深冻结、批准件校验、零和勾稽。
- `lib/hearing/cases.ts`：原始合成证据、固定规则和带版本号的剧本。
- `lib/hearing/machine.ts`：从播放头重建案件状态，从状态派生结论；相同证据包与剧本的序列化结果一致。
- `lib/hearing/store.ts`：播放、暂停、单步、重放、切案。
- `app/page.tsx`：页面、材料详情与结论卡；尊重减少动效设置。
- `tests/invariants.ts`：拒绝非法调整、账面不可变、跨期守恒、补查上限、重放幂等及播放状态验证。

WebMCP 为渐进增强，在浏览器支持 `document.modelContext` 时注册只读与播放控制工具；不影响普通浏览器使用。

## 开源与部署

采用 [MIT 许可证](LICENSE)。允许使用、修改和再分发；第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。欢迎通过 Issue 反馈或提交 Pull Request。

无需 API Key、账号或数据库即可本地运行。公开版本的 `.openai/hosting.json` 仅保留通用绑定配置，不包含作者的站点标识。`npm run build` 生成 Cloudflare Workers 兼容产物，可用 `npm run start` 在本地预览生产构建。

[在线演示](https://owenmao-builder.github.io/expense-hearing/) 已开放公开访问，打开即可进入费用会审室，无需 ChatGPT 账号或登录。可直接分享演示链接，也可分享本仓库源码链接。

GitHub Pages 从 `main` 分支通过 GitHub Actions 自动发布。每次推送先检查类型、金额与状态测试，再构建静态页面并部署。`npm run build:pages` 将导出含 `/expense-hearing` 路径前缀的页面到 `out/`，无需服务器或登录服务。
