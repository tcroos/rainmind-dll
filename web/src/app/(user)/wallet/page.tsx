import { redirect } from "next/navigation";
import { Suspense } from "react";

import { scopeOfSectionParam } from "../profile/account-sections";
import { AccountCenter } from "../profile/account-center";

export const metadata = {
    title: "钱包",
};

/**
 * 钱包是「钱」的唯一入口：余额、充值套餐、优惠券、订单、积分与消费流水。
 * 首屏就是余额卡 + 套餐网格，充值不用再跳两次页面。
 */
export default async function WalletPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const section = Array.isArray(params.section) ? params.section[0] : params.section;
    if (scopeOfSectionParam(section) === "profile") {
        redirect(section === "overview" ? "/profile" : `/profile?section=${encodeURIComponent(section || "")}`);
    }
    return (
        <Suspense fallback={null}>
            <AccountCenter scope="wallet" />
        </Suspense>
    );
}
