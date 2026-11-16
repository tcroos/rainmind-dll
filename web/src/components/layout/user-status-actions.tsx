"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, CircleHelp, CreditCard, Crown, Gift, Globe, Keyboard, LogOut, ShieldCheck, UserCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button, Input, Popover } from "antd";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { AnnouncementNotificationCenter } from "@/components/layout/announcement-notification-center";
import { CreditSymbol, formatCreditAmount } from "@/constant/credits";
import { cn } from "@/lib/utils";
import { userAvatarInitial } from "@/lib/user-avatar";
import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUserStore, type LocalUser } from "@/stores/use-user-store";
import { resetClientSessionState } from "@/lib/client-session-reset";

type UserStatusActionsProps = {
    variant?: "default" | "canvas";
    onOpenShortcuts?: () => void;
    initialUser?: LocalUser;
};

export function UserStatusActions({ variant = "default", onOpenShortcuts, initialUser }: UserStatusActionsProps) {
    const router = useRouter();
    const { message } = App.useApp();
    const [pointsOpen, setPointsOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [isCompactViewport, setIsCompactViewport] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const storeUser = useUserStore((state) => state.user);
    const user = storeUser || initialUser || null;
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const canvasTheme = canvasThemes[theme];
    const defaultControlClass =
        "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[#e6e9ed] bg-white text-sm font-medium text-[#59616c] transition hover:border-[#d9dde3] hover:bg-[#f3f5f7] hover:text-[#20242a] dark:border-[#2c3138] dark:bg-[#181b20] dark:text-[#b7bec8] dark:hover:border-[#3b424c] dark:hover:bg-[#22262c] dark:hover:text-white";
    const canvasControlClass =
        "inline-flex h-9 shrink-0 items-center justify-center rounded-xl border px-2.5 text-sm font-medium shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 [&_svg]:size-4";
    const canvasIconClass = cn(canvasControlClass, "w-9 px-0");
    const canvasControlStyle: CSSProperties | undefined =
        variant === "canvas"
            ? {
                  background: canvasTheme.toolbar.panel,
                  borderColor: canvasTheme.toolbar.border,
                  boxShadow: theme === "dark" ? "0 10px 30px rgba(0,0,0,.28)" : "0 10px 24px rgba(28,25,23,.08)",
                  color: canvasTheme.toolbar.item,
              }
            : undefined;
    const naturalIconClass = variant === "canvas" ? canvasIconClass : cn(defaultControlClass, "w-8 px-0 [&_svg]:size-4");
    const iconStyle: CSSProperties | undefined = variant === "canvas" ? canvasControlStyle : undefined;
    const avatarUrl = user?.avatarUrl?.trim();
    /* 默认头像：一个字 + 品牌橙渐变。原来的「两个汉字 + 灰底」在 32px 里
     * 既挤又像本地开发的占位图，尤其是深色态那块白圆。 */
    const avatarInitial = userAvatarInitial(user?.displayName || user?.username || "用户");
    const accountName = user?.displayName || user?.username || "用户";
    const accountSecondary = user ? `ID：${user.accountId}` : "";
    const planActionLabel = user?.hasActivePlan ? "续费套餐" : "升级套餐";
    useEffect(() => {
        if (user?.role === "admin") router.prefetch("/admin");
        if (user) {
            router.prefetch("/canvas");
            router.prefetch("/profile");
        }
    }, [router, user]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 520px)");
        const syncViewport = () => setIsCompactViewport(mediaQuery.matches);
        syncViewport();
        mediaQuery.addEventListener("change", syncViewport);
        return () => mediaQuery.removeEventListener("change", syncViewport);
    }, []);

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            await resetClientSessionState();
            router.replace("/login");
            router.refresh();
        } catch (error) {
            message.error(error instanceof Error ? error.message : "退出登录失败");
        }
    };

    useEffect(() => {
        if (variant !== "canvas" || (!pointsOpen && !accountOpen)) return;
        const closeCanvasPopups = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (rootRef.current?.contains(target)) return;
            if (target instanceof Element && target.closest(".user-points-popover, .account-menu-popover, .ant-popover, .ant-dropdown, .ant-dropdown-menu, .ant-dropdown-menu-submenu, .ant-dropdown-menu-submenu-popup")) {
                return;
            }
            setPointsOpen(false);
            setAccountOpen(false);
        };
        document.addEventListener("pointerdown", closeCanvasPopups, true);
        return () => document.removeEventListener("pointerdown", closeCanvasPopups, true);
    }, [variant, pointsOpen, accountOpen]);

    const handleAccountOpenChange = (open: boolean) => {
        setAccountOpen(open);
        if (open) setPointsOpen(false);
    };

    const pointsButton = user ? (
        <button
            type="button"
            className={cn(variant === "canvas" ? canvasControlClass : defaultControlClass, "gap-1 px-2 text-xs font-semibold sm:gap-1.5 sm:px-2.5", variant === "canvas" ? "canvas-points-action" : "app-points-action shrink-0")}
            style={iconStyle}
            title="积分余额"
        >
            <CreditSymbol className="text-sm" />
            {formatCreditAmount(user.pointsBalance)}
        </button>
    ) : null;

    return (
        <div ref={rootRef} className={cn("user-status-actions inline-flex max-w-full items-center gap-1.5 sm:gap-2", variant === "canvas" ? "canvas-user-status-actions shrink-0" : "app-user-status-actions min-w-0")}>
            {user ? (
                <Popover
                    rootClassName="user-points-popover"
                    open={pointsOpen}
                    onOpenChange={(open) => {
                        setPointsOpen(open);
                        if (open) setAccountOpen(false);
                    }}
                    trigger="click"
                    placement="bottomRight"
                    content={
                        <PointsSummaryPanel
                            user={user}
                            onClose={() => setPointsOpen(false)}
                        />
                    }
                >
                    {pointsButton}
                </Popover>
            ) : null}
            <AnnouncementNotificationCenter
                compact={isCompactViewport}
                buttonClassName={cn(naturalIconClass, variant === "canvas" ? "canvas-notification-action" : "app-notification-action")}
                buttonStyle={iconStyle}
                onOpen={() => {
                    setPointsOpen(false);
                    setAccountOpen(false);
                }}
            />
            <AnimatedThemeToggler
                theme={theme}
                onThemeChange={setTheme}
                className={cn(naturalIconClass, variant === "canvas" && "canvas-theme-action")}
                style={iconStyle}
                aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
                title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
            />
            {user ? (
                <>
                    <Popover
                        rootClassName="account-menu-popover"
                        open={accountOpen}
                        onOpenChange={handleAccountOpenChange}
                        trigger="click"
                        placement="bottomRight"
                        arrow={false}
                        content={
                            <AccountMenuPanel
                                user={user}
                                avatarUrl={avatarUrl}
                                avatarInitial={avatarInitial}
                                onNavigate={(href) => {
                                    setAccountOpen(false);
                                    router.push(href);
                                }}
                                onLogout={() => {
                                    setAccountOpen(false);
                                    void logout();
                                }}
                            />
                        }
                    >
                        <button
                            type="button"
                            className={cn(
                                variant === "canvas" ? canvasControlClass : defaultControlClass,
                                variant === "canvas"
                                    ? "canvas-account-action size-9 rounded-full border-0 bg-transparent p-0 hover:bg-transparent"
                                    : "app-account-action size-8 rounded-full border-0 bg-transparent p-0 hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
                            )}
                            style={iconStyle}
                            aria-label="账户菜单"
                            title={user.displayName || user.username}
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="size-full rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                <span
                                    aria-hidden="true"
                                    className="user-avatar-fallback grid size-full place-items-center rounded-full bg-[linear-gradient(135deg,#f6b181_0%,#e2671f_100%)] text-[12px] font-semibold leading-none text-white ring-1 ring-black/5 transition hover:brightness-105 dark:ring-white/15"
                                >
                                    {avatarInitial}
                                </span>
                            )}
                        </button>
                    </Popover>
                </>
            ) : (
                <Link href="/login" className={cn(variant === "canvas" ? canvasControlClass : defaultControlClass, "gap-2 px-2.5", variant === "canvas" && "canvas-account-action")} style={iconStyle}>
                    <UserCircle className="size-4" />
                    <span className="hidden sm:inline">登录</span>
                </Link>
            )}
            {onOpenShortcuts ? (
                <button type="button" className={cn(naturalIconClass, variant === "canvas" && "canvas-shortcuts-action")} style={iconStyle} onClick={onOpenShortcuts} aria-label="快捷键" title="快捷键">
                    <Keyboard className="size-4" />
                </button>
            ) : null}
        </div>
    );
}

