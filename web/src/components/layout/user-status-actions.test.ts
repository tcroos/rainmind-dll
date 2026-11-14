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
});
