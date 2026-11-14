import type { CanvasProject, CanvasProjectSummary } from "@/lib/canvas-project-contract";
import { summarizeCanvasProject } from "@/lib/create-workbench-overview";

/** 列表卡最多拼 4 张封面，再多也看不出差别，白搭请求 */
export const CANVAS_SUMMARY_PREVIEW_LIMIT = 4;

export function summarizeCanvasProjectRecord(project: CanvasProject): CanvasProjectSummary {
    return {
        id: project.id,
        sourceHandoffId: project.sourceHandoffId,
        creativeConversationId: project.creativeConversationId,
        title: project.title,
        nodeCount: project.nodes.length,
        connectionCount: project.connections.length,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        previews: summarizeCanvasProject(project).previews.slice(0, CANVAS_SUMMARY_PREVIEW_LIMIT),
    };
}
