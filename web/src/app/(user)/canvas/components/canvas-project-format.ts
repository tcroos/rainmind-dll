/**
 * 画布卡上的时间戳。
 * 当天只显示时分（信息量最大），同年显示「月-日」，跨年才带年份，
 * 避免每张卡都挂一长串 2026-11-14 12:18 把标题挤掉。
 */
export function formatCanvasUpdatedAt(value: string, now: Date = new Date()) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (input: number) => String(input).padStart(2, "0");
    const sameYear = date.getFullYear() === now.getFullYear();
    if (sameYear && date.toDateString() === now.toDateString()) return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const monthDay = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return sameYear ? monthDay : `${date.getFullYear()}-${monthDay}`;
}

/** 副标题：有节点就报规模，空画布就直说，不要写「0 个节点」 */
export function canvasProjectMeta(nodeCount: number, connectionCount: number) {
    if (nodeCount <= 0) return "空白画布";
    return connectionCount > 0 ? `${nodeCount} 个节点 · ${connectionCount} 条连线` : `${nodeCount} 个节点`;
}
