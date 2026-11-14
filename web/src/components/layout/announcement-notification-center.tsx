"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronDown, Heart, RotateCcw, X } from "lucide-react";
import { Drawer } from "antd";

import { useAnnouncementReadState } from "@/hooks/use-announcement-read-state";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useInteractionNotifications } from "@/hooks/use-interaction-notifications";
import { formatAnnouncementTime } from "@/lib/announcement-notifications";
import { cn } from "@/lib/utils";
import type { PublicAnnouncement } from "@/services/api/announcements";
import type { InteractionNotification } from "@/services/api/work-community";
import { useUserStore } from "@/stores/use-user-store";
import { AnnouncementGlyph } from "./announcement-glyph";

export function AnnouncementNotificationCenter({ compact, buttonClassName, buttonStyle, onOpen }: { compact: boolean; buttonClassName: string; buttonStyle?: CSSProperties; onOpen?: () => void }) {
    const { data: announcements = [], error, isFetching, refetch } = useAnnouncements();
    const user = useUserStore((state) => state.user);
    const interactions = useInteractionNotifications(user?.id);
    const { readIds, hydrated, markRead } = useAnnouncementReadState();
    const [open, setOpen] = useState(false);
    /* 预渲染只能在客户端挂载后开：否则服务端会输出抽屉 DOM，hydration 不匹配 */
    const [clientReady, setClientReady] = useState(false);
    useEffect(() => setClientReady(true), []);
    const [expandedId, setExpandedId] = useState("");
    const [sessionUnreadIds, setSessionUnreadIds] = useState<Set<string>>(() => new Set());
    const [activeTab, setActiveTab] = useState<"announcements" | "interactions">("announcements");
    const unreadAnnouncements = useMemo(() => (hydrated ? announcements.filter((item) => !readIds.has(item.id)) : []), [announcements, hydrated, readIds]);
    const totalUnread = unreadAnnouncements.length + interactions.unreadCount;

    useEffect(() => {
        if (!open || !unreadAnnouncements.length) return;
        setSessionUnreadIds((current) => new Set([...current, ...unreadAnnouncements.map((item) => item.id)]));
        markRead(...unreadAnnouncements.map((item) => item.id));
    }, [markRead, open, unreadAnnouncements]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            if (!unreadAnnouncements.length && interactions.unreadCount) setActiveTab("interactions");
            onOpen?.();
        } else {
            setExpandedId("");
            setSessionUnreadIds(new Set());
        }
    };
    const button = (
        <button type="button" className={cn(buttonClassName, "relative")} style={buttonStyle} onClick={() => handleOpenChange(true)} aria-label={totalUnread ? `消息中心，${totalUnread} 条未读` : "消息中心"} title="消息中心" aria-expanded={open}>
            <Bell className="size-4" />
            {hydrated && totalUnread ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-3.5 place-items-center rounded-full bg-[#66758e] px-1 text-[9px] font-semibold leading-[14px] text-white ring-2 ring-white dark:bg-[#d8dee8] dark:text-[#252b33] dark:ring-[#181b20]">
                    {totalUnread > 9 ? "9+" : totalUnread}
                </span>
            ) : null}
        </button>
    );
    const panel = (
        <AnnouncementPanel
            announcements={announcements}
            error={error}
            expandedId={expandedId}
            loading={isFetching && !announcements.length}
            sessionUnreadIds={sessionUnreadIds}
            onClose={() => handleOpenChange(false)}
            onExpand={(id) => setExpandedId((current) => (current === id ? "" : id))}
            onRetry={() => void refetch()}
            activeTab={activeTab}
            interactionError={interactions.error}
            interactionItems={interactions.items}
            interactionLoading={interactions.isFetching && !interactions.items.length}
            interactionUnreadCount={interactions.unreadCount}
            interactionHasMore={interactions.hasNextPage}
            interactionLoadingMore={interactions.isFetchingNextPage}
            onTabChange={setActiveTab}
            onInteractionRead={(id) => void interactions.markRead(id)}
            onInteractionReadAll={() => void interactions.markAllRead()}
            onInteractionMore={() => void interactions.fetchNextPage()}
            onInteractionRetry={() => void interactions.refetch()}
        />
    );

    return (
        <>
            {button}
            {/* 即梦的「消息中心」是贴右侧滑出的浮层，不是屏幕中央的对话框：
             * 左侧页面内容保持可见，面板只占右缘一竖条。 */}
            <Drawer
                placement="right"
                size={compact ? "min(100vw, var(--announcement-drawer-width))" : "var(--announcement-drawer-width)"}
                open={open}
                onClose={() => handleOpenChange(false)}
                closable={false}
                /* 预渲染：面板首次挂载（antd 样式注入 + 列表 + SVG）很重，
                 * 放在点击时做会把滑入动画堵住 200ms+。挂在页面加载阶段付掉，
                 * 点铃铛就只剩一段纯 CSS transform 过渡。 */
                forceRender={clientReady}
                rootClassName="announcement-drawer"
                styles={{
                    wrapper: { maxWidth: "100vw", overflow: "hidden" },
                    body: { height: "100%", padding: 0, overflow: "hidden" },
                }}
                aria-label="消息中心"
            >
                {panel}
            </Drawer>
        </>
    );
}

