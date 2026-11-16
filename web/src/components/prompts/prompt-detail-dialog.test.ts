import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 详情弹窗的尺寸约束。
 * 提示词可以很长，弹窗必须是固定高度 + 内部滚动，否则整块会被撑出屏幕。
 */
describe("prompt detail dialog layout", () => {
    const read = () => readFile(resolve(process.cwd(), "src/components/prompts/prompt-detail-dialog.tsx"), "utf8");

    it("locks the dialog height and scrolls the prompt inside it", async () => {
        const dialog = await read();

        expect(dialog).toContain("h-[min(78dvh,620px)]");
        expect(dialog).toContain("max-h-[calc(100dvh-28px)]");
        expect(dialog).toContain("overflow-y-auto overscroll-contain");
        expect(dialog).toContain("styles={{");
        expect(dialog).toContain("overflow: \"hidden\"");
    });

    it("clamps long prompts and lets them expand in place", async () => {
        const dialog = await read();

        expect(dialog).toContain("CLAMP_LENGTH");
        expect(dialog).toContain("line-clamp-6");
        expect(dialog).toContain("展开全部");
        expect(dialog).toContain("aria-expanded");
        // 换一条提示词要回到折叠态
        expect(dialog).toContain("setExpanded(false)");
    });

    it("reuses the list thumbnail so the preview shows immediately", async () => {
        const dialog = await read();

        expect(dialog).toContain("previewUrl ||");
        expect(dialog).toContain("object-cover object-top");
        expect(dialog).toContain("md:object-contain");
    });
});
