"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** 服务端把时间格式化成字符串再传进来：客户端再格式化一次会因为时区不同导致水合不一致。 */
export type AnnouncementView = {
    id: string;
    title: string;
    content: string;
    day: string;
    yearTime: string;
    fullDate: string;
    latest: boolean;
};

const CLAMP_LENGTH = 160;

export function AnnouncementItem({ item }: { item: AnnouncementView }) {
    const [expanded, setExpanded] = useState(false);
    const collapsible = item.content.length > CLAMP_LENGTH;
    const clamped = collapsible && !expanded;

    return (
        <article
            id={item.id}
            className={cn(
                "group scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-card transition duration-200 hover:border-[var(--brand-line)] hover:shadow-[0_18px_44px_-34px_rgba(17,17,19,0.45)]",
                // 最新一条给一层极淡的暖底，扫一眼就知道从哪里开始读
                item.latest && "border-[var(--brand-line)] bg-[linear-gradient(120deg,rgba(226,103,31,0.055),rgba(255,255,255,0)_46%)]",
            )}
        >
            <div className="grid gap-2.5 p-3.5 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-6 sm:p-6">
                <div className="flex items-baseline gap-2 text-[var(--ink-3)] sm:flex-col sm:items-start sm:gap-1.5 sm:pt-1">
                    <span className="hidden text-[20px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[var(--ink-1)] sm:block">{item.day}</span>
                    <span className="text-[11px] font-medium tabular-nums sm:hidden">{item.fullDate}</span>
                    <span className="hidden text-[11px] leading-4 tabular-nums sm:block">{item.yearTime}</span>
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h2 className="min-w-0 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[var(--ink-1)] sm:text-base">{item.title}</h2>
                        {item.latest ? <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold leading-4 text-[var(--brand-600)]">最新</span> : null}
                    </div>

                    <p
                        className={cn(
                            "mt-2 whitespace-pre-wrap break-words text-[13px] leading-7 text-[var(--ink-2)] sm:text-[13.5px]",
                            clamped && "line-clamp-3 sm:line-clamp-2",
                        )}
                    >
                        {item.content}
                    </p>

                    {collapsible ? (
                        <button
                            type="button"
                            aria-expanded={expanded}
                            className="mt-2 inline-flex h-7 items-center gap-1 rounded-lg text-[12px] font-medium text-[var(--brand-600)] transition-colors hover:text-[var(--brand-500)]"
                            onClick={() => setExpanded((value) => !value)}
                        >
                            {expanded ? "收起" : "展开全文"}
                            <ChevronDown className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
                        </button>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
