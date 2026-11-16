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

    it("puts the balance card and the plan grid on the first wallet screen", async () => {
        const center = await read("src/app/(user)/profile/account-center.tsx");

        expect(center).toContain('data-testid="wallet-balance-card"');
        expect(center).toContain('id="wallet-plans"');
        // 余额卡下方直接就是套餐网格，充值不再多跳一层弹窗
        expect(center.indexOf('data-testid="wallet-balance-card"')).toBeLessThan(center.indexOf('id="wallet-plans"'));
        // 套餐网格直接铺在钱包首屏，不再套一层「套餐中心」容器
        expect(center).toContain("<BillingPlanGrid");
        expect(center).toContain("function WalletRechargeSection(");
        // 订单与积分并成一张可切换的账单卡，不再并排两块同权重面板
        expect(center).toContain('data-testid="wallet-bills"');
        expect(center).toContain("setBillTab");
    });

    it("keeps the sidebar account entry as the second way into the profile", async () => {
        const sidebar = await read("src/components/layout/app-sidebar.tsx");

        expect(sidebar).toContain('href="/profile"');
        expect(sidebar).toContain("个人中心");
        // 帮助从侧栏底部撤下，收进个人中心分区
        expect(sidebar).not.toContain('href="/help"');
    });
});
