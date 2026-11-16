"use client";

import { ChevronDown, Copy, FolderPlus, ImageOff, X } from "lucide-react";
import { Button, Modal, Tag } from "antd";
import { useEffect, useState } from "react";

import { imagePreviewUrl } from "@/lib/media-image-url";
import { cn } from "@/lib/utils";
import { formatPromptDate, type Prompt } from "@/services/api/prompts";

/** 正文超过这个长度就折叠：弹窗高度固定，长提示词在弹窗内部滚动，不把页面撑出屏幕。 */
const CLAMP_LENGTH = 220;

export function PromptDetailDialog({ prompt, previewUrl, onClose, onCopy, onSaveAsset }: { prompt: Prompt | null; previewUrl?: string; onClose: () => void; onCopy: (prompt: string) => void; onSaveAsset?: (prompt: Prompt) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [coverState, setCoverState] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        setExpanded(false);
        setCoverState("loading");
    }, [prompt?.id]);

    /* 列表页已经把 640 宽的缩略图缓存下来了，优先复用它：弹窗一打开就有画面，
     * 不会先闪一块灰。没有缩略图时再退到 960 宽的原图。 */
    const coverUrl = previewUrl || (prompt?.coverUrl ? imagePreviewUrl(prompt.coverUrl, 960) : "");
    const collapsible = Boolean(prompt && prompt.prompt.length > CLAMP_LENGTH);

    return (
        <Modal
            open={Boolean(prompt)}
            onCancel={onClose}
            footer={null}
            title={null}
            closable={false}
            centered
            width={980}
            styles={{
                container: { padding: 0, overflow: "hidden" },
                body: { padding: 0, overflow: "hidden" },
                mask: { background: "rgba(17, 17, 19, 0.52)", backdropFilter: "blur(8px)" },
            }}
        >
            {prompt ? (
                <div className="flex h-[min(78dvh,620px)] max-h-[calc(100dvh-28px)] flex-col overflow-hidden bg-card text-[var(--ink-1)]">
                    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--hairline)] px-4 py-3 sm:px-5">
                        <div className="min-w-0">
                            <h2 className="truncate text-[14px] font-semibold leading-5 text-[var(--ink-1)] sm:text-[15px]">{prompt.title}</h2>
                            <p className="mt-0.5 truncate text-[11px] leading-4 text-[var(--ink-3)]">
                                {prompt.category || "提示词"} · 更新于 {formatPromptDate(prompt.updatedAt)}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-inset)] transition hover:bg-[var(--surface-hover)]"
                            style={{ color: "var(--ink-2)" }}
                            aria-label="关闭提示词详情"
                            title="关闭"
                            onClick={onClose}
                        >
                            <X className="size-4" />
                        </button>
                    </header>

                    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,32%)_minmax(0,1fr)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-rows-1">
                        {/* 预览图：手机上一块满宽横图更好看，桌面上完整等比缩进相框里 */}
                        <div className="relative flex min-h-0 items-center justify-center overflow-hidden border-b border-[var(--hairline)] bg-[var(--surface-soft)] md:border-b-0 md:border-r">
                            {coverUrl && coverState !== "error" ? (
                                <>
                                    {coverState === "loading" ? (
                                        <div
                                            aria-hidden
                                            className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,var(--surface-soft)_0%,var(--surface-inset)_50%,var(--surface-soft)_100%)]"
                                        />
                                    ) : null}
                                    {/* eslint-disable-next-line @next/next/no-img-element -- 素材域名来自用户上传与模型产物，不走 next/image 白名单 */}
                                    <img
                                        src={coverUrl}
                                        alt={prompt.title}
                                        loading="eager"
                                        decoding="async"
                                        className={cn(
                                            "relative size-full object-cover object-top transition-opacity duration-300 md:object-contain md:object-center",
                                            coverState === "ready" ? "opacity-100" : "opacity-0",
                                        )}
                                        onLoad={() => setCoverState("ready")}
                                        onError={() => setCoverState("error")}
                                    />
                                </>
                            ) : (
                                <span className="flex flex-col items-center gap-2 px-6 text-center text-[12px] text-[var(--ink-3)]">
                                    <ImageOff className="size-6" aria-hidden />
                                    {coverUrl ? "预览图加载失败" : "这条提示词没有预览图"}
                                </span>
                            )}
                        </div>

                        <div className="flex min-h-0 flex-col">
                            {prompt.tags.length ? (
                                <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pt-3 sm:px-5">
                                    {prompt.tags.map((tag) => (
                                        <Tag key={tag} className="m-0">
                                            {tag}
                                        </Tag>
                                    ))}
                                </div>
                            ) : null}

                            <div className="relative min-h-0 flex-1">
                                <div className="thin-scrollbar h-full overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
                                    <p className={cn("whitespace-pre-wrap break-words text-[13px] leading-7 text-[var(--ink-2)]", !expanded && collapsible && "line-clamp-6")}>{prompt.prompt}</p>
                                    {collapsible ? (
                                        <button
                                            type="button"
                                            aria-expanded={expanded}
                                            className="mt-2 inline-flex h-7 items-center gap-1 rounded-lg text-[12px] font-medium text-[var(--brand-600)] transition-colors hover:text-[var(--brand-500)]"
                                            onClick={() => setExpanded((value) => !value)}
                                        >
                                            {expanded ? "收起" : "展开全部"}
                                            <ChevronDown className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
                                        </button>
                                    ) : null}
                                </div>
                                {/* 折叠时底部压一层渐隐，提示下面还有内容 */}
                                {collapsible && !expanded ? (
                                    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(180deg,transparent,var(--surface-panel))]" />
                                ) : null}
                            </div>

                            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] px-4 py-3 sm:px-5">
                                <span className="truncate text-[11px] text-[var(--ink-3)]">
                                    创建：{formatPromptDate(prompt.createdAt)} · 共 {prompt.prompt.length} 字
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button type="primary" icon={<Copy className="size-4" />} onClick={() => onCopy(prompt.prompt)}>
                                        复制提示词
                                    </Button>
                                    {onSaveAsset ? (
                                        <Button icon={<FolderPlus className="size-4" />} onClick={() => onSaveAsset(prompt)}>
                                            加入我的素材
                                        </Button>
                                    ) : null}
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}
