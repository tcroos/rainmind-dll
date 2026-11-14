import { describe, expect, it } from "vitest";

import { creativeComposerCompactIconButtonClass, creativeComposerIconButtonClass, creativeComposerSendButtonClass, creativeComposerToolButtonClass } from "@/components/creative-composer-styles";

describe("creativeComposerToolButtonClass", () => {
    it("only keeps the active palette while its popover is open", () => {
        const closedClass = creativeComposerToolButtonClass(false);
        const openClass = creativeComposerToolButtonClass(true);

        expect(closedClass).toContain("!bg-transparent");
        expect(closedClass).toContain("focus:!bg-transparent");
        expect(closedClass).not.toContain("!bg-[rgba(17,17,19,0.07)]");
        expect(openClass).toContain("!bg-[rgba(17,17,19,0.07)]");
    });

    it("keeps the toolbar line-free and hover-driven", () => {
        const closedClass = creativeComposerToolButtonClass(false);

        expect(closedClass).toContain("!rounded-lg");
        expect(closedClass).toContain("!border-0");
        expect(closedClass).not.toContain("!border-[");
        expect(closedClass).toContain("hover:!bg-[");
        expect(closedClass).toContain("!h-9");
        expect(closedClass).toContain("sm:!h-8");
    });
});

describe("creativeComposer icon buttons", () => {
    it("squares the add-asset entry to the toolbar height", () => {
        expect(creativeComposerIconButtonClass(false)).toContain("!size-9");
        expect(creativeComposerIconButtonClass(false)).toContain("sm:!size-8");
        expect(creativeComposerCompactIconButtonClass(false)).toContain("!size-11");
    });

    it("drops the send fill down to a flat tonal circle when the composer is empty", () => {
        expect(creativeComposerSendButtonClass).toContain("linear-gradient(135deg,var(--brand-500)");
        expect(creativeComposerSendButtonClass).toContain("disabled:!bg-[rgba(17,17,19,0.07)]");
        expect(creativeComposerSendButtonClass).not.toContain("inset_0_0_0_1px");
    });
});
