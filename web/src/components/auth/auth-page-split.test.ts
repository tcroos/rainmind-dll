import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("login page split layout", () => {
    it("splits the auth card into a video column and a form column", async () => {
        const [authForm, showcase] = await Promise.all([read("src/components/auth/auth-form.tsx"), read("src/components/auth/auth-showcase-video.tsx")]);

        expect(authForm).toContain("AuthShowcaseVideo");
        expect(authForm).toContain('className="auth-page-card"');
        expect(authForm).toContain('className="auth-page-card-content"');
        // 视频必须是卡片的第一个子节点，表单在它后面，才能形成左视频 / 右表单
        expect(authForm.indexOf("<AuthShowcaseVideo />")).toBeLessThan(authForm.indexOf('className="auth-page-card-content"'));

        expect(showcase).toContain('data-testid="auth-showcase-video"');
        expect(showcase).toContain("autoPlay");
        expect(showcase).toContain("muted");
        expect(showcase).toContain("loop");
        expect(showcase).toContain("playsInline");
        expect(showcase).toContain("preload=");
        // 缓存命中时 loadeddata 可能早于 hydration，必须用 readyState 兜底，否则视频一直透明
        expect(showcase).toContain("readyState >= 2");
        expect(showcase).toContain("prefers-reduced-motion");
    });

    it("fills the viewport instead of floating a centred card on a grey page", async () => {
        const [authForm, css] = await Promise.all([read("src/components/auth/auth-form.tsx"), read("src/app/styles/global-auth.css")]);

        // main 不再做 flex 居中，卡片自己占满一屏
        expect(authForm).not.toContain("flex items-center justify-center px-4 py-8");
        expect(css).toContain("min-height: 100dvh;");
        expect(css).toContain("grid-template-columns: minmax(0, 55%) minmax(0, 45%)");
        // 圆角、描边、阴影都去掉：满屏设计不该再读成「浮起来的卡片」
        const cardRule = css.slice(css.indexOf(".auth-page-card {"), css.indexOf(".dark .auth-page-card"));
        expect(cardRule).not.toContain("border-radius");
        expect(cardRule).not.toContain("box-shadow");
        expect(cardRule).not.toContain("border:");
        expect(css).not.toContain("minmax(0, 420px) minmax(0, 1fr)");
        // 卡片自己不能留内边距，否则视频贴不到边
        expect(css).toContain("padding: 0;");
    });

    it("centres the auth component with a sensible width and padding", async () => {
        const [authForm, css] = await Promise.all([read("src/components/auth/auth-form.tsx"), read("src/app/styles/global-auth.css")]);

        // 登录组件包在 auth-page-card-inner 里，由它限宽并居中
        expect(authForm).toContain('className="auth-page-card-inner"');
        expect(css).toContain(".auth-page-card-inner {");
        expect(css).toContain("margin: auto;");
        expect(css).toContain("max-width: 384px;");
        // 右栏内边距随视口伸缩，不是一档写死
        expect(css).toContain("padding: clamp(32px, 6vh, 72px) clamp(24px, 5vw, 64px);");
        // 返回入口钉在右栏右上角，不再是卡片下方的一行小字
        expect(css).toContain(".auth-page-back {");
        expect(css).toContain("position: absolute;");
        expect(css).toContain("right: clamp(14px, 2.4vw, 28px);");
        expect(css).toContain("top: clamp(12px, 2.2vh, 24px);");
    });

    it("keeps the video covering its column and collapses to one column on narrow screens", async () => {
        const css = await read("src/app/styles/global-auth.css");

        expect(css).toContain("object-fit: cover");
        expect(css).toContain(".auth-split-video");
        expect(css).toContain("max-width: 1023px");
        // 卡片自己不能留内边距，否则视频贴不到边
        expect(css).toContain("padding: 0;");
        // 窄屏只剩表单列，且再补一档更窄屏的内边距
        expect(css).toContain("grid-template-columns: minmax(0, 1fr);");
        expect(css).toContain("max-width: 640px");
    });

    it("gives the forgot-password page the same full-screen split", async () => {
        const page = await read("src/app/forgot-password/page.tsx");

        // 找回密码曾经自己套 .auth-page-card 但没有视频列，网格直接把内容劈成两半
        expect(page).toContain("AuthShowcaseVideo");
        expect(page).toContain('className="auth-page-card-content"');
        expect(page).toContain('className="auth-page-card-inner"');
        expect(page.indexOf("<AuthShowcaseVideo />")).toBeLessThan(page.indexOf('className="auth-page-card-content"'));
    });

    it("keeps auth links readable in dark mode despite antd's unlayered anchor rule", async () => {
        const css = await read("src/app/styles/global-auth.css");

        // antd 给所有 <a> 注入无层级 color，层级里的 dark:text-white 会全部输掉；
        // 这些规则必须写在 @layer 之外才压得回去
        const layerStart = css.indexOf("@layer utilities {");
        const layerEnd = css.indexOf("/* ── 首屏登录弹窗");
        const outside = css.slice(layerEnd);
        expect(layerStart).toBeGreaterThan(-1);
        expect(outside).toContain(".auth-page-card .auth-switch-link a,");
        expect(outside).toContain(".dark .auth-page-card .auth-switch-link a,");
        expect(outside).toContain(".auth-page-card .auth-page-back {");
        expect(outside).toContain(".dark .auth-page-card .auth-page-back {");
    });

    it("uses the brand name as the heading with a plain sign-in hint", async () => {
        const authForm = await read("src/components/auth/auth-form.tsx");

        // 标准做法：品牌名做主标题 + 一句说明「这一步要做什么」的提示语。
        // 旧的「继续你的电商、短剧、美颜与画布创作」是营销文案，放在登录框里很突兀。
        expect(authForm).toContain("`登录 ${site.title}`");
        expect(authForm).toContain("`注册 ${site.title}`");
        expect(authForm).toContain("欢迎回来，请输入账号信息以继续。");
        expect(authForm).not.toContain("继续你的电商、短剧、美颜与画布创作");
        expect(authForm).not.toContain("保存项目、提示词与常用风格。");
    });

    it("neutralises Chrome's autofill blue strip on every auth input", async () => {
        const css = await read("src/app/styles/global-auth.css");

        // 蓝底是 UA 注入的 :-webkit-autofill 背景，只刷在 input 上、刷不到 affix-wrapper；
        // 必须用 inset box-shadow 重新刷成面板底色，且放在 @layer 之外。
        const layerEnd = css.indexOf("/* ── 首屏登录弹窗");
        const outside = css.slice(layerEnd);
        expect(outside).toContain("input:-webkit-autofill");
        expect(outside).toContain("0 0 0 1000px var(--auth-autofill-surface, #ffffff) inset");
        expect(outside).toContain("-webkit-text-fill-color: #111111;");
        expect(outside).toContain("transition: background-color 9999s ease-out 0s;");
        // 深色态与登录弹窗各自的底色都要覆盖，否则会刷出一条白/黑条
        expect(outside).toContain("--auth-autofill-surface: #1c1c1c;");
        expect(outside).toContain(".ant-modal.landing-auth-modal .auth-panel input:-webkit-autofill");
    });

    it("drops the optional nickname and verifies the repeated password", async () => {
        const authForm = await read("src/components/auth/auth-form.tsx");

        // 注册不再收集昵称，显示名由用户名承担
        expect(authForm).not.toContain("昵称（选填）");
        expect(authForm).not.toContain("displayName");
        // 注册增加二次密码输入，提交前校验一致
        expect(authForm).toContain("确认密码");
        expect(authForm).toContain("confirmPassword");
        expect(authForm).toContain("两次输入的密码不一致");
        expect(authForm).toContain("请先阅读并同意服务条款和隐私政策");
        // 协议未勾选不再把按钮灰掉，改为点击时提示
        expect(authForm).toContain("disabled={disabled || !installTokenReady}");
    });

    it("keeps auth inputs at 46px with centred 14px text", async () => {
        const css = await read("src/app/styles/global-auth.css");

        // wrapper 负责 46px，input 只占 22px 行高；字号必须带 !important，
        // 否则 antd 无层级的 .ant-input-lg { font-size: 16px } 会压回来。
        expect(css).toContain(".auth-page-card .ant-input-affix-wrapper {");
        expect(css).toContain("height: 46px;");
        expect(css).toContain("font-size: 14px !important;");
        expect(css).toContain(".auth-page-card .ant-input-affix-wrapper .ant-input {");
        expect(css).toContain("height: 22px;");
    });

    it("exposes a replaceable video link", async () => {
        const config = await read("src/lib/auth-showcase.ts");
        expect(config).toContain("NEXT_PUBLIC_AUTH_SHOWCASE_VIDEO_URL");
        expect(config).toMatch(/DEFAULT_AUTH_SHOWCASE_VIDEO_URL = "https?:\/\//);
    });
});
