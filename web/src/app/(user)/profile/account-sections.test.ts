import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { accountSectionHref, parseScopedSection, scopeOfSectionParam } from "./account-sections";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("wallet and profile section split", () => {
    it("routes every money section to the wallet and every identity section to profile", () => {
        expect(scopeOfSectionParam("billing")).toBe("wallet");
        expect(scopeOfSectionParam("coupons")).toBe("wallet");
        expect(scopeOfSectionParam("orders")).toBe("wallet");
        expect(scopeOfSectionParam("points")).toBe("wallet");
        expect(scopeOfSectionParam("consume")).toBe("wallet");
        expect(scopeOfSectionParam("referrals")).toBe("wallet");
        expect(scopeOfSectionParam("profile")).toBe("profile");
        expect(scopeOfSectionParam("security")).toBe("profile");
        expect(scopeOfSectionParam("help")).toBe("profile");
        expect(scopeOfSectionParam("unknown")).toBeNull();
    });

    it("never renders a section on the wrong page", () => {
        // 个人中心收到资金分区、钱包收到身份分区，都回落到本页首页，不会渲染出空白
        expect(parseScopedSection("billing", "profile")).toBe("overview");
        expect(parseScopedSection("security", "wallet")).toBe("wallet");
        expect(parseScopedSection(null, "wallet")).toBe("wallet");
        expect(parseScopedSection("points", "wallet")).toBe("points");
    });

    it("builds clean urls without a redundant section param on home", () => {
        expect(accountSectionHref("wallet", "wallet")).toBe("/wallet");
        expect(accountSectionHref("overview", "profile")).toBe("/profile");
        expect(accountSectionHref("billing", "wallet")).toBe("/wallet?section=billing");
        expect(accountSectionHref("help", "profile")).toBe("/profile?section=help");
    });

    it("redirects legacy money links from the profile page to the wallet", async () => {
        const [profile, wallet] = await Promise.all([read("src/app/(user)/profile/page.tsx"), read("src/app/(user)/wallet/page.tsx")]);

        expect(profile).toContain('redirect(section === "wallet" ? "/wallet"');
        expect(profile).toContain('<AccountCenter scope="profile" />');
        expect(wallet).toContain('redirect(section === "overview" ? "/profile"');
        expect(wallet).toContain('<AccountCenter scope="wallet" />');
    });

    it("recharges through the shared plan modal instead of a plan grid on the page", async () => {
        const center = await read("src/app/(user)/profile/account-center.tsx");
        const elements = await read("src/app/(user)/profile/profile-elements.tsx");

        // 钱包首屏只留余额卡 + 账单，套餐走和官网同一个弹窗
        expect(center).toContain('data-testid="wallet-balance-card"');
        expect(center).toContain("<BillingPlansModal");
        expect(center).not.toContain("BillingPlanGrid");
        expect(center).not.toContain('id="wallet-plans"');
        expect(center).toContain('data-testid="wallet-bills"');
        expect(center).toContain("setBillTab");
        // 老链接 ?section=billing 仍会打开弹窗，并把地址清成 /wallet
        expect(center).toContain('requestedSection === "billing"');
        expect(center).toContain('router.replace("/wallet", { scroll: false })');
        // 导航里不再有「充值套餐」，避免点进去是空页
        expect(elements).not.toContain('label: "充值套餐"');
    });

    it("keeps the sidebar account entry as the second way into the profile", async () => {
        const sidebar = await read("src/components/layout/app-sidebar.tsx");

        expect(sidebar).toContain('href="/profile"');
        expect(sidebar).toContain("个人中心");
        // 帮助从侧栏底部撤下，收进个人中心分区
        expect(sidebar).not.toContain('href="/help"');
    });
});
