"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import type { CanvasProjectPreview } from "@/lib/canvas-project-contract";
import { cn } from "@/lib/utils";

/** 封面最多拼 4 张，和后端 aggregation 的上限保持一致 */
const MAX_TILES = 4;

/**
 * 画布列表卡的封面：把画布里已生成的素材拼成一格缩略图。
 * 没有素材时不摆假图，用一张抽象节点网络表示"空白画布"，观感比灰块好，也不误导。
 */
export function CanvasProjectCover({ previews, className }: { previews: CanvasProjectPreview[]; className?: string }) {
    const tiles = previews.slice(0, MAX_TILES);
    if (!tiles.length) return <CanvasCoverPlaceholder className={className} />;

    return (
        <div className={cn("size-full bg-[var(--surface-inset)]", className)}>
            {tiles.length === 1 ? (
                <CoverTile preview={tiles[0]} allowVideo />
            ) : (
                <div
                    className={cn(
                        "grid size-full gap-px",
                        tiles.length === 2 && "grid-cols-2",
                        tiles.length === 3 && "grid-cols-2 grid-rows-2",
                        tiles.length >= 4 && "grid-cols-2 grid-rows-2",
                    )}
                >
                    {tiles.map((preview, index) => (
                        <CoverTile
                            key={`${preview.url}-${index}`}
                            preview={preview}
                            allowVideo={index === 0}
                            className={cn(tiles.length === 3 && index === 0 && "row-span-2")}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CoverTile({ preview, allowVideo, className }: { preview: CanvasProjectPreview; allowVideo: boolean; className?: string }) {
    const [failed, setFailed] = useState(false);
    const isVideo = preview.kind === "video";
    // 一个列表页最多十几个视频，全渲染 <video> 太重；只有主位放真视频，其余用海报位
    const renderVideo = isVideo && allowVideo && !failed;
    const renderImage = !isVideo && !failed;
    const src = isVideo && !preview.url.includes("#") ? `${preview.url}#t=0.1` : preview.url;

    return (
        <div className={cn("relative size-full overflow-hidden bg-[var(--surface-inset)]", className)}>
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
    return (
        <div className={cn("relative size-full overflow-hidden bg-[linear-gradient(145deg,var(--surface-soft)_0%,var(--surface-inset)_100%)]", className)}>
            <svg
                viewBox="0 0 240 150"
                className="absolute inset-0 size-full text-[rgba(17,17,19,0.52)] dark:text-[rgba(255,255,255,0.5)]"
                fill="none"
                aria-hidden
            >
                <g stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M74 62h34a6 6 0 0 1 6 6v14" />
                    <path d="M120 82h22" />
                    <path d="M154 62h-8a6 6 0 0 0-6 6v14" />
                    <path d="M74 106h30" />
                    <path d="M148 106h18" />
                </g>
                <g fill="currentColor">
                    <rect x="52" y="48" width="22" height="28" rx="6" fillOpacity="0.42" />
                    <rect x="140" y="48" width="22" height="28" rx="6" fillOpacity="0.42" />
                    <rect x="106" y="76" width="28" height="20" rx="6" fillOpacity="0.72" />
                    <rect x="104" y="98" width="34" height="18" rx="6" fillOpacity="0.55" />
                </g>
            </svg>
        </div>
    );
}
