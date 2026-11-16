"use client";

import { ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SiteLogo } from "@/components/layout/site-logo";
import { isExternalTool, navigationGroups, navigationToolHref, navigationTools, type NavigationToolSlug } from "@/constant/navigation-tools";
import { userAvatarInitial } from "@/lib/user-avatar";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_TITLE, resolveSiteTitle } from "@/lib/site-brand";
import { usePublicSessionStore } from "@/stores/use-public-session-store";
import { useUserStore } from "@/stores/use-user-store";

export function AppSidebar({ activeToolSlug, expanded }: { activeToolSlug?: NavigationToolSlug; expanded: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const site = usePublicSessionStore((state) => state.payload?.settings?.site) || { title: DEFAULT_SITE_TITLE, logoUrl: "/logo.svg" };
    const siteTitle = resolveSiteTitle(site.title);
    const user = useUserStore((state) => state.user);
    const avatarUrl = user?.avatarUrl?.trim();
    const accountName = user?.displayName || user?.username || "未登录";
    const avatarInitial = userAvatarInitial(accountName);
    const accountActive = pathname.startsWith("/profile");

    return (
        <aside className={cn("hidden h-full shrink-0 flex-col bg-[var(--surface-rail)] text-[var(--ink-1)] transition-[width] duration-200 lg:flex", expanded ? "w-52" : "w-[72px]")}>
            <Link href="/create" className={cn("flex h-16 shrink-0 items-center px-3", expanded ? "justify-start px-5" : "justify-center")} aria-label={siteTitle}>
                <SiteLogo logoUrl={site.logoUrl} className="size-8" />
                {expanded ? <span className="ml-3 min-w-0 truncate text-[17px] font-semibold">{siteTitle}</span> : null}
            </Link>

            <nav className={cn("hide-scrollbar min-h-0 flex-1 overflow-y-auto py-3", expanded ? "px-4" : "px-2")} aria-label="工作空间导航">
                {navigationGroups.map((group, groupIndex) => {
                    const tools = navigationTools.filter((tool) => tool.group === group.id);
                    return (
                        <div key={group.id} className={cn(groupIndex > 0 && "mt-4")}>
                            {expanded ? <div className="mb-1 px-2 text-[13px] font-normal text-[var(--ink-3)]">{group.label}</div> : null}
                            <div className="space-y-0.5">
                                {tools.map((tool) => {
                                    const Icon = tool.icon;
                                    const active = tool.slug === activeToolSlug;
                                    const external = isExternalTool(tool);
                                    const href = navigationToolHref(tool);
                                    const className = cn(
                                        "group relative flex h-11 items-center rounded-lg px-2 text-base font-medium transition-colors duration-150",
                                        expanded ? "justify-start gap-3 px-3" : "justify-center",
                                        active ? "bg-[var(--surface-inset)] text-[var(--ink-1)]" : "text-[var(--ink-2)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink-1)]",
                                    );
                                    const content = (
                                        <>
                                            <Icon className={cn("size-5 shrink-0", active && "text-[var(--ink-1)]")} />
                                            {expanded ? <span className="min-w-0 flex-1 truncate">{tool.label}</span> : null}
                                            {expanded && external ? <ExternalLink className="size-3.5 shrink-0 text-[var(--ink-3)]" /> : null}
                                        </>
                                    );
                                    return external ? (
                                        <a key={tool.slug} href={href} target="_blank" rel="noreferrer noopener" title={tool.label} className={className}>
                                            {content}
                                        </a>
                                    ) : (
                                        <Link
                                            key={tool.slug}
                                            href={href}
                                            prefetch
                                            title={tool.label}
                                            onMouseEnter={() => router.prefetch(href)}
                                            onFocus={() => router.prefetch(href)}
                                            className={className}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* 侧栏底部固定账号入口：和右上角账户面板构成双入口，任何页面都能一步回到个人中心。 */}
            <div className={cn("shrink-0 border-t border-[var(--hairline)]", expanded ? "px-3 pb-3 pt-3" : "p-2")}>
                <Link
                    href="/profile"
                    prefetch
                    title={`${accountName} · 个人中心`}
                    onMouseEnter={() => router.prefetch("/profile")}
                    onFocus={() => router.prefetch("/profile")}
                    className={cn(
                        "flex min-h-12 items-center rounded-lg text-[var(--ink-2)] transition-colors duration-150 hover:bg-[var(--surface-inset)] hover:text-[var(--ink-1)]",
                        expanded ? "gap-2.5 px-2" : "justify-center px-2",
                        accountActive && "bg-[var(--surface-inset)] text-[var(--ink-1)]",
                    )}
                    aria-current={accountActive ? "page" : undefined}
                >
                    <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#f6b181_0%,#e2671f_100%)] text-[11px] font-semibold text-white ring-1 ring-black/5 dark:ring-white/15">
                        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : avatarInitial}
                    </span>
                    {expanded ? (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-medium leading-5">{accountName}</span>
                                <span className="block truncate text-[11px] leading-4 text-[var(--ink-3)]">个人中心</span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-[var(--ink-3)]" />
                        </>
                    ) : null}
                </Link>
            </div>
        </aside>
    );
}
