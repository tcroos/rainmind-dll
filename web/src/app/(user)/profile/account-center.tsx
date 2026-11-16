"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Input, Pagination } from "antd";
import { saveAs } from "file-saver";
import { ArrowRight, ArrowUpRight, BookOpenText, CreditCard, Download, History, ReceiptText, RefreshCw, ShieldCheck, Sparkles, TicketPercent, Wallet, WalletCards } from "lucide-react";

import { CreditSymbol, formatCreditAmount } from "@/constant/credits";
import { CompactEmptyState } from "@/components/compact-empty-state";
import { resetClientSessionState } from "@/lib/client-session-reset";
import { downloadUserDataExport } from "@/services/api/user-data-export";
import { BillingPlansModal } from "@/components/billing/billing-plans-modal";
import { cn } from "@/lib/utils";
import { useUserStore, type LocalUser } from "@/stores/use-user-store";

import { accountSectionHref, parseScopedSection, type AccountScope } from "./account-sections";
import { AccountDeletionPanel } from "./account-deletion-panel";
import { AdminMfaPanel } from "./admin-mfa-panel";
import { LoginSecurityPanel } from "./login-security-panel";
import { CouponWalletSection } from "./profile-coupon-wallet";
import { ProfileReferralCenter } from "./profile-referral-center";

import {
    ProfileSectionKey,
    RECORD_PAGE_SIZE,
    profilePrimaryButtonClass,
    profileSecondaryButtonClass,
    profileDangerButtonClass,
    ProfileSectionNav,
    AccountEmailForm,
    ProfileForm,
    OrderList,
    AccountMetric,
    AccountPanel,
    LoadingBlock,
    RecordList,
} from "./profile-elements";
import { useProfileData } from "./use-profile-data";

const SCOPE_COPY: Record<AccountScope, { title: string; description: string }> = {
    wallet: {
        title: "钱包",
        description: "积分余额、套餐充值和账单都在这里，选套餐与支付在一屏内完成。",
    },
    profile: {
        title: "个人中心",
        description: "维护头像昵称、账号安全与个人数据，资金相关的入口统一收在钱包里。",
    },
};

const HELP_SHORTCUTS = [
    { id: "start", label: "快速开始", detail: "五分钟跑通第一条生成", icon: BookOpenText },
    { id: "agent", label: "Agent 创作", detail: "提示词、引用素材与迭代", icon: WalletCards },
    { id: "canvas", label: "画布与短剧", detail: "节点编排与分镜成片", icon: History },
    { id: "account", label: "账户与计费", detail: "积分、套餐与订单说明", icon: CreditCard },
] as const;

