"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { AnnouncementMarquee } from "@/components/layout/announcement-marquee";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { isFullscreenWorkspacePath } from "@/components/layout/app-workspace-path";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { SiteLogo } from "@/components/layout/site-logo";
import { UserStatusActions } from "@/components/layout/user-status-actions";
import { navigationToolForPathname } from "@/constant/navigation-tools";
import { DEFAULT_SITE_TITLE, resolveSiteTitle } from "@/lib/site-brand";
import { usePublicSessionStore } from "@/stores/use-public-session-store";

const PAGE_TITLES: Record<string, string> = {
    billing: "充值中心",
    wallet: "钱包",
    help: "帮助中心",
    profile: "个人中心",
};

export function AppWorkspaceShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const site = usePublicSessionStore((state) => state.payload?.settings?.site) || { title: DEFAULT_SITE_TITLE, logoUrl: "/logo.svg" };
    const siteTitle = resolveSiteTitle(site.title);
    const tool = navigationToolForPathname(pathname);
    const fullscreen = isFullscreenWorkspacePath(pathname);
    const rootSlug = pathname.split("/").filter(Boolean)[0] || "";
    const pageTitle = tool?.label || PAGE_TITLES[rootSlug] || "工作空间";
    /* 创作页要「背景顶到最上面」：页头是透明的，如果背景画在 <main> 里，
     * 就只能从页头下沿开始，64px 处会留一道横向接缝。
     * 所以把环境光挂到外壳这一层：外壳 isolate 成一个层叠上下文，
     * 背景走 z-index:-1，正好压在底色之上、页头/侧栏/内容之下。 */
    const ambientBackdrop = rootSlug === "create";

    if (fullscreen) return <div className="h-dvh min-h-0 overflow-hidden">{children}</div>;

    return (
        <div className="workspace-shell relative isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-[var(--surface-canvas)] text-foreground">
            {ambientBackdrop ? <div className="create-ambient" aria-hidden data-testid="create-ambient" /> : null}
            <AnnouncementMarquee />
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                <AppSidebar activeToolSlug={tool?.slug} expanded={sidebarExpanded} />
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 px-3 sm:px-4 lg:px-7">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <button
                                type="button"
                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink-1)] lg:hidden"
                                onClick={() => setMobileNavOpen(true)}
                                aria-label="打开导航菜单"
                                title="导航菜单"
                            >
                                <Menu className="size-5" />
                            </button>
                            <Link href="/create" className="inline-flex shrink-0 items-center lg:hidden" aria-label={siteTitle}>
                                <SiteLogo logoUrl={site.logoUrl} className="size-6" />
                            </Link>
                            <button
                                type="button"
                                className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink-1)] lg:inline-flex"
                                onClick={() => setSidebarExpanded((value) => !value)}
                                aria-label={sidebarExpanded ? "收起侧边栏" : "展开侧边栏"}
                                title={sidebarExpanded ? "收起侧边栏" : "展开侧边栏"}
                                aria-pressed={sidebarExpanded}
                            >
                                {sidebarExpanded ? <PanelLeftClose className="size-[17px]" /> : <PanelLeftOpen className="size-[17px]" />}
                            </button>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-[var(--ink-1)]">{pageTitle}</div>
                            </div>
                        </div>
                        <div className="min-w-0 max-w-[calc(100vw-6.5rem)] shrink-0 overflow-visible sm:max-w-[calc(100vw-8rem)] lg:max-w-none">
                            <UserStatusActions />
                        </div>
                    </header>
                    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
                </div>
            </div>
            <MobileNavDrawer open={mobileNavOpen} activeToolSlug={tool?.slug} onClose={() => setMobileNavOpen(false)} />
        </div>
    );
}
