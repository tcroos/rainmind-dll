"use client";

import { Check, Download, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Dropdown, Input } from "antd";
import type { MenuProps } from "antd";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useCanvasStore, type CanvasProjectSummary } from "../stores/use-canvas-store";
import { useCanvasUiStore } from "../stores/use-canvas-ui-store";
import { exportCanvasProjects } from "../utils/canvas-export";
import { CanvasProjectCover } from "./canvas-project-cover";
import { canvasProjectMeta, formatCanvasUpdatedAt } from "./canvas-project-format";

/** 悬浮控件统一用「白底 + 细边 + 落影」：深色封面、浅色封面和亮图上都读得清。
 *  之前的半透明黑/白在深浅两种封面上总有一种糊在一起，选中态也不明显。 */
const actionSurface =
    "bg-white/95 ring-1 ring-black/10 shadow-[0_2px_8px_rgba(17,17,19,0.28)] hover:bg-white dark:bg-white/92 dark:hover:bg-white";
const actionBase = "absolute top-2 grid place-items-center transition-[opacity,background-color,box-shadow] duration-150";
/** 深色主题有一条未分层的 `button` 颜色规则，会把 Tailwind 的 text-* 压成白色，
 *  白底控件上的图标因此看不见；这里用内联色保证两种主题都读得清。 */
const controlInk = { color: "#3f3f46" } as const;
/** 默认隐形，指针悬停或键盘聚焦时才露出来，避免缩略图上长期压着小按钮 */
const revealClass = "opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100";