export function AccountCenter({ scope }: { scope: AccountScope }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { message } = App.useApp();
    const user = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const requestedSection = parseScopedSection(searchParams.get("section"), scope);
    const [activeSection, setActiveSection] = useState<ProfileSectionKey>(requestedSection);
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [email, setEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [exportingData, setExportingData] = useState(false);
    const [billTab, setBillTab] = useState<"orders" | "points">("orders");
    const [plansOpen, setPlansOpen] = useState(false);
    const { coupons, orders, points, consumption, loading: accountLoading, refresh: refreshAccount } = useProfileData(activeSection);

    const boundEmail = user?.email || "";
    const emailChanged = email.trim().toLowerCase() !== boundEmail.toLowerCase();
    const copy = SCOPE_COPY[scope];

    useEffect(() => {
        setActiveSection(requestedSection);
    }, [requestedSection]);

    useEffect(() => {
        if (!user) return;
        setDisplayName(user.displayName || user.username);
        setBio(user.bio || "");
        setEmail(user.email || "");
    }, [user]);

    const switchSection = (key: ProfileSectionKey) => {
        setActiveSection(key);
        router.replace(accountSectionHref(key, scope), { scroll: false });
    };

    /* 充值走和官网一致的套餐弹窗：不把套餐卡铺进钱包页面。
     * 老链接 /wallet?section=billing 与账户面板的「续费套餐」都用这个参数，
     * 落进来就把弹窗打开，再把地址清成 /wallet。 */
    const wantsRecharge = scope === "wallet" && requestedSection === "billing";
    useEffect(() => {
        if (!wantsRecharge) return;
        setActiveSection("wallet");
        setPlansOpen(true);
        router.replace("/wallet", { scroll: false });
    }, [router, wantsRecharge]);

    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            const response = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName, bio }),
            });
            const payload = (await response.json()) as { user?: LocalUser; error?: string };
            if (!response.ok || !payload.user) throw new Error(payload.error || "保存个人资料失败");
            setUser(payload.user);
            setEmailCode("");
            message.success("个人资料已保存");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "保存个人资料失败");
        } finally {
            setSavingProfile(false);
        }
    };

    const saveEmail = async () => {
        if (!emailChanged || savingEmail) return;
        setSavingEmail(true);
        try {
            const response = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, emailCode }),
            });
            const payload = (await response.json()) as { user?: LocalUser; error?: string };
            if (!response.ok || !payload.user) throw new Error(payload.error || "邮箱更新失败");
            setUser(payload.user);
            setEmailCode("");
            message.success("邮箱已更新");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "邮箱更新失败");
        } finally {
            setSavingEmail(false);
        }
    };

    const sendEmailCode = async () => {
        if (!emailChanged) {
            message.info("邮箱未变化，无需获取验证码");
            return;
        }
        setSendingCode(true);
        try {
            const response = await fetch("/api/auth/email-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purpose: "email-change", email }),
            });
            const payload = (await response.json()) as { error?: string };
            if (!response.ok) throw new Error(payload.error || "验证码发送失败");
            message.success("验证码已发送，请查看邮箱");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "验证码发送失败");
        } finally {
            setSendingCode(false);
        }
    };

    const savePassword = async () => {
        setSavingPassword(true);
        try {
            const response = await fetch("/api/auth/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const payload = (await response.json()) as { error?: string };
            if (!response.ok) throw new Error(payload.error || "修改密码失败");
            await resetClientSessionState();
            message.success("密码已修改，请重新登录");
            window.location.href = "/login";
        } catch (error) {
            message.error(error instanceof Error ? error.message : "修改密码失败");
        } finally {
            setSavingPassword(false);
        }
    };

    const exportUserData = async () => {
        setExportingData(true);
        try {
            const result = await downloadUserDataExport();
            saveAs(result.blob, result.fileName);
            message.success("个人数据已导出");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "个人数据导出失败");
        } finally {
            setExportingData(false);
        }
    };

    const permanentPoints = user?.permanentPointsBalance ?? user?.pointsBalance ?? 0;
    const planLabel = user?.planName || user?.planId || "未开通套餐";

    return (
        <main className="profile-page-scroll h-full min-h-0 overflow-x-hidden overflow-y-auto px-2 py-2 text-foreground sm:px-6 sm:py-6" style={{ backgroundColor: "var(--background)" }} data-testid={`account-center-${scope}`}>
            <div className="mx-auto w-full max-w-[1280px] pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(2rem+env(safe-area-inset-bottom))]">
                {/* 两页共用一条紧凑标题：页头已经写着页面名，这里不再套一张大卡片 */}
                <div className="mb-2 flex items-start justify-between gap-3 sm:mb-5">
                    <div className="min-w-0">
                        <h1 className="text-[20px] font-semibold leading-7 tracking-tight text-[var(--ink-1)] sm:text-[22px]">{copy.title}</h1>
                        <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-3)] sm:truncate sm:text-[12.5px]">{copy.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5">
                        <Button size="small" className={profileSecondaryButtonClass} icon={<RefreshCw className="size-3.5 sm:size-4" />} loading={accountLoading} onClick={() => void refreshAccount()}>
                            <span className="hidden sm:inline">刷新</span>
                        </Button>
                        {scope === "wallet" ? null : (
                            <Button size="small" className={profilePrimaryButtonClass} type="primary" icon={<Wallet className="size-3.5 sm:size-4" />} onClick={() => router.push("/wallet")}>
                                <span className="sm:hidden">钱包</span>
                                <span className="hidden sm:inline">前往钱包</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mb-1.5 xl:hidden sm:mb-5">
                    <ProfileSectionNav activeKey={activeSection} onChange={switchSection} mode="mobile" scope={scope} />
                </div>

                {scope === "wallet" && activeSection === "wallet" ? (
                    /* 钱包首屏：一张「卡」讲清余额，下面一条四格入口，
                     * 再往下直接就是套餐——把最重要的两个动作放在同一屏。 */
                    <section data-testid="wallet-balance-card" className="relative mb-2 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-card sm:mb-5">
                        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(226,103,31,0.16), transparent 68%)" }} />
                        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-[12px] leading-5 text-[var(--ink-3)]">
                                    <CreditSymbol className="text-[var(--brand-600)]" />
                                    可用积分
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
                                    <span className="text-[38px] font-semibold leading-none tabular-nums text-[var(--ink-1)] sm:text-[44px]">{formatCreditAmount(user?.pointsBalance || 0)}</span>
                                    <span className="pb-1 text-[12px] text-[var(--ink-3)]">积分</span>
                                    <span className="mb-1.5 inline-flex h-6 items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 text-[11px] font-medium text-[var(--brand-600)]">
                                        <Sparkles className="size-3" />
                                        {planLabel}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[var(--ink-3)]">
                                    <span>
                                        今日可用 <span className="font-semibold tabular-nums text-[var(--ink-1)]">{formatCreditAmount(user?.dailyPointsBalance || 0)}</span>
                                    </span>
                                    <span aria-hidden className="h-3 w-px bg-[var(--hairline)]" />
                                    <span>
                                        永久 <span className="font-semibold tabular-nums text-[var(--ink-1)]">{formatCreditAmount(permanentPoints)}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Button type="primary" className={profilePrimaryButtonClass} icon={<CreditCard className="size-4" />} onClick={() => setPlansOpen(true)}>
                                    立即充值
                                </Button>
                                <Button className={profileSecondaryButtonClass} icon={<TicketPercent className="size-4" />} onClick={() => switchSection("coupons")}>
                                    优惠券
                                </Button>
                            </div>
                        </div>

                        <div className="relative grid grid-cols-2 gap-px bg-[var(--hairline)] sm:grid-cols-4">
                            {[
                                { key: "orders" as ProfileSectionKey, label: "订单记录", value: `${orders.total} 笔`, icon: ReceiptText },
                                { key: "points" as ProfileSectionKey, label: "积分流水", value: `${points.total} 条`, icon: CreditSymbol },
                                { key: "consume" as ProfileSectionKey, label: "消费记录", value: `${consumption.total} 条`, icon: History },
                                { key: "referrals" as ProfileSectionKey, label: "邀请有礼", value: "赚积分", icon: ArrowUpRight },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => switchSection(item.key)}
                                        className="group flex min-w-0 items-center gap-2.5 bg-card px-4 py-3 text-left transition-colors hover:bg-[var(--surface-soft)]"
                                    >
                                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-inset)] text-[var(--ink-3)] transition-colors group-hover:text-[var(--ink-1)]">
                                            <Icon className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-semibold leading-5 tabular-nums text-[var(--ink-1)]">{item.value}</span>
                                            <span className="block truncate text-[11px] leading-4 text-[var(--ink-3)]">{item.label}</span>
                                        </span>
                                        <ArrowRight className="size-3.5 shrink-0 text-transparent transition-colors group-hover:text-[var(--ink-3)]" />
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ) : null}

                <div className="grid min-w-0 gap-1.5 sm:gap-5 xl:grid-cols-[210px_minmax(0,1fr)]">
                    <div className="hidden xl:block">
                        <ProfileSectionNav activeKey={activeSection} onChange={switchSection} mode="desktop" scope={scope} />
                    </div>
                    <div className="min-w-0 space-y-1.5 sm:space-y-5">
                        {/* 钱包概览：只有一张账单卡，充值是弹窗，不占页面 */}
                        {activeSection === "wallet" ? (
                            <section className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-card" data-testid="wallet-bills">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-5">
                                    <div className="min-w-0">
                                        <h2 className="text-[15px] font-semibold leading-6 text-[var(--ink-1)]">账单</h2>
                                        <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-3)]">最近的充值订单与积分变动。</p>
                                    </div>
                                    <div className="flex items-center gap-0.5 rounded-lg bg-[var(--surface-inset)] p-0.5" role="tablist" aria-label="账单类型">
                                        {[
                                            { key: "orders" as const, label: "订单" },
                                            { key: "points" as const, label: "积分" },
                                        ].map((tab) => {
                                            const active = billTab === tab.key;
                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={active}
                                                    onClick={() => setBillTab(tab.key)}
                                                    className={cn(
                                                        "h-7 rounded-md px-3 text-[12px] font-medium transition-colors",
                                                        active ? "bg-card text-[var(--ink-1)] shadow-[0_1px_3px_rgba(32,36,42,0.08)] dark:bg-[#2f343b]" : "text-[var(--ink-3)] hover:text-[var(--ink-1)]",
                                                    )}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="px-4 pb-3 pt-3 sm:px-6 sm:pb-4">
                                    {billTab === "orders" ? (
                                        <OrderList loading={orders.loading} orders={orders.items.slice(0, 6)} total={orders.total} page={orders.page} onPageChange={orders.setPage} compact />
                                    ) : points.loading ? (
                                        <LoadingBlock />
                                    ) : points.items.length ? (
                                        <RecordList records={points.items.slice(0, 6)} />
                                    ) : (
                                        <CompactEmptyState title="暂无积分记录" description="每日积分、充值和模型消费记录会显示在这里。" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => switchSection(billTab)}
                                    className="flex w-full items-center justify-center gap-1 border-t border-[var(--hairline)] py-2.5 text-[12px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)]"
                                >
                                    查看全部{billTab === "orders" ? "订单" : "积分记录"}
                                    <ArrowRight className="size-3.5" />
                                </button>
                            </section>
                        ) : null}

                        {/* 个人中心概览：只讲账号，不摆账本 */}
                        {scope === "profile" && activeSection === "overview" ? (
                            <div className="space-y-1.5 sm:space-y-5">
                                <section className="grid grid-cols-2 gap-1.5 sm:gap-3 xl:grid-cols-4">
                                    <AccountMetric label="账号 ID" value={user?.accountId || "—"} icon={<WalletCards className="size-4" />} />
                                    <AccountMetric label="绑定邮箱" value={user?.email || "未绑定"} icon={<ReceiptText className="size-4" />} />
                                    <AccountMetric label="登录保护" value={user?.mfaEnabled ? "已开启 MFA" : "仅密码"} icon={<ShieldCheck className="size-4" />} />
                                    <AccountMetric label="账户状态" value={user?.status === "active" ? "正常" : user?.status || "未知"} icon={<CreditSymbol className="text-base" />} />
                                </section>
                                <div className="grid gap-1.5 sm:gap-5 lg:grid-cols-2">
                                    <AccountPanel title="常用入口" description="资料、安全、帮助与钱包分别从这里进入。">
                                        <div className="grid gap-1.5 sm:grid-cols-2">
                                            {[
                                                { label: "个人资料", detail: "头像、昵称与简介", key: "profile" as ProfileSectionKey, icon: WalletCards },
                                                { label: "账户与安全", detail: "邮箱、密码与数据", key: "security" as ProfileSectionKey, icon: ShieldCheck },
                                                { label: "帮助中心", detail: "使用指南与常见问题", key: "help" as ProfileSectionKey, icon: BookOpenText },
                                            ].map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={() => switchSection(item.key)}
                                                        className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[var(--hairline)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-inset)]"
                                                    >
                                                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-inset)] text-stone-500 dark:text-stone-400">
                                                            <Icon className="size-4" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-[13px] font-medium text-stone-900 dark:text-stone-100">{item.label}</span>
                                                            <span className="block truncate text-[11px] text-stone-500 dark:text-stone-400">{item.detail}</span>
                                                        </span>
                                                        <ArrowRight className="size-3.5 shrink-0 text-stone-400" />
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={() => router.push("/wallet")}
                                                className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[var(--hairline)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-inset)]"
                                            >
                                                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-600)]">
                                                    <Wallet className="size-4" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[13px] font-medium text-stone-900 dark:text-stone-100">钱包与充值</span>
                                                    <span className="block truncate text-[11px] text-stone-500 dark:text-stone-400">积分、套餐与订单</span>
                                                </span>
                                                <ArrowRight className="size-3.5 shrink-0 text-stone-400" />
                                            </button>
                                        </div>
                                    </AccountPanel>
                                    <AccountPanel title="账号资料" description="这些信息会展示在作品广场与个人主页。">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f6b181_0%,#e2671f_100%)] text-[15px] font-semibold text-white">
                                                {Array.from(displayName.trim() || user?.username || "U")[0]?.toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="truncate text-[14px] font-semibold text-stone-900 dark:text-stone-100">{displayName || user?.username || "未设置"}</div>
                                                <div className="mt-0.5 truncate text-[12px] text-stone-500 dark:text-stone-400">@{user?.username || "—"}</div>
                                            </div>
                                        </div>
                                        <p className="mt-3 line-clamp-2 text-[12.5px] leading-6 text-stone-500 dark:text-stone-400">{bio || "还没有填写个人简介，去「个人资料」补一句介绍。"}</p>
                                    </AccountPanel>
                                </div>
                            </div>
                        ) : null}

                        {activeSection === "profile" ? (
                            <AccountPanel title="个人资料" description="更换头像、修改显示昵称和个人简介。">
                                <ProfileForm user={user} displayName={displayName} bio={bio} savingProfile={savingProfile} onDisplayNameChange={setDisplayName} onBioChange={setBio} onSave={() => void saveProfile()} />
                            </AccountPanel>
                        ) : null}

                        {activeSection === "coupons" ? (
                            <CouponWalletSection
                                coupons={coupons.items}
                                templates={coupons.templates}
                                templatesTotal={coupons.templatesTotal}
                                templatePage={coupons.templatePage}
                                total={coupons.total}
                                page={coupons.page}
                                loading={coupons.loading}
                                onRefresh={coupons.refresh}
                                onTemplatePageChange={coupons.setTemplatePage}
                                onPageChange={coupons.setPage}
                                onClaimed={coupons.refreshAfterClaim}
                            />
                        ) : null}

                        {activeSection === "referrals" ? <ProfileReferralCenter /> : null}

                        {activeSection === "orders" ? (
                            <AccountPanel title="订单记录" description="查看充值订单、支付渠道、订单状态和套餐开通结果。">
                                <OrderList loading={orders.loading} orders={orders.items} total={orders.total} page={orders.page} onPageChange={orders.setPage} />
                            </AccountPanel>
                        ) : null}

                        {activeSection === "consume" ? (
                            <AccountPanel title="消费记录" description="展示最近扣除积分的模型调用、生成任务和接口消费。">
                                {consumption.loading ? (
                                    <LoadingBlock />
                                ) : consumption.items.length ? (
                                    <>
                                        <RecordList records={consumption.items} />
                                        {consumption.total > RECORD_PAGE_SIZE ? <Pagination size="small" current={consumption.page} pageSize={RECORD_PAGE_SIZE} total={consumption.total} showSizeChanger={false} onChange={consumption.setPage} /> : null}
                                    </>
                                ) : (
                                    <CompactEmptyState title="暂无消费记录" description="产生模型调用或生成任务后会显示在这里。" />
                                )}
                            </AccountPanel>
                        ) : null}

                        {activeSection === "points" ? (
                            <AccountPanel title="积分记录" description="每日积分、充值赠送、管理员调整和失败退回都会出现在这里。">
                                {points.loading ? (
                                    <LoadingBlock />
                                ) : points.items.length ? (
                                    <>
                                        <RecordList records={points.items} />
                                        {points.total > RECORD_PAGE_SIZE ? <Pagination size="small" current={points.page} pageSize={RECORD_PAGE_SIZE} total={points.total} showSizeChanger={false} onChange={points.setPage} /> : null}
                                    </>
                                ) : (
                                    <CompactEmptyState title="暂无积分记录" description="积分变化会按时间记录在这里。" />
                                )}
                            </AccountPanel>
                        ) : null}

                        {activeSection === "help" ? (
                            <AccountPanel title="帮助中心" description="先看这几篇能解决大部分问题，需要更多内容可以打开完整帮助中心。">
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                    {HELP_SHORTCUTS.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <a
                                                key={item.id}
                                                href={`/help?section=${item.id}`}
                                                className="flex min-w-0 items-center gap-2.5 rounded-lg border border-[var(--hairline)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-inset)]"
                                            >
                                                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-inset)] text-stone-500 dark:text-stone-400">
                                                    <Icon className="size-4" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[13px] font-medium text-stone-900 dark:text-stone-100">{item.label}</span>
                                                    <span className="block truncate text-[11px] text-stone-500 dark:text-stone-400">{item.detail}</span>
                                                </span>
                                                <ArrowRight className="size-3.5 shrink-0 text-stone-400" />
                                            </a>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
                                    <a
                                        href="/help"
                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--surface-inset)] px-3 text-[12.5px] font-medium text-[var(--ink-1)] transition hover:opacity-85"
                                    >
                                        打开完整帮助中心
                                        <ArrowUpRight className="size-3.5" />
                                    </a>
                                    <span className="text-[11.5px] text-stone-500 dark:text-stone-400">账号或支付问题也可以直接联系站点管理员。</span>
                                </div>
                            </AccountPanel>
                        ) : null}

                        {activeSection === "security" ? (
                            <AccountPanel title="账户与安全" description="管理绑定邮箱、登录密码和个人数据。">
                                <div className="max-w-2xl space-y-6">
                                    <AccountEmailForm
                                        boundEmail={boundEmail}
                                        emailChanged={emailChanged}
                                        email={email}
                                        emailCode={emailCode}
                                        sendingCode={sendingCode}
                                        savingEmail={savingEmail}
                                        onEmailChange={setEmail}
                                        onEmailCodeChange={setEmailCode}
                                        onSendEmailCode={() => void sendEmailCode()}
                                        onSave={() => void saveEmail()}
                                    />

                                    <AdminMfaPanel />

                                    <LoginSecurityPanel />

                                    <div className="max-w-xl space-y-4 border-t border-stone-200 pt-5 dark:border-stone-800">
                                        <div>
                                            <h3 className="text-sm font-semibold text-stone-950 dark:text-white">登录密码</h3>
                                            <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">修改密码后会退出当前登录，需要使用新密码重新登录。</p>
                                        </div>
                                        <label className="block space-y-2">
                                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">当前密码</span>
                                            <Input.Password value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                                        </label>
                                        <label className="block space-y-2">
                                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">新密码</span>
                                            <Input.Password value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="至少 8 位" />
                                        </label>
                                        <Button danger className={profileDangerButtonClass} loading={savingPassword} icon={<ShieldCheck className="size-4" />} onClick={() => void savePassword()}>
                                            修改密码并重新登录
                                        </Button>
                                    </div>

                                    <div className="border-t border-stone-200 pt-5 dark:border-stone-800">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold text-stone-950 dark:text-white">个人数据</h3>
                                                <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">导出账户、积分、订单和创作记录。媒体原文件与安全凭据不包含在 JSON 中。</p>
                                            </div>
                                            <Button className={`${profileSecondaryButtonClass} shrink-0`} loading={exportingData} icon={<Download className="size-4" />} onClick={() => void exportUserData()}>
                                                导出我的数据
                                            </Button>
                                        </div>
                                    </div>
                                    <AccountDeletionPanel />
                                </div>
                            </AccountPanel>
                        ) : null}
                    </div>
                </div>
            </div>
            <BillingPlansModal
                open={plansOpen}
                onClose={() => setPlansOpen(false)}
                onSelect={(product) => {
                    setPlansOpen(false);
                    router.push(`/billing/checkout?product=${encodeURIComponent(product.id)}`);
                }}
            />
        </main>
    );
}
