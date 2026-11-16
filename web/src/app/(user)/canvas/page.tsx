"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Button, Input, Pagination } from "antd";
import { Download, FileUp, Plus, Search } from "lucide-react";

import { readZip } from "@/lib/zip";
import { cn } from "@/lib/utils";
import { APP_EXPORT_ID } from "@/lib/storage-keys";
import { uploadMediaFile } from "@/services/file-storage";
import { uploadImage } from "@/services/image-storage";
import { CanvasDeleteProjectsDialog } from "./components/canvas-delete-projects-dialog";
import { CanvasCreateCard } from "./components/canvas-project-create-card";
import { CanvasProjectCard } from "./components/canvas-project-card";
import type { CanvasExportFile } from "./export-types";
import { useCanvasStore } from "./stores/use-canvas-store";
import { useCanvasUiStore } from "./stores/use-canvas-ui-store";
import { resolveSiteTitle } from "@/lib/site-brand";
import { usePublicSessionStore } from "@/stores/use-public-session-store";
import { useUserStore } from "@/stores/use-user-store";
import { exportCanvasProjects } from "./utils/canvas-export";

export default function CanvasPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLInputElement>(null);
    const autoOpenRef = useRef(false);
    const [creating, setCreating] = useState(false);
    const [exporting, setExporting] = useState(false);
    const siteTitle = usePublicSessionStore((state) => resolveSiteTitle(state.payload?.settings?.site?.title));
    const userId = useUserStore((state) => state.user?.id || "");
    const hydrated = useCanvasStore((state) => state.hydrated);
    const hydratedUserId = useCanvasStore((state) => state.hydratedUserId);
    const syncError = useCanvasStore((state) => state.syncError);
    const hydrate = useCanvasStore((state) => state.hydrate);
    const projects = useCanvasStore((state) => state.summaries);
    const total = useCanvasStore((state) => state.summaryTotal);
    const page = useCanvasStore((state) => state.summaryPage);
    const pageSize = useCanvasStore((state) => state.summaryPageSize);
    const loadProject = useCanvasStore((state) => state.loadProject);
    const createProject = useCanvasStore((state) => state.createProject);
    const importProject = useCanvasStore((state) => state.importProject);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
    const removeSelectedIds = useCanvasUiStore((state) => state.removeSelectedProjectIds);
    const searchProjects = useCanvasStore((state) => state.searchProjects);
    const storedKeyword = useCanvasStore((state) => state.summaryKeyword);
    const summaryBusy = useCanvasStore((state) => state.summaryBusy);
    const [keyword, setKeyword] = useState(storedKeyword);
    const ready = Boolean(userId && hydrated && hydratedUserId === userId);

    const mode = searchParams.get("mode");
    const agentMode = mode === "new" || mode === "recent" || mode === "choose";
    const agentQuery = agentMode ? `?${searchParams.toString()}` : "";
    const enterProject = (id: string) => {
        router.push(`/canvas/${id}${agentQuery}`);
    };
    const createAndEnter = async () => {
        if (creating) return;
        setCreating(true);
        try {
            enterProject(await createProject(`${siteTitle} 画布 ${total + 1}`, { insertIntoList: false }));
        } catch (error) {
            message.error(error instanceof Error ? error.message : "画布创建失败");
        } finally {
            setCreating(false);
        }
    };
    const importCanvas = async (file?: File) => {
        if (!file) return;
        try {
            const zip = await readZip(file);
            const projectFile = zip.get("projects.json");
            if (!projectFile) throw new Error("missing projects.json");
            const data = JSON.parse(await projectFile.text()) as CanvasExportFile;
            if (data.app !== APP_EXPORT_ID) throw new Error("不是当前应用的画布包");
            await Promise.all(
                data.projects.map(async (item) => {
                    const uploaded = new Map<string, { storageKey: string; url: string }>();
                    await Promise.all(
                        item.files.map(async (file) => {
                            const blob = zip.get(file.path);
                            if (!blob) return;
                            const typedBlob = blob.type ? blob : blob.slice(0, blob.size, file.mimeType);
                            const media = file.mimeType.startsWith("image/") ? await uploadImage(typedBlob) : await uploadMediaFile(typedBlob, file.mimeType.startsWith("audio/") ? "audio" : "video");
                            uploaded.set(file.storageKey, media);
                        }),
                    );
                    await importProject(remapImportedProjectMedia(item.project, uploaded));
                }),
            );
            message.success(`已导入 ${data.projects.length} 个画布`);
        } catch {
            message.error("导入失败，请选择有效的画布压缩包");
        } finally {
            if (inputRef.current) inputRef.current.value = "";
        }
    };
    const exportSelectedProjects = async () => {
        if (!selectedIds.length || exporting) return;
        setExporting(true);
        try {
            const selected = await Promise.all(selectedIds.map((id) => loadProject(id)));
            await exportCanvasProjects(selected);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "画布导出失败");
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        void hydrate();
    }, [hydrate, userId]);

    // 输入停顿 320ms 再查，避免每敲一个字打一次接口；store 里同词会直接短路
    useEffect(() => {
        if (!ready) return;
        const timer = setTimeout(() => void searchProjects(keyword), 320);
        return () => clearTimeout(timer);
    }, [keyword, ready, searchProjects]);

    useEffect(() => {
        if (!ready || autoOpenRef.current || (mode !== "new" && mode !== "recent")) return;
        autoOpenRef.current = true;
        void (async () => {
            try {
                const defaultName = `${siteTitle} 画布 ${total + 1}`;
                const id = mode === "new" ? await createProject(defaultName, { insertIntoList: false }) : projects[0]?.id || (await createProject(defaultName, { insertIntoList: false }));
                enterProject(id);
            } catch (error) {
                autoOpenRef.current = false;
                message.error(error instanceof Error ? error.message : "画布打开失败");
            }
        })();
    }, [createProject, message, mode, projects, ready, siteTitle, total]);

    if (creating || (ready && (mode === "new" || mode === "recent"))) {
        return <main className="flex h-full items-center justify-center gap-2 bg-background text-sm text-[var(--ink-3)]">正在打开画布...</main>;
    }

    return (
        <main className="h-full overflow-auto bg-background text-[var(--ink-1)]">
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-7 sm:py-7">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[12px] leading-4 text-[var(--ink-3)]">画布库</p>
                        <h1 className="mt-1 truncate text-[20px] font-semibold leading-7 tracking-tight sm:text-[22px]">我的画布</h1>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {/* 用外层 div 控制宽度：antd 的 .ant-input-affix-wrapper 自带 width:100%，
                            直接给 Input 写 w-[190px] 会被它按未分层规则压掉 */}
                        <div className="hidden w-[190px] shrink-0 sm:block">
                            <Input
                                allowClear
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                prefix={<Search className="size-3.5 text-[var(--ink-3)]" />}
                                placeholder="搜索画布"
                                aria-label="搜索画布"
                                className="w-full"
                            />
                        </div>
                        <Button disabled={!ready} icon={<FileUp className="size-4" />} onClick={() => inputRef.current?.click()}>
                            导入画布
                        </Button>
                        <Button disabled={!ready} loading={creating} type="primary" icon={<Plus className="size-4" />} onClick={() => void createAndEnter()}>
                            新建画布
                        </Button>
                    </div>
                </header>

                {selectedIds.length ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--surface-panel)] px-3 py-2 shadow-[0_1px_2px_rgba(17,17,19,0.05),0_8px_20px_-14px_rgba(17,17,19,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_-14px_rgba(0,0,0,0.7)]">
                        <span className="text-[12px] text-[var(--ink-2)]">已选 {selectedIds.length} 个画布</span>
                        <span className="flex-1" />
                        <Button size="small" loading={exporting} icon={<Download className="size-3.5" />} onClick={() => void exportSelectedProjects()}>
                            导出
                        </Button>
                        <Button size="small" danger onClick={() => setDeleteIds(selectedIds)}>
                            删除
                        </Button>
                        <Button size="small" type="text" onClick={() => removeSelectedIds(selectedIds)}>
                            取消选择
                        </Button>
                    </div>
                ) : null}

                {!ready ? (
                    <section className="flex min-h-40 flex-col items-center justify-center gap-3 text-center text-sm text-[var(--ink-3)]">
                        <span>{syncError || "正在加载画布..."}</span>
                        {syncError ? (
                            <Button size="small" onClick={() => void hydrate(true)}>
                                重新加载
                            </Button>
                        ) : null}
                    </section>
                ) : (
                    <>
                        <div className={cn("grid grid-cols-1 gap-x-3 gap-y-6 transition-opacity duration-200 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4", summaryBusy && "pointer-events-none opacity-50")}>
                            <CanvasCreateCard onCreate={() => void createAndEnter()} loading={creating} />
                            {projects.map((project) => (
                                <CanvasProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                        {!projects.length ? (
                            <p className="pb-6 text-center text-[12px] text-[var(--ink-3)]">
                                {keyword.trim() ? `没有找到包含「${keyword.trim()}」的画布` : "还没有画布，点上面的卡片开始搭第一个"}
                            </p>
                        ) : null}
                        {total > pageSize ? (
                            <div className="flex justify-center pb-2">
                                <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger={false} onChange={(nextPage) => void hydrate(true, nextPage)} />
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            <input ref={inputRef} type="file" accept="application/zip,.zip" className="hidden" onChange={(event) => void importCanvas(event.target.files?.[0])} />
            <CanvasDeleteProjectsDialog />
        </main>
    );
}

function remapImportedProjectMedia(project: CanvasExportFile["projects"][number]["project"], uploaded: Map<string, { storageKey: string; url: string }>) {
    const visit = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(visit);
        if (!value || typeof value !== "object") return value;
        const source = value as Record<string, unknown>;
        const next = Object.fromEntries(Object.entries(source).map(([key, item]) => [key, visit(item)]));
        const media = typeof source.storageKey === "string" ? uploaded.get(source.storageKey) : undefined;
        if (!media) return next;
        next.storageKey = media.storageKey;
        next.serverUrl = media.url;
        delete next.remoteUrl;
        if ("content" in source) next.content = media.url;
        if ("dataUrl" in source) next.dataUrl = media.url;
        if ("url" in source) next.url = media.url;
        return next;
    };
    return visit(project) as typeof project;
}
