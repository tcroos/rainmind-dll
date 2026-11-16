import { redirect } from "next/navigation";
import { Suspense } from "react";

import { scopeOfSectionParam } from "./account-sections";
import { AccountCenter } from "./account-center";

export const metadata = {
    title: "个人中心",
};

/**
 * 个人中心只留「人」：资料、安全、帮助。
 * 资金类分区（套餐/优惠券/订单/积分/消费/邀请）已经搬到 /wallet，
 * 老的 `?section=billing` 这类链接在这里 302 过去，收藏和邮件里的地址不会失效。
 */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const section = Array.isArray(params.section) ? params.section[0] : params.section;
    if (scopeOfSectionParam(section) === "wallet") {
        redirect(section === "wallet" ? "/wallet" : `/wallet?section=${encodeURIComponent(section || "")}`);
    }
    return (
        <Suspense fallback={null}>
            <AccountCenter scope="profile" />
        </Suspense>
    );
}
