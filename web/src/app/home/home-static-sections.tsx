import { AudioLines, Clapperboard, Cloud, History, Image as ImageIcon, Layers3, Network, Video } from "lucide-react";

import { HOME_ADVANTAGES, HOME_STEPS } from "./home-data";
import { Reveal, SectionHeading } from "./home-motion";
import styles from "./home.module.css";

const advantageIcons = { layers: Layers3, network: Network, history: History, cloud: Cloud } as const;

/** 四种产出：和「关于」页同一套信息，但首页只留一行标题 + 一句解释，不放微缩场景。 */
const CAPABILITIES = [
    { title: "图片", description: "主图、海报、详情页，一次生成多张可选。", icon: ImageIcon },
    { title: "视频", description: "文生视频、图生视频，直接出可用镜头。", icon: Video },
    { title: "音频", description: "旁白、配音与氛围声，能直接配进成片。", icon: AudioLines },
    { title: "短剧", description: "剧本、分镜到成片，一条链路走完。", icon: Clapperboard },
] as const;

/** 内容带的环境光层：sticky 在视口顶部，纯 CSS 缓慢漂移，不占文档高度。 */
export function HomeContentAura() {
    return (
        <div className={styles.contentAura} aria-hidden="true">
            <span className={styles.auraWarm} />
            <span className={styles.auraCool} />
            <span className={styles.auraVeil} />
        </div>
    );
}

/* 下面三段都走「发丝线 + 文字」的编辑式排版：
 * 之前每段都是一组带微缩插画的卡片，四张一屏、四张又一屏，
 * 页面上同时出现十来个同权重的方块，读起来像组件展示而不是产品介绍。 */
export function HomeIntroSection() {
    return (
        <section className={styles.section} aria-labelledby="home-intro-title">
            <SectionHeading id="home-intro-title" index="01" label="一个工作台" title="一个入口，四种产出" subtitle="不是把四个工具拼在一起，而是共用同一份输入和上下文。" />
            <div className="mt-10 grid gap-y-8 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
                {CAPABILITIES.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Reveal key={item.title} delay={index * 0.06}>
                            <article className="border-t border-[var(--home-border)] pt-5">
                                <Icon className="size-[18px] text-[var(--brand-500)]" aria-hidden="true" />
                                <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-[var(--home-text)]">{item.title}</h3>
                                <p className="mt-1.5 text-[13px] leading-6 text-[var(--home-muted)]">{item.description}</p>
                            </article>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}

export function HomeStepsSection() {
    return (
        <section className={styles.section} aria-labelledby="home-steps-title">
            <SectionHeading id="home-steps-title" index="02" label="创作流程" title="四步，从一句话到成片" subtitle="上一步的产物下一步直接能用，不用重新上传一遍。" />
            <ol className="mt-10 grid gap-y-8 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
                {HOME_STEPS.map((step, index) => (
                    <Reveal key={step.number} delay={index * 0.06}>
                        <li className="border-t border-[var(--home-border)] pt-5">
                            <span className="text-[11px] font-semibold tabular-nums tracking-[0.14em] text-[var(--brand-500)]">{step.number}</span>
                            <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-[var(--home-text)]">{step.title}</h3>
                            <p className="mt-1.5 text-[13px] leading-6 text-[var(--home-muted)]">{step.description}</p>
                        </li>
                    </Reveal>
                ))}
            </ol>
        </section>
    );
}

export function HomeAdvantagesSection() {
    return (
        <section className={`${styles.section} ${styles.advantages}`} aria-labelledby="home-advantages-title">
            <SectionHeading id="home-advantages-title" index="04" label="平台能力" title="工具会换，作品不用重做" subtitle="模型、任务、素材都存在账号里，换设备或换模型都不用从头再来。" />
            <div className="mt-10 grid gap-y-8 sm:grid-cols-2 sm:gap-x-10">
                {HOME_ADVANTAGES.map((advantage, index) => {
                    const Icon = advantageIcons[advantage.icon];
                    return (
                        <Reveal key={advantage.title} delay={index * 0.06}>
                            <article className="flex gap-3 border-t border-[var(--home-border)] pt-5">
                                <Icon className="mt-0.5 size-4 shrink-0 text-[var(--brand-500)]" aria-hidden="true" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--home-text)]">{advantage.title}</h3>
                                    <p className="mt-1 text-[13px] leading-6 text-[var(--home-muted)]">{advantage.description}</p>
                                </div>
                            </article>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}
