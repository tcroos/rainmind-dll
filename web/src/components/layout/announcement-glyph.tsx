"use client";

import { useId } from "react";

/**
 * 官方公告的徽记：不再用 lucide 那枚「原皮」线性小喇叭，
 * 换成一支品牌橙→青蓝渐变的星芒，和顶部渐变带同一套色。
 * 渐变 id 由 useId 生成：列表里每条公告一枚，多个实例不会互相抢 defs。
 */
export function AnnouncementGlyph({ className }: { className?: string }) {
    const gradientId = `announcement-glyph-${useId().replace(/:/g, "")}`;

    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
            <defs>
                <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffc47f" />
                    <stop offset="0.52" stopColor="#e2671f" />
                    <stop offset="1" stopColor="#4fa8d4" />
                </linearGradient>
            </defs>
            {/* 主体：圆润四角星，凹边由二次曲线收出来，不是硬折线的默认图标 */}
            <path d="M12 2.6 Q12.85 11.15 21.4 12 Q12.85 12.85 12 21.4 Q11.15 12.85 2.6 12 Q11.15 11.15 12 2.6 Z" fill={`url(#${gradientId})`} />
            <path d="M19.4 2.6 Q19.78 5.5 22.6 6 Q19.78 6.5 19.4 9.4 Q19.02 6.5 16.2 6 Q19.02 5.5 19.4 2.6 Z" fill={`url(#${gradientId})`} opacity="0.68" />
            <circle cx="4.5" cy="19.2" r="1.15" fill={`url(#${gradientId})`} opacity="0.5" />
        </svg>
    );
}

export type ChipGlyphVariant = "star" | "pulse" | "diamond";

/**
 * 顶部公告条那排小方块里的符号：抽象几何，统一由 currentColor 着色，
 * 不再塞四五个不同颜色的线性图标 —— 那正是「原皮」感的来源。
 */
export function AnnouncementChipGlyph({ variant, className }: { variant: ChipGlyphVariant; className?: string }) {
    if (variant === "star") {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
                <path d="M12 3.8 Q12.75 11.25 20.2 12 Q12.75 12.75 12 20.2 Q11.25 12.75 3.8 12 Q11.25 11.25 12 3.8 Z" />
                <circle cx="19.1" cy="4.6" r="1.35" opacity="0.62" />
            </svg>
        );
    }

    if (variant === "pulse") {
        return (
            <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
                <path d="M6.4 16.1a7.6 7.6 0 0 1 0-8.2" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                <path d="M10.9 18.7a11.4 11.4 0 0 1 0-13.4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.72" />
                <circle cx="17.4" cy="12" r="2.15" fill="currentColor" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
            <path d="M12 3.8 20.2 12 12 20.2 3.8 12Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        </svg>
    );
}
