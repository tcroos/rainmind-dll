"use client";

import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useAnnouncements } from "@/hooks/use-announcements";
import { readBarDismissSignature, writeBarDismissSignature } from "@/lib/announcement-dismiss";
import { cn } from "@/lib/utils";
import { AnnouncementChipGlyph, type ChipGlyphVariant } from "./announcement-glyph";

/** 每条公告「停留 + 上滑」占用的秒数 */
const SECONDS_PER_ITEM = 4.5;
/** 单条行高，必须和 global-surfaces.css 里 .announcement-marquee-item 的 36px 一致 */
const ITEM_HEIGHT = 36;
/** 一条周期里停留的比例，剩下的时间用来向上滑一格。
 * 停留占大头：滑动时才不会长时间露出上下两行半截字 */
const HOLD_RATIO = 0.86;

/**
 * 即梦那条横幅不是一行裸文字：文字前有几枚白色圆角小方块（倒计时/活动图标），
 * 整组连同文字、末尾箭头一起上下切换。这里准备四套「模板」按序轮换，
 * 每条公告的方块组合都不同，切换时才读得出「好几条」而不是同一行反复闪。
 * 方块里用同一组抽象几何符号 + 一套色，不再堆四五个不同颜色的默认线性图标。
 */
const TEMPLATES: { variants: ChipGlyphVariant[]; tone: "warm" | "cool" }[] = [
    { variants: ["star", "pulse", "diamond"], tone: "warm" },
    { variants: ["pulse", "diamond", "star"], tone: "cool" },
    { variants: ["diamond", "star", "pulse"], tone: "warm" },
    { variants: ["star", "diamond", "pulse"], tone: "cool" },
];

function isLive(start?: string, end?: string, now = Date.now()) {
    const from = start ? Date.parse(start) : Number.NaN;
    const to = end ? Date.parse(end) : Number.NaN;
    if (Number.isFinite(from) && now < from) return false;
    if (Number.isFinite(to) && now > to) return false;
    return true;
}

/**
 * 生成竖向轮播的 keyframes：第 i 条先停一会儿，再上滑一格。
 * 轨道末尾接一份第一条副本，滚到 -N 格时正好停在副本上，跳回 0 看不出接缝。
 * 步数随公告条数变化，所以用行内 <style> 生成，而不是写死在 CSS 里。
 */
function verticalKeyframes(count: number) {
    const frames: string[] = [];
    for (let index = 0; index < count; index += 1) {
        const start = ((index / count) * 100).toFixed(2);
        const hold = (((index + HOLD_RATIO) / count) * 100).toFixed(2);
        const end = (((index + 1) / count) * 100).toFixed(2);
        frames.push(`${start}%, ${hold}% { transform: translateY(-${index * ITEM_HEIGHT}px); }`);
        frames.push(`${end}% { transform: translateY(-${(index + 1) * ITEM_HEIGHT}px); }`);
    }
    return `@keyframes announcement-vertical-scroll { ${frames.join(" ")} }`;
}

/**
 * 顶部公告条：整条几乎都是跳往公告中心的链接，右端只留一枚细小的白色 × 用来关闭。
 * × 是链接的同级兄弟（绝对定位盖在上面），既避开 button-in-link 的非法嵌套，
 * 又不占布局空间 —— 中间那行字仍然相对整条横幅居中。
 * 中间是一行放大的居中文字，前面带几枚模板小方块，后面带箭头，整组随轨道上下切换。
 * 悬停暂停、尊重「减少动态效果」，没公告或已被关掉时整条不渲染。
 */
export function AnnouncementMarquee() {
    const { data } = useAnnouncements();

    const messages = useMemo(() => {
        return (data ?? [])
            .filter((item) => item.enabled && isLive(item.startsAt, item.endsAt))
            .map((item) => ({ id: item.id, text: item.title.trim() }))
            .filter((item) => item.text.length > 0);
    }, [data]);

    const signature = useMemo(() => messages.map((item) => item.id).join("|"), [messages]);
    /* 关闭状态只存当前标签页（sessionStorage）：刷新不重现，关掉页面重开又会出现。
     * 公告数据只在客户端拉取，服务端本来就不会输出这条横幅，所以首次渲染直接读
     * 存储既不会 hydration 不一致，也不会「先闪一下再消失」。
     * 存的仍是「当前生效公告 id 集合」，管理员发新公告时签名变化会自动重新出现。 */
    const [dismissedSignature, setDismissedSignature] = useState<string | null>(() => readBarDismissSignature());

    const dismissed = dismissedSignature === signature;

    /* 横幅关掉后页头整体上移 36px，抽屉顶边也要跟着抬，否则会空出一大截。
     * 只在「有公告 + 被用户关掉」时打标，营销页那类本来就没有横幅的页面不受影响。 */
    useEffect(() => {
        document.documentElement.classList.toggle("announcement-bar-dismissed", dismissed && messages.length > 0);
        return () => document.documentElement.classList.remove("announcement-bar-dismissed");
    }, [dismissed, messages.length]);

    if (!messages.length || dismissed) return null;

    const dismiss = () => {
        setDismissedSignature(signature);
        writeBarDismissSignature(signature);
    };

    const rotating = messages.length > 1;
    const duration = messages.length * SECONDS_PER_ITEM;
    const items = rotating ? [...messages, messages[0]] : messages;

    return (
        <div className="announcement-marquee relative z-40 flex h-9 shrink-0 items-center px-3 sm:px-4">
            {rotating ? <style>{verticalKeyframes(messages.length)}</style> : null}
            <Link
                href="/announcements"
                className="relative flex min-w-0 flex-1 items-center"
                aria-label="站点公告，点击进入公告中心"
            >
                <div
                    className="announcement-marquee-viewport relative min-w-0 flex-1 overflow-hidden"
                    style={{ "--announcement-duration": `${duration}s` } as CSSProperties}
                >
                    <div className={cn("announcement-marquee-track", rotating && "announcement-marquee-track--rotating")}>
                        {items.map((item, index) => {
                            const template = TEMPLATES[index % TEMPLATES.length];
                            return (
                                <span
                                    key={`${item.id}-${index}`}
                                    className="announcement-marquee-item"
                                    aria-hidden={index >= messages.length || undefined}
                                    title={item.text}
                                >
                                    {/* 模板小方块挂在行内，所以会跟着文字一起上下切换 */}
                                    <span
                                        className={cn(
                                            "announcement-marquee-chips",
                                            `announcement-marquee-chips--${template.tone}`,
                                        )}
                                        aria-hidden
                                    >
                                        {template.variants.map((variant, iconIndex) => (
                                            <span className="announcement-marquee-chip" key={`${variant}-${iconIndex}`}>
                                                <AnnouncementChipGlyph variant={variant} className="size-3" />
                                            </span>
                                        ))}
                                    </span>
                                    <span className="min-w-0 truncate px-1">{item.text}</span>
                                    <ChevronRight className="announcement-marquee-arrow size-3.5" aria-hidden />
                                </span>
                            );
                        })}
                    </div>
                </div>
            </Link>
            <button
                type="button"
                className="announcement-marquee-close"
                onClick={dismiss}
                aria-label="关闭顶部公告"
                title="关闭公告"
            >
                <X strokeWidth={1.8} aria-hidden />
            </button>
        </div>
    );
}
