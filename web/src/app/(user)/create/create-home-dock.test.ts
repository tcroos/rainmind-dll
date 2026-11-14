import { describe, expect, it } from "vitest";
import { HOME_DOCK_RELEASE_GAP, HOME_DOCK_TRIGGER_GAP, homeComposerDocked } from "./create-home-dock";

// origin = 输入区底边在滚动内容里的位置，即"要滚到多少输入区才刚好完全离开屏幕"
const origin = 372;

describe("home composer dock", () => {
    it("keeps the big composer in place while it is still on screen", () => {
        expect(homeComposerDocked({ scrollTop: 0, origin, docked: false })).toBe(false);
        expect(homeComposerDocked({ scrollTop: 180, origin, docked: false })).toBe(false);
        expect(homeComposerDocked({ scrollTop: origin - 60, origin, docked: false })).toBe(false);
    });

    it("docks only when the composer bottom is about to leave the viewport", () => {
        expect(homeComposerDocked({ scrollTop: origin - HOME_DOCK_TRIGGER_GAP - 1, origin, docked: false })).toBe(false);
        expect(homeComposerDocked({ scrollTop: origin - HOME_DOCK_TRIGGER_GAP, origin, docked: false })).toBe(true);
        expect(homeComposerDocked({ scrollTop: origin + 40, origin, docked: false })).toBe(true);
    });

    it("holds the docked state inside the hysteresis band so it cannot flicker", () => {
        expect(homeComposerDocked({ scrollTop: origin - HOME_DOCK_RELEASE_GAP, origin, docked: true })).toBe(true);
        expect(homeComposerDocked({ scrollTop: origin - 20, origin, docked: true })).toBe(true);
        expect(homeComposerDocked({ scrollTop: origin + 120, origin, docked: true })).toBe(true);
    });

    it("releases once the composer body is visible again", () => {
        expect(homeComposerDocked({ scrollTop: origin - HOME_DOCK_RELEASE_GAP - 1, origin, docked: true })).toBe(false);
        expect(homeComposerDocked({ scrollTop: 0, origin, docked: true })).toBe(false);
    });

    it("keeps the release threshold above the trigger threshold", () => {
        expect(HOME_DOCK_RELEASE_GAP).toBeGreaterThan(HOME_DOCK_TRIGGER_GAP);
    });
});
