import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";

import { AnnouncementItem, type AnnouncementView } from "@/app/announcements/announcement-item";
import { PublicHeader } from "@/components/layout/public-header";
import { listAnnouncementsPage } from "@/lib/auth/store";
import type { PublicAnnouncement } from "@/lib/auth/store-types";
import { getPublicSiteSettings } from "@/lib/server/site-metadata";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;
export async function generateMetadata(): Promise<Metadata> {
    const site = await getPublicSiteSettings();
    return {
        title: `网站公告 | ${site.title}`,
        description: `查看 ${site.title} 的站点通知、维护说明和功能更新。`,
        alternates: { canonical: "/announcements" },
        robots: { index: true, follow: true },
    };
}

export default async function AnnouncementsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
    const params = searchParams ? await searchParams : {};
    const requestedPage = positiveInteger(first(params.page), 1);
    const [firstPage, site] = await Promise.all([listAnnouncementsPage(false, { page: requestedPage, pageSize: PAGE_SIZE }), getPublicSiteSettings()]);
    const totalPages = Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize));
    /* ?page=99 这类越界地址不应该看到「暂无公告」：夹到最后一页重新取一次。 */
    const page = Math.min(requestedPage, totalPages);
    const announcementPage = page === requestedPage ? firstPage : await listAnnouncementsPage(false, { page, pageSize: PAGE_SIZE });
    const items = announcementPage.items.map((announcement, index) => toAnnouncementView(announcement, page === 1 && index === 0));
    const latestDate = items[0] ? items[0].day : "";

    return (
        <main className="app-scroll-page bg-[var(--surface-canvas)] text-[var(--ink-1)]">
            <PublicHeader siteTitle={site.title} logoUrl={site.logoUrl} maxWidthClass="max-w-[1080px]">
                <Link
                    href="/"
                    className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[var(--ink-2)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)]"
                >
                    <ArrowLeft className="size-4" />
                    返回首页
                </Link>
            </PublicHeader>

            <div className="mx-auto w-full max-w-[1080px] px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
                <header className="relative overflow-hidden rounded-[24px] border border-[var(--hairline)] bg-card p-5 sm:rounded-[28px] sm:p-9">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full opacity-70 blur-2xl dark:opacity-45"
                        style={{ background: "radial-gradient(circle, rgba(226,103,31,0.16), transparent 68%)" }}
                    />
                    <div className="relative">
                        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--ink-3)]">Updates · 站点动态</p>
                        <h1 className="mt-3 text-[clamp(1.9rem,4.6vw,2.7rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--ink-1)]">网站公告</h1>
                        <p className="mt-3 max-w-[560px] text-[13.5px] leading-7 text-[var(--ink-2)] sm:text-[14px]">
                            站点通知、维护说明与功能更新都会发布在这里。遇到异常时，先看这里有没有对应的说明。
                        </p>

                        <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--hairline)] pt-4 text-[12px] text-[var(--ink-3)]">
                            <div className="flex items-baseline gap-1.5">
                                <dt>累计公告</dt>
                                <dd className="font-semibold tabular-nums text-[var(--ink-1)]">{announcementPage.total} 条</dd>
                            </div>
                            {latestDate ? (
                                <div className="flex items-baseline gap-1.5">
                                    <dt>最近更新</dt>
                                    <dd className="font-semibold tabular-nums text-[var(--ink-1)]">{latestDate}</dd>
                                </div>
                            ) : null}
                            {totalPages > 1 ? (
                                <div className="flex items-baseline gap-1.5">
                                    <dt>当前</dt>
                                    <dd className="font-semibold tabular-nums text-[var(--ink-1)]">
                                        第 {page} / {totalPages} 页
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    </div>
                </header>

                {items.length ? (
                    <ol className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                        {items.map((item) => (
                            <li key={item.id}>
                                <AnnouncementItem item={item} />
                            </li>
                        ))}
                    </ol>
                ) : (
                    <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--hairline)] bg-card px-6 py-16 text-center sm:mt-6">
                        <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-inset)] text-[var(--ink-3)]">
                            <Megaphone className="size-5" aria-hidden />
                        </span>
                        <h2 className="mt-3 text-[14px] font-semibold text-[var(--ink-1)]">暂无公告</h2>
                        <p className="mt-1 max-w-[320px] text-[12.5px] leading-5 text-[var(--ink-3)]">站点通知发布后会出现在这里，可以稍后再来看看。</p>
                    </div>
                )}

                {announcementPage.total > announcementPage.pageSize ? (
                    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="公告分页">
                        <PageArrow href={announcementPageHref(page - 1)} disabled={page <= 1} direction="prev" />
                        {paginationWindow(page, totalPages).map((value, index) =>
                            value ? (
                                <Link
                                    key={value}
                                    href={announcementPageHref(value)}
                                    aria-current={value === page ? "page" : undefined}
                                    className={cn(
                                        "inline-flex size-9 items-center justify-center rounded-lg border text-[12.5px] font-medium tabular-nums transition",
                                        value === page
                                            ? "border-transparent shadow-[0_8px_18px_-10px_rgba(226,103,31,0.9)]"
                                            : "border-[var(--hairline)] bg-card text-[var(--ink-2)] hover:border-[var(--brand-line)] hover:text-[var(--ink-1)]",
                                    )}
                                    style={value === page ? { backgroundColor: "var(--brand-500)", color: "#ffffff" } : undefined}
                                >
                                    {value}
                                </Link>
                            ) : (
                                <span key={`gap-${index}`} className="px-1 text-[12px] text-[var(--ink-3)]">
                                    …
                                </span>
                            ),
                        )}
                        <PageArrow href={announcementPageHref(page + 1)} disabled={page >= totalPages} direction="next" />
                    </nav>
                ) : null}
            </div>
        </main>
    );
}

