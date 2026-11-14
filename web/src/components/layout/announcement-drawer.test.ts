import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const center = () => readFile(resolve(process.cwd(), "src/components/layout/announcement-notification-center.tsx"), "utf8");
const popup = () => readFile(resolve(process.cwd(), "src/components/layout/site-announcement-popup.tsx"), "utf8");
const marquee = () => readFile(resolve(process.cwd(), "src/components/layout/announcement-marquee.tsx"), "utf8");
const glyph = () => readFile(resolve(process.cwd(), "src/components/layout/announcement-glyph.tsx"), "utf8");
const styles = () => readFile(resolve(process.cwd(), "src/app/styles/global-surfaces.css"), "utf8");

describe("announcement panels open from the right, like Jimeng's 消息中心", () => {
    it("turns the notification center from a centered modal into a right drawer", async () => {
        const tsx = await center();

        expect(tsx).toContain('import { Drawer } from "antd";');
        expect(tsx).toContain('placement="right"');
        expect(tsx).toContain('rootClassName="announcement-drawer"');
        expect(tsx).toContain("closable={false}");
        expect(tsx).not.toContain("<Modal");
        expect(tsx).not.toContain("centered");
        // 面板撑满抽屉高度，左侧页面仍可见
        expect(tsx).toContain('className="flex h-full min-h-0 w-full flex-col');
    });

    it("uses the Jimeng-style minimal header, tabs and message rows", async () => {
        const tsx = await center();

        expect(tsx).toContain("消息中心");
        expect(tsx).toContain("官方消息");
        expect(tsx).toContain("互动");
        expect(tsx).toContain('className="mx-3 mt-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl');
        expect(tsx).toContain("shadow-[0_1px_3px_rgba(17,20,28,0.12)]");
        // 每条消息一枚圆形冷蓝图标；未读不再是一枚小圆点
        expect(tsx).toContain("function MessageIcon");
        expect(tsx).toContain("rounded-full");
        expect(tsx).not.toContain("absolute left-4 top-[19px]");
        expect(tsx).toContain("line-clamp-2");
        expect(tsx).toContain('href="/announcements"');
    });

    it("moves the auto announcement popup to the same right drawer", async () => {
        const tsx = await popup();

        expect(tsx).toContain('import { Button, Drawer } from "antd";');
        expect(tsx).toContain('placement="right"');
        expect(tsx).toContain('rootClassName="announcement-drawer"');
        expect(tsx).not.toContain("<Modal");
        expect(tsx).toContain("站点公告");
        expect(tsx).toContain("关闭站点公告");
        expect(tsx).toContain("查看全部公告");
    });

    it("floats as a card: space above the notice bar, space below the window, rounded all round", async () => {
        const css = await styles();

        // 上边避开顶部渐变通知栏并留空隙、右边和底边同样留白，不再是顶天立地的一竖条
        expect(css).toContain("--announcement-drawer-top: 116px;");
        expect(css).toContain("--announcement-drawer-right: 16px;");
        expect(css).toContain("--announcement-drawer-bottom: 32px;");
        expect(css).toContain("top: var(--announcement-drawer-top) !important;");
        expect(css).toContain("right: var(--announcement-drawer-right) !important;");
        expect(css).toContain("bottom: var(--announcement-drawer-bottom) !important;");
        expect(css).toContain("height: auto !important;");
        expect(css).toContain("border-radius: 16px;");
        expect(css).not.toContain("border-radius: 16px 0 0 16px;");
        expect(css).toContain("@media (max-width: 640px)");
        // 遮罩仍是双主题各一份，且几乎不压暗左侧页面
        expect(css).toContain("--announcement-drawer-mask: rgba(17, 20, 28, 0.06);");
        expect(css).toContain("--announcement-drawer-mask: rgba(0, 0, 0, 0.3);");
        expect(css).toContain(".announcement-drawer .ant-drawer-mask {");
        expect(css).toContain("background: var(--announcement-drawer-mask) !important;");
        expect(css).toContain(".dark .announcement-drawer .ant-drawer-content-wrapper");
    });

    it("slims both drawers down with one shared width token", async () => {
        const [tsx, popupTsx, css] = await Promise.all([center(), popup(), styles()]);

        // 原来 400 / 380 的一整块「厚板」收成 340，两个抽屉共用同一个令牌
        expect(css).toContain("--announcement-drawer-width: 340px;");
        for (const source of [tsx, popupTsx]) {
            expect(source).toContain("var(--announcement-drawer-width)");
            expect(source).not.toContain("380px");
            expect(source).not.toContain("400px");
        }
        // 内边距同步收紧，窄面板才不会显得挤
        expect(tsx).toContain('className="mx-3 mt-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl');
        expect(tsx).toContain("px-3 py-3 text-left");
        expect(popupTsx).toContain("px-4 py-4");
        // 窄屏仍是扣掉两侧留白的近全宽
        expect(css).toContain("width: calc(100vw - 20px) !important;");
    });

    it("keeps the geometry in CSS only, so both drawers share it", async () => {
        const [tsx, popupTsx] = await Promise.all([center(), popup()]);

        for (const source of [tsx, popupTsx]) {
            expect(source).toContain('rootClassName="announcement-drawer"');
            // inline 只写左侧圆角会盖掉 CSS 的四角圆角，必须删掉
            expect(source).not.toContain('borderRadius: "16px 0 0 16px"');
        }
    });

    it("replaces the stock megaphone with a custom gradient mark everywhere", async () => {
        const [tsx, popupTsx, marqueeTsx, glyphTsx, css] = await Promise.all([center(), popup(), marquee(), glyph(), styles()]);

        for (const source of [tsx, popupTsx, marqueeTsx]) {
            expect(source).not.toContain("Megaphone");
        }
        expect(tsx).toContain("AnnouncementGlyph");
        expect(popupTsx).toContain("AnnouncementGlyph");
        expect(marqueeTsx).toContain("AnnouncementChipGlyph");
        // 渐变 id 必须唯一，列表里每条一枚才不会互相抢 defs
        expect(glyphTsx).toContain("useId()");
        expect(glyphTsx).toContain("linearGradient");
        expect(glyphTsx).toContain("#e2671f");
        expect(css).toContain(".announcement-glyph-chip--brand");
        expect(css).toContain(".dark .announcement-glyph-chip--brand");
    });

    it("slides in fast and smooth, and honours reduced motion", async () => {
        const css = await styles();

        expect(css).toContain("--announcement-drawer-duration: 220ms;");
        expect(css).toContain("--announcement-drawer-ease: cubic-bezier(0.16, 1, 0.3, 1);");
        // 只过渡 transform / opacity，不用 antd 的 transition: all 0.3s
        expect(css).toContain("transform var(--announcement-drawer-duration) var(--announcement-drawer-ease)");
        expect(css).toContain("will-change: transform;");
        // 只改 antd 的过渡曲线，不额外接管 motion 类（会和它抢 transform、动画冻结）
        expect(css).not.toContain("announcement-drawer-in");
        expect(css).toContain("animation: announcement-panel-reveal 220ms");
        expect(css).toContain(".announcement-drawer.ant-drawer-open .ant-drawer-body > section");
        expect(css).toContain("prefers-reduced-motion: reduce");
        expect(css).toContain("transition-duration: 0.01ms !important;");
    });

    it("pre-renders both panels so the first click is not blocked by mounting", async () => {
        const [tsx, popupTsx] = await Promise.all([center(), popup()]);

        for (const source of [tsx, popupTsx]) {
            // 只在客户端就绪后预渲染：SSR 输出抽屉 DOM 会引发 hydration mismatch
            expect(source).toContain("forceRender={clientReady}");
            expect(source).toContain("useEffect(() => setClientReady(true), [])");
            // 每次关闭就销毁 = 每次打开都重新挂载，滑入会被 200ms+ 的渲染堵住
            expect(source).not.toContain("destroyOnHidden");
        }
    });
});
