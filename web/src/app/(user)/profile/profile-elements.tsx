"use client";

import type { ReactNode } from "react";
import { Button, Input, Pagination, Select, Spin, Tag } from "antd";
import { CircleHelp, CreditCard, History, ReceiptText, RefreshCw, Save, ShieldCheck, TicketPercent, UserCircle, UserPlus, Wallet, WalletCards } from "lucide-react";

import { CreditSymbol, formatCreditAmount } from "@/constant/credits";
import { CompactEmptyState } from "@/components/compact-empty-state";
import { cn } from "@/lib/utils";
import { type BillingOrder, type BillingOrderStatus, type BillingProduct } from "@/services/api/billing";
import type { PointRecord } from "@/services/api/points";
import { useUserStore } from "@/stores/use-user-store";
import { ProfileAvatarUploader } from "@/components/profile/profile-avatar-uploader";
import { ACCOUNT_SCOPE_BY_SECTION, parseScopedSection, type AccountScope, type ProfileSectionKey } from "./account-sections";

export type { ProfileSectionKey } from "./account-sections";

export const RECORD_PAGE_SIZE = 8;
export const ORDER_PAGE_SIZE = 8;
export const COUPON_PAGE_SIZE = 8;

/* 分区按 scope 分两页：钱包只放钱（余额、充值、券、账单），
 * 个人中心只放人（资料、安全、帮助）。顺序即导航顺序。 */
export const profileSections: Array<{ key: ProfileSectionKey; label: string; description: string; shortDescription: string; icon: ReactNode }> = [
    {
        key: "overview",
        label: "账户概览",
        description: "账号状态、绑定信息与常用入口。",
        shortDescription: "账号与入口",
        icon: <WalletCards className="size-4" />,
    },
    { key: "profile", label: "个人资料", description: "维护头像、显示昵称和个人简介。", shortDescription: "头像与资料", icon: <UserCircle className="size-4" /> },
    { key: "security", label: "账户与安全", description: "管理绑定邮箱、登录密码和个人数据。", shortDescription: "邮箱、密码与 MFA", icon: <ShieldCheck className="size-4" /> },
    { key: "help", label: "帮助中心", description: "使用指南、常见问题与账号支持。", shortDescription: "指南与常见问题", icon: <CircleHelp className="size-4" /> },

    { key: "wallet", label: "钱包概览", description: "积分余额、套餐与快捷充值入口。", shortDescription: "余额与充值", icon: <Wallet className="size-4" /> },
    { key: "coupons", label: "我的优惠券", description: "领取优惠券并查看可用、锁定、已使用和过期状态。", shortDescription: "领取与状态", icon: <TicketPercent className="size-4" /> },
    { key: "orders", label: "订单记录", description: "查看所有充值订单、支付状态和开通结果。", shortDescription: "收款状态", icon: <ReceiptText className="size-4" /> },
    { key: "points", label: "积分记录", description: "查看每日积分、充值赠送、退款退回和管理员调整流水。", shortDescription: "余额流水", icon: <CreditSymbol className="text-sm" /> },
    { key: "consume", label: "消费记录", description: "查看模型调用、生成任务和接口消费扣除。", shortDescription: "积分扣除", icon: <History className="size-4" /> },
    { key: "referrals", label: "邀请有礼", description: "复制邀请码和邀请链接，查看注册、首单与奖励进度。", shortDescription: "拉新与奖励", icon: <UserPlus className="size-4" /> },
];

export function sectionsForScope(scope: AccountScope) {
    return profileSections.filter((section) => ACCOUNT_SCOPE_BY_SECTION[section.key] === scope);
}

export const profilePrimaryButtonClass = "profile-primary-button";
export const profileSecondaryButtonClass = "profile-secondary-button";
export const profileDangerButtonClass = "profile-danger-button";

