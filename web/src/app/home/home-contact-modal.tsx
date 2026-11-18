"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import styles from "./home.module.css";

/* 联系图片由后台「网站设置 → 联系图片 URL」配置，按 3:4 竖版展示。
 * 弹窗挂到 body（避免首页 sticky 导航的层叠上下文），所以样式只用全局色 token，
 * 不用只在 .root 里生效的 --home-* 变量。 */
export function HomeContactModal({ open, imageUrl, siteTitle, onClose }: { open: boolean; imageUrl: string; siteTitle: string; onClose: () => void }) {
    const url = imageUrl.trim();
    const [imageFailed, setImageFailed] = useState(false);
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);
    /* 换图（含后台刚保存的新地址）时重置失败态，否则会一直停在提示文案上 */
    useEffect(() => setImageFailed(false), [url]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div className={styles.contactOverlay} role="presentation" onClick={onClose}>
            <div className={styles.contactDialog} role="dialog" aria-modal="true" aria-label="联系我们" onClick={(event) => event.stopPropagation()}>
                <div className={styles.contactHead}>
                    <div>
                        <p className={styles.contactEyebrow}>Contact</p>
                        <h2 className={styles.contactTitle}>联系我们</h2>
                    </div>
                    <button type="button" className={styles.contactClose} onClick={onClose} aria-label="关闭联系我们">
                        <X aria-hidden="true" />
                    </button>
                </div>
                {url && !imageFailed ? (
                    <div className={styles.contactMedia}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- 图片地址由后台配置，可能是站内路径或任意 https 直链，不走 next/image 白名单 */}
                        <img src={url} alt={`${siteTitle} 联系方式`} onError={() => setImageFailed(true)} />
                    </div>
                ) : (
                    <div className={styles.contactEmpty}>
                        <p>{url ? "联系图片加载失败" : "管理员还没有配置联系图片"}</p>
                        <span>{url ? "请检查「联系图片 URL」是否指向已部署、可公开访问的图片文件。" : "可在后台「网站设置 → 联系图片 URL」填写一张 3:4 竖图链接。"}</span>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
