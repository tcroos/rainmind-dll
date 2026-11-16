"use client";

import { BookMarked, FolderPlus, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { App, Button, Form, Input, Modal, Pagination, Popconfirm, Tag } from "antd";

import { PromptCard } from "@/components/prompts/prompt-card";
import { PromptDetailDialog } from "@/components/prompts/prompt-detail-dialog";
import { cn } from "@/lib/utils";
import { useCopyText } from "@/hooks/use-copy-text";
import { createMyPrompt, deleteMyPrompt, listMyPrompts } from "@/services/api/my-prompts";
import { ALL_PROMPTS_OPTION, type Prompt } from "@/services/api/prompts";
import { useAssetStore } from "@/stores/use-asset-store";

const PAGE_SIZE = 12;

type PromptFormValue = {
    title: string;
    prompt: string;
    category?: string;
    tags?: string;
    coverUrl?: string;
    preview?: string;
};

export function MyPromptsPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm<PromptFormValue>();
    const [items, setItems] = useState<Prompt[]>([]);
    const [total, setTotal] = useState(0);
    const [categories, setCategories] = useState<string[]>([ALL_PROMPTS_OPTION]);
    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState(ALL_PROMPTS_OPTION);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
    const copyText = useCopyText();
    const addAsset = useAssetStore((state) => state.addAsset);
    const deferredKeyword = useDeferredValue(keyword.trim());
    const hasFilters = Boolean(keyword.trim()) || category !== ALL_PROMPTS_OPTION;

    const loadPrompts = useCallback(async () => {
        setLoading(true);
        try {
            const payload = await listMyPrompts({ page, pageSize: PAGE_SIZE, keyword: deferredKeyword, category });
            setItems(payload.items);
            setTotal(payload.total);
            setCategories([ALL_PROMPTS_OPTION, ...(payload.categories || [])]);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "获取我的提示词失败");
        } finally {
            setLoading(false);
        }
    }, [category, deferredKeyword, message, page]);

    useEffect(() => {
        void loadPrompts();
    }, [loadPrompts, reloadToken]);

    const updateCategory = (value: string) => {
        setCategory(value);
        setPage(1);
    };

    const clearFilters = () => {
        setKeyword("");
        setCategory(ALL_PROMPTS_OPTION);
        setPage(1);
    };

    const createPrompt = async (value: PromptFormValue) => {
        setSubmitting(true);
        try {
            await createMyPrompt({ ...value, tags: splitTags(value.tags) });
            form.resetFields();
            setCreateOpen(false);
            message.success("提示词已保存");
            // 新记录可能不满足当前筛选条件，保存后回到第一页看全部
            setKeyword("");
            setCategory(ALL_PROMPTS_OPTION);
            setPage(1);
            setReloadToken((token) => token + 1);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "新增提示词失败");
        } finally {
            setSubmitting(false);
        }
    };

    const deletePrompt = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteMyPrompt(id);
            message.success("提示词已删除");
            const targetPage = Math.min(page, Math.max(1, Math.ceil(Math.max(0, total - 1) / PAGE_SIZE)));
            if (targetPage === page) setReloadToken((token) => token + 1);
            else setPage(targetPage);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "删除提示词失败");
        } finally {
            setDeletingId("");
        }
    };

    const savePromptAsset = async (item: Prompt) => {
        try {
            await addAsset({ kind: "text", title: item.title, coverUrl: item.coverUrl, tags: item.tags, source: item.category, data: { content: item.prompt }, metadata: { source: "my-prompts", promptId: item.id } });
            message.success("已加入我的素材");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "素材保存失败");
        }
    };

    const showEmptyState = !loading && items.length === 0;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <main className="min-h-0 flex-1 overflow-y-auto bg-background">
                <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-7">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--ink-1)] sm:text-[24px]">我的提示词</h1>
                            <p className="mt-1 text-[12px] leading-5 text-[var(--ink-3)] sm:mt-1.5 sm:text-[13px]">把常用的提示词存成自己的库，随时复制、加入素材或继续沉淀。</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="hidden h-7 items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-card px-2.5 text-[11px] tabular-nums text-[var(--ink-3)] sm:inline-flex sm:text-[12px]">
                                共 <span className="font-semibold text-[var(--ink-1)]">{total}</span> 条
                            </span>
                            <Button type="primary" icon={<Plus className="size-4" />} className="!h-9 !rounded-xl" onClick={() => setCreateOpen(true)}>
                                添加提示词
                            </Button>
                        </div>
                    </header>

                    {!showEmptyState || hasFilters ? (
                        <section className="mt-3 rounded-2xl border border-[var(--hairline)] bg-card p-2.5 sm:mt-5 sm:p-4">
                            <div className="flex min-w-0 items-center gap-2">
                                <Input
                                    allowClear
                                    size="large"
                                    className="!h-10 min-w-0 flex-1"
                                    prefix={<Search className="size-4 text-[var(--ink-3)]" />}
                                    value={keyword}
                                    placeholder="搜索标题或提示词内容"
                                    onChange={(event) => {
                                        setKeyword(event.target.value);
                                        setPage(1);
                                    }}
                                />
                                <Button size="large" className="!h-10 shrink-0 !rounded-xl" icon={<RotateCcw className="size-3.5" />} aria-label="清除筛选" disabled={!hasFilters} onClick={clearFilters}>
                                    <span className="hidden sm:inline">清除</span>
                                </Button>
                            </div>

                            {categories.length > 1 ? (
                                <div className="mt-2.5 border-t border-[var(--hairline)] pt-2.5 sm:mt-3 sm:pt-3">
                                    <div className="flex min-w-0 items-start gap-2 sm:items-center">
                                        <span className="mt-2 w-7 shrink-0 text-[11px] font-medium text-[var(--ink-3)] sm:mt-0 sm:w-8">分类</span>
                                        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                            {categories.map((option) => {
                                                const active = option === category;
                                                return (
                                                    <Tag.CheckableTag key={option} checked={active} className={cn("prompt-filter-tag shrink-0", active && "is-active")} onChange={() => updateCategory(option)}>
                                                        {option}
                                                    </Tag.CheckableTag>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </section>
                    ) : null}

                    {loading ? <MyPromptGridSkeleton /> : null}

                    {showEmptyState ? (
                        hasFilters ? (
                            <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--hairline)] bg-card px-6 py-16 text-center sm:mt-6">
                                <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-inset)] text-[var(--ink-3)]">
                                    <Search className="size-5" aria-hidden />
                                </span>
                                <h2 className="mt-3 text-[14px] font-semibold text-[var(--ink-1)]">没有匹配的提示词</h2>
                                <p className="mt-1 max-w-[320px] text-[12.5px] leading-5 text-[var(--ink-3)]">换个关键词，或清除分类筛选再看看。</p>
                                <Button className="mt-4 !rounded-xl" icon={<RotateCcw className="size-3.5" />} onClick={clearFilters}>
                                    清除筛选
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--hairline)] bg-card px-6 py-16 text-center sm:mt-6">
                                <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-600)]">
                                    <BookMarked className="size-5" aria-hidden />
                                </span>
                                <h2 className="mt-3 text-[14px] font-semibold text-[var(--ink-1)]">还没有保存提示词</h2>
                                <p className="mt-1 max-w-[340px] text-[12.5px] leading-5 text-[var(--ink-3)]">把调好的提示词存进来，下次直接复制使用，也可以一键加入我的素材。</p>
                                <Button type="primary" className="mt-4 !rounded-xl" icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
                                    添加第一个提示词
                                </Button>
                            </div>
                        )
                    ) : null}

                    {!loading && items.length ? (
                        <div className="mt-3 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                            {items.map((item) => (
                                <PromptCard
                                    key={item.id}
                                    item={item}
                                    onOpen={(previewUrl) => {
                                        setSelectedPrompt(item);
                                        setSelectedPreviewUrl(previewUrl || "");
                                    }}
                                    onCopy={() => copyText(item.prompt, "提示词已复制")}
                                    extraAction={
                                        <div className="flex items-center gap-0.5">
                                            <Button
                                                size="small"
                                                type="text"
                                                className="!rounded-lg"
                                                icon={<FolderPlus className="size-3.5" />}
                                                aria-label="加入我的素材"
                                                title="加入我的素材"
                                                onClick={() => savePromptAsset(item)}
                                            />
                                            <Popconfirm title="删除提示词？" description="删除后无法恢复。" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => deletePrompt(item.id)}>
                                                <Button
                                                    size="small"
                                                    type="text"
                                                    danger
                                                    className="!rounded-lg"
                                                    icon={<Trash2 className="size-3.5" />}
                                                    aria-label="删除提示词"
                                                    title="删除提示词"
                                                    loading={deletingId === item.id}
                                                />
                                            </Popconfirm>
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                    ) : null}

                    {total > PAGE_SIZE ? (
                        <div className="flex flex-wrap items-center justify-center gap-3 py-5 sm:py-8">
                            <Pagination current={page} pageSize={PAGE_SIZE} total={total} showSizeChanger={false} showLessItems responsive onChange={setPage} />
                            <span className="text-[11px] tabular-nums text-[var(--ink-3)] sm:text-xs">
                                第 {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))} 页
                            </span>
                        </div>
                    ) : null}
                </div>
            </main>

            <PromptDetailDialog
                prompt={selectedPrompt}
                previewUrl={selectedPreviewUrl}
                onClose={() => {
                    setSelectedPrompt(null);
                    setSelectedPreviewUrl("");
                }}
                onCopy={(prompt) => copyText(prompt, "提示词已复制")}
                onSaveAsset={savePromptAsset}
            />

            <Modal
                title="添加提示词"
                open={createOpen}
                footer={null}
                centered
                width={680}
                destroyOnHidden
                onCancel={() => setCreateOpen(false)}
                afterClose={() => form.resetFields()}
                styles={{ body: { maxHeight: "calc(100dvh - 200px)", overflowY: "auto" } }}
            >
                <p className="-mt-1 text-xs leading-5 text-[var(--ink-3)]">存下来的提示词只对自己可见，可以随时复制或收进我的素材。</p>
                <Form form={form} layout="vertical" onFinish={createPrompt} requiredMark={false} className="pt-3">
                    <div className="grid gap-x-4 sm:grid-cols-2">
                        <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入标题" }]}>
                            <Input size="large" className="!h-10" placeholder="例如：产品摄影主视觉" />
                        </Form.Item>
                        <Form.Item label="分类" name="category">
                            <Input size="large" className="!h-10" placeholder="例如：商业海报" />
                        </Form.Item>
                        <Form.Item label="标签" name="tags" extra="用逗号分隔，会显示在卡片上">
                            <Input size="large" className="!h-10" placeholder="摄影, 电商, 写实" />
                        </Form.Item>
                        <Form.Item label="封面 URL" name="coverUrl" extra="可选，留空时卡片显示文字封面">
                            <Input size="large" className="!h-10" placeholder="https://..." />
                        </Form.Item>
                    </div>
                    <Form.Item label="提示词内容" name="prompt" rules={[{ required: true, message: "请输入提示词内容" }]}>
                        <Input.TextArea rows={5} placeholder="输入完整提示词..." />
                    </Form.Item>
                    <Form.Item label="备注 / 预览" name="preview" extra="可选，记录使用场景或效果备注">
                        <Input.TextArea rows={2} placeholder="例如：适合 3:4 竖版，人物近景" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button onClick={() => setCreateOpen(false)}>取消</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} icon={<Plus className="size-4" />}>
                            保存提示词
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

function MyPromptGridSkeleton() {
    return (
        <div className="mt-3 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-card">
                    <div className="aspect-[16/10] w-full animate-pulse bg-[var(--surface-inset)]" />
                    <div className="space-y-2 p-3 sm:p-3.5">
                        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--surface-inset)]" />
                        <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-inset)]" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--surface-inset)]" />
                        <div className="flex items-center justify-between pt-2">
                            <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-inset)]" />
                            <div className="h-6 w-20 animate-pulse rounded-lg bg-[var(--surface-inset)]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function splitTags(value?: string) {
    return (value || "")
        .split(/[,，\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
}
