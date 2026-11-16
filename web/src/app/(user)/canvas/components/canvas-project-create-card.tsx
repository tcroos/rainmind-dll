"use client";

import { Loader2, Plus } from "lucide-react";

/**
 * 列表首格的「新建画布」入口。
 * 和项目卡同尺寸同圆角，让入口本身就是网格的一部分，
 * 比把按钮塞在标题栏更符合"这里是我的画布"的心智。
 */
export function CanvasCreateCard({ onCreate, loading = false }: { onCreate: () => void; loading?: boolean }) {
    return (
        <button
            type="button"
            onClick={onCreate}
            disabled={loading}
            className="group/create flex h-full min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[rgba(17,17,19,0.22)] bg-[linear-gradient(135deg,var(--surface-soft)_0%,var(--surface-inset)_100%)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[rgba(17,17,19,0.4)] hover:shadow-[0_12px_28px_-16px_rgba(17,17,19,0.3)] disabled:cursor-progress dark:border-[rgba(255,255,255,0.22)] dark:hover:border-[rgba(255,255,255,0.4)]"
        >
            <span className="grid size-10 place-items-center rounded-full bg-[var(--surface-inset)] text-[var(--ink-1)] transition-transform duration-200 group-hover/create:scale-105">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-[18px]" />}
            </span>
            <span className="mt-0.5 text-[13px] font-medium text-[var(--ink-1)]">新建画布</span>
            <span className="hidden text-[11px] text-[var(--ink-3)] sm:block">从空白开始搭节点</span>
        </button>
    );
}
