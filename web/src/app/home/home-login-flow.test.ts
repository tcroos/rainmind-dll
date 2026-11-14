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

    it("labels the header action as 登录 when signed out and 开始创作 when signed in", async () => {
        const header = await read("src/app/home/home-header.tsx");

        expect(header).toContain('onClick={() => openProtectedPath("/create")}');
        expect(header).toContain('{authenticated ? "开始创作" : "登录"}');
        expect(header).not.toContain("立即体验");
        // 直接调 openLogin 会让入口绕过 openProtectedPath 的已登录分支
        expect(header).not.toContain("openLogin(");
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