function PageArrow({ href, disabled, direction }: { href: string; disabled: boolean; direction: "prev" | "next" }) {
    const className = cn(
        "inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-[12.5px] font-medium transition",
        disabled
            ? "pointer-events-none border-[var(--hairline)] bg-card text-[var(--ink-3)] opacity-50"
            : "border-[var(--hairline)] bg-card text-[var(--ink-2)] hover:border-[var(--brand-line)] hover:text-[var(--ink-1)]",
    );
    const icon = direction === "prev" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />;

    if (disabled) {
        return (
            <span className={className} aria-hidden>
                {direction === "prev" ? icon : null}
                <span className="hidden sm:inline">{direction === "prev" ? "上一页" : "下一页"}</span>
                {direction === "next" ? icon : null}
            </span>
        );
    }
    return (
        <Link href={href} className={className} aria-label={direction === "prev" ? "上一页" : "下一页"}>
            {direction === "prev" ? icon : null}
            <span className="hidden sm:inline">{direction === "prev" ? "上一页" : "下一页"}</span>
            {direction === "next" ? icon : null}
        </Link>
    );
}

function toAnnouncementView(announcement: PublicAnnouncement, latest: boolean): AnnouncementView {
    const created = new Date(announcement.createdAt);
    const month = created.getMonth() + 1;
    const date = String(created.getDate()).padStart(2, "0");
    return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        day: `${month}/${date}`,
        yearTime: `${created.getFullYear()} · ${created.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
        fullDate: `${created.getFullYear()}/${String(month).padStart(2, "0")}/${date}`,
        latest,
    };
}

/** 首页、末页和当前页附近；中间断开的地方用 null 占位成省略号。 */
function paginationWindow(page: number, totalPages: number) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = new Set([1, totalPages, page - 1, page, page + 1]);
    if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
    if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value));

    const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
    const result: (number | null)[] = [];
    sorted.forEach((value, index) => {
        if (index && value - sorted[index - 1] > 1) result.push(null);
        result.push(value);
    });
    return result;
}

function first(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function announcementPageHref(page: number) {
    return page <= 1 ? "/announcements" : `/announcements?page=${page}`;
}
