"use client";

import { Button, Dropdown, Input, Modal, Spin, Tooltip } from "antd";
import { AtSign, ChevronDown, CornerDownLeft, FileVideo, ImageIcon, LibraryBig, ListFilter, Play, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LazyMediaImage } from "@/components/media/lazy-media-image";
import type { CreativeAsset } from "@/lib/creative-runtime-contract";
import { imagePreviewUrl } from "@/lib/media-image-url";
import { cn } from "@/lib/utils";
import { listMyPrompts } from "@/services/api/my-prompts";
import { ALL_PROMPTS_OPTION, fetchPrompts, promptCategoryLabel, type Prompt } from "@/services/api/prompts";

import { CreateSidePanel } from "./create-side-panel";

type PromptCollection = {
    items: Prompt[];
    page: number;
    total: number;
    loading: boolean;
    loaded: boolean;
    error: string;
    categories: string[];
};
type AssetPanelTab = "assets" | "my" | "library";
type PanelPreview = { type: "image" | "video"; url: string; title: string; posterUrl?: string };

const emptyPromptCollection = (): PromptCollection => ({ items: [], page: 0, total: 0, loading: false, loaded: false, error: "", categories: [] });
const resetPromptCollection = (current: PromptCollection): PromptCollection => ({ ...emptyPromptCollection(), categories: current.categories });

