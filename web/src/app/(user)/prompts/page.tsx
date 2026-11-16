"use client";

import { FolderPlus, RotateCcw, Search } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { App, Button, Input, Pagination, Select, Tag } from "antd";

import { CompactEmptyState } from "@/components/compact-empty-state";
import { PromptCard } from "@/components/prompts/prompt-card";
import { PromptDetailDialog } from "@/components/prompts/prompt-detail-dialog";
import { usePromptPage } from "@/components/prompts/use-prompt-list";
import { useCopyText } from "@/hooks/use-copy-text";
import { cn } from "@/lib/utils";
import { useAssetStore } from "@/stores/use-asset-store";
import { ALL_PROMPTS_OPTION, type Prompt } from "@/services/api/prompts";

const PAGE_SIZE = 16;

export default function PromptsPage() {
    const { message } = App.useApp();
    const [titleKeyword, setTitleKeyword] = useState("");
    const [selectedTag, setSelectedTag] = useState(ALL_PROMPTS_OPTION);
    const [selectedCategory, setSelectedCategory] = useState(ALL_PROMPTS_OPTION);
    const [page, setPage] = useState(1);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [selectedPromptPreviewUrl, setSelectedPromptPreviewUrl] = useState("");
    const listStartRef = useRef<HTMLDivElement | null>(null);
    const addAsset = useAssetStore((state) => state.addAsset);
    const copyText = useCopyText();
    const deferredKeyword = useDeferredValue(titleKeyword.trim());
    const {
        query,
        items: promptItems,
        tags: promptTags,
        categories: promptCategoryOptions,
        total: totalPrompts,
    } = usePromptPage({
        keyword: deferredKeyword,
        tag: selectedTag,
        category: selectedCategory,
        page,
        pageSize: PAGE_SIZE,
    });
    const hasFilters = Boolean(titleKeyword.trim()) || selectedTag !== ALL_PROMPTS_OPTION || selectedCategory !== ALL_PROMPTS_OPTION;

    useEffect(() => {
        if (query.isError) {
            message.error(query.error instanceof Error ? query.error.message : "获取提示词失败");
        }
    }, [message, query.error, query.isError]);

    const updateCategory = (value: string) => {
        setSelectedCategory(value);
        setPage(1);
    };

    const updateTag = (value: string) => {
        setSelectedTag(value);
        setPage(1);
    };

    const clearFilters = () => {
        setTitleKeyword("");
        setSelectedCategory(ALL_PROMPTS_OPTION);
        setSelectedTag(ALL_PROMPTS_OPTION);
        setPage(1);
    };

    const changePage = (value: number) => {
        setPage(value);
        requestAnimationFrame(() => listStartRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    };

    const savePromptAsset = async (item: Prompt) => {
        try {
            await addAsset({ kind: "text", title: item.title, coverUrl: item.coverUrl, tags: item.tags, source: item.category, data: { content: item.prompt }, metadata: { source: "prompt-library", promptId: item.id, githubUrl: item.githubUrl || "" } });
            message.success("已加入我的素材");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "素材保存失败");
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <main className="min-h-0 flex-1 overflow-y-auto bg-background">
                <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-7">
                    <header className="flex flex-wrap items-end justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--ink-1)] sm:text-[24px]">提示词库</h1>
                            <p className="mt-1 text-[12px] leading-5 text-[var(--ink-3)] sm:mt-1.5 sm:text-[13px]">浏览公共提示词，复制使用，或一键收进我的素材。</p>
                        </div>
                        <span className="hidden h-7 shrink-0 items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-card px-2.5 text-[11px] tabular-nums text-[var(--ink-3)] sm:inline-flex sm:text-[12px]">
                            共 <span className="font-semibold text-[var(--ink-1)]">{totalPrompts}</span> 条
                            {hasFilters ? <span className="text-[var(--ink-3)]">· 已筛选</span> : null}
                        </span>
                    </header>

                    <section className="mt-3 rounded-2xl border border-[var(--hairline)] bg-card p-2.5 sm:mt-5 sm:p-4">
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                allowClear
                                size="large"
                                className="!h-10 min-w-0 flex-1"
                                prefix={<Search className="size-4 text-[var(--ink-3)]" />}
                                value={titleKeyword}
                                placeholder="搜索标题或提示词内容"
                                onChange={(event) => {
                                    setTitleKeyword(event.target.value);
                                    setPage(1);
                                }}
                            />
                            <div className="flex min-w-0 items-center gap-2">
                                <Select
                                    size="large"
                                    showSearch
                                    aria-label="提示词标签"
                                    className="!h-10 min-w-0 flex-1 sm:w-44 sm:flex-none"
                                    optionFilterProp="label"
                                    value={selectedTag}
                                    options={promptTags.map((tag) => ({ label: tag, value: tag }))}
                                    onChange={updateTag}
                                />
                                <Button size="large" className="!h-10 shrink-0 !rounded-xl" icon={<RotateCcw className="size-3.5" />} aria-label="清除提示词筛选" disabled={!hasFilters} onClick={clearFilters}>
                                    <span className="hidden sm:inline">清除</span>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-2.5 border-t border-[var(--hairline)] pt-2.5 sm:mt-3 sm:pt-3">
                            <ChipRow label="分类" options={promptCategoryOptions} value={selectedCategory} onChange={updateCategory} />
                        </div>
                    </section>

                    <div ref={listStartRef} className="scroll-mt-4 pt-3 sm:pt-5">
                        {query.isLoading ? <PromptGridSkeleton /> : null}
                        {!query.isLoading ? (
                            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                                {promptItems.map((item) => (
                                    <PromptCard
                                        key={item.id}
                                        item={item}
                                        onOpen={(previewUrl) => {
                                            setSelectedPrompt(item);
                                            setSelectedPromptPreviewUrl(previewUrl || "");
                                        }}
                                        onCopy={() => copyText(item.prompt, "提示词已复制")}
                                        extraAction={
                                            <Button
                                                size="small"
                                                type="text"
                                                className="!rounded-lg"
                                                icon={<FolderPlus className="size-3.5" />}
                                                aria-label="加入我的素材"
                                                title="加入我的素材"
                                                onClick={() => savePromptAsset(item)}
                                            />
                                        }
                                    />
                                ))}
                            </div>
                        ) : null}
                        {!query.isLoading && promptItems.length === 0 ? (
                            <CompactEmptyState
                                title="没有找到匹配的提示词"
                                description="试着换个关键词，或切换分类与标签。"
                                action={
                                    hasFilters ? (
                                        <Button icon={<RotateCcw className="size-3.5" />} onClick={clearFilters}>
                                            清除筛选
                                        </Button>
                                    ) : null
                                }
                            />
                        ) : null}
                        {totalPrompts > PAGE_SIZE ? (
                            <div className="flex flex-wrap items-center justify-center gap-3 py-5 sm:py-8">
                                <Pagination current={page} pageSize={PAGE_SIZE} total={totalPrompts} showSizeChanger={false} showLessItems responsive onChange={changePage} />
                                <span className="text-[11px] tabular-nums text-[var(--ink-3)] sm:text-xs">
                                    第 {page} / {Math.max(1, Math.ceil(totalPrompts / PAGE_SIZE))} 页
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            <PromptDetailDialog
                prompt={selectedPrompt}
                previewUrl={selectedPromptPreviewUrl}
                onClose={() => {
                    setSelectedPrompt(null);
                    setSelectedPromptPreviewUrl("");
                }}
                onCopy={(prompt) => copyText(prompt, "提示词已复制")}
                onSaveAsset={savePromptAsset}
            />
        </div>
    );
}

function ChipRow({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (next: string) => void }) {
    return (
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <span className="mt-2 w-7 shrink-0 text-[11px] font-medium text-[var(--ink-3)] sm:mt-0 sm:w-8">{label}</span>
            <div className="thin-scrollbar -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {options.map((option) => {
                    const active = option === value;
                    return (
                        <Tag.CheckableTag key={`${label}-${option}`} checked={active} className={cn("prompt-filter-tag shrink-0", active && "is-active")} onChange={() => onChange(option)}>
                            {option}
                        </Tag.CheckableTag>
                    );
                })}
            </div>
        </div>
    );
}

function PromptGridSkeleton() {
    return (
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-card">
                    <div className="aspect-[16/10] w-full animate-pulse bg-[var(--surface-inset)]" />
                    <div className="space-y-2 p-3 sm:p-3.5">
                        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--surface-inset)]" />
                        <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-inset)]" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--surface-inset)]" />
                        <div className="flex items-center justify-between pt-2">
                            <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-inset)]" />
                            <div className="h-6 w-14 animate-pulse rounded-lg bg-[var(--surface-inset)]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