export function ProfileSectionNav({ activeKey, onChange, mode, scope }: { activeKey: ProfileSectionKey; onChange: (key: ProfileSectionKey) => void; mode: "mobile" | "desktop"; scope: AccountScope }) {
    const sections = sectionsForScope(scope);
    const navLabel = scope === "wallet" ? "钱包分区" : "个人中心分区";
    if (mode === "mobile") {
        return (
            <nav className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2 text-card-foreground" aria-label={navLabel}>
                <span className="shrink-0 text-[11px] font-medium text-stone-500 dark:text-stone-400">当前分区</span>
                <Select aria-label={`切换${navLabel}`} className="min-w-0 flex-1" variant="borderless" value={activeKey} options={sections.map((section) => ({ label: section.label, value: section.key }))} onChange={onChange} />
            </nav>
        );
    }

    return (
        <aside className="min-w-0 self-start xl:sticky xl:top-0" aria-label={navLabel}>
            <div className="flex flex-col gap-0.5">
                {sections.map((section) => {
                    const active = section.key === activeKey;
                    return (
                        <button
                            key={section.key}
                            type="button"
                            className={cn(
                                "group relative flex min-w-0 items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-left transition-colors",
                                active ? "bg-[var(--surface-inset)] text-[var(--ink-1)]" : "text-[var(--ink-2)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)]",
                            )}
                            onClick={() => onChange(section.key)}
                        >
                            {/* 选中态改用品牌橙细条：和创作历史、公告那套指示语言一致 */}
                            <span aria-hidden className={cn("absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full transition-opacity", active ? "bg-[var(--brand-500)] opacity-100" : "opacity-0")} />
                            <span className={cn("shrink-0 transition-colors", active ? "text-[var(--ink-1)]" : "text-[var(--ink-3)] group-hover:text-[var(--ink-2)]")}>{section.icon}</span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5">{section.label}</span>
                            {active ? <span className="size-1 shrink-0 rounded-full bg-[var(--brand-500)]" /> : null}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

export function ProfileForm({
    user,
    displayName,
    bio,
    savingProfile,
    onDisplayNameChange,
    onBioChange,
    onSave,
}: {
    user: ReturnType<typeof useUserStore.getState>["user"];
    displayName: string;
    bio: string;
    savingProfile: boolean;
    onDisplayNameChange: (value: string) => void;
    onBioChange: (value: string) => void;
    onSave: () => void;
}) {
    return (
        <div className="max-w-2xl">
            <ProfileAvatarUploader />
            <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
                <label className="block min-w-0 space-y-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">登录用户名</span>
                    <Input value={user?.username || ""} disabled />
                </label>
                <label className="block min-w-0 space-y-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">显示昵称</span>
                    <Input value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} />
                </label>
                <label className="block min-w-0 space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">个人简介</span>
                    <Input.TextArea value={bio} maxLength={160} showCount autoSize={{ minRows: 3, maxRows: 5 }} placeholder="介绍你的创作方向、擅长领域或常用风格" onChange={(event) => onBioChange(event.target.value)} />
                </label>
                <Button className={`${profilePrimaryButtonClass} w-fit sm:col-span-2`} type="primary" icon={<Save className="size-4" />} loading={savingProfile} onClick={onSave}>
                    保存资料
                </Button>
            </div>
        </div>
    );
}

export function AccountEmailForm({
    boundEmail,
    emailChanged,
    email,
    emailCode,
    sendingCode,
    savingEmail,
    onEmailChange,
    onEmailCodeChange,
    onSendEmailCode,
    onSave,
}: {
    boundEmail: string;
    emailChanged: boolean;
    email: string;
    emailCode: string;
    sendingCode: boolean;
    savingEmail: boolean;
    onEmailChange: (value: string) => void;
    onEmailCodeChange: (value: string) => void;
    onSendEmailCode: () => void;
    onSave: () => void;
}) {
    return (
        <div className="max-w-2xl">
            <div>
                <h3 className="text-sm font-semibold text-stone-950 dark:text-white">绑定邮箱</h3>
                <p className="mt-1 break-all text-sm leading-6 text-stone-500 dark:text-stone-400">{boundEmail || "绑定邮箱后可用于找回密码和接收验证码。"}</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block min-w-0 space-y-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{boundEmail ? "修改邮箱" : "绑定邮箱"}</span>
                    <Input value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="请输入邮箱地址" />
                </label>
                <label className="block min-w-0 space-y-2">
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">邮箱验证码</span>
                    <Input.Search
                        className="profile-email-code-search"
                        value={emailCode}
                        onChange={(event) => onEmailCodeChange(event.target.value)}
                        placeholder={emailChanged ? "修改邮箱时必填" : "邮箱未变化时无需填写"}
                        enterButton="获取验证码"
                        loading={sendingCode}
                        disabled={!emailChanged}
                        onSearch={onSendEmailCode}
                    />
                </label>
                <Button className={`${profilePrimaryButtonClass} w-fit sm:col-span-2`} type="primary" icon={<Save className="size-4" />} loading={savingEmail} disabled={!emailChanged || !email.trim()} onClick={onSave}>
                    保存邮箱
                </Button>
            </div>
        </div>
    );
}

export function OrderList({ loading, orders, total, page, onPageChange, compact }: { loading: boolean; orders: BillingOrder[]; total: number; page: number; onPageChange: (page: number) => void; compact?: boolean }) {
    if (loading) return <LoadingBlock />;
    if (!orders.length) return <CompactEmptyState title="暂无订单记录" description="购买套餐后可在这里查看支付状态。" />;
    return (
        <div className="divide-y divide-stone-200 dark:divide-stone-800" role="list">
            {orders.map((order) => (
                <div key={order.id} role="listitem" className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-1.5 text-xs first:pt-0 last:pb-0 sm:min-h-0 sm:gap-3 sm:px-1 sm:py-3 sm:text-sm">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-stone-950 dark:text-white">{order.subject}</div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] leading-4 text-stone-500 sm:mt-1 sm:gap-2 sm:text-xs dark:text-stone-400">
                            <span className={cn("truncate", compact && "hidden sm:inline")}>{order.orderNo}</span>
                            <span className="shrink-0">{formatShortTime(order.createdAt)}</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                        <Tag className="m-0 !px-1 !py-0 text-[10px] leading-[18px] sm:!px-2 sm:text-xs sm:leading-5" color={orderStatusColor(order.status)}>
                            {orderStatusLabel(order.status)}
                        </Tag>
                        <div className="text-xs font-semibold tabular-nums text-stone-900 dark:text-stone-100 sm:text-[13px]">{formatMoney(order.amountCents, order.currency)}</div>
                    </div>
                </div>
            ))}
            {!compact && total > ORDER_PAGE_SIZE ? <Pagination size="small" current={page} pageSize={ORDER_PAGE_SIZE} total={total} showSizeChanger={false} onChange={onPageChange} /> : null}
        </div>
    );
}

export function AccountMetric({ label, value, icon, detail }: { label: string; value: string; icon: ReactNode; detail?: string }) {
    return (
        <div className="rounded-lg bg-stone-50/70 px-2.5 py-2 text-card-foreground xl:rounded-2xl xl:border xl:border-border xl:bg-card xl:p-4 xl:shadow-sm xl:shadow-stone-200/60 dark:bg-stone-900/35 xl:dark:bg-card xl:dark:shadow-black/20">
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-stone-500 xl:text-sm dark:text-stone-400">{label}</div>
                <span className="flex size-5 items-center justify-center text-stone-400 xl:size-8 xl:rounded-xl xl:bg-stone-100 xl:text-stone-700 dark:text-stone-500 xl:dark:bg-stone-900 xl:dark:text-stone-200">{icon}</span>
            </div>
            <div className="mt-1 truncate text-sm font-semibold tracking-normal text-stone-950 xl:mt-3 xl:text-xl dark:text-white">{value}</div>
            {detail ? <div className="mt-0.5 truncate text-[10px] text-stone-500 xl:mt-1 xl:text-xs dark:text-stone-400">{detail}</div> : null}
        </div>
    );
}

export function AccountPanel({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="rounded-lg border border-border bg-card p-2 text-card-foreground sm:rounded-2xl sm:p-5 sm:shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:sm:shadow-black/20">
            <div className="mb-1.5 flex items-start justify-between gap-3 sm:mb-4">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-stone-950 sm:text-lg dark:text-white">{title}</h2>
                    <p className="mt-1 hidden text-sm leading-6 text-stone-500 sm:block dark:text-stone-400">{description}</p>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function LoadingBlock() {
    return (
        <div className="flex min-h-12 items-center justify-center rounded-lg border border-dashed border-stone-200 sm:min-h-24 dark:border-stone-800">
            <Spin size="small" />
        </div>
    );
}

export function RecordList({ records }: { records: PointRecord[] }) {
    return (
        <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {records.map((record) => {
                const positive = record.amount >= 0;
                return (
                    <div key={record.id} className="py-1.5 first:pt-0 last:pb-0 sm:px-1 sm:py-3">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="break-words text-sm font-semibold text-stone-900 dark:text-stone-100">{record.description || pointRecordTypeLabel(record.type)}</div>
                                <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">{formatTime(record.createdAt)}</div>
                            </div>
                            <Tag color={positive ? "green" : "red"} className="m-0 shrink-0">
                                {positive ? "+" : ""}
                                {formatCreditAmount(record.amount)}
                            </Tag>
                        </div>
                        <div className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">余额 {formatCreditAmount(record.balanceAfter)}</div>
                    </div>
                );
            })}
        </div>
    );
}

export function parseProfileSection(value: string | null): ProfileSectionKey {
    return parseScopedSection(value, "profile");
}

export function pointRecordTypeLabel(type: PointRecord["type"]) {
    if (type === "consume") return "模型消费";
    if (type === "refund") return "消费退款";
    if (type === "credit") return "积分充值";
    return "后台调整";
}

export function orderStatusLabel(status: BillingOrderStatus) {
    if (status === "pending") return "待支付";
    if (status === "paid") return "已开通";
    if (status === "refunding") return "退款处理中";
    if (status === "closed") return "已关闭";
    if (status === "canceled") return "已取消";
    return "已退款";
}

export function orderStatusColor(status: BillingOrderStatus) {
    if (status === "pending") return "gold";
    if (status === "paid") return "green";
    if (status === "refunded") return "blue";
    if (status === "refunding") return "orange";
    return "default";
}

export function formatMoney(cents: number, currency = "CNY") {
    const amount = (Number(cents || 0) / 100).toFixed(2);
    if (currency === "CNY") return `¥${amount}`;
    if (currency === "USD") return `$${amount}`;
    return `${amount} ${currency}`;
}

export function formatTime(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", { hour12: false });
}

export function formatShortTime(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
