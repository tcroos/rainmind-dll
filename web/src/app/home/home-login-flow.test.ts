import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("marketing page login flow", () => {
    it("sends every account-only entry to the full login page with its original destination", async () => {
        const actions = await read("src/app/home/home-actions.tsx");

        // 不再弹营销页自己的登录框，统一整页登录；next 带上原目标，
        // hero 里输入的 prompt、短剧/结账页这些入口才不会丢。
        expect(actions).toContain("router.push(`/login?next=${encodeURIComponent(nextPath)}`)");
        expect(actions).toContain("if (authenticated) router.push(path)");
        expect(actions).toContain("else openLogin(path)");
        expect(actions).not.toContain("landing-auth-modal");
        expect(actions).not.toContain("<AuthForm");
        expect(actions).not.toContain("authOpen");
        expect(actions).not.toContain("setAuthNextPath");
        // 首屏不该再为登录弹窗拉进 AuthForm / antd Modal
        expect(actions).not.toContain('from "antd"');
    });

    it("keeps the plans modal but routes checkout through login when signed out", async () => {
        const actions = await read("src/app/home/home-actions.tsx");

        expect(actions).toContain("<BillingPlansModal");
        expect(actions).toContain("openProtectedPath(`/billing/checkout?product=${encodeURIComponent(product.id)}`)");
    });

    it("restores the brand mark and keeps one solid CTA in the header", async () => {
        const header = await read("src/app/home/home-header.tsx");

        // 左上角恢复品牌图标，与字标一起出现
        expect(header).toContain("<SiteLogo");
        expect(header).toContain("site.logoUrl");
        // 未登录：文字「登录」回首页 + 实心「开始创作」带 next=/create
        expect(header).toContain('openLogin("/")');
        expect(header).toMatch(/>\s*登录\s*<\/button>/);
        expect(header).toContain("开始创作");
        // 已登录：同一位置只留「进入工作台」
        expect(header).toContain("进入工作台");
        expect(header).toContain("openContact");
        expect(header).toContain('openProtectedPath("/create")');
        expect(header).not.toContain("立即体验");
    });

    it("hides the scroll cue and narrows the header without darkening its border", async () => {
        const hero = await read("src/app/home/home-agent-hero.tsx");
        expect(hero).not.toContain("SCROLL");
        expect(hero).not.toContain("heroCue");

        const css = await read("src/app/home/home.module.css");
        const scrolledStart = css.indexOf(".headerScrolled .headerInner");
        const scrolledBlock = css.slice(scrolledStart, css.indexOf(":global(.dark) .headerScrolled .headerInner"));
        // 滚动后胶囊收窄，但不再覆盖边框颜色（之前 ×140% 会被读成一条黑边）
        expect(scrolledBlock).toContain("max-width: 880px");
        expect(scrolledBlock).not.toContain("border-color");
    });

    it("keeps only API service and contact in the header", async () => {
        const [data, footer] = await Promise.all([read("src/app/home/home-data.ts"), read("src/app/home/home-footer.tsx")]);

        expect(data).toContain('{ label: "API 服务", href: "https://api.rainmind.net/", action: "external" }');
        expect(data).toContain('{ label: "联系我们", href: "#contact", action: "contact" }');
        // 顶部只剩两个对外栏目：作品、定价、关于都不在头部
        expect(data).not.toContain('{ label: "作品"');
        expect(data).not.toContain('{ label: "定价"');
        expect(data).not.toContain('{ label: "关于"');
        expect(data).not.toContain('{ label: "API",');
        expect(data).not.toContain('{ label: "联系",');
        expect(data).not.toContain('label: "AI 创作"');
        expect(data).not.toContain('label: "短剧制作"');
        // 页脚仍保留作品广场、定价与关于入口
        expect(footer).toContain('{ label: "作品广场", href: "/gallery", action: "link" }');
        expect(footer).toContain('{ label: "定价", href: "/billing", action: "billing" }');
        expect(footer).toContain('{ label: "关于", href: "/about", action: "link" }');

        const header = await read("src/app/home/home-header.tsx");
        expect(header).toContain("styles.headerRight");
        expect(header).toContain('target="_blank"');

        // 「关于」是公开页，访客点进来不能被 (user) 布局踢回登录页
        const about = await read("src/app/about/page.tsx");
        expect(about).toContain("export default async function AboutPage");
        expect(about).toContain('href="/login?next=%2Fcreate"');
    });

    it("lets /login round-trip the next parameter without an open redirect", async () => {
        const login = await read("src/app/login/page.tsx");

        expect(login).toContain("safeNextPath(firstValue(params.next))");
        expect(login).toContain('value?.startsWith("/") && !value.startsWith("//")');
        expect(login).toContain("if (user) redirect(nextPath)");
        expect(login).toContain('<AuthForm mode="login" nextPath={nextPath}');
    });

    it("no longer ships a second unused login modal module", async () => {
        await expect(read("src/app/home/home-overlays.tsx")).rejects.toThrow();
    });

    it("softens the hero bottom with a thin overlay instead of a canvas mask", async () => {
        const backdrop = await read("src/app/home/hero-backdrop.module.css");
        const css = await read("src/app/home/home.module.css");

        // 蒙版会让整块 WebGL 画布多走一遍合成，条纹动画明显不如无蒙版时顺
        expect(backdrop).not.toContain("mask-image");
        // 收口只在最底部 ~88px，且从全透明起，不能糊掉上方的光场
        expect(css).toContain(".heroShell::after");
        expect(css).toContain("height: clamp(48px, 7vh, 88px);");
    });
});