function PointsSummaryPanel({ user, onClose }: { user: LocalUser; onClose: () => void }) {
    const { message } = App.useApp();
    const setUser = useUserStore((state) => state.setUser);
    const [code, setCode] = useState("");
    const [redeeming, setRedeeming] = useState(false);
    const [recordTotal, setRecordTotal] = useState<number>();
    useEffect(() => {
        let active = true;
        void fetch("/api/points?page=1&pageSize=1", { cache: "no-store" })
            .then((response) => response.json())
            .then((payload: { total?: number }) => {
                if (active && Number.isFinite(payload.total)) setRecordTotal(Number(payload.total));
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [user.id]);
    const redeemCode = async () => {
        const value = code.trim();
        if (!value || redeeming) return;
        setRedeeming(true);
        try {
            const response = await fetch("/api/cdk/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: value }),
            });
            const payload = (await response.json()) as { user?: LocalUser; points?: number; error?: string };
            if (!response.ok || !payload.user) throw new Error(payload.error || "兑换失败");
            setUser(payload.user);
            setCode("");
            message.success(`兑换成功，获得 ${formatCreditAmount(payload.points || 0)} 积分`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "兑换失败");
        } finally {
            setRedeeming(false);
        }
    };

    const permanentPoints = user.permanentPointsBalance ?? Math.max(0, user.pointsBalance - (user.dailyPointsBalance || 0));
    return (
        <div className="user-points-panel w-[min(19rem,calc(100vw-2rem))] text-[var(--ink-1)]">
            <div className="flex items-end justify-between gap-3 px-0.5">
                <div className="min-w-0">
                    <div className="text-[11.5px] leading-4 text-[var(--ink-3)]">当前积分</div>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                        <CreditSymbol className="size-4 self-center text-[var(--brand-600)]" />
                        <span className="text-[26px] font-semibold leading-7 tabular-nums">{formatCreditAmount(user.pointsBalance)}</span>
                    </div>
                </div>
                <div className="shrink-0 pb-1 text-right text-[11px] leading-[18px] text-[var(--ink-3)]">
                    <div>
                        今日可用 <strong className="font-medium tabular-nums text-[var(--ink-2)]">{formatCreditAmount(user.dailyPointsBalance || 0)}</strong>
                    </div>
                    <div>
                        永久 <strong className="font-medium tabular-nums text-[var(--ink-2)]">{formatCreditAmount(permanentPoints)}</strong>
                    </div>
                </div>
            </div>

            <div className="mt-3 border-t border-[var(--hairline)] pt-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium">
                        <Gift className="size-3.5 text-[var(--brand-600)]" /> CDK 兑换
                    </span>
                    <span className="truncate text-[10.5px] text-[var(--ink-3)]">{recordTotal === undefined ? "兑换后自动到账" : `共 ${recordTotal} 条积分记录`}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                    <Input value={code} size="middle" className="min-w-0 flex-1" placeholder="输入兑换密钥" aria-label="CDK 兑换密钥" onChange={(event) => setCode(event.target.value)} onPressEnter={() => void redeemCode()} />
                    <Button type="primary" className="!h-9 !shrink-0 !px-3 !text-[12.5px]" loading={redeeming} onClick={() => void redeemCode()}>
                        兑换
                    </Button>
                </div>
            </div>

            <div className="mt-3.5 flex flex-col gap-1">
                <Link
                    href="/wallet"
                    onClick={onClose}
                    className="points-summary-purchase flex h-9 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-3 text-[12.5px] font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-[#18181b]"
                >
                    <CreditCard className="size-4" />
                    去钱包充值
                </Link>
                <Link
                    href="/wallet?section=consume"
                    onClick={onClose}
                    className="flex h-9 items-center justify-between rounded-lg px-2 text-[12.5px] font-medium text-[var(--ink-2)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)]"
                >
                    使用详情
                    <ChevronRight className="size-4 text-[var(--ink-3)]" />
                </Link>
            </div>
        </div>
    );
}

/**
 * 账户菜单：整块自定义面板，不再走 antd 的 Dropdown menu。
 * 菜单项之间去掉一条条分割线，靠留白分组；套餐信息收成一块浅底卡片，
 * 续费按钮从黄底改成跟随主题的黑/白小胶囊。
 */
function AccountMenuPanel({
    user,
    avatarUrl,
    avatarInitial,
    onNavigate,
    onLogout,
}: {
    user: LocalUser;
    avatarUrl?: string;
    avatarInitial: string;
    onNavigate: (href: string) => void;
    onLogout: () => void;
}) {
    const accountName = user.displayName || user.username || "用户";
    const planLabel = user.planName || user.planId || "免费版";
    const planActionLabel = user.hasActivePlan ? "续费套餐" : "升级套餐";
    const rows = [
        { key: "profile", label: "个人中心", icon: UserCircle, href: "/profile" },
        { key: "wallet", label: "钱包", icon: Wallet, href: "/wallet" },
        { key: "help", label: "帮助中心", icon: CircleHelp, href: "/help" },
        ...(user.role === "admin" ? [{ key: "admin", label: "管理员后台", icon: ShieldCheck, href: "/admin" }] : []),
        { key: "site", label: "官网首页", icon: Globe, href: "/" },
    ];
    return (
        <div className="w-[min(18.5rem,calc(100vw-2rem))] text-[var(--ink-1)]">
            <div className="flex items-center gap-2.5 px-0.5">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/15">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <span className="grid size-full place-items-center bg-[linear-gradient(135deg,#f6b181_0%,#e2671f_100%)] text-[13px] font-semibold text-white">{avatarInitial}</span>
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold leading-5">{accountName}</div>
                    <div className="mt-0.5 truncate text-[11px] leading-4 text-[var(--ink-3)]">ID：{user.accountId}</div>
                </div>
            </div>

            <div className="mt-3 rounded-xl bg-[var(--surface-inset)] p-2.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-[10.5px] leading-4 text-[var(--ink-3)]">当前套餐</div>
                        <div className="mt-0.5 truncate text-[13px] font-semibold leading-5">{planLabel}</div>
                    </div>
                    <button
                        type="button"
                        /* 按钮文字色走内联样式：全局有未分层级的 `button { color: inherit }`，
                           Tailwind 的 text-* 在 @layer 里会被它压掉，黑底黑字就这么来的。 */
                        style={{ color: "var(--surface-panel)" }}
                        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-[#18181b] px-2.5 text-[11px] font-semibold transition hover:opacity-90 dark:bg-[#ffffff]"
                        onClick={() => onNavigate("/wallet")}
                        aria-label={planActionLabel}
                        title={planActionLabel}
                    >
                        <Crown className="size-3" /> {planActionLabel}
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 text-[11px] text-[var(--ink-3)] dark:border-white/10">
                    <span>积分余额</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--ink-1)]">
                        <CreditSymbol className="text-[var(--brand-600)]" />
                        {formatCreditAmount(user.pointsBalance)}
                    </span>
                </div>
            </div>

            <div className="mt-2 flex flex-col">
                {rows.map((row) => {
                    const Icon = row.icon;
                    return (
                        <button
                            key={row.key}
                            type="button"
                            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[12.5px] font-medium text-[var(--ink-1)] transition hover:bg-[var(--surface-soft)]"
                            onClick={() => onNavigate(row.href)}
                        >
                            <Icon className="size-4 shrink-0 text-[var(--ink-3)]" />
                            {row.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 border-t border-[var(--hairline)] pt-2">
                <button
                    type="button"
                    className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[12.5px] font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    onClick={onLogout}
                >
                    <LogOut className="size-4 shrink-0" />
                    退出登录
                </button>
            </div>
        </div>
    );
}
