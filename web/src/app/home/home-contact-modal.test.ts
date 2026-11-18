import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 联系我们弹窗的兜底。
 * 后台填的图片可能是还没部署的站内路径（404），也可能被删了；
 * 不能把浏览器的破图图标直接展示给访客。
 */
describe("home contact modal image fallback", () => {
    const read = () => readFile(resolve(process.cwd(), "src/app/home/home-contact-modal.tsx"), "utf8");

    it("switches to a readable hint when the configured image fails", async () => {
        const modal = await read();

        expect(modal).toContain("onError={() => setImageFailed(true)}");
        expect(modal).toContain("联系图片加载失败");
        expect(modal).toContain("已部署、可公开访问");
        // 换地址后要重置失败态，否则后台改好了也一直显示提示
        expect(modal).toContain("useEffect(() => setImageFailed(false), [url])");
    });

    it("keeps the empty-state copy for an unconfigured site", async () => {
        const modal = await read();

        expect(modal).toContain("管理员还没有配置联系图片");
    });
});
