import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = () => readFile(resolve(process.cwd(), "src/components/layout/announcement-marquee.tsx"), "utf8");
const styles = () => readFile(resolve(process.cwd(), "src/app/styles/global-surfaces.css"), "utf8");
const dismiss = () => readFile(resolve(process.cwd(), "src/lib/announcement-dismiss.ts"), "utf8");
const authForm = () => readFile(resolve(process.cwd(), "src/components/auth/auth-form.tsx"), "utf8");
const sessionReset = () => readFile(resolve(process.cwd(), "src/lib/client-session-reset.ts"), "utf8");
const popup = () => readFile(resolve(process.cwd(), "src/components/layout/site-announcement-popup.tsx"), "utf8");

describe("site announcement bar", () => {
    it("paints a brand gradient in both themes instead of a flat black band", async () => {
        const [tsx, css] = await Promise.all([component(), styles()]);

        // 即梦那条：左端品牌橙 → 中间近白 → 右端青蓝
        expect(css).toContain("linear-gradient(90deg, #f5823c 0%, #ffd9bd 32%, #e6f4f9 62%, #66b9dc 100%)");
        expect(css).toContain(".dark .announcement-marquee {");
        expect(css).toContain("linear-gradient(90deg, #8c3f18 0%, #6d4a3a 34%");
        // 纯黑带不许回来
        expect(tsx).not.toContain("bg-[#18181b]");
        expect(tsx).not.toContain("dark:bg-[#1c1c1c]");
        expect(css).toContain("color: var(--ink-1);");
        // 字号放大后条高跟着从 28px 抬到 36px
        expect(tsx).toContain("h-9");
    });

    it("switches announcements vertically, one line at a time", async () => {
        const [tsx, css] = await Promise.all([component(), styles()]);

        // keyframes 按条数动态生成：每条先停留再上滑一格，末尾接第一条副本做无缝回绕
        expect(tsx).toContain("announcement-vertical-scroll");
        expect(tsx).toContain("translateY(-${(index + 1) * ITEM_HEIGHT}px)");
        expect(tsx).toContain("const ITEM_HEIGHT = 36;");
        expect(tsx).toContain("const items = rotating ? [...messages, messages[0]] : messages;");
        expect(tsx).toContain("announcement-marquee-track--rotating");
        // 一条公告时不轮播
        expect(tsx).toContain("const rotating = messages.length > 1;");

        expect(css).toContain("flex-direction: column;");
        expect(css).toContain("height: 36px;");
        expect(css).not.toContain("translate3d(-50%");
        // 悬停暂停 + 尊重减少动态效果
        expect(css).toContain("animation-play-state: paused");
        expect(css).toContain("prefers-reduced-motion");
    });

    it("keeps the whole bar clickable to the announcement center", async () => {
        const [tsx, css] = await Promise.all([component(), styles()]);

        // 横幅是容器，里面一枚铺满的 Link：点渐变空白处、文字、模板块都能跳；
        // 右端那枚 × 是 Link 的同级兄弟，不能嵌进 <a> 里造成非法交互嵌套
        expect(tsx).toContain('<div className="announcement-marquee relative z-40 flex h-9');
        expect(tsx).toContain('href="/announcements"');
        expect(tsx).toContain('aria-label="站点公告，点击进入公告中心"');
        expect(tsx).toContain('className="relative flex min-w-0 flex-1 items-center"');
        expect(tsx).toContain("</Link>");
        expect(tsx.indexOf("</Link>")).toBeLessThan(tsx.indexOf("announcement-marquee-close"));
        expect(tsx).not.toContain("查看全部");
        expect(tsx).not.toContain("announcement-marquee-link");
        expect(tsx).not.toContain("announcement-marquee-badge");
        expect(css).not.toContain("announcement-marquee-badge");
        expect(css).not.toContain(".announcement-marquee-link");
        expect(css).toContain("text-decoration: none;");
    });

    it("lets the user close the bar with a small white × until new announcements arrive", async () => {
        const [tsx, css] = await Promise.all([component(), styles()]);

        expect(tsx).toContain('import { ChevronRight, X } from "lucide-react";');
        expect(tsx).toContain('aria-label="关闭顶部公告"');
        expect(tsx).toContain('className="announcement-marquee-close"');
        expect(tsx).toContain('title="关闭公告"');
        expect(tsx).toContain("strokeWidth={1.8}");
        // 按当前生效公告的 id 签名记录：换新公告时签名变化，横幅重新出现
        expect(tsx).toContain("dismissedSignature === signature");
        expect(tsx).toContain("readBarDismissSignature");
        expect(tsx).toContain("writeBarDismissSignature");
        // 关闭状态绝不能再写进 localStorage（跨账号、跨浏览器会话永久生效）
        expect(tsx).not.toContain("window.localStorage");
        // 细小白色 × 绝对定位、不占 flex 空间，中间那行字仍相对整条居中
        expect(css).toContain(".announcement-marquee-close {");
        expect(css).toContain("position: absolute;");
        expect(css).toContain("color: #fff;");
        expect(css).toContain("width: 13px;");
        expect(css).toContain("filter: drop-shadow");
        // 关掉横幅后页头会上移 36px，抽屉顶边跟着抬，避免留下一大截空白
        expect(tsx).toContain("announcement-bar-dismissed");
        expect(tsx).toContain("document.documentElement.classList.toggle");
        expect(css).toContain("html.announcement-bar-dismissed");
        expect(css).toContain("--announcement-drawer-top: 80px;");
        // 窄屏文字会铺满，左右对称留白避免省略号贴住 ×
        expect(css).toContain("padding-inline: 22px;");
    });

    it("centers each line, enlarges the text and keeps no leading bullet", async () => {
        const [tsx, css] = await Promise.all([component(), styles()]);

        expect(css).toContain("justify-content: center;");
        expect(css).toContain("text-align: center;");
        expect(css).toContain("font-size: 14px;");
        expect(css).not.toContain("announcement-marquee-dot");
        expect(tsx).not.toContain("announcement-marquee-dot");
        expect(tsx).not.toContain("rounded-full bg-white/45");
    });

    it("scrolls several template chips together with each line", async () => {
        const [tsx, css] = await Promise.all([component(), styles()]);

        // 三/四套模板按序轮换，方块挂在 .announcement-marquee-item 里随轨道一起位移
        expect(tsx).toContain("const TEMPLATES:");
        expect(tsx).toContain("TEMPLATES[index % TEMPLATES.length]");
        expect(tsx).toContain("announcement-marquee-chips");
        expect(tsx).toContain("announcement-marquee-chip");
        expect(tsx).toContain("announcement-marquee-arrow");
        expect(tsx).toContain("className=\"announcement-marquee-item\"");
        expect(css).toContain(".announcement-marquee-chip {");
        expect(css).toContain(".announcement-marquee-chips--cool");
        expect(css).toContain(".dark .announcement-marquee-chip");
        // 方块里换成统一的抽象几何，不许再塞默认线性小喇叭
        expect(tsx).toContain("AnnouncementChipGlyph");
        expect(tsx).toContain("template.variants.map");
        expect(tsx).not.toContain("template.icons");
        expect(tsx).not.toContain("Megaphone");
        expect(css).toContain("linear-gradient(160deg, rgba(255, 255, 255, 0.97)");
    });

    it("keeps the close state only for the current tab and resets it on every login", async () => {
        const [helper, form, reset, popupTsx, tsx] = await Promise.all([dismiss(), authForm(), sessionReset(), popup(), component()]);

        // sessionStorage：刷新 / 站内跳转仍关闭，关掉标签页重开就重新出现
        expect(helper).toContain("window[kind]");
        expect(helper).toContain('readBarDismissSignature(): string | null');
        expect(helper).toContain('storage("sessionStorage")?.setItem(ANNOUNCEMENT_BAR_DISMISS_KEY, signature)');
        expect(helper).toContain("export function clearAnnouncementDismissState()");
        // 旧版 localStorage 的永久关闭标记要在读取 / 清空时一并抹掉
        expect(helper).toContain('storage("localStorage")?.removeItem(ANNOUNCEMENT_BAR_DISMISS_KEY)');
        expect(helper).toContain('removeMatching(storage("localStorage"), isAnnouncementKey)');

        // 登录成功与退出登录都清空：换账号登录也能重新看到公告
        expect(form).toContain("clearAnnouncementDismissState();");
        expect(reset).toContain("clearAnnouncementDismissState();");

        // 登录后公告弹窗走同一套会话级关闭状态，不再用 localStorage
        expect(popupTsx).toContain("isPopupDismissed");
        expect(popupTsx).toContain("markPopupDismissed");
        expect(popupTsx).not.toContain("localStorage");
        expect(tsx).toContain("useState<string | null>(() => readBarDismissSignature())");
    });
});
