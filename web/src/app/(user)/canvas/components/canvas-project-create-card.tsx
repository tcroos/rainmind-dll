"use client";

import { Loader2, Plus } from "lucide-react";

/**
 * 列表首格的「新建画布」入口。
 * 结构和项目卡一致：16:10 的封面区 + 下方标题/说明。
 * 之前整格用 h-full 撑满行高，缩略图区被拉成接近正方形，和旁边的项目卡对不齐。
 */
export function CanvasCreateCard({ onCreate, loading = false }: { onCreate: () => void; loading?: boolean }) {
    return (
        <button type="button" onClick={onCreate} disabled={loading} className="group/create flex h-full min-w-0 cursor-pointer flex-col text-left disabled:cursor-progress">
            <span className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(17,17,19,0.22)] bg-[linear-gradient(135deg,var(--surface-soft)_0%,var(--surface-inset)_100%)] transition-[transform,border-color,box-shadow] duration-200 group-hover/create:-translate-y-0.5 group-hover/create:border-[rgba(17,17,19,0.4)] group-hover/create:shadow-[0_12px_28px_-16px_rgba(17,17,19,0.3)] dark:border-[rgba(255,255,255,0.22)] dark:group-hover/create:border-[rgba(255,255,255,0.4)]">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--surface-panel)] text-[var(--ink-1)] shadow-[0_1px_2px_rgba(17,17,19,0.06)] transition-transform duration-200 group-hover/create:scale-105">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-[18px]" />}
                </span>
            </span>
            <span className="mt-2.5 block min-w-0 px-0.5">
                <span className="block truncate text-[14px] font-medium leading-[1.5] text-[var(--ink-1)]">{loading ? "正在创建…" : "新建画布"}</span>
            </span>
        </button>
    );
}
