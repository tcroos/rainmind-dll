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

    it("keeps one solid CTA and two account entries without the brand mark", async () => {
        const header = await read("src/app/home/home-header.tsx");

        // 品牌区只剩字标，不再渲染 ∞ 图标
        expect(header).not.toContain("<SiteLogo");
        expect(header).not.toContain("site.logoUrl");
        // 未登录：文字「登录」回首页 + 实心「开始创作」带 next=/create
        expect(header).toContain('openLogin("/")');
        expect(header).toMatch(/>\s*登录\s*<\/button>/);
        expect(header).toContain("开始创作");
        // 已登录：同一位置只留「进入工作台」，不出现两个同义入口
        expect(header).toContain("进入工作台");
        expect(header).toContain('openProtectedPath("/create")');
        expect(header).not.toContain("立即体验");
    });

    it("uses official-style navigation items that all have a real destination", async () => {
        const data = await read("src/app/home/home-data.ts");

        expect(data).toContain('{ label: "AI 创作", href: "/create", action: "protected" }');
        expect(data).toContain('{ label: "短剧制作", href: "/drama", action: "protected" }');
        expect(data).toContain('{ label: "作品广场", href: "/gallery", action: "link" }');
        expect(data).toContain('{ label: "价格", href: "/billing", action: "billing" }');
        expect(data).toContain('{ label: "关于", href: "/about", action: "link" }');

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
});