function AnnouncementPanel({
    announcements,
    error,
    expandedId,
    loading,
    sessionUnreadIds,
    onClose,
    onExpand,
    onRetry,
    activeTab,
    interactionError,
    interactionItems,
    interactionLoading,
    interactionUnreadCount,
    interactionHasMore,
    interactionLoadingMore,
    onTabChange,
    onInteractionRead,
    onInteractionReadAll,
    onInteractionMore,
    onInteractionRetry,
}: {
    announcements: PublicAnnouncement[];
    error: Error | null;
    expandedId: string;
    loading: boolean;
    sessionUnreadIds: ReadonlySet<string>;
    onClose: () => void;
    onExpand: (id: string) => void;
    onRetry: () => void;
    activeTab: "announcements" | "interactions";
    interactionError: Error | null;
    interactionItems: InteractionNotification[];
    interactionLoading: boolean;
    interactionUnreadCount: number;
    interactionHasMore: boolean;
    interactionLoadingMore: boolean;
    onTabChange: (tab: "announcements" | "interactions") => void;
    onInteractionRead: (id: string) => void;
    onInteractionReadAll: () => void;
    onInteractionMore: () => void;
    onInteractionRetry: () => void;
}) {
    return (
        <section className="flex h-full min-h-0 w-full flex-col bg-white text-[#20242a] dark:bg-[#15181d] dark:text-[#f3f5f7]" aria-label="消息中心">
            {/* 即梦式极简头：只有标题和关闭，不摆大图标、不写副标题 */}
            <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#eef0f3] px-4 dark:border-[#2a2f36]">
                <h2 className="text-[15px] font-semibold tracking-tight">消息中心</h2>
                <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[#8a939f] transition hover:bg-[#f1f3f5] hover:text-[#20242a] dark:text-[#9aa3af] dark:hover:bg-[#22262c] dark:hover:text-white"
                    onClick={onClose}
                    aria-label="关闭消息中心"
                    title="关闭"
                >
                    <X className="size-4" />
                </button>
            </header>
            {/* 浅灰槽 + 选中项白胶囊：和即梦「互动 / 官方消息」同一套 */}
            <div className="mx-3 mt-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-[#f1f3f6] p-1 dark:bg-[#20252c]">
                <button
                    type="button"
                    className={cn(
                        "h-8 rounded-lg text-xs font-semibold transition",
                        activeTab === "interactions" ? "bg-white text-[#20242a] shadow-[0_1px_3px_rgba(17,20,28,0.12)] dark:bg-[#3a424e] dark:text-white dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]" : "text-[#828b96] hover:text-[#4a5260] dark:text-[#9aa3af] dark:hover:text-white",
                    )}
                    onClick={() => onTabChange("interactions")}
                >
                    互动 {interactionUnreadCount ? `· ${interactionUnreadCount}` : ""}
                </button>
                <button
                    type="button"
                    className={cn(
                        "h-8 rounded-lg text-xs font-semibold transition",
                        activeTab === "announcements" ? "bg-white text-[#20242a] shadow-[0_1px_3px_rgba(17,20,28,0.12)] dark:bg-[#3a424e] dark:text-white dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]" : "text-[#828b96] hover:text-[#4a5260] dark:text-[#9aa3af] dark:hover:text-white",
                    )}
                    onClick={() => onTabChange("announcements")}
                >
                    官方消息 {sessionUnreadIds.size ? `· ${sessionUnreadIds.size}` : ""}
                </button>
            </div>
            <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 pt-2">
                {activeTab === "announcements" && loading ? <AnnouncementLoading /> : null}
                {activeTab === "announcements" && !loading && error ? <AnnouncementError onRetry={onRetry} /> : null}
                {activeTab === "announcements" && !loading && !error && announcements.length ? (
                    <div className="space-y-0.5">
                        {announcements.map((announcement) => (
                            <AnnouncementRow key={announcement.id} announcement={announcement} expanded={expandedId === announcement.id} unread={sessionUnreadIds.has(announcement.id)} onExpand={() => onExpand(announcement.id)} />
                        ))}
                    </div>
                ) : null}
                {activeTab === "announcements" && !loading && !error && !announcements.length ? (
                    <div className="grid min-h-40 place-items-center px-5 py-10 text-center">
                        <div>
                            <Bell className="mx-auto size-5 text-[#a4acb6]" />
                            <p className="mt-3 text-sm font-medium">暂时没有新公告</p>
                            <p className="mt-1 text-xs text-[#8a939f] dark:text-[#8f98a5]">后续通知会在这里集中展示</p>
                        </div>
                    </div>
                ) : null}
                {activeTab === "interactions" && interactionLoading ? <AnnouncementLoading /> : null}
                {activeTab === "interactions" && !interactionLoading && interactionError ? <AnnouncementError onRetry={onInteractionRetry} /> : null}
                {activeTab === "interactions" && !interactionLoading && !interactionError && interactionItems.length ? (
                    <div className="space-y-0.5">
                        {interactionItems.map((item) => (
                            <InteractionRow key={item.id} item={item} onClose={onClose} onRead={onInteractionRead} />
                        ))}
                        {interactionHasMore ? (
                            <button
                                type="button"
                                className="flex h-10 w-full items-center justify-center text-xs font-semibold text-[#66758e] transition hover:bg-[#f7f8fa] dark:text-[#c7ced8] dark:hover:bg-[#1d2127]"
                                disabled={interactionLoadingMore}
                                onClick={onInteractionMore}
                            >
                                {interactionLoadingMore ? "加载中..." : "查看更多"}
                            </button>
                        ) : null}
                    </div>
                ) : null}
                {activeTab === "interactions" && !interactionLoading && !interactionError && !interactionItems.length ? (
                    <div className="grid min-h-40 place-items-center px-5 py-10 text-center">
                        <div>
                            <Heart className="mx-auto size-5 text-[#a4acb6]" />
                            <p className="mt-3 text-sm font-medium">暂时没有互动通知</p>
                            <p className="mt-1 text-xs text-[#8a939f] dark:text-[#8f98a5]">点赞和关注会显示在这里</p>
                        </div>
                    </div>
                ) : null}
            </div>
            {activeTab === "announcements" ? (
                <Link
                    href="/announcements"
                    onClick={onClose}
                    className="flex h-11 shrink-0 items-center justify-center border-t border-[#eef0f3] text-xs font-semibold text-[#59677d] transition hover:bg-[#f7f8fa] hover:text-[#20242a] dark:border-[#2a2f36] dark:text-[#c2c8d1] dark:hover:bg-[#1d2127] dark:hover:text-white"
                >
                    查看全部公告
                </Link>
            ) : interactionUnreadCount ? (
                <button
                    type="button"
                    onClick={onInteractionReadAll}
                    className="flex h-11 shrink-0 items-center justify-center gap-2 border-t border-[#eef0f3] text-xs font-semibold text-[#59677d] transition hover:bg-[#f7f8fa] hover:text-[#20242a] dark:border-[#2a2f36] dark:text-[#c2c8d1] dark:hover:bg-[#1d2127] dark:hover:text-white"
                >
                    <CheckCheck className="size-3.5" /> 全部设为已读
                </button>
            ) : null}
        </section>
    );
}

/* 每条消息：左侧一枚渐变玻璃圆徽，右侧标题 / 两行摘要 / 时间。
 * 官方公告用自定义星芒徽记，不再是 lucide 的默认线性小喇叭；
 * 即梦没有未读小圆点 —— 未读只用标题字重和徽记底色表达。 */
function InteractionRow({ item, onClose, onRead }: { item: InteractionNotification; onClose: () => void; onRead: (id: string) => void }) {
    return (
        <Link
            href={item.targetPath}
            className="group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-[#f5f7fa] dark:hover:bg-[#20252c]"
            onClick={() => {
                if (!item.readAt) onRead(item.id);
                onClose();
            }}
        >
            <MessageIcon unread={!item.readAt} kind="interaction" />
            <div className="min-w-0 flex-1">
                <div className={cn("text-[13.5px] leading-5", item.readAt ? "font-medium text-[#444c56] dark:text-[#d2d7de]" : "font-semibold text-[#20242a] dark:text-white")}>{item.summary}</div>
                <p className="mt-1 truncate text-xs text-[#7b8490] dark:text-[#a7afb9]">{item.actor?.displayName || item.actor?.username || "系统通知"}</p>
                <time className="mt-1.5 block text-[11px] text-[#9aa2ad] dark:text-[#737d89]">{formatAnnouncementTime(item.createdAt)}</time>
            </div>
        </Link>
    );
}

function AnnouncementRow({ announcement, expanded, unread, onExpand }: { announcement: PublicAnnouncement; expanded: boolean; unread: boolean; onExpand: () => void }) {
    return (
        <button type="button" className="group flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f5f7fa] dark:hover:bg-[#20252c]" onClick={onExpand} aria-expanded={expanded}>
            <MessageIcon unread={unread} kind="announcement" />
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className={cn("min-w-0 flex-1 text-[13.5px] leading-5", unread ? "font-semibold text-[#20242a] dark:text-white" : "font-medium text-[#444c56] dark:text-[#d2d7de]", expanded ? "" : "truncate")}>{announcement.title}</h3>
                    <ChevronDown className={cn("mt-0.5 size-3.5 shrink-0 text-[#9aa2ad] transition", expanded && "rotate-180")} />
                </div>
                <p className={cn("mt-1 whitespace-pre-wrap text-xs leading-5 text-[#7b8490] dark:text-[#a7afb9]", expanded ? "" : "line-clamp-2")}>{announcement.content}</p>
                <time className="mt-1.5 block text-[11px] text-[#9aa2ad] dark:text-[#737d89]">{formatAnnouncementTime(announcement.createdAt)}</time>
            </div>
        </button>
    );
}

function MessageIcon({ unread, kind }: { unread: boolean; kind: "announcement" | "interaction" }) {
    if (kind === "interaction") {
        return (
            <span className={cn("announcement-glyph-chip mt-0.5", unread ? "announcement-glyph-chip--cool" : "announcement-glyph-chip--muted")} aria-hidden>
                <Heart className="size-4" fill="currentColor" strokeWidth={1.4} />
            </span>
        );
    }

    return (
        <span className={cn("announcement-glyph-chip mt-0.5", unread ? "announcement-glyph-chip--brand" : "announcement-glyph-chip--muted")} aria-hidden>
            <AnnouncementGlyph className="size-[18px]" />
        </span>
    );
}

function AnnouncementLoading() {
    return (
        <div className="space-y-1" aria-label="公告加载中">
            {[0, 1, 2].map((item) => (
                <div key={item} className="flex animate-pulse gap-3 rounded-xl px-3 py-4">
                    <div className="size-8 shrink-0 rounded-full bg-[#eef1f5] dark:bg-[#2a3038]" />
                    <div className="min-w-0 flex-1">
                        <div className="h-3 w-2/3 rounded bg-[#e8ebef] dark:bg-[#2a3038]" />
                        <div className="mt-2 h-2.5 w-full rounded bg-[#f0f2f4] dark:bg-[#22272e]" />
                        <div className="mt-2 h-2.5 w-16 rounded bg-[#f0f2f4] dark:bg-[#22272e]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function AnnouncementError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="grid min-h-40 place-items-center px-5 py-10 text-center">
            <div>
                <p className="text-sm font-medium">公告暂时无法加载</p>
                <button
                    type="button"
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-[#59616c] transition hover:bg-[#f3f5f7] hover:text-[#20242a] dark:border-[#343a43] dark:text-[#c4cad2] dark:hover:bg-[#22262c] dark:hover:text-white"
                    onClick={onRetry}
                >
                    <RotateCcw className="size-3.5" /> 重新加载
                </button>
            </div>
        </div>
    );
}
