import { cn } from "@/lib/utils";

/**
 * 参考即梦工作台的底部工具条：不画描边，按钮平时完全融进面板底色，
 * 只在悬停/展开时浮起一层同色浅灰。线条全部交给色阶去表达。
 */
const toolButtonBaseClass =
    "shrink-0 !h-9 !min-w-9 !gap-1.5 !rounded-lg !border-0 !bg-transparent !px-2 !text-[13px] !font-normal !text-[var(--ink-2)] !shadow-none transition-colors hover:!bg-[rgba(17,17,19,0.055)] hover:!text-[var(--ink-1)] focus:!bg-transparent focus:!text-[var(--ink-2)] active:!bg-[rgba(17,17,19,0.08)] active:!text-[var(--ink-1)] dark:hover:!bg-[rgba(255,255,255,0.07)] dark:hover:!text-white dark:active:!bg-[rgba(255,255,255,0.1)] dark:active:!text-white sm:!h-8 sm:!min-w-8 sm:!px-2.5";

const toolButtonOpenClass =
    "!bg-[rgba(17,17,19,0.07)] !text-[var(--ink-1)] focus:!bg-[rgba(17,17,19,0.07)] focus:!text-[var(--ink-1)] active:!bg-[rgba(17,17,19,0.09)] active:!text-[var(--ink-1)] dark:!bg-[rgba(255,255,255,0.1)] dark:!text-white dark:focus:!bg-[rgba(255,255,255,0.1)] dark:focus:!text-white dark:active:!bg-[rgba(255,255,255,0.12)] dark:active:!text-white";

export function creativeComposerToolButtonClass(open: boolean) {
    return cn(toolButtonBaseClass, open && toolButtonOpenClass);
}

/** 纯图标按钮：与工具条同款无描边，1:1 尺寸，用于左下角的"添加参考素材"入口。 */
export function creativeComposerIconButtonClass(active = false) {
    return cn(creativeComposerToolButtonClass(active), "!size-9 !min-w-9 !px-0 sm:!size-8 sm:!min-w-8");
}

/** 收起态悬浮胶囊里的图标按钮：跟发送键同一档 44px，撑住 60px 高的胶囊。 */
export function creativeComposerCompactIconButtonClass(active = false) {
    return cn(creativeComposerToolButtonClass(active), "!size-11 !min-w-11 !px-0 sm:!size-11 sm:!min-w-11");
}

/** 右下角发送键：32px 实心圆，用主题色（和营销页 CTA 同一支橙）；
 * 空态退成同色浅灰圆，不描边。深色态橙更亮，文字转成深色才够对比。 */
export const creativeComposerSendButtonClass =
    "shrink-0 !size-9 !min-w-9 !rounded-full !border-0 !p-0 !bg-[linear-gradient(135deg,var(--brand-500),var(--brand-600))] !text-white transition-[filter,box-shadow] hover:!brightness-95 !shadow-[0_6px_16px_rgba(226,103,31,0.26)] disabled:!bg-none disabled:!bg-[rgba(17,17,19,0.07)] disabled:!text-[var(--ink-3)] disabled:!shadow-none dark:!text-[#1b1206] dark:!shadow-[0_6px_18px_rgba(240,128,58,0.22)] dark:disabled:!bg-[rgba(255,255,255,0.09)] dark:disabled:!text-[#7a7a82] sm:!size-8 sm:!min-w-8";
