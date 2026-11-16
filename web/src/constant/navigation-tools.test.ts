import { describe, expect, it } from "vitest";

import { landingNavigationTools, navigationGroups, navigationToolHref, navigationTools } from "./navigation-tools";

describe("user navigation order", () => {
    it("keeps the landing page entries in their dedicated order", () => {
        expect(landingNavigationTools).toEqual([
            { slug: "create", label: "Agent" },
            { slug: "drama", label: "短剧" },
            { slug: "gallery", label: "广场" },
        ]);
    });

    it("keeps the unified Agent as the only generation entry in workspace navigation", () => {
        expect(navigationGroups.map((group) => group.label)).toEqual(["创作", "项目", "资产", "个人"]);
        expect(navigationTools.map((tool) => tool.slug)).not.toContain("image");
        expect(navigationTools.map((tool) => tool.slug)).not.toContain("video");
    });

    it("puts public works into assets and keeps money plus account under personal", () => {
        expect(navigationTools.filter((tool) => tool.group === "assets").map((tool) => tool.label)).toEqual(["作品", "素材", "提示词", "词库", "广场"]);
        // 广场是「别人的作品」，归资产；「社区」这个分组随之取消
        expect(navigationTools.find((tool) => tool.slug === "community")?.group).toBe("assets");
        expect(navigationGroups.map((group) => group.id)).not.toContain("community");
        expect(navigationTools.filter((tool) => tool.group === "personal").map((tool) => tool.label)).toEqual(["主页", "钱包", "个人中心", "API"]);
    });

    it("links the API entry to the public gateway in a new window", () => {
        const api = navigationTools.find((tool) => tool.slug === "api");

        expect(api?.group).toBe("personal");
        expect(api && "external" in api && api.external).toBe(true);
        expect(api && navigationToolHref(api)).toBe("https://api.rainmind.net");
    });
});
