import type { Metadata } from "next";
import "./globals.css";
const basePath = process.env.GITHUB_PAGES === "true" ? "/expense-hearing" : "";
export const metadata: Metadata = {
  title: "费用会审室 · 用证据把结论改掉",
  description: "四个角色会审一句话经营解释。可交互的费用会审演示，使用合成数据，未连接 Grok。",
  icons: { icon: `${basePath}/favicon.svg`, shortcut: `${basePath}/favicon.svg` },
};
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
 return <html lang="zh-CN"><body>{children}</body></html>;
}
