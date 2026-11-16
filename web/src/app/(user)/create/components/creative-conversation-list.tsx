"use client";

import { Button, Checkbox, Dropdown, Input, Modal } from "antd";
import { Check, CheckSquare2, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CreativeConversation } from "@/lib/creative-runtime-contract";
import { cn } from "@/lib/utils";

type Props = {
    items: CreativeConversation[];
    activeId?: string;
    loading: boolean;
    onNew: () => void;
    onOpen: (id: string) => void;
    onRename: (id: string, title: string) => Promise<void>;
    onDelete: (ids: string[]) => Promise<void>;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
};

type ConversationGroup = { key: string; label: string; items: CreativeConversation[] };

export function CreativeConversationList({ items, activeId, loading, onNew, onOpen, onRename, onDelete, hasMore, loadingMore, onLoadMore }: Props) {
    const [managing, setManaging] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [renaming, setRenaming] = useState<CreativeConversation>();
    const [deleteIds, setDeleteIds] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
    const allSelected = Boolean(items.length) && selectedIds.length === items.length;
    /* 10 条「1」堆在一起时，光看右侧时间很难扫：按 今天 / 昨天 / 日期 分组，
     * 同一屏里立刻能分出「刚聊的」和「翻出来的旧会话」。 */
    const groups = useMemo(() => groupConversations(items), [items]);

    useEffect(() => {
        const visibleIds = new Set(items.map((item) => item.id));
        setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
    }, [items]);

    const leaveManage = () => {
        setManaging(false);
        setSelectedIds([]);
    };

    const remove = async (ids: string[]) => {
        if (!ids.length || submitting) return false;
        setSubmitting(true);
        try {
            await onDelete(ids);
            if (ids.length > 1) leaveManage();
            return true;
        } catch {
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const saveTitle = async () => {
        const value = title.trim();
        if (!renaming || !value || submitting) return;
        setSubmitting(true);
        try {
            await onRename(renaming.id, value);
            setRenaming(undefined);
        } catch {
            return;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 px-3 pt-1">
                <button
                    type="button"
                    data-testid="creative-conversation-new"
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--surface-inset)] text-[13px] font-medium text-[var(--ink-1)] transition-colors hover:bg-[var(--surface-soft)] active:bg-[var(--surface-inset)]"
                    onClick={onNew}
                >
                    <Plus className="size-3.5" /> 新建对话
                </button>
            </div>

            <div className="flex h-10 shrink-0 items-center justify-between gap-2 px-3">
                {managing ? (
                    <Checkbox checked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected} onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])}>
                        <span className="text-[12px] text-[var(--ink-3)]">全选</span>
                    </Checkbox>
                ) : (
                    <span className="text-[11.5px] font-medium tracking-[0.02em] text-[var(--ink-3)]">最近对话 · {items.length}</span>
                )}
                <button
                    type="button"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)]"
                    onClick={() => (managing ? leaveManage() : setManaging(true))}
                >
                    {managing ? <X className="size-3.5" /> : <CheckSquare2 className="size-3.5" />}
                    {managing ? "退出管理" : "批量管理"}
                </button>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                {loading ? <div className="py-10 text-center text-[13px] text-[var(--ink-3)]">正在读取...</div> : null}
                {!loading && !items.length ? <div className="py-10 text-center text-[13px] text-[var(--ink-3)]">暂无创作会话</div> : null}
                {groups.map((group) => (
                    <section key={group.key} aria-label={group.label}>
                        <h3 className="px-2 pb-1 pt-4 text-[11px] font-medium tracking-[0.04em] text-[var(--ink-3)] first:pt-1">{group.label}</h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const checked = selected.has(item.id);
                                const active = activeId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "group relative flex min-h-10 items-center gap-1 rounded-lg transition-colors",
                                            active ? "bg-[var(--surface-inset)]" : "hover:bg-[var(--surface-soft)]",
                                        )}
                                    >
                                        {active ? <span aria-hidden className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--brand-500)]" /> : null}
                                        {renaming?.id === item.id ? (
                                            <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5">
                                                <Input
                                                    value={title}
                                                    maxLength={120}
                                                    autoFocus
                                                    size="small"
                                                    className="min-w-0 flex-1"
                                                    aria-label="对话标题"
                                                    onChange={(event) => setTitle(event.target.value)}
                                                    onPressEnter={() => void saveTitle()}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Escape") setRenaming(undefined);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--ink-2)] transition hover:bg-[var(--surface-panel)] hover:text-[var(--ink-1)]"
                                                    aria-label="保存标题"
                                                    title="保存标题"
                                                    onClick={() => void saveTitle()}
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--ink-3)] transition hover:bg-[var(--surface-panel)] hover:text-[var(--ink-1)]"
                                                    aria-label="取消修改"
                                                    title="取消修改"
                                                    onClick={() => setRenaming(undefined)}
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {managing ? (
                                                    <span className="pl-2.5">
                                                        <Checkbox checked={checked} aria-label={`选择${item.title}`} onChange={() => setSelectedIds((current) => (checked ? current.filter((id) => id !== item.id) : [...current, item.id]))} />
                                                    </span>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pl-3 pr-0.5 text-left"
                                                    onClick={() => (managing ? setSelectedIds((current) => (checked ? current.filter((id) => id !== item.id) : [...current, item.id])) : onOpen(item.id))}
                                                >
                                                    <span className={cn("block min-w-0 flex-1 truncate text-[13px] leading-5", active ? "font-medium text-[var(--ink-1)]" : "text-[var(--ink-1)]")}>{item.title}</span>
                                                    {sameDay(item.lastMessageAt) ? <span className="shrink-0 text-[11px] leading-4 tabular-nums text-[var(--ink-3)]">{formatConversationTime(item.lastMessageAt)}</span> : null}
                                                </button>
                                                {!managing ? (
                                                    <Dropdown
                                                        trigger={["click"]}
                                                        menu={{
                                                            items: [{ key: "rename", icon: <Pencil className="size-3.5" />, label: "重命名" }, { type: "divider" }, { key: "delete", danger: true, icon: <Trash2 className="size-3.5" />, label: "删除" }],
                                                            onClick: ({ key }) => {
                                                                if (key === "rename") {
                                                                    setRenaming(item);
                                                                    setTitle(item.title);
                                                                } else {
                                                                    setDeleteIds([item.id]);
                                                                }
                                                            },
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="mr-1 grid size-7 shrink-0 place-items-center rounded-md text-[var(--ink-3)] opacity-0 transition hover:bg-[var(--surface-panel)] hover:text-[var(--ink-1)] focus-visible:opacity-100 group-hover:opacity-100"
                                                            aria-label={`管理${item.title}`}
                                                            title="管理对话"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </button>
                                                    </Dropdown>
                                                ) : null}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
                {hasMore ? (
                    <Button type="text" block size="small" className="!mt-2 !text-[12px]" loading={loadingMore} onClick={onLoadMore}>
                        加载更多对话
                    </Button>
                ) : null}
            </div>

            {managing ? (
                <div className="flex shrink-0 items-center gap-3 border-t border-[var(--hairline)] px-4 py-3">
                    <span className="min-w-0 flex-1 text-[12px] text-[var(--ink-3)]">已选择 {selectedIds.length} 条</span>
                    <Button danger size="small" icon={<Trash2 className="size-3.5" />} disabled={!selectedIds.length} loading={submitting} onClick={() => setDeleteIds(selectedIds)}>
                        批量删除
                    </Button>
                </div>
            ) : null}

            <Modal
                title={deleteIds.length > 1 ? `删除 ${deleteIds.length} 条对话？` : "删除这条对话？"}
                open={Boolean(deleteIds.length)}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                confirmLoading={submitting}
                onOk={() =>
                    void remove(deleteIds).then((success) => {
                        if (success) setDeleteIds([]);
                    })
                }
                onCancel={() => setDeleteIds([])}
            >
                <p className="text-sm text-[#697381] dark:text-[#a7afb9]">将永久删除消息、生成记录和仅由这些对话使用的媒体；仍被素材库、画布、短剧或作品引用的媒体会保留。</p>
            </Modal>
        </div>
    );
}

function groupConversations(items: CreativeConversation[]): ConversationGroup[] {
    /* 用 Map 而不是「只跟上一组比」：接口偶尔会给出跨天乱序的列表，
     * 相邻判断会把同一天拆成两个「今天」标题。 */
    const groups = new Map<string, ConversationGroup>();
    for (const item of items) {
        const stamp = new Date(item.lastMessageAt);
        const key = `${stamp.getFullYear()}-${stamp.getMonth() + 1}-${stamp.getDate()}`;
        const existing = groups.get(key);
        if (existing) existing.items.push(item);
        else groups.set(key, { key, label: dayLabel(stamp), items: [item] });
    }
    return [...groups.values()];
}

function dayLabel(value: Date) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfDay = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfDay) / 86_400_000);
    if (diffDays <= 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays} 天前`;
    return value.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

function sameDay(value: number) {
    return new Date(value).toDateString() === new Date().toDateString();
}

function formatConversationTime(value: number) {
    const date = new Date(value);
    const today = new Date();
    return date.toDateString() === today.toDateString() ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
