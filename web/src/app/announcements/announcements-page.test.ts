import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 公告页的结构约束。
 * 这里只有「标题 + 一大段正文」，必须给出日期栏、最新标记和折叠，否则又退回成一个纯文字列表。
 */
describe("announcements page layout", () => {
    const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

    it("renders an editorial header with counts and a card list", async () => {
        const page = await read("src/app/announcements/page.tsx");

        expect(page).toContain("Updates · 站点动态");
        expect(page).toContain("累计公告");
        expect(page).toContain("AnnouncementItem");
        expect(page).toContain("paginationWindow");
        // 越界页码夹回最后一页，不能落到「暂无公告」
        expect(page).toContain("Math.min(requestedPage, totalPages)");
    });

    it("collapses long announcements instead of dumping the whole text", async () => {
        const item = await read("src/app/announcements/announcement-item.tsx");

        expect(item).toContain("CLAMP_LENGTH");
        expect(item).toContain("line-clamp-3");
        expect(item).toContain("展开全文");
        expect(item).toContain("aria-expanded");
        // 最新一条要有标签和一层暖底，和普通公告区分开
        expect(item).toContain("最新");
        expect(item).toContain("item.latest &&");
    });

    it("formats the date on the server to avoid hydration drift", async () => {
        const page = await read("src/app/announcements/page.tsx");

        expect(page).toContain("toAnnouncementView");
        expect(page).toContain("toLocaleTimeString(\"zh-CN\"");
    });
});
