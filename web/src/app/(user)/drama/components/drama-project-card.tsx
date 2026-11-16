"use client";

import { App, Button, Popconfirm, Tooltip } from "antd";
import { ArrowUpRight, Clapperboard, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { DramaProjectSummary } from "../types";
import { useDramaStore } from "../stores/use-drama-store";

export function DramaProjectCard({ project }: { project: DramaProjectSummary }) {
    const router = useRouter();
    const { message } = App.useApp();
    const deleteProject = useDramaStore((state) => state.deleteProject);
    const pendingCount = project.pendingTaskCount;
    const failedCount = project.failedTaskCount;
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-panel)] shadow-[0_1px_2px_rgba(17,17,19,0.04),0_10px_24px_-20px_rgba(17,17,19,0.35)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[rgba(17,17,19,0.16)] hover:shadow-[0_16px_32px_-22px_rgba(17,17,19,0.4)] focus-within:border-[rgba(17,17,19,0.2)] dark:border-white/10">
            <Link href={`/drama/${project.id}`} className="absolute inset-0 z-0 rounded-xl outline-none" aria-label={`进入短剧项目：${project.title}`}>
                <span className="sr-only">{`进入短剧项目：${project.title}`}</span>
            </Link>

            {/* 没有封面时用一条品牌色渐变带占位，比纯白卡片更容易和列表里的其他内容区分 */}
            <div className="pointer-events-none relative h-[88px] shrink-0 overflow-hidden bg-[linear-gradient(135deg,var(--brand-soft)_0%,var(--surface-inset)_100%)] dark:bg-[linear-gradient(135deg,rgba(240,138,75,0.12)_0%,rgba(255,255,255,0.04)_100%)]">
                <Clapperboard className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-[var(--brand-600)]/55 dark:text-[var(--brand-600)]/70" />
                <span className="absolute right-2 top-2 inline-flex h-5 items-center rounded-full bg-white/85 px-2 text-[11px] font-medium text-[var(--ink-2)] ring-1 ring-black/5 dark:bg-white/15 dark:text-white/90 dark:ring-white/15">{project.ratio}</span>
                {pendingCount ? (
                    <span className="absolute left-2 top-2 inline-flex h-5 items-center rounded-full bg-amber-50 px-2 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900/60">{pendingCount} 执行中</span>
                ) : null}
                {failedCount ? (
                    <span className="absolute bottom-2 right-2 inline-flex h-5 items-center rounded-full bg-rose-50 px-2 text-[11px] font-medium text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/60">{failedCount} 失败</span>
                ) : null}
            </div>

            <div className="pointer-events-none relative z-[1] flex min-w-0 flex-1 flex-col p-3">
                <div className="flex min-w-0 items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[14.5px] font-semibold leading-5">{project.title}</h2>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-[1.55] text-[var(--ink-3)]">{project.summary || "还没有填写项目简介"}</p>
                    </div>
                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-[var(--ink-3)] transition group-hover:text-[var(--ink-1)]" />
                </div>

                <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1 text-[11px] text-[var(--ink-3)]">
                    <span className="inline-flex h-5 items-center rounded-md bg-[var(--surface-inset)] px-1.5">{project.episodeCount} 集</span>
                    <span className="inline-flex h-5 items-center rounded-md bg-[var(--surface-inset)] px-1.5">{project.sceneCount} 场景</span>
                    <span className="inline-flex h-5 items-center rounded-md bg-[var(--surface-inset)] px-1.5">{project.shotCount} 分镜</span>
                    <span className="inline-flex h-5 items-center rounded-md bg-[var(--surface-inset)] px-1.5">{project.characterCount} 角色</span>
                </div>

                <div className="relative z-10 mt-auto flex min-w-0 items-center justify-end gap-1.5 border-t border-[var(--hairline)] pt-2.5">
                    <Popconfirm title="删除这个短剧项目？" onConfirm={() => deleteProject(project.id).catch((error) => message.error(error instanceof Error ? error.message : "项目删除失败"))}>
                        <Tooltip title="删除项目">
                            <Button
                                type="text"
                                shape="circle"
                                className="!pointer-events-auto !size-7 !text-[var(--ink-3)] hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-950/30 dark:hover:!text-rose-300"
                                icon={<Trash2 className="size-3.5" />}
                                aria-label="删除项目"
                            />
                        </Tooltip>
                    </Popconfirm>
                    <Button
                        size="small"
                        className="!pointer-events-auto !h-7 !rounded-md !px-2.5 !text-[12px]"
                        icon={<Share2 className="size-3.5" />}
                        onClick={() => router.push(`/works?sourceType=drama&sourceId=${encodeURIComponent(project.id)}`)}
                    >
                        发布
                    </Button>
                </div>
            </div>
        </article>
    );
}
