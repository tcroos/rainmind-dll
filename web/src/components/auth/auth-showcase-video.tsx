"use client";

import { useEffect, useRef, useState } from "react";

import { AUTH_SHOWCASE_POSTER_URL, AUTH_SHOWCASE_VIDEO_URL } from "@/lib/auth-showcase";

/**
 * 登录页左栏的视频。
 *
 * 几个必须注意的点：
 * - `muted` 是自动播放的前置条件，少了它浏览器会直接拦掉（Safari 尤其严格）；
 * - `playsInline` 避免 iOS 上点开自动全屏；
 * - 尊重「减少动态效果」：这种情况下不自动播，留第一帧静帧；
 * - 视频加载失败时退化成渐变底，不留一块黑。
 */
export function AuthShowcaseVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        // 视频可能在上面的 onLoadedData 挂上之前就已经解码好了（缓存命中基本都会这样），
        // readyState >= 2 说明已有当前帧，直接标记为可显示，否则会一直停在透明状态
        if (video.readyState >= 2) setState("ready");
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            video.pause();
            return;
        }
        // 自动播放可能被策略拦掉，失败就算了，保持静帧
        void video.play().catch(() => {});
    }, []);

    return (
        <div className="auth-split-media" data-testid="auth-showcase-media" aria-hidden>
            <video
                ref={videoRef}
                className="auth-split-video"
                data-state={state}
                data-testid="auth-showcase-video"
                src={AUTH_SHOWCASE_VIDEO_URL}
                poster={AUTH_SHOWCASE_POSTER_URL || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                tabIndex={-1}
                onLoadedData={() => setState("ready")}
                onCanPlay={() => setState((current) => (current === "failed" ? current : "ready"))}
                onError={() => setState("failed")}
            />
        </div>
    );
}
