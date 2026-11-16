"use client";

import { Copy, Quote } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "antd";

import { imagePreviewUrl } from "@/lib/media-image-url";
import { cn } from "@/lib/utils";
import { formatPromptDate, type Prompt } from "@/services/api/prompts";

/**
 * 词库卡片：封面 + 标题 + 摘要 + 元信息/操作。
 * 一块缩略图撑起卡片，正文只留三行信息，底部用发丝线隔开操作区 —— 一屏能扫过更多条目。
 */
export function PromptCard({
    item,
    onOpen,
    onCopy,
    actionLabel = "复制",
    actionIcon = <Copy className="size-3.5" />,
    actionType = "text",
    extraAction,
}: {
    item: Prompt;
    onOpen: (previewUrl?: string) => void;
    onCopy: () => void;
    actionLabel?: string;
    actionIcon?: ReactNode;
    actionType?: "text" | "primary";
    extraAction?: ReactNode;
}) {
    const open = () => onOpen(item.coverUrl ? imagePreviewUrl(item.coverUrl, 640) : undefined);
    // 分类已经压在封面上，标签行里再出现一次就是重复信息
    const metaTags = item.tags.filter((tag) => tag !== item.category);
    const hasCover = Boolean(item.coverUrl);

    return (
        <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--hairline)] bg-card text-[var(--ink-1)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-28px_rgba(17,17,19,0.35)]">
            {/* 没有配图的提示词不占一块 16:10 的空白封面：改成纯文字卡，
                「我的提示词」里几乎都是这种情况，一排灰框会让页面看起来像加载失败。 */}
            {hasCover ? (
                <button type="button" className="relative block w-full overflow-hidden bg-[var(--surface-inset)] text-left" aria-label={`查看 ${item.title}`} onClick={open}>
                    <div className="aspect-[16/10] w-full overflow-hidden">
                        <PromptCover url={imagePreviewUrl(item.coverUrl || "", 640)} title={item.title} />
                    </div>
                    {item.category ? (
                        <span className="pointer-events-none absolute left-2.5 top-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium leading-4 text-white backdrop-blur-sm">
                            {item.category}
                        </span>
                    ) : null}
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-end bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.42))] px-2.5 pb-2 pt-8 text-[11px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
                        查看提示词
                    </span>
                </button>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-3.5">
                {!hasCover ? (
                    <div className="mb-2 flex min-w-0 items-center gap-1.5">
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-600)]">
                            <Quote className="size-3" aria-hidden />
                        </span>
                        {item.category ? (
                            <span className="min-w-0 truncate rounded-md bg-[var(--surface-inset)] px-1.5 py-0.5 text-[10px] font-medium leading-4 text-[var(--ink-2)]">{item.category}</span>
                        ) : null}
                    </div>
                ) : null}
                <button type="button" className="block min-w-0 text-left" onClick={open}>
                    <h2 className="line-clamp-1 text-[13.5px] font-semibold leading-5 text-[var(--ink-1)] sm:text-sm">{item.title}</h2>
                    <p className={cn("mt-1 text-[12px] leading-5 text-[var(--ink-2)]", hasCover ? "line-clamp-2 min-h-10" : "line-clamp-4")}>{item.prompt}</p>
                </button>

                <div className="mt-2.5 flex min-w-0 flex-1 items-start gap-1 overflow-hidden">
                    {metaTags.slice(0, 2).map((tag) => (
                        <span key={tag} className="max-w-28 shrink-0 truncate rounded-md bg-[var(--surface-inset)] px-1.5 py-0.5 text-[10.5px] leading-4 text-[var(--ink-2)]">
                            {tag}
                        </span>
                    ))}
                    {metaTags.length > 2 ? <span className="shrink-0 text-[10.5px] leading-4 text-[var(--ink-3)]">+{metaTags.length - 2}</span> : null}
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--hairline)] pt-2.5">
                    <span className="shrink-0 text-[11px] text-[var(--ink-3)]">{formatPromptDate(item.updatedAt)}</span>
                    <div className="flex min-w-0 items-center gap-1">
                        <Button size="small" type={actionType} icon={actionIcon} className="!rounded-lg" onClick={onCopy}>
                            {actionLabel}
                        </Button>
                        {extraAction}
                    </div>
                </div>
            </div>
        </article>
    );
}

/**
 * 封面：加载时是一块安静的呼吸灰，失败时退成标题文字。
 * 不走全局 LazyMediaImage 的品牌 Logo 占位 —— 词库里不少条目没有配图，
 * 一排 Logo 水印会读成"图片全挂了"。
 */
function PromptCover({ url, title }: { url: string; title: string }) {
    const [status, setStatus] = useState<"loading" | "ready" | "error">(url ? "loading" : "error");

    useEffect(() => setStatus(url ? "loading" : "error"), [url]);

    return (
        <div className="relative size-full overflow-hidden bg-[var(--surface-inset)]">
            {status !== "ready" ? (
                <div
                    aria-hidden
                    className={cn(
                        "absolute inset-0 bg-[linear-gradient(120deg,var(--surface-soft)_0%,var(--surface-inset)_52%,var(--surface-soft)_100%)]",
                        status === "loading" && "animate-pulse",
                    )}
                />
            ) : null}
            {status === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[linear-gradient(135deg,var(--brand-soft)_0%,var(--surface-soft)_56%,var(--surface-inset)_100%)] px-4">
                    <Quote className="size-3.5 text-[var(--brand-600)] opacity-60" aria-hidden />
                    <span className="line-clamp-3 text-center text-[12px] font-medium leading-5 text-[var(--ink-2)]">{title}</span>
                </div>
            ) : null}
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- 素材域名来自用户上传与模型产物，不走 next/image 白名单
                <img
                    src={url}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className={cn("relative size-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.03]", status === "ready" ? "opacity-100" : "opacity-0")}
                    onLoad={() => setStatus("ready")}
                    onError={() => setStatus("error")}
                />
            ) : null}
        </div>
    );
}
