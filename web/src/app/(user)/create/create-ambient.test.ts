import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("create page ambient background", () => {
    it("paints the backdrop from the shell so it reaches the top edge", async () => {
        const shell = await readFile(resolve(process.cwd(), "src/components/layout/app-workspace-shell.tsx"), "utf8");
        const page = await readFile(resolve(process.cwd(), "src/app/(user)/create/page.tsx"), "utf8");

        // 背景挂在外壳上：页头是透明的，画在 <main> 里只能从页头下沿开始，会留一道横缝
        expect(shell).toContain('rootSlug === "create"');
        expect(shell).toContain('className="create-ambient"');
        // 外壳必须隔离成层叠上下文，背景走 z-index:-1 才能压在内容之下
        expect(shell).toContain("relative isolate");
        // 页面自己不再画这一层，避免叠两层
        expect(page).not.toContain('className="create-ambient"');
        expect(page).toContain("<CreateDotField />");
    });

    it("stacks light, gradient, vignette and grain in both themes", async () => {
        const css = await readFile(resolve(process.cwd(), "src/app/styles/global-create-ambient.css"), "utf8");
        const globals = await readFile(resolve(process.cwd(), "src/app/globals.css"), "utf8");

        expect(globals).toContain("./styles/global-create-ambient.css");
        expect(css).toContain(".create-ambient {");
        expect(css).toContain("z-index: -1");
        expect(css).toContain("position: absolute");
        // 顶部光池 + 两片极淡的冷暖雾 + 竖向渐变
        expect(css).toContain("radial-gradient(920px 430px at 50% -70px");
        expect(css).toContain("linear-gradient(180deg, #fefbf8 0%");
        // 暗角与颗粒
        expect(css).toContain("rgba(16, 20, 28, 0)");
        expect(css).toContain("feTurbulence");
        // 深色态另起一套，且尊重「减少动态效果」
        expect(css).toContain(".dark .create-ambient {");
        expect(css).toContain("prefers-reduced-motion");
        // 主题色只做点缀：顶部光池左缘一点暖、右缘一点冷，浓度都压在 10% 以内
        expect(css).toContain("rgba(226, 103, 31, 0.07)");
        expect(css).toContain("rgba(148, 163, 184, 0.1)");
    });

    it("anchors every glow to the top content area instead of the window edges", async () => {
        const css = await readFile(resolve(process.cwd(), "src/app/styles/global-create-ambient.css"), "utf8");
        const dotField = await readFile(resolve(process.cwd(), "src/app/(user)/create/components/create-dot-field.tsx"), "utf8");

        // 光斑一律固定 px 尺寸 + 负 y 锚点：窗口宽窄变化时范围不会胀缩，
        // 也不会有光团被钉在视口底边、滚动时悬在空白处。
        expect(css).toContain("at 22% -90px");
        expect(css).toContain("at 82% -110px");
        expect(css).not.toContain("96% 96%");
        expect(css).not.toContain("16% 90%");
        expect(css).not.toMatch(/at \d+% (?:[6-9]\d|100)%/);
        // 底部只剩一层均匀竖向渐变
        expect(css).toContain("linear-gradient(180deg, #191c21 0%, #141619 48%, #0d0e10 100%)");

        // 点阵是品牌橙、铺到首屏底边（灵感发现上方）才淡出
        expect(css).toContain(".create-dot-field {");
        expect(css).toContain("mask-image: linear-gradient(180deg");
        expect(css).toContain("transparent 100%");
        expect(dotField).toContain("create-dot-field pointer-events-none");
        expect(dotField).toContain("[--create-dot-rgb:226_103_31]");
        expect(dotField).toContain("const RADIUS = 150;");
        expect(dotField).toContain("const BASE_ALPHA = 0.09;");

        // 卡面暖光同样收窄到左上角一小团，深色态不再整张卡发棕
        const surfaces = await readFile(resolve(process.cwd(), "src/app/styles/global-surfaces.css"), "utf8");
        expect(surfaces).toContain("radial-gradient(72% 110% at 6% -24%");
        expect(surfaces).toContain("rgba(240, 128, 58, 0.045)");
    });
});
