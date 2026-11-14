import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { isFullscreenWorkspacePath } from "./app-workspace-path";

describe("workspace sidebar", () => {
    it("starts expanded and keeps scrolling without a visible scrollbar", async () => {
        const [shell, sidebar] = await Promise.all([readFile(resolve(process.cwd(), "src/components/layout/app-workspace-shell.tsx"), "utf8"), readFile(resolve(process.cwd(), "src/components/layout/app-sidebar.tsx"), "utf8")]);

        expect(shell).toContain("const [sidebarExpanded, setSidebarExpanded] = useState(true)");
        expect(shell).toContain("expanded={sidebarExpanded}");
        expect(sidebar).toContain('expanded ? "w-52" : "w-[72px]"');
        expect(sidebar).toContain("hide-scrollbar min-h-0 flex-1 overflow-y-auto");
        expect(sidebar).not.toContain("thin-scrollbar min-h-0 flex-1 overflow-y-auto");
        expect(sidebar).toContain('<CircleHelp className="size-5 shrink-0" />');
        expect(sidebar).not.toContain("userAvatarFallback");
        expect(sidebar).not.toContain("workspaceUrl");
        expect(sidebar).not.toContain("window.location.host");
    });

    it("uses a larger nav type scale and a Dreamina-like rail width", async () => {
        const [sidebar, mobile] = await Promise.all([readFile(resolve(process.cwd(), "src/components/layout/app-sidebar.tsx"), "utf8"), readFile(resolve(process.cwd(), "src/components/layout/mobile-nav-drawer.tsx"), "utf8")]);

        // 即梦工作台侧栏约占视口 12%；仅从 176 → 192px 肉眼几乎看不出变化，
        // 这次放大到 208px(14.4%) 并把字号抬到 16px，让加宽一眼可见。
        expect(sidebar).toContain('expanded ? "w-52" : "w-[72px]"');
        expect(sidebar).not.toContain('"w-44"');
        expect(sidebar).not.toContain('"w-48"');
        expect(sidebar).toContain("h-12 items-center rounded-lg px-2 text-base");
        expect(sidebar).toContain("text-[13px] font-normal text-[var(--ink-3)]");
        expect(sidebar).toContain("text-[17px] font-semibold");
        expect(sidebar).toContain("size-5 shrink-0");
        // 收起态只留图标，宽度不变，避免折叠时跳动
        expect(sidebar).toContain('"w-[72px]"');
        // 移动抽屉同步字号，桌面/窄屏读起来是同一套比例
        expect(mobile).toContain("text-base");
        expect(mobile).toContain("size-5 shrink-0");
    });

    it("keeps sidebar links readable in dark mode despite antd's unlayered anchor rule", async () => {
        const css = await readFile(resolve(process.cwd(), "src/app/styles/global-surfaces.css"), "utf8");

        // antd 的无层级 a{color} 在深色态等于侧栏底色，整排文字会隐形；
        // 覆盖规则必须写在 @layer 之外并按 ink 令牌取色。
        expect(css).toContain(".workspace-shell aside a {");
        expect(css).toContain(".workspace-shell aside a:hover,");
        expect(css).toContain("color: var(--ink-2);");
        expect(css).toContain("color: var(--ink-1);");
    });

    it("opens Canvas and drama project details as full-screen workspaces only", () => {
        expect(isFullscreenWorkspacePath("/canvas/canvas-one")).toBe(true);
        expect(isFullscreenWorkspacePath("/canvas/canvas-one/history")).toBe(true);
        expect(isFullscreenWorkspacePath("/drama/drama-one")).toBe(true);
        expect(isFullscreenWorkspacePath("/drama/drama-one/episode")).toBe(true);
        expect(isFullscreenWorkspacePath("/canvas")).toBe(false);
        expect(isFullscreenWorkspacePath("/drama")).toBe(false);
    });
});