export function CreativeAssetsPanel({
    open,
    conversationId,
    assets,
    selectedAssetIds,
    onToggleAsset,
    onUsePrompt,
    onClose,
}: {
    open: boolean;
    conversationId?: string;
    assets: CreativeAsset[];
    selectedAssetIds: string[];
    onToggleAsset: (id: string) => void;
    onUsePrompt: (prompt: string) => void;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<AssetPanelTab>("assets");
    const [myPrompts, setMyPrompts] = useState(emptyPromptCollection);
    const [libraryPrompts, setLibraryPrompts] = useState(emptyPromptCollection);
    const [myPromptCategory, setMyPromptCategory] = useState(ALL_PROMPTS_OPTION);
    const [libraryPromptCategory, setLibraryPromptCategory] = useState(ALL_PROMPTS_OPTION);
    const [myPromptKeyword, setMyPromptKeyword] = useState("");
    const [libraryPromptKeyword, setLibraryPromptKeyword] = useState("");
    const [preview, setPreview] = useState<PanelPreview>();
    const inFlightRef = useRef(new Set<string>());
    const mediaAssets = assets.filter((asset) => asset.status === "ready" && (asset.type === "image" || asset.type === "video"));

    const loadPromptPage = useCallback(async (kind: "my" | "library", page: number, category: string, keyword: string) => {
        const requestKey = `${kind}:${category}:${keyword}:${page}`;
        if (inFlightRef.current.has(requestKey)) return;
        inFlightRef.current.add(requestKey);
        const setCollection = kind === "my" ? setMyPrompts : setLibraryPrompts;
        setCollection((current) => ({ ...current, loading: true, error: "" }));
        try {
            const includeFacets = page === 1;
            const payload = kind === "my" ? await listMyPrompts({ page, category, keyword, includeFacets }) : await fetchPrompts({ page, category, keyword, includeFacets });
            setCollection((current) => ({
                items: page === 1 ? payload.items : uniquePrompts([...current.items, ...payload.items]),
                page,
                total: payload.total,
                categories: page === 1 ? payload.categories : current.categories,
                loading: false,
                loaded: true,
                error: "",
            }));
        } catch (error) {
            setCollection((current) => ({ ...current, loading: false, loaded: true, error: error instanceof Error ? error.message : "提示词加载失败" }));
        } finally {
            inFlightRef.current.delete(requestKey);
        }
    }, []);

    useEffect(() => {
        if (!open || activeTab === "assets") return;
        const collection = activeTab === "my" ? myPrompts : libraryPrompts;
        const category = activeTab === "my" ? myPromptCategory : libraryPromptCategory;
        const keyword = activeTab === "my" ? myPromptKeyword : libraryPromptKeyword;
        if (!collection.loaded && !collection.loading) void loadPromptPage(activeTab, 1, category, keyword);
    }, [activeTab, libraryPromptCategory, libraryPromptKeyword, libraryPrompts, loadPromptPage, myPromptCategory, myPromptKeyword, myPrompts, open]);

    const tabs: { key: AssetPanelTab; label: string; count?: number }[] = [
        { key: "assets", label: "当前对话", count: mediaAssets.length },
        { key: "my", label: "我的提示词", count: myPrompts.loaded ? myPrompts.total : undefined },
        { key: "library", label: "提示词库", count: libraryPrompts.loaded ? libraryPrompts.total : undefined },
    ];

    return (
        <>
            <CreateSidePanel open={open} title="资产" icon={<LibraryBig className="size-4" />} onClose={onClose}>
                <div className="flex h-full min-h-0 flex-col">
                    {/* 分段切换：三个等宽胶囊，选中是白底浮起，比原来的下划线 tab 更安静 */}
                    <div className="shrink-0 px-3 pb-2.5 pt-3">
                        <div className="flex gap-1 rounded-lg bg-[var(--surface-inset)] p-1" role="tablist" aria-label="资产面板">
                            {tabs.map((tab) => {
                                const active = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cn(
                                            "flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[12.5px] font-medium transition-colors",
                                            active
                                                ? "bg-white text-[var(--ink-1)] shadow-[0_1px_3px_rgba(32,36,42,0.08)] dark:bg-[#2f343b] dark:text-white"
                                                : "text-[var(--ink-3)] hover:text-[var(--ink-1)] dark:hover:text-white",
                                        )}
                                    >
                                        {tab.label}
                                        {tab.count ? <span className="text-[10px] font-normal opacity-55">{tab.count}</span> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-hidden">
                        {activeTab === "assets" ? (
                            <ConversationAssets conversationId={conversationId} assets={mediaAssets} selectedAssetIds={selectedAssetIds} onToggle={onToggleAsset} onPreview={setPreview} />
                        ) : activeTab === "my" ? (
                            <PromptList
                                collection={myPrompts}
                                activeCategory={myPromptCategory}
                                keyword={myPromptKeyword}
                                onSearch={(keyword) => {
                                    setMyPromptKeyword(keyword);
                                    setMyPrompts(resetPromptCollection);
                                }}
                                onCategoryChange={(category) => {
                                    setMyPromptCategory(category);
                                    setMyPrompts(resetPromptCollection);
                                }}
                                onPreview={setPreview}
                                onUse={onUsePrompt}
                                onRetry={() => void loadPromptPage("my", 1, myPromptCategory, myPromptKeyword)}
                                onLoadMore={() => void loadPromptPage("my", myPrompts.page + 1, myPromptCategory, myPromptKeyword)}
                            />
                        ) : (
                            <PromptList
                                collection={libraryPrompts}
                                activeCategory={libraryPromptCategory}
                                keyword={libraryPromptKeyword}
                                onSearch={(keyword) => {
                                    setLibraryPromptKeyword(keyword);
                                    setLibraryPrompts(resetPromptCollection);
                                }}
                                onCategoryChange={(category) => {
                                    setLibraryPromptCategory(category);
                                    setLibraryPrompts(resetPromptCollection);
                                }}
                                onPreview={setPreview}
                                onUse={onUsePrompt}
                                onRetry={() => void loadPromptPage("library", 1, libraryPromptCategory, libraryPromptKeyword)}
                                onLoadMore={() => void loadPromptPage("library", libraryPrompts.page + 1, libraryPromptCategory, libraryPromptKeyword)}
                            />
                        )}
                    </div>
                </div>
            </CreateSidePanel>
            <AssetPreviewModal preview={preview} onClose={() => setPreview(undefined)} />
        </>
    );
}

export function ConversationAssets({
    conversationId,
    assets,
    selectedAssetIds,
    onToggle,
    onPreview,
}: {
    conversationId?: string;
    assets: CreativeAsset[];
    selectedAssetIds: string[];
    onToggle: (id: string) => void;
    onPreview: (preview: PanelPreview) => void;
}) {
    const [activeType, setActiveType] = useState<"image" | "video">("image");
    if (!conversationId || !assets.length) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 pb-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-inset)] text-[var(--ink-3)]">
                    <ImageIcon className="size-5" />
                </span>
                <div>
                    <p className="text-[13px] font-medium text-[var(--ink-2)]">当前对话还没有资产</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-[var(--ink-3)]">生成的图片和视频会出现在这里，点「引用」可以直接带进下一轮</p>
                </div>
            </div>
        );
    }
    const imageAssets = assets.filter((asset) => asset.type === "image");
    const videoAssets = assets.filter((asset) => asset.type === "video");
    const visibleType = activeType === "image" && imageAssets.length ? "image" : activeType === "video" && videoAssets.length ? "video" : imageAssets.length ? "image" : "video";
    const visibleAssets = visibleType === "image" ? imageAssets : videoAssets;
    const selected = new Set(selectedAssetIds);
    return (
        <div className="flex h-full min-h-0 flex-col" data-testid="creative-conversation-assets">
            <div className="flex shrink-0 items-center gap-1.5 px-3 pb-2.5" role="tablist" aria-label="当前对话资产类型">
                <ConversationAssetTypeTab label="图片" count={imageAssets.length} active={visibleType === "image"} disabled={!imageAssets.length} onClick={() => setActiveType("image")} />
                <ConversationAssetTypeTab label="视频" count={videoAssets.length} active={visibleType === "video"} disabled={!videoAssets.length} onClick={() => setActiveType("video")} />
            </div>
            <div className="hide-scrollbar grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-2 overflow-y-auto px-3 pb-4" data-testid={`creative-conversation-${visibleType}-assets`}>
                {visibleAssets.map((asset) => {
                    const active = selected.has(asset.id);
                    return (
                        <article key={asset.id} className="group min-w-0" title={asset.title}>
                            <div
                                className={cn(
                                    "relative aspect-square overflow-hidden rounded-lg bg-[var(--surface-inset)] ring-1 transition",
                                    active ? "ring-2 ring-[var(--ink-1)] dark:ring-[#8b8b95]" : "ring-black/5 group-hover:ring-black/15 dark:ring-white/10 dark:group-hover:ring-white/25",
                                )}
                            >
                                <button
                                    type="button"
                                    className="block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ink-1)]"
                                    onClick={() => {
                                        const url = asset.serverUrl || asset.remoteUrl;
                                        if (!url || (asset.type !== "image" && asset.type !== "video")) return;
                                        const posterUrl = typeof asset.metadata.coverUrl === "string" ? asset.metadata.coverUrl : undefined;
                                        onPreview({ type: asset.type, url, title: asset.title, posterUrl });
                                    }}
                                    aria-label={`展开查看${asset.title}`}
                                >
                                    <AssetPreview asset={asset} />
                                </button>
                                {asset.type === "video" ? (
                                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-black/55 text-white">
                                        <Play className="ml-0.5 size-3 fill-current" />
                                    </span>
                                ) : null}
                                {active ? (
                                    <span className="pointer-events-none absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[var(--ink-1)] text-white dark:bg-white dark:text-[#1b1e22]">
                                        <AtSign className="size-3" />
                                    </span>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                data-testid="creative-asset-reference-action"
                                className={cn(
                                    "mt-1 flex h-6 w-full items-center justify-center gap-1 rounded-md text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-1)]",
                                    active ? "text-[var(--ink-1)] hover:bg-[var(--surface-soft)]" : "text-[var(--ink-3)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)]",
                                )}
                                onClick={() => onToggle(asset.id)}
                                aria-pressed={active}
                                aria-label={`${active ? "取消引用" : "引用"}${asset.title}`}
                                title={active ? "取消引用" : "引用"}
                            >
                                {active ? "已引用" : "引用"}
                            </button>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

function ConversationAssetTypeTab({ label, count, active, disabled, onClick }: { label: "图片" | "视频"; count: number; active: boolean; disabled: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11.5px] font-medium transition-colors",
                active
                    ? "bg-[var(--ink-1)] text-white dark:bg-white dark:text-[#1b1e22]"
                    : "bg-[var(--surface-inset)] text-[var(--ink-3)] hover:text-[var(--ink-1)] disabled:cursor-default disabled:opacity-40",
            )}
            onClick={onClick}
        >
            {label}
            <span className="text-[10px] font-normal opacity-65">{count}</span>
        </button>
    );
}

export function PromptList({
    collection,
    activeCategory,
    keyword,
    onSearch,
    onCategoryChange,
    onPreview,
    onUse,
    onRetry,
    onLoadMore,
}: {
    collection: PromptCollection;
    activeCategory: string;
    keyword: string;
    onSearch: (keyword: string) => void;
    onCategoryChange: (category: string) => void;
    onPreview: (preview: PanelPreview) => void;
    onUse: (prompt: string) => void;
    onRetry: () => void;
    onLoadMore: () => void;
}) {
    const [searchValue, setSearchValue] = useState(keyword);

    useEffect(() => setSearchValue(keyword), [keyword]);

    const hasMore = collection.items.length < collection.total;
    const categories = [ALL_PROMPTS_OPTION, ...collection.categories];
    return (
        <div data-testid="creative-prompt-scroll" className="hide-scrollbar h-full min-h-0 overflow-y-auto overscroll-contain px-3 pb-4">
            <div className="sticky top-0 z-20 mb-2 flex min-w-0 gap-1.5 bg-white pb-2 dark:bg-[#15181c]">
                <Input
                    value={searchValue}
                    allowClear
                    prefix={
                        <button type="button" className="grid size-6 place-items-center text-[#7a8490] transition hover:text-[var(--ink-1)] dark:text-[#929ca8]" onClick={() => onSearch(searchValue.trim())} aria-label="搜索提示词">
                            <Search className="size-4" />
                        </button>
                    }
                    placeholder="搜索提示词"
                    className="min-w-0 flex-1 !rounded-md [&_.ant-input]:!text-xs"
                    onChange={(event) => {
                        const next = event.target.value;
                        setSearchValue(next);
                        if (!next && keyword) onSearch("");
                    }}
                    onPressEnter={() => onSearch(searchValue.trim())}
                    aria-label="搜索提示词"
                />
                {collection.categories.length ? (
                    <Dropdown
                        trigger={["click"]}
                        popupRender={(menu) => (
                            <div className="[&_.ant-dropdown-menu]:!rounded-md [&_.ant-dropdown-menu]:!border [&_.ant-dropdown-menu]:!border-[#e3e7eb] [&_.ant-dropdown-menu]:!p-1 [&_.ant-dropdown-menu]:!shadow-[0_10px_28px_rgba(31,35,41,0.12)] [&_.ant-dropdown-menu-item]:!min-h-8 [&_.ant-dropdown-menu-item]:!rounded [&_.ant-dropdown-menu-item]:!px-2.5 [&_.ant-dropdown-menu-item]:!text-xs [&_.ant-dropdown-menu-item-active]:!bg-[#f3f5f7] [&_.ant-dropdown-menu-item:hover]:!bg-[#f3f5f7] dark:[&_.ant-dropdown-menu]:!border-[#343a42] dark:[&_.ant-dropdown-menu]:!bg-[#20242a] dark:[&_.ant-dropdown-menu-item]:!text-[#c8cfd7] dark:[&_.ant-dropdown-menu-item-active]:!bg-[#2b3036] dark:[&_.ant-dropdown-menu-item:hover]:!bg-[#2b3036]">
                                {menu}
                            </div>
                        )}
                        menu={{
                            items: categories.map((category) => ({ key: category, label: promptCategoryLabel(category) })),
                            onClick: ({ key }) => onCategoryChange(key),
                        }}
                    >
                        <button
                            type="button"
                            className="flex h-8 max-w-28 shrink-0 items-center gap-1.5 rounded-md border border-[#e1e5e9] bg-transparent px-2.5 text-xs font-medium text-[#596572] transition hover:border-[#cfd3da] hover:bg-[var(--surface-soft)] hover:text-[var(--ink-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-1)] dark:border-[#343a42] dark:text-[#b4bdc7] dark:hover:border-[#4a4d55] dark:hover:bg-[var(--surface-inset)] dark:hover:text-[var(--ink-1)]"
                            aria-label="提示词分类"
                        >
                            <ListFilter className="size-3.5 shrink-0 text-[var(--ink-2)]" />
                            <span className="truncate">{promptCategoryLabel(activeCategory)}</span>
                            <ChevronDown className="size-3.5 shrink-0 opacity-55" />
                        </button>
                    </Dropdown>
                ) : null}
            </div>
            {collection.loading && !collection.items.length ? (
                <div className="grid h-48 place-items-center">
                    <Spin size="small" />
                </div>
            ) : collection.error && !collection.items.length ? (
                <PanelEmpty
                    icon={<RefreshCw className="size-5" />}
                    text={collection.error}
                    action={
                        <Button size="small" type="text" icon={<RefreshCw className="size-3.5" />} onClick={onRetry}>
                            重新加载
                        </Button>
                    }
                />
            ) : !collection.items.length ? (
                <PanelEmpty icon={<Sparkles className="size-5" />} text="暂无可用提示词" />
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-1.5" data-testid="creative-prompt-thumbnails">
                        {collection.items.map((item) => (
                            <article key={item.id} className="group min-w-0" title={item.title}>
                                <div className="aspect-square overflow-hidden rounded-md border border-[#e3e7eb] bg-[#f1f3f5] dark:border-[#30363e] dark:bg-[#24282e]">
                                    {item.coverUrl ? (
                                        <button
                                            type="button"
                                            className="block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ink-1)]"
                                            onClick={() => onPreview({ type: "image", url: item.coverUrl, title: item.title })}
                                            aria-label={`展开查看${item.title}`}
                                        >
                                            <LazyMediaImage src={imagePreviewUrl(item.coverUrl, 480)} alt="" containerClassName="size-full" imageClassName="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                                        </button>
                                    ) : (
                                        <span className="grid size-full place-items-center text-[#929ba6] dark:text-[#78828e]" aria-hidden="true">
                                            <Sparkles className="size-5" />
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    data-testid="creative-prompt-insert-action"
                                    className="mt-1 flex h-5 w-full items-center justify-center gap-1 rounded-sm !bg-transparent !text-[11px] !text-[#68727e] font-medium transition-colors hover:!bg-transparent hover:!text-[var(--ink-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-1)] dark:!text-[var(--ink-3)]"
                                    onClick={() => onUse(item.prompt)}
                                    aria-label={`插入：${item.title}`}
                                >
                                    <CornerDownLeft className="size-3" aria-hidden="true" />
                                    插入
                                </button>
                            </article>
                        ))}
                    </div>
                    {hasMore ? (
                        <Button block type="text" size="small" loading={collection.loading} className="!mt-2 !text-xs" onClick={onLoadMore}>
                            加载更多
                        </Button>
                    ) : null}
                </>
            )}
        </div>
    );
}

function PanelEmpty({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex h-48 flex-col items-center justify-center gap-2 px-5 text-center text-xs text-[#8b949f] dark:text-[#7f8996]">
            <span className="grid size-10 place-items-center rounded-md bg-[#f0f0ff] text-[#6066d2] dark:bg-[#2b2d49] dark:text-[#b7baff]">{icon}</span>
            <span>{text}</span>
            {action}
        </div>
    );
}

function AssetPreview({ asset }: { asset: CreativeAsset }) {
    const url = asset.serverUrl || asset.remoteUrl;
    if (asset.type === "image" && url) return <img src={imagePreviewUrl(url, 320)} alt="" className="size-full object-cover" loading="lazy" />;
    const coverUrl = typeof asset.metadata.coverUrl === "string" ? asset.metadata.coverUrl : "";
    if (asset.type === "video" && coverUrl) return <img src={imagePreviewUrl(coverUrl, 320)} alt="" className="size-full object-cover" loading="lazy" />;
    if (asset.type === "video" && url) return <video src={url} aria-label={asset.title} className="size-full bg-black object-cover" muted playsInline preload="metadata" />;
    const Icon = asset.type === "video" ? FileVideo : ImageIcon;
    return (
        <span className="grid size-full place-items-center text-[#7b8490] dark:text-[#aab3bf]">
            <Icon className="size-5" />
        </span>
    );
}

function AssetPreviewModal({ preview, onClose }: { preview?: PanelPreview; onClose: () => void }) {
    return (
        <Modal title="预览" open={Boolean(preview)} footer={null} centered width="fit-content" destroyOnHidden onCancel={onClose} style={{ maxWidth: "calc(100vw - 32px)" }}>
            <div className="overflow-hidden rounded-md border border-[#e3e7eb] bg-white dark:border-[#343a42] dark:bg-[#111316]">
                {preview?.type === "image" ? <img src={imagePreviewUrl(preview.url, 2048)} alt={preview.title} className="block h-auto max-h-[78dvh] w-auto max-w-[calc(100vw-80px)] object-contain" /> : null}
                {preview?.type === "video" ? (
                    <video
                        src={preview.url}
                        poster={preview.posterUrl ? imagePreviewUrl(preview.posterUrl, 1280) : undefined}
                        aria-label={preview.title}
                        className="block h-auto max-h-[78dvh] w-auto max-w-[calc(100vw-80px)] bg-black object-contain"
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                    />
                ) : null}
            </div>
        </Modal>
    );
}

function uniquePrompts(items: Prompt[]) {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function TabLabel({ text, count }: { text: string; count?: number }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium">
            {text}
            {count ? <span className="text-[10px] font-normal opacity-55">{count}</span> : null}
        </span>
    );
}
