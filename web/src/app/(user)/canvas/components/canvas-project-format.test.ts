import { describe, expect, it } from "vitest";

import { canvasProjectMeta, formatCanvasUpdatedAt } from "./canvas-project-format";

describe("canvas project card format", () => {
    const now = new Date(2026, 10, 14, 20, 30);

    it("shows only the clock for today, month-day within the same year, full date across years", () => {
        expect(formatCanvasUpdatedAt(new Date(2026, 10, 14, 9, 5).toISOString(), now)).toBe("今天 09:05");
        expect(formatCanvasUpdatedAt(new Date(2026, 9, 24, 9, 5).toISOString(), now)).toBe("10-24");
        expect(formatCanvasUpdatedAt(new Date(2025, 5, 1, 9, 5).toISOString(), now)).toBe("2025-06-01");
    });

    it("returns an empty string instead of Invalid Date for broken timestamps", () => {
        expect(formatCanvasUpdatedAt("not-a-date", now)).toBe("");
        expect(formatCanvasUpdatedAt("", now)).toBe("");
    });

    it("describes an empty canvas in words rather than 0 个节点", () => {
        expect(canvasProjectMeta(0, 0)).toBe("空白画布");
        expect(canvasProjectMeta(3, 0)).toBe("3 个节点");
        expect(canvasProjectMeta(3, 2)).toBe("3 个节点 · 2 条连线");
    });
});
