import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 主题色口径：全站一支橙（与营销页大标题 / CTA 同源 #e2671f），
 * 在工作台里只做「动作 / 选中 / 强调」的点缀，不铺底色。
 * 这里把口径钉住，避免以后又出现紫、靛蓝各说各话。
 */
describe("workbench theme accent", () => {
    it("defines one brand hue for both themes", async () => {
        const surfaces = await readFile(resolve(process.cwd(), "src/app/styles/global-surfaces.css"), "utf8");

        expect(surfaces).toContain("--brand-500: #e2671f;");
        expect(surfaces).toContain("--brand-600: #c95616;");
        // 深色态沿同一色相抬明度，橙压在 #121212 上才不会发闷
        expect(surfaces).toContain("--brand-500: #f0803a;");
        expect(surfaces).toContain("--brand-soft: rgba(226, 103, 31, 0.1);");
    });

    it("uses the accent on the primary action and on skill icons only", async () => {
        const sendStyles = await readFile(resolve(process.cwd(), "src/components/creative-composer-styles.ts"), "utf8");
        const page = await readFile(resolve(process.cwd(), "src/app/(user)/create/page.tsx"), "utf8");

        expect(sendStyles).toContain("linear-gradient(135deg,var(--brand-500),var(--brand-600))");
        expect(page).toContain('iconClass: "text-[var(--brand-600)]"');
        expect(page).toContain('surfaceClass: "bg-[var(--brand-soft)]"');
    });

    it("keeps brand references out of the neutral surface ramp", async () => {
        const surfaces = await readFile(resolve(process.cwd(), "src/app/styles/global-surfaces.css"), "utf8");
        const canvas = await readFile(resolve(process.cwd(), "src/app/styles/global-create-ambient.css"), "utf8");

        // 底色 / 面板 / 文字层级一律中性，不许掺品牌色
        for (const token of ["--surface-canvas", "--surface-panel", "--ink-1", "--ink-2"]) {
            const value = surfaces.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1] ?? "";
            expect(value).not.toContain("brand");
        }
        // 环境光里品牌色只出现在低浓度 radial 上
        expect(canvas).not.toMatch(/rgba\(226, 103, 31, 0\.[2-9]/);
    });
});
