"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * 创作页右侧浮层外壳：历史与资产共用同一套几何。
 * 位置 / 宽度 / 圆角 / 投影全部复用公告抽屉那组变量，
 * 和「消息中心」「站点公告」在同一个水平线上，切面板时不会跳。
 *
 * 关闭方式两种：右上角 ×，以及点遮罩（面板外的任意位置）。
 * 遮罩透明，不压暗对话内容，只负责接住外部点击。
 */
export function CreateSidePanel({
    open,
    title,
    icon,
    onClose,
    children,
}: {
    open: boolean;
    title: string;
    icon?: ReactNode;
    onClose: () => void;
    children: ReactNode;
}) {
    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" data-testid="create-side-panel-backdrop" />
            <section
                role="dialog"
                aria-label={title}
                data-testid="create-side-panel"
                className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-panel)] shadow-[0_24px_56px_-20px_rgba(17,20,28,0.28),0_2px_10px_-4px_rgba(17,20,28,0.12)] dark:shadow-[0_24px_56px_-18px_rgba(0,0,0,0.72)]"
                style={{
                    top: "var(--announcement-drawer-top, 116px)",
                    right: "var(--announcement-drawer-right, 16px)",
                    bottom: "var(--announcement-drawer-bottom, 32px)",
                    width: "min(calc(100vw - 24px), var(--announcement-drawer-width, 340px))",
                }}
            >
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--hairline)] px-4">
                    {icon ? <span className="grid size-4 shrink-0 place-items-center text-[var(--ink-2)]">{icon}</span> : null}
                    <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink-1)]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={`关闭${title}`}
                        title={`关闭${title}`}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--ink-3)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                    >
                        <X className="size-4" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            </section>
        </>
    );
}
