"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import type { CanvasProjectPreview } from "@/lib/canvas-project-contract";
import { cn } from "@/lib/utils";

/**
 * 画布列表卡的封面：只展示画布里的第一张素材，整块铺满。
 * 不做拼图——列表里多张缩略图拼在一起会把卡片读成一堆碎片，第一张足够代表这张画布。
 * 没有素材时不摆假图，用一张点阵画板表示"空白画布"，观感比灰块好，也不误导。
 */
export function CanvasProjectCover({ previews, className }: { previews: CanvasProjectPreview[]; className?: string }) {
    const cover = previews[0];
    if (!cover) return <CanvasCoverPlaceholder className={className} />;

    return (
        <div className={cn("size-full bg-[var(--surface-inset)]", className)}>
            <CoverTile preview={cover} />
        </div>
    );
}

function CoverTile({ preview }: { preview: CanvasProjectPreview }) {
    const [failed, setFailed] = useState(false);
    const isVideo = preview.kind === "video";
    const renderVideo = isVideo && !failed;
    const renderImage = !isVideo && !failed;
    const src = isVideo && !preview.url.includes("#") ? `${preview.url}#t=0.1` : preview.url;

    return (
        <div className="relative size-full overflow-hidden bg-[var(--surface-inset)]">
            {renderVideo ? (
                <video src={src} muted playsInline preload="metadata" className="size-full object-cover" onError={() => setFailed(true)} />
            ) : renderImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- 素材域名来自用户上传与模型产物，不走 next/image 白名单
                <img src={preview.url} alt="" loading="lazy" decoding="async" className="size-full object-cover" onError={() => setFailed(true)} />
            ) : (
                // 素材 404/被清理时留一块渐变色，不要塌成空白格
                <div className="size-full bg-[linear-gradient(150deg,var(--surface-inset)_0%,var(--surface-soft)_100%)]" />
            )}
            {isVideo ? (
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                    <Play className="size-2.5 translate-x-px" fill="currentColor" strokeWidth={0} />
                </span>
            ) : null}
        </div>
    );
}

export function CanvasCoverPlaceholder({ className }: { className?: string }) {
    /* 空白画布的封面不放节点流程图：库里同时存在多张空画布时，
     * 一排一模一样的「节点 + 连线」会被读成新手引导图，而不是"这里什么都没有"。
     * 改成一张安静的点阵画板，用密度和留白表达"空白"。 */
    return (
        <div className={cn("relative size-full overflow-hidden bg-[linear-gradient(145deg,var(--surface-soft)_0%,var(--surface-inset)_100%)]", className)}>
            <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle,rgba(17,17,19,0.085)_1px,transparent_1px)] bg-[size:14px_14px] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.075)_1px,transparent_1px)]"
            />
        </div>
    );
}
