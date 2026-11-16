"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import styles from "./home.module.css";

/* 联系图片由后台「网站设置 → 联系图片 URL」配置，按 3:4 竖版展示。
 * 弹窗挂到 body（避免首页 sticky 导航的层叠上下文），所以样式只用全局色 token，
 * 不用只在 .root 里生效的 --home-* 变量。 */
export function HomeContactModal({ open, imageUrl, siteTitle, onClose }: { open: boolean; imageUrl: string; siteTitle: string; onClose: () => void }) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open || typeof document === "undefined") return null;
    const url = imageUrl.trim();

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
                {url ? (
                    <div className={styles.contactMedia}>
                        <img src={url} alt={`${siteTitle} 联系方式`} />
                    </div>
                ) : (
                    <div className={styles.contactEmpty}>
                        <p>管理员还没有配置联系图片</p>
                        <span>可在后台「网站设置 → 联系图片 URL」填写一张 3:4 竖图链接。</span>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
