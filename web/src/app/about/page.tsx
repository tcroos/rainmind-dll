import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AudioLines, Clapperboard, Image as ImageIcon, Sparkles, Video } from "lucide-react";

import { resolveSiteTitle } from "@/lib/site-brand";
import { getPublicSiteSettings } from "@/lib/server/site-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const site = await getPublicSiteSettings();
    const siteTitle = resolveSiteTitle(site.title);
    return {
        title: `关于 · ${siteTitle}`,
        description: `${siteTitle} 是一个把图片、视频、音频和短剧放进同一条创作链路的 AI 创作工作台。`,
    };
}

const CAPABILITIES = [
    {
        icon: ImageIcon,
        title: "图片",
        description: "海报、电商主图、概念图与参考图改写，尺寸和比例跟着用途走。",
    },
    {
        icon: Video,
        title: "视频",
        description: "文生视频、图生视频与首尾帧控制，一条提示词就能出可用的镜头。",
    },
    {
        icon: AudioLines,
        title: "声音",
        description: "旁白、口播与氛围音频，和画面共用同一份创作上下文。",
    },
    {
        icon: Clapperboard,
        title: "短剧",
        description: "从剧本、分镜到镜头生成，把一个故事拆成能直接拍的分段。",
    },
];

const STEPS = [
    { number: "01", title: "说清要什么", description: "一句话就够，也可以直接丢一张参考图或一段草稿。" },
    { number: "02", title: "系统自己配", description: "按需求匹配模型、尺寸和时长，不需要逐个挑参数。" },
    { number: "03", title: "结果接着用", description: "继续改、重新生成，或者发布到作品广场让别人看到。" },
];

export default async function AboutPage() {
    const site = await getPublicSiteSettings();
    const siteTitle = resolveSiteTitle(site.title);

    return (
        <div className="app-scroll-page bg-[var(--surface-canvas)] text-[var(--ink-1)]">
            <header className="mx-auto flex h-20 w-full max-w-[1080px] items-center justify-between px-6">
                <Link href="/" className="text-[17px] font-bold tracking-[-0.012em]">
                    {siteTitle}
                </Link>
                <nav className="flex items-center gap-4 text-[13px] text-[var(--ink-2)] sm:gap-6 sm:text-[14px]" aria-label="关于页导航">
                    <Link href="/gallery" className="transition-colors hover:text-[var(--ink-1)]">
                        作品广场
                    </Link>
                    <Link href="/login" className="hidden transition-colors hover:text-[var(--ink-1)] sm:inline">
                        登录
                    </Link>
                    <Link
                        href="/login?next=%2Fcreate"
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 sm:px-5"
                        style={{ backgroundColor: "var(--brand-500)", color: "#ffffff" }}
                    >
                        开始创作
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                </nav>
            </header>

            <main className="mx-auto w-full max-w-[1080px] px-6">
                <section className="border-b border-[var(--hairline)] pb-14 pt-10 sm:pb-20 sm:pt-16">
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--ink-3)]">About · 关于</p>
                    <h1 className="mt-5 max-w-[760px] text-[clamp(2.4rem,6.4vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
                        让每个想法，
                        <br />
                        <span className="text-[var(--brand-500)]">直接变成作品</span>
                    </h1>
                    <p className="mt-6 max-w-[620px] text-[15px] leading-8 text-[var(--ink-2)]">
                        {siteTitle} 是一个把图片、视频、音频和短剧放进同一条链路的 AI 创作工作台。不用先学模型、不用来回切工具，
                        把想做的说清楚，剩下的交给系统。
                    </p>
                    <dl className="mt-10 grid max-w-[620px] grid-cols-3 gap-4 sm:mt-12">
                        {[
                            ["4", "种产出形态"],
                            ["1", "个输入框"],
                            ["0", "次模型选择"],
                        ].map(([value, label]) => (
                            <div key={label} className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-panel)] px-4 py-4 sm:px-5">
                                <dt className="text-[26px] font-semibold leading-none tracking-[-0.02em]">{value}</dt>
                                <dd className="mt-2 text-[12px] text-[var(--ink-3)]">{label}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="py-14 sm:py-20">
                    <div className="flex items-end justify-between gap-6">
                        <div>
                            <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">一个入口，四种产出</h2>
                            <p className="mt-2 text-[14px] text-[var(--ink-2)]">不是把四个工具拼在一起，而是共用同一份输入和上下文。</p>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {CAPABILITIES.map((item) => (
                            <article key={item.title} className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-panel)] p-5">
                                <item.icon className="size-[18px] text-[var(--brand-500)]" aria-hidden="true" />
                                <h3 className="mt-4 text-[15px] font-semibold">{item.title}</h3>
                                <p className="mt-2 text-[13px] leading-6 text-[var(--ink-2)]">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="border-t border-[var(--hairline)] py-14 sm:py-20">
                    <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">创作只需要三步</h2>
                    <p className="mt-2 text-[14px] text-[var(--ink-2)]">把「选模型、调参数、等结果」留给系统，你只管判断好不好看。</p>
                    <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-4">
                        {STEPS.map((step) => (
                            <li key={step.number} className="border-t border-[var(--hairline)] pt-5">
                                <span className="text-[12px] font-medium tabular-nums text-[var(--brand-500)]">{step.number}</span>
                                <h3 className="mt-3 text-[15px] font-semibold">{step.title}</h3>
                                <p className="mt-2 text-[13px] leading-6 text-[var(--ink-2)]">{step.description}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="mb-16 rounded-3xl border border-[var(--hairline)] bg-[var(--surface-panel)] px-6 py-10 sm:mb-20 sm:px-10 sm:py-12">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em]">
                                <Sparkles className="size-4 text-[var(--brand-500)]" aria-hidden="true" />
                                从一张想法开始
                            </h2>
                            <p className="mt-2 text-[13px] text-[var(--ink-2)]">免费注册即可试用，作品保存在你的账号里。</p>
                        </div>
                        <Link
                            href="/login?next=%2Fcreate"
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "var(--brand-500)", color: "#ffffff" }}
                        >
                            开始创作
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[var(--hairline)]">
                <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-3 px-6 py-8 text-[12px] text-[var(--ink-3)] sm:flex-row sm:items-center sm:justify-between">
                    <span>© {new Date().getFullYear()} {siteTitle}</span>
                    <div className="flex items-center gap-5">
                        <Link href="/terms" className="transition-colors hover:text-[var(--ink-1)]">
                            服务条款
                        </Link>
                        <Link href="/privacy" className="transition-colors hover:text-[var(--ink-1)]">
                            隐私政策
                        </Link>
                        <Link href="/" className="transition-colors hover:text-[var(--ink-1)]">
                            返回首页
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
