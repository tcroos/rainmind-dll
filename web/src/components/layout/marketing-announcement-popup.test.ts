import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("marketing page never auto-opens an announcement drawer", () => {
    it("does not even mount the popup component on the landing page", async () => {
        const init = await read("src/components/layout/client-root-init.tsx");

        expect(init).toContain("isAnnouncementSuppressedPath(pathname)");
        expect(init).toContain("installRoute || announcementSuppressed ? null : <SiteAnnouncementPopup />");
    });

    it("keeps the sign-in flow announcement-free", async () => {
        const routes = await read("src/lib/announcement-routes.ts");

        // 登录/注册/找回密码还没进站，不该先被弹一次公告、进站后再弹一次
        expect(routes).toContain('const AUTH_PATHS = ["/login", "/register", "/forgot-password"] as const;');
        expect(routes).toContain('if (pathname === "/") return true;');
    });

    it("only shows the after-login announcement, never a home popup", async () => {
        const popup = await read("src/components/layout/site-announcement-popup.tsx");

        // 未登录（宣传页访客）连公告数据都不拉，更不会弹抽屉
        expect(popup).toContain("useAnnouncements({ enabled: Boolean(user) })");
        // 组件内部再挡一道，防止以后被复用到公开页
        expect(popup).toContain("isAnnouncementSuppressedPath");
        expect(popup).toContain("if (suppressed) return null;");
        expect(popup).toContain("announcement.popupAfterLogin");
        expect(popup).toContain('isPopupDismissed(announcement.id, "login")');
        expect(popup).not.toContain("popupHome");
        expect(popup).not.toContain('key: "home"');
        expect(popup).not.toContain("首页弹窗");
    });

    it("pops at most once per session even when several announcements are flagged", async () => {
        const [popup, dismiss] = await Promise.all([read("src/components/layout/site-announcement-popup.tsx"), read("src/lib/announcement-dismiss.ts")]);

        // 后台可能同时有多条公告勾了「登录后弹窗」；关掉第一条后列表一刷新就会挑出第二条，
        // 用户感知就是「关过了又在别的页面弹一次」。会话级标记必须优先于逐条标记。
        expect(popup).toContain('if (hasPopupSeen("login")) return;');
        expect(popup).toContain('markPopupSeen("login")');
        expect(dismiss).toContain("export function hasPopupSeen(");
        expect(dismiss).toContain("export function markPopupSeen(");
        // 重新登录要能重新看到：清理函数必须覆盖 seen 前缀
        expect(dismiss).toContain("key.startsWith(POPUP_SEEN_PREFIX)");
    });

    it("removes the now-dead 首页弹窗 switch from the admin console", async () => {
        const admin = await read("src/components/admin/admin-content-sections.tsx");

        expect(admin).not.toContain("首页弹窗");
        expect(admin).not.toContain('checkedChildren="首页"');
        expect(admin).not.toContain("announcement.popupHome");
        expect(admin).toContain("宣传页不会自动弹出公告");
        expect(admin).toContain("popupAfterLogin");
    });
});
