import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("signing out of the workspace", () => {
    it("always goes back to the /login page after clearing the client session", async () => {
        const tsx = await read("src/components/layout/user-status-actions.tsx");

        expect(tsx).toContain('await fetch("/api/auth/logout", { method: "POST" });');
        expect(tsx).toContain("await resetClientSessionState();");
        expect(tsx).toContain('router.replace("/login");');
        expect(tsx).toContain("router.refresh();");

        // 先清本地会话再跳，避免登录页上仍挂着旧账号
        expect(tsx.indexOf("await resetClientSessionState();")).toBeLessThan(tsx.indexOf('router.replace("/login")'));

        // 不再有「留在 /create」的特判分支与那句停留提示
        expect(tsx).not.toContain("usePathname");
        expect(tsx).not.toContain("pathname.startsWith");
        expect(tsx).not.toContain("已退出登录，可继续浏览");
    });

    it("renders the account menu as a controlled panel instead of an antd dropdown", async () => {
        const tsx = await read("src/components/layout/user-status-actions.tsx");

        // 自定义面板才有稳定的排版：套餐信息一块、菜单一组、退出登录单独一档
        expect(tsx).toContain("function AccountMenuPanel(");
        expect(tsx).toContain("account-menu-popover");
        expect(tsx).not.toContain("accountItems");
    });

    it("points the account panel at the wallet instead of a nested plan modal", async () => {
        const tsx = await read("src/components/layout/user-status-actions.tsx");

        // 充值入口统一在 /wallet，浮层里不再套一层套餐弹窗
        expect(tsx).toContain('href: "/wallet"');
        expect(tsx).toContain('href: "/help"');
        expect(tsx).not.toContain("BillingPlansModal");
        expect(tsx).not.toContain("购买积分与套餐");
    });

    it("keeps the plan action readable on its dark pill", async () => {
        const tsx = await read("src/components/layout/user-status-actions.tsx");

        // 全局有未分层的 `button { color: inherit }`，Tailwind 的 text-* 会被压掉，
        // 这里必须用内联色，否则黑底黑字（之前就踩过）
        expect(tsx).toContain('style={{ color: "var(--surface-panel)" }}');
    });
});
