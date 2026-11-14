"use client";

import { ChevronRight, CircleHelp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SiteLogo } from "@/components/layout/site-logo";
import { navigationGroups, navigationTools, type NavigationToolSlug } from "@/constant/navigation-tools";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_TITLE, resolveSiteTitle } from "@/lib/site-brand";
import { usePublicSessionStore } from "@/stores/use-public-session-store";

export function AppSidebar({ activeToolSlug, expanded }: { activeToolSlug?: NavigationToolSlug; expanded: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const site = usePublicSessionStore((state) => state.payload?.settings?.site) || { title: DEFAULT_SITE_TITLE, logoUrl: "/logo.svg" };
    const siteTitle = resolveSiteTitle(site.title);
    const helpActive = pathname.startsWith("/help");

    return (
        <aside className={cn("hidden h-full shrink-0 flex-col bg-[var(--surface-rail)] text-[var(--ink-1)] transition-[width] duration-200 lg:flex", expanded ? "w-52" : "w-[72px]")}>
            <Link href="/create" className={cn("flex h-16 shrink-0 items-center px-3", expanded ? "justify-start px-5" : "justify-center")} aria-label={siteTitle}>
                <SiteLogo logoUrl={site.logoUrl} className="size-8" />
                {expanded ? <span className="ml-3 min-w-0 truncate text-[17px] font-semibold">{siteTitle}</span> : null}
            </Link>

            <nav className={cn("hide-scrollbar min-h-0 flex-1 overflow-y-auto py-5", expanded ? "px-4" : "px-2")} aria-label="工作空间导航">
                {navigationGroups.map((group, groupIndex) => {
                    const tools = navigationTools.filter((tool) => tool.group === group.id);
                    return (
                        <div key={group.id} className={cn(groupIndex > 0 && "mt-6")}>
                            {expanded ? <div className="mb-2 px-2 text-[13px] font-normal text-[var(--ink-3)]">{group.label}</div> : null}
                            <div className="space-y-1">
                                {tools.map((tool) => {
                                    const Icon = tool.icon;
                                    const active = tool.slug === activeToolSlug;
                                    return (
                                        <Link
                                            key={tool.slug}
                                            href={`/${tool.slug}`}
                                            prefetch
                                            title={tool.label}
                                            onMouseEnter={() => router.prefetch(`/${tool.slug}`)}
                                            onFocus={() => router.prefetch(`/${tool.slug}`)}
                                            className={cn(
                                                "group relative flex h-12 items-center rounded-lg px-2 text-base font-medium transition-colors duration-150",
                                                expanded ? "justify-start gap-3 px-3" : "justify-center",
                                                active ? "bg-[var(--surface-inset)] text-[var(--ink-1)]" : "text-[var(--ink-2)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink-1)]",
                                            )}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            {/* 选中态原来用靛蓝图标（#5965ff）。整站走黑白灰之后，
                                                它是导航里唯一的高饱和色，会把人眼先拽到图标上；
                                                改成与文字同一档的近黑，靠底色和字重区分选中。 */}
                                            <Icon className={cn("size-5 shrink-0", active && "text-[var(--ink-1)]")} />
                                            {expanded ? <span className="min-w-0 truncate">{tool.label}</span> : null}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className={cn("shrink-0", expanded ? "px-4 pb-3 pt-3.5" : "p-2")}>
                <Link
                    href="/help"
                    prefetch
                    title="帮助"
                    onMouseEnter={() => router.prefetch("/help")}
                    onFocus={() => router.prefetch("/help")}
                    className={cn(
                        "relative flex min-h-12 items-center rounded-lg px-2 text-base font-medium text-[var(--ink-2)] transition-colors duration-150 hover:bg-[var(--surface-inset)] hover:text-[var(--ink-1)]",
                        expanded ? "justify-start gap-3 px-2" : "justify-center",
                        helpActive && "bg-[var(--surface-inset)] text-[var(--ink-1)]",
                    )}
                    aria-current={helpActive ? "page" : undefined}
                >
                    <CircleHelp className="size-5 shrink-0" />
                    {expanded ? (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate">帮助</span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-[#7f8995]" />
                        </>
                    ) : null}
                    {helpActive ? <span className="absolute right-0 h-4 w-0.5 rounded-full bg-[#5965ff]" /> : null}
                </Link>
            </div>
        </aside>
    );
}
