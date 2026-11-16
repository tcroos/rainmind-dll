"use client";

/**
 * 公告「关闭」状态只活在当前标签页。
 *
 * - 关掉后刷新、站内跳转都不再显示：sessionStorage 在同一标签页内保留；
 * - 关掉标签页 / 浏览器再打开就重新显示：sessionStorage 随标签页销毁；
 * - 每次登录都会清空：换账号登录也一定看得到公告（登录页、退出登录各调一次 clear）；
 * - 管理员发新公告时签名变化，横幅同样会自动重新出现。
 *
 * 旧版把状态写在 localStorage，会跨账号、跨浏览器会话永久生效，导致
 * 「同一个电脑换账号登录后公告直接消失」。这里在读取时顺手清掉遗留键。
 */

export const ANNOUNCEMENT_BAR_DISMISS_KEY = "vozeb-pro:announcement-bar-dismissed";
const POPUP_DISMISS_PREFIX = "vozeb-pro:announcement-dismissed:";
/** 「本会话已经看过登录后弹窗」：多条公告都勾了该选项时，
 *  关掉第一条之后 list 一刷新又会挑出第二条，必须记一个会话级标记。 */
const POPUP_SEEN_PREFIX = "vozeb-pro:announcement-popup-seen:";

function storage(kind: "sessionStorage" | "localStorage"): Storage | null {
    if (typeof window === "undefined") return null;
    try {
        return window[kind];
    } catch {
        // Safari 隐私模式 / 禁用存储时直接降级成「只在本页内存生效」
        return null;
    }
}

function removeMatching(target: Storage | null, matches: (key: string) => boolean) {
    if (!target) return;
    try {
        for (let index = target.length - 1; index >= 0; index -= 1) {
            const key = target.key(index);
            if (key && matches(key)) target.removeItem(key);
        }
    } catch {
        // 忽略存储不可写
    }
}

export function readBarDismissSignature(): string | null {
    try {
        // 迁移：清掉旧版写进 localStorage 的永久关闭标记
        storage("localStorage")?.removeItem(ANNOUNCEMENT_BAR_DISMISS_KEY);
        return storage("sessionStorage")?.getItem(ANNOUNCEMENT_BAR_DISMISS_KEY) ?? null;
    } catch {
        return null;
    }
}

export function writeBarDismissSignature(signature: string) {
    try {
        storage("sessionStorage")?.setItem(ANNOUNCEMENT_BAR_DISMISS_KEY, signature);
    } catch {
        // 写不进去时至少本次页面内保持关闭（组件里还有 state 兜底）
    }
}

export function isPopupDismissed(id: string, context: string) {
    try {
        return storage("sessionStorage")?.getItem(`${POPUP_DISMISS_PREFIX}${context}:${id}`) === "1";
    } catch {
        return false;
    }
}

export function markPopupDismissed(id: string, context: string) {
    try {
        storage("sessionStorage")?.setItem(`${POPUP_DISMISS_PREFIX}${context}:${id}`, "1");
    } catch {
        // 忽略存储不可写
    }
}

/**
 * 当前标签页是否已经处理过「登录后弹窗」。
 * 按 context 存：现在只有 login，之后若有别的弹窗场景可以分开记。
 */
export function hasPopupSeen(context: string) {
    try {
        return storage("sessionStorage")?.getItem(`${POPUP_SEEN_PREFIX}${context}`) === "1";
    } catch {
        return false;
    }
}

export function markPopupSeen(context: string) {
    try {
        storage("sessionStorage")?.setItem(`${POPUP_SEEN_PREFIX}${context}`, "1");
    } catch {
        // 忽略存储不可写
    }
}

/** 登录成功 / 退出登录时调用：让下一次进入界面一定重新展示公告。 */
export function clearAnnouncementDismissState() {
    const isAnnouncementKey = (key: string) => key === ANNOUNCEMENT_BAR_DISMISS_KEY || key.startsWith(POPUP_DISMISS_PREFIX) || key.startsWith(POPUP_SEEN_PREFIX);

    try {
        storage("sessionStorage")?.removeItem(ANNOUNCEMENT_BAR_DISMISS_KEY);
    } catch {
        // 忽略存储不可写
    }
    removeMatching(storage("sessionStorage"), isAnnouncementKey);
    // 旧版遗留：localStorage 里的横幅标记 + 弹窗标记一并清掉
    removeMatching(storage("localStorage"), isAnnouncementKey);
}