export function CanvasProjectCard({ project }: { project: CanvasProjectSummary }) {
    const { message } = App.useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const renameProject = useCanvasStore((state) => state.renameProject);
    const loadProject = useCanvasStore((state) => state.loadProject);
    const [exporting, setExporting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const editingId = useCanvasUiStore((state) => state.editingProjectId);
    const editingTitle = useCanvasUiStore((state) => state.editingProjectTitle);
    const startEditing = useCanvasUiStore((state) => state.startEditingProject);
    const setEditingTitle = useCanvasUiStore((state) => state.setEditingProjectTitle);
    const stopEditing = useCanvasUiStore((state) => state.stopEditingProject);
    const toggleSelected = useCanvasUiStore((state) => state.toggleSelectedProjectId);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
    const editing = editingId === project.id;
    const selected = selectedIds.includes(project.id);
    const href = `/canvas/${project.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const preload = () => {
        router.prefetch(href);
        void loadProject(project.id).catch(() => undefined);
    };
    const open = () => {
        preload();
        router.push(href);
    };
    const saveTitle = () => {
        renameProject(project.id, editingTitle);
        stopEditing();
    };
    const exportProject = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const detail = await loadProject(project.id);
            await exportCanvasProjects([detail]);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "画布导出失败");
        } finally {
            setExporting(false);
        }
    };
    const menuItems: MenuProps["items"] = [
        { key: "rename", label: "重命名", icon: <Pencil className="size-3.5" /> },
        { key: "export", label: exporting ? "导出中…" : "导出画布", icon: <Download className="size-3.5" />, disabled: exporting },
        { key: "publish", label: "发布作品", icon: <Share2 className="size-3.5" /> },
        { type: "divider" },
        { key: "delete", label: "删除", icon: <Trash2 className="size-3.5" />, danger: true },
    ];
    const runAction = (key: string) => {
        if (key === "rename") startEditing(project.id, project.title);
        else if (key === "export") void exportProject();
        else if (key === "publish") router.push(`/works?sourceType=canvas&sourceId=${encodeURIComponent(project.id)}`);
        else if (key === "delete") setDeleteIds([project.id]);
    };

    return (
        <article className="group/card relative flex min-w-0 flex-col">
            <div
                className={cn(
                    "relative aspect-[16/10] overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-soft)] shadow-[0_1px_2px_rgba(17,17,19,0.04),0_8px_20px_-16px_rgba(17,17,19,0.28)] transition-[transform,box-shadow] duration-200",
                    "dark:border-transparent dark:shadow-none",
                    "group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_12px_28px_-14px_rgba(17,17,19,0.3),0_2px_6px_-2px_rgba(17,17,19,0.08)]",
                    "dark:group-hover/card:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.75),0_2px_6px_-2px_rgba(0,0,0,0.5)]",
                    // 菜单是 portal 出去渲染的，鼠标移进菜单就丢了 hover，这里补一次，防止卡片"掉回去"
                    menuOpen && "-translate-y-0.5 shadow-[0_12px_28px_-14px_rgba(17,17,19,0.3),0_2px_6px_-2px_rgba(17,17,19,0.08)] dark:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.75),0_2px_6px_-2px_rgba(0,0,0,0.5)]",
                    // 用 outline 而不是 shadow 画选中框，免得和上面的落影互相覆盖
                    selected && "outline outline-2 -outline-offset-1 outline-[var(--brand-500)]",
                )}
            >
                <button
                    type="button"
                    onClick={open}
                    onPointerEnter={preload}
                    onFocus={preload}
                    aria-label={`打开画布 ${project.title}`}
                    className="absolute inset-0 block size-full cursor-pointer overflow-hidden"
                >
                    <span className="block size-full transition-transform duration-500 ease-out group-hover/card:scale-[1.035]">
                        <CanvasProjectCover previews={project.previews ?? []} />
                    </span>
                </button>

                <button
                    type="button"
                    aria-label={selected ? `取消选择 ${project.title}` : `选择 ${project.title}`}
                    aria-pressed={selected}
                    onClick={(event) => {
                        event.stopPropagation();
                        toggleSelected(project.id, !selected);
                    }}
                    className={cn(
                        actionBase,
                        "left-2 size-6 rounded-md",
                        selected
                            ? "bg-[var(--brand-500)] shadow-[0_2px_8px_rgba(226,103,31,0.42)] ring-1 ring-white/70 hover:bg-[var(--brand-600)]"
                            : cn(actionSurface, revealClass),
                    )}
                    style={selected ? { color: "#ffffff" } : controlInk}
                >
                    {/* 方形空框＝未选中，橙色勾＝已选中；圆点太容易被当成装饰 */}
                    <Check className={cn("size-3.5", selected ? "opacity-100" : "opacity-0")} strokeWidth={3.5} />
                </button>

                <Dropdown
                    menu={{ items: menuItems, onClick: ({ key, domEvent }) => {
                        domEvent.stopPropagation();
                        runAction(key);
                    } }}
                    // 只镜像开合状态用于样式，开合本身交给 antd，避免和 stopPropagation 打架
                    onOpenChange={setMenuOpen}
                    trigger={["click"]}
                    placement="bottomRight"
                >
                    <button
                        type="button"
                        aria-label={`${project.title} 的更多操作`}
                        onClick={(event) => event.stopPropagation()}
                        className={cn(actionBase, "right-2 size-7 rounded-lg", actionSurface, menuOpen ? "opacity-100" : revealClass)}
                        style={controlInk}
                    >
                        <MoreHorizontal className="size-4" />
                    </button>
                </Dropdown>
            </div>

            <div className="mt-2.5 min-w-0 px-0.5">
                {editing ? (
                    <Input
                        size="small"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") saveTitle();
                            if (event.key === "Escape") stopEditing();
                        }}
                        onBlur={saveTitle}
                        autoFocus
                        aria-label="画布名称"
                    />
                ) : (
                    <button type="button" onPointerEnter={preload} onClick={open} className="block w-full cursor-pointer text-left">
                        <h2 className="truncate text-[14px] font-medium leading-[1.5] text-[var(--ink-1)]">{project.title}</h2>
                        <p className="mt-0.5 truncate text-[12px] leading-[1.4] text-[var(--ink-2)]/80">
                            {canvasProjectMeta(project.nodeCount, project.connectionCount)} · {formatCanvasUpdatedAt(project.updatedAt)}
                        </p>
                    </button>
                )}
            </div>
        </article>
    );
}
