"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Drawer } from "antd";
import { X } from "lucide-react";

import { useAnnouncementReadState } from "@/hooks/use-announcement-read-state";
import { useAnnouncements } from "@/hooks/use-announcements";
import { hasPopupSeen, isPopupDismissed, markPopupDismissed, markPopupSeen } from "@/lib/announcement-dismiss";
import { isAnnouncementSuppressedPath } from "@/lib/announcement-routes";
import { useUserStore } from "@/stores/use-user-store";
import { AnnouncementGlyph } from "./announcement-glyph";

/**
 * 只在「登录后的工作台」按配置弹一次公告。营销页与登录链路（/login、/register、
 * /forgot-password）都不弹：外层 ClientRootInit 已经不挂载本组件，这里再挡一道
 * pathname，免得以后组件被复用到别的公开页又冒出抽屉。
 */
export function SiteAnnouncementPopup() {
    const pathname = usePathname();
    const suppressed = isAnnouncementSuppressedPath(pathname);
    const user = useUserStore((state) => state.user);
    const { data: announcements = [] } = useAnnouncements({ enabled: Boolean(user) });
    const { markRead } = useAnnouncementReadState();
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState("");
    /* forceRender 会让服务端也输出整个抽屉 DOM，Portal 在客户端 hydration 时
     * 还没挂上，React 会报 mismatch。只在客户端挂载后才开启预渲染。 */
    const [clientReady, setClientReady] = useState(false);
    useEffect(() => setClientReady(true), []);
    const active = useMemo(() => announcements.find((item) => item.id === activeId) || null, [activeId, announcements]);

    useEffect(() => {
        if (!announcements.length || !user || suppressed) return;
        /* 会话级「已处理」优先于逐条标记：后台可能有不止一条公告勾了「登录后弹窗」，
         * 关掉第一条后公告列表一刷新（React Query 重新取数）就会挑出第二条，
         * 用户感知就是「关过了又在别的页面弹一次」。 */
        if (hasPopupSeen("login")) return;
        const item = announcements.find((announcement) => announcement.popupAfterLogin && !isPopupDismissed(announcement.id, "login"));
        if (!item) return;
        setActiveId(item.id);
        setOpen(true);
    }, [announcements, suppressed, user]);

    const close = () => {
        if (active) {
            if (active.popupAfterLogin) {
                markPopupDismissed(active.id, "login");
                /* 一次关闭等于「这类提醒我看过了」，本标签页内不再自动弹，
                 * 直到重新登录（登录/退出会清空这些标记）。 */
                markPopupSeen("login");
            }
            markRead(active.id);
        }
        setOpen(false);
    };

    if (suppressed) return null;

    return (
        /* 和消息中心同一套右侧浮层：登录后的公告也不再在屏幕中央弹对话框 */
        <Drawer
            open={open}
            onClose={close}
            placement="right"
            size="min(100vw, var(--announcement-drawer-width))"
            closable={false}
            /* 客户端就绪后预渲染，避免首次弹出时现挂载面板拖慢滑入 */
            forceRender={clientReady}
            rootClassName="announcement-drawer"
            styles={{
                wrapper: { maxWidth: "100vw", overflow: "hidden" },
                body: { height: "100%", padding: 0, overflow: "hidden" },
            }}
            aria-label="站点公告"
        >
            <section className="flex h-full min-h-0 flex-col bg-white text-[#20242a] dark:bg-[#15181d] dark:text-[#f3f5f7]">
                <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#eef0f3] px-4 dark:border-[#2a2f36]">
                    <h2 className="text-[15px] font-semibold tracking-tight">站点公告</h2>
                    <button
                        type="button"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-[#8a939f] transition hover:bg-[#f1f3f5] hover:text-[#20242a] dark:text-[#9aa3af] dark:hover:bg-[#22262c] dark:hover:text-white"
                        onClick={close}
                        aria-label="关闭站点公告"
                        title="关闭"
                    >
                        <X className="size-4" />
                    </button>
                </header>
                <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    {active ? (
                        <>
                            <div className="flex items-start gap-3">
                                <span className="announcement-glyph-chip announcement-glyph-chip--brand" aria-hidden>
                                    <AnnouncementGlyph className="size-[18px]" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold leading-5">{active.title}</h3>
                                    <div className="mt-1 text-[11px] text-[#9aa2ad] dark:text-[#737d89]">{new Date(active.createdAt).toLocaleString("zh-CN")}</div>
                                </div>
                            </div>
                            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f6f8fa] p-4 text-[13px] leading-7 text-[#5d6672] dark:bg-[#1d2127] dark:text-[#c2c8d1]">{active.content}</div>
                        </>
                    ) : null}
                </div>
                <footer className="flex shrink-0 flex-col gap-2 border-t border-[#eef0f3] p-4 sm:flex-row sm:justify-end dark:border-[#2a2f36]">
                    <Button onClick={close}>我知道了</Button>
                    <Button type="primary" href="/announcements" onClick={close}>
                        查看全部公告
                    </Button>
                </footer>
            </section>
        </Drawer>
    );
}
