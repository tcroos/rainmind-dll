import { describe, expect, it } from "vitest";

import { userAvatarFallback, userAvatarInitial } from "./user-avatar";

describe("user avatar helpers", () => {
    it("keeps a single glyph for the avatar bubble", () => {
        // 两个汉字塞进 32px 会挤成一团，头像只取第一个字
        expect(userAvatarInitial("管理员")).toBe("管");
        expect(userAvatarInitial("  neo  ")).toBe("N");
        expect(userAvatarInitial("")).toBe("U");
    });

    it("still exposes the two-letter fallback for wider surfaces", () => {
        expect(userAvatarFallback("管理员")).toBe("管理");
        expect(userAvatarFallback("neo anderson")).toBe("NA");
        expect(userAvatarFallback("")).toBe("U");
    });
});
