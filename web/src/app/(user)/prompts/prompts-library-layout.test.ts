import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 词库页面的结构约束。
 * 分类只有 7 个，用一排胶囊比两个下拉更快扫读；标签留一个下拉，避免两排一模一样的胶囊。
 */
describe("prompt library layout", () => {
    const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

    it("keeps one category chip row plus a tag dropdown in the toolbar", async () => {
        const page = await read("src/app/(user)/prompts/page.tsx");

        expect(page).toContain('label="分类"');
        expect(page).not.toContain('label="标签"');
        expect(page).toContain('aria-label="提示词标签"');
        expect(page).toContain("prompt-filter-tag");
        // 搜索、标签、清除统一 40px 高，避免三件套参差不齐
        expect(page.match(/!h-10/g)).toHaveLength(3);
    });

    it("renders covers without the brand logo placeholder", async () => {
        const card = await read("src/components/prompts/prompt-card.tsx");

        // 无封面条目很多，一排 Logo 水印会被读成「图片全挂了」
        expect(card).not.toContain("@/components/media/lazy-media-image");
        expect(card).toContain("aspect-[16/10]");
        expect(card).toContain("status === \"error\"");
        // 分类压在封面上，标签行不再重复同一个词
        expect(card).toContain("item.tags.filter((tag) => tag !== item.category)");
    });

    it("shows a skeleton grid instead of a lone spinner while loading", async () => {
        const page = await read("src/app/(user)/prompts/page.tsx");

        expect(page).toContain("PromptGridSkeleton");
        expect(page).not.toContain("h-32 items-center justify-center");
    });
});
