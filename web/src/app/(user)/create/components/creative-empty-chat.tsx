"use client";

import { Clapperboard, Image as ImageIcon, Sparkles, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { imagePreviewUrl } from "@/lib/media-image-url";
import { cn } from "@/lib/utils";
import { listPublicGallery } from "@/services/api/work-governance";

/** 新对话的空状态：给几个具体到能直接出片的例子，避免整屏只剩一个输入框。 */
const SUGGESTIONS = [
    "生成一张 3:4 的产品主图，白底、柔光，突出质感",
    "做一条 15 秒短视频：城市夜景，慢推镜，配轻快电子乐",
    "写一份 6 个镜头的短剧分镜，都市情感题材",
    "把这句文案改成小红书口播风格：今天也要好好生活",
] as const;

type Cover = { key: string; url?: string };

export function CreativeEmptyChat({ siteTitle, onPick }: { siteTitle: string; onPick: (prompt: string) => void }) {
    const [covers, setCovers] = useState<Cover[]>([{ key: "a" }, { key: "b" }, { key: "c" }]);

    useEffect(() => {
        let active = true;
        void listPublicGallery({ limit: 3, sort: "random" })
            .then((page) => {
                if (!active) return;
                const urls = page.items.map((item) => item.preview?.url).filter((url): url is string => Boolean(url));
                if (!urls.length) return;
                setCovers((current) => current.map((cover, index) => (urls[index] ? { key: cover.key, url: urls[index] } : cover)));
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="mx-auto flex w-full max-w-[760px] flex-col items-center px-4 pb-8 pt-10 sm:pt-[8vh]" data-testid="creative-empty-chat">
            {/* 三张斜叠卡：有作品封面就用真实图，没有就退回品牌色块，别留一片空白 */}
            <div className="relative h-[132px] w-[240px] shrink-0" aria-hidden="true">
                {covers.map((cover, index) => {
                    const placement = [
                        "left-0 top-4 h-[104px] w-[78px] -rotate-[14deg]",
                        "left-1/2 top-0 h-[124px] w-[92px] -translate-x-1/2 rotate-0",
                        "right-0 top-5 h-[100px] w-[76px] rotate-[14deg]",
                    ][index];
                    return (
                        <figure
                            key={cover.key}
                            className={cn(
                                "absolute overflow-hidden rounded-lg border border-black/5 bg-[linear-gradient(160deg,#fdece0_0%,#f7f2ec_52%,#eef1f5_100%)] shadow-[0_10px_24px_-12px_rgba(20,20,24,0.35)] dark:border-white/10 dark:bg-[linear-gradient(160deg,#3a2a1e_0%,#242527_52%,#1b1d21_100%)]",
                                placement,
                            )}
                        >
                            {cover.url ? (
                                <img src={imagePreviewUrl(cover.url, 320)} alt="" className="size-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                            ) : index === 1 ? (
                                <span className="grid size-full place-items-center text-[var(--brand-600)]">
                                    <ImageIcon className="size-7" />
                                </span>
                            ) : index === 0 ? (
                                <span className="grid size-full place-items-center text-[var(--brand-600)]/70">
                                    <Clapperboard className="size-6" />
                                </span>
                            ) : (
                                <span className="grid size-full place-items-center text-[var(--brand-600)]/70">
                                    <Video className="size-6" />
                                </span>
                            )}
                        </figure>
                    );
                })}
            </div>

            <h2 className="mt-7 text-center text-[22px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink-1)] sm:text-[26px]">
                和 {siteTitle} 一起，把想法变成作品
            </h2>
            <p className="mt-2 text-center text-[13px] text-[var(--ink-3)]">从一个想法开始，也可以直接点下面的例子</p>

            <div className="mt-6 flex w-full flex-col items-stretch gap-2 sm:items-center">
                {SUGGESTIONS.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onPick(item)}
                        className="group inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-panel)] px-4 py-2.5 text-left text-[13px] leading-5 text-[var(--ink-2)] shadow-[0_1px_2px_rgba(17,17,19,0.04)] transition hover:border-[var(--brand-500)]/50 hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)] sm:w-auto sm:justify-center"
                    >
                        <Sparkles className="size-3.5 shrink-0 text-[var(--brand-600)]" />
                        <span>{item}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
