/** 上方输入区底边距滚动区顶边 ≤ 该值（几乎滚出屏幕）时，底部浮出小胶囊 */
export const HOME_DOCK_TRIGGER_GAP = 8;
/** 回滚后底边要重新露出这么多才收回胶囊，避免临界处来回抖 */
export const HOME_DOCK_RELEASE_GAP = 32;

/**
 * 首页输入区是否该收成底部悬浮胶囊。
 *
 * 判定只依赖「当前滚动量」和「输入区底边在滚动内容坐标系里的位置」，
 * 不依赖输入区此刻的实时位置——收起后输入区已被挪到屏幕底部，
 * 再拿它自己的 rect 判定会被读成"还没滚走"，于是立刻弹回去。
 */
export function homeComposerDocked({ scrollTop, origin, docked }: { scrollTop: number; origin: number; docked: boolean }) {
    if (docked) return scrollTop >= origin - HOME_DOCK_RELEASE_GAP;
    return scrollTop >= origin - HOME_DOCK_TRIGGER_GAP;
}
