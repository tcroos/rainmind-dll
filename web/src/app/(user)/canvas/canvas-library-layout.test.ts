import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 画布库的结构约束。
 * 抄的是 liblib.tv/project 的做法：入口就是网格的第一格，卡是「封面 + 标题 + 时间」，
 * 不画分割线，靠缩略图本身撑起版面。这些断言防止以后被改回一堆边框文字卡。
 */
describe("canvas library layout", () => {
    const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

    it("puts the create entry as the first tile of the same grid", async () => {
        const page = await read("src/app/(user)/canvas/page.tsx");
        const grid = page.slice(page.indexOf("<div className={cn(\"grid grid-cols-1"));
        expect(page).toContain("CanvasCreateCard");
        expect(grid.indexOf("<CanvasCreateCard")).toBeLessThan(grid.indexOf("projects.map("));
        expect(page).toContain("xl:grid-cols-4");
    });

    it("enters a freshly created canvas without flashing a new tile first", async () => {
        const [page, store] = await Promise.all([read("src/app/(user)/canvas/page.tsx"), read("src/app/(user)/canvas/stores/use-canvas-store.ts")]);

        expect(store).toContain("insertIntoList");
        expect(store).toContain("options?.insertIntoList !== false");
        // 新建 / 自动打开都直接进画布，不往列表插卡片
        expect(page).toContain("{ insertIntoList: false }");
    });

    it("renders real thumbnails from canvas previews instead of text-only cards", async () => {
        const [card, cover] = await Promise.all([read("src/app/(user)/canvas/components/canvas-project-card.tsx"), read("src/app/(user)/canvas/components/canvas-project-cover.tsx")]);
        expect(card).toContain("CanvasProjectCover");
        expect(card).toContain("project.previews ?? []");
        expect(card).toContain("aspect-[16/10]");
        // 拼贴：2 张并排、3 张一大两小、4 张 2×2
        expect(cover).toContain("tiles.length === 2 && \"grid-cols-2\"");
        expect(cover).toContain("tiles.length === 3 && \"grid-cols-2 grid-rows-2\"");
        expect(cover).toContain("row-span-2");
        // 没有素材时不摆假图
        expect(cover).toContain("CanvasCoverPlaceholder");
        // 素材挂了也要留一块渐变，不能塌成空白
        expect(cover).toContain("failed");
    });

    it("keeps the toolbar free of rules and secondary actions out of the header", async () => {
        const page = await read("src/app/(user)/canvas/page.tsx");
        expect(page).not.toContain("border-b border-border");
        expect(page).not.toContain("删除当前页");
        expect(page).toContain("已选 {selectedIds.length} 个画布");
        expect(page).toContain("取消选择");
        expect(page).toContain("搜索画布");
    });

    it("wraps the search input so antd's width:100% cannot stretch it", async () => {
        const page = await read("src/app/(user)/canvas/page.tsx");
        expect(page).toContain('className="hidden w-[190px] shrink-0 sm:block"');
        expect(page).toContain('placeholder="搜索画布"');
        expect(page).toContain('className="w-full"');
    });

    it("exposes search and a busy flag without blanking the list on refetch", async () => {
        const store = await read("src/app/(user)/canvas/stores/use-canvas-store.ts");
        expect(store).toContain("summaryKeyword");
        expect(store).toContain("summaryBusy");
        expect(store).toContain("searchProjects");
        expect(store).toContain("const warm = get().hydrated && get().hydratedUserId === userId");
    });
});
