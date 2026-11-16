/**
 * 账户体系的分区元数据：钱包与个人中心共用一套 key，
 * 用 scope 决定某个分区落在哪一页。
 *
 * 这个模块刻意不引入任何 React / antd：服务端页面（profile/page.tsx、
 * wallet/page.tsx）要靠它判断「这个 ?section= 属于哪一页」并做 302，
 * 一旦带进 "use client" 的依赖，服务端就没法调用这些函数了。
 */
export type AccountScope = "profile" | "wallet";

export type ProfileSectionKey =
    | "overview"
    | "profile"
    | "security"
    | "help"
    | "wallet"
    | "billing"
    | "coupons"
    | "orders"
    | "points"
    | "consume"
    | "referrals";

export const ACCOUNT_SCOPE_BY_SECTION: Record<ProfileSectionKey, AccountScope> = {
    overview: "profile",
    profile: "profile",
    security: "profile",
    help: "profile",
    wallet: "wallet",
    billing: "wallet",
    coupons: "wallet",
    orders: "wallet",
    points: "wallet",
    consume: "wallet",
    referrals: "wallet",
};

export const ACCOUNT_HOME_SECTION: Record<AccountScope, ProfileSectionKey> = {
    profile: "overview",
    wallet: "wallet",
};

export const ACCOUNT_ROOT_PATH: Record<AccountScope, string> = {
    profile: "/profile",
    wallet: "/wallet",
};

export function isAccountSection(value: string | null | undefined): value is ProfileSectionKey {
    return Boolean(value) && Object.prototype.hasOwnProperty.call(ACCOUNT_SCOPE_BY_SECTION, value as string);
}

/** ?section= 落在哪一页；没有或非法时给 null，交给调用方决定默认值。 */
export function scopeOfSectionParam(value: string | null | undefined): AccountScope | null {
    return isAccountSection(value) ? ACCOUNT_SCOPE_BY_SECTION[value] : null;
}

/** 当前页只认自己 scope 内的分区，别页的 key 一律回落到本页首页。 */
export function parseScopedSection(value: string | null | undefined, scope: AccountScope): ProfileSectionKey {
    const key = isAccountSection(value) ? value : null;
    return key && ACCOUNT_SCOPE_BY_SECTION[key] === scope ? key : ACCOUNT_HOME_SECTION[scope];
}

export function accountSectionHref(key: ProfileSectionKey, scope: AccountScope) {
    const root = ACCOUNT_ROOT_PATH[scope];
    return key === ACCOUNT_HOME_SECTION[scope] ? root : `${root}?section=${key}`;
}
