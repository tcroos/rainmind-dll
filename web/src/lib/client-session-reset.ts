"use client";

import { clearAnnouncementDismissState } from "@/lib/announcement-dismiss";
import { resetPublicSession } from "@/stores/use-public-session-store";
import { useAssetStore } from "@/stores/use-asset-store";
import { useUserStore } from "@/stores/use-user-store";

export async function resetClientSessionState() {
    /* 退出登录也重置公告关闭状态，保证下次登录一定能看到公告 */
    clearAnnouncementDismissState();
    useUserStore.getState().clearSession();
    resetPublicSession();
    useAssetStore.getState().reset();
    const [{ useCanvasStore }, { useDramaStore }, { useCreateDraftAttachmentsStore }] = await Promise.all([
        import("@/app/(user)/canvas/stores/use-canvas-store"),
        import("@/app/(user)/drama/stores/use-drama-store"),
        import("@/app/(user)/create/use-create-draft-attachments-store"),
    ]);
    useCanvasStore.getState().reset();
    useDramaStore.getState().reset();
    useCreateDraftAttachmentsStore.getState().clear();
}
