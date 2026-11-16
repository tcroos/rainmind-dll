import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("create Agent home layout", () => {
    it("keeps Agent input, projects, tasks and reusable public inspiration in one flow", async () => {
        const [page, composer, messages, conversationList, generationControls, preferences, overview, inspiration, previewModal] = await Promise.all([
            readFile(resolve(process.cwd(), "src/app/(user)/create/page.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/app/(user)/create/components/creative-composer.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/app/(user)/create/components/creative-messages.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/app/(user)/create/components/creative-conversation-list.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/app/(user)/create/components/creative-generation-controls.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/components/creative-generation-preferences.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/app/(user)/create/components/create-workbench-overview.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/app/(user)/create/components/create-inspiration-gallery.tsx"), "utf8"),
            readFile(resolve(process.cwd(), "src/components/works/public-work-preview-modal.tsx"), "utf8"),
        ]);

        expect(page).toContain("创作 Agent");
        expect(page).toContain("createAgentDraftFromHash");
        expect(page).toContain("setCreationMode(incomingDraft.mode)");
        expect(page).toContain('data-testid="creative-conversation-scroll"');
        expect(page).toContain("updateConversationScrollState");
        expect(page).toContain("onWheelCapture");
        expect(page).toContain("scrollingAwayFromLatestRef");
        expect(page).toContain("creativeConversationScrollTransition");
        expect(page).toContain('transition === "collapse"');
        expect(page).toContain('transition === "expand"');
        expect(page).toContain("awayFromLatestRef.current = false");
        expect(page).toContain("setAwayFromLatestState(true)");
        expect(page).toContain("回到底部");
        expect(page).toContain("conversationWasLoadingRef");
        expect(page).toContain("if (wasLoading)");
        expect(page).toContain("resizeObserver.observe(content)");
        expect(messages).toContain('data-testid="creative-message-list"');
        expect(messages).toContain("[assets.length, followLatest, lastMessageId, loading]");
        // 历史与资产共用 CreateSidePanel：几何在组件里，页面只负责挂载
        expect(page).toContain('<CreateSidePanel open={historyOpen} title="创作历史"');
        expect(page).toContain("aria-expanded={historyOpen}");
        const sidePanel = await readFile(resolve(process.cwd(), "src/app/(user)/create/components/create-side-panel.tsx"), "utf8");
        expect(sidePanel).toContain('role="dialog"');
        expect(sidePanel).toContain("var(--announcement-drawer-width, 340px)");
        expect(sidePanel).toContain("fixed inset-0 z-40");
        // 工具组是浮在右上角的图标行，进对话才显示（主页不出现历史 / 资产）
        expect(page).toContain('data-testid="creative-page-tools"');
        expect(page).toContain('!showConversation && "hidden"');
        expect(page).toContain("absolute right-3 top-3 z-30 flex items-center gap-0.5");
        expect(page).not.toContain('data-testid="creative-page-tools" className="h-14');
        expect(page).not.toContain("w-[320px]");
        expect(conversationList).toContain('className="flex h-9 w-full');
        expect(conversationList).toContain("group relative flex min-h-10");
        expect(conversationList).toContain("function groupConversations(");
        expect(conversationList).toContain("最近对话 · {items.length}");
        expect(page).not.toContain("最近创作");
        expect(page).toContain("<CreateInspirationGallery");

        // 「+」是新建对话：留在对话视图、清空消息，用空状态引导，不退回主页
        expect(page).toContain('router.replace("/create?new=1")');
        expect(page).toContain('searchParams.get("new") === "1"');
        expect(page).toContain("<CreativeEmptyChat");
        // 侧栏点 Agent（/create 无参数）回主页：清掉当前会话，首屏内容回来
        expect(page).toContain("if (searchKey || !previous) return;");
        expect(page.indexOf("<CreateWorkbenchOverview")).toBeLessThan(page.indexOf("<CreateInspirationGallery"));
        expect(page).not.toContain("composerHeight");
        expect(page).not.toContain("top-[117px]");
        expect(page).toContain('data-testid="creative-composer-dock"');
        expect(page).toContain('data-compact={homeDocked ? "true" : "false"}');
        expect(page).toContain("setHomeDocked");
        expect(page).toContain("composerMeasureRef");
        // 收起时机跟着"输入框底边快滚出视口"走，不能再按固定像素阈值
        expect(page).toContain("homeComposerDocked");
        expect(page).toContain("composerOriginRef");
        expect(page).toContain('data-testid="creative-composer-dock-anchor"');
        expect(page).not.toContain("scrollTop > 120");
        // 上方输入区必须随内容滚走，不能 sticky 钉住再瞬间搬到底部
        expect(page).not.toContain("sticky top-0 z-20 mt-5 sm:mt-8");
        expect(page).toContain('(!showConversation && homeDocked)');
        expect(page).toContain("<CreateDotField />");
        expect(page).toContain("<CreateWorkbenchOverview />");
        expect(page).not.toContain("onUseAsset");
        expect(page).toContain("usePublicImage");
        expect(composer).toContain('centered ? "max-w-[900px]"');
        expect(composer).toContain('data-compact={compact ? "true" : "false"}');
        expect(composer).toContain("const inputMediaAttachments = compact ? allMediaAttachments");
        expect(composer).toContain("<ComposerMediaThumbnail key={asset.id} asset={asset} compact={compact}");
        expect(composer).toContain("autoSize={compactMode ? { minRows: 1, maxRows: 1 }");
        expect(composer).toContain("<CreativeGenerationControls");
        expect(composer).toContain("使用 Skill");
        expect(composer).toContain('aria-label={optimizing ? "正在优化提示词" : "优化提示词"}');
        expect(composer).toContain("disabled:!bg-none");
        expect(page).toContain("optimizePrompt");
        expect(page).toContain("mode: creationMode");
        expect(composer).toContain('aria-label={mediaAttachments.length ? "继续添加参考素材" : "添加素材"}');
        expect(composer).toContain("创作类型");
        expect(composer).toContain("transition hover:bg-[#eef3f6] dark:hover:bg-[#29323a]");
        expect(composer).toContain('selected ? "text-[#20242a] dark:text-white"');
        expect(composer).not.toContain('selected ? "bg-[#eef3f6]');
        expect(composer).toContain('const popoverPlacement = centered ? "bottomLeft" : "topLeft"');
        expect(composer).toContain("placement={popoverPlacement}");
        expect(composer).not.toContain("上传中");
        expect(composer).toContain("data-delete-indicator");
        expect(composer).toContain("size-[22px]");
        expect(composer).toContain("bg-[#66727f]/95");
        expect(composer).toContain("text-white");
        expect(generationControls).toContain("placement={placement}");
        expect(composer).toContain("hide-scrollbar scroll-fade-x flex min-w-0 flex-1");
        expect(composer).toContain('data-testid="creative-composer-reference-row"');
        // 参考素材与 Skill 各占一行：素材在上、Skill 在下，不再互相挤位置
        expect(composer).toContain('data-testid="creative-composer-skill-row"');
        expect(composer.indexOf('data-testid="creative-composer-reference-row"')).toBeLessThan(composer.indexOf('data-testid="creative-composer-skill-row"'));
        expect(composer).toContain("creativeComposerIconButtonClass(false)");
        expect(composer).toContain("creativeComposerSendButtonClass");
        expect(composer).toContain('rounded-[20px] p-0');
        // 输入框不描边，靠面板渐变 + 落影浮在画布上
        expect(composer).toContain("[background-image:var(--surface-panel-gradient)]");
        expect(composer).not.toContain("border border-[#e8ebef]");
        expect(generationControls).toContain("智能模型");
        expect(generationControls).toContain("选择模型");
        expect(generationControls).toContain("<Orbit");
        expect(generationControls).toContain("<GenerationPreferencesControl");
        expect(generationControls).toContain("max-w-[360px]");
        expect(generationControls).not.toContain("选择比例");
        expect(preferences).toContain("Agent 模式");
        expect(preferences).toContain("图片生成");
        expect(preferences).toContain("视频生成");
        expect(preferences).toContain("音频生成");
        expect(preferences).toContain("生成参数");
        expect(preferences).toContain(">比例</p>");
        expect(preferences).toContain("1080P");
        expect(preferences).toContain("选择音色");
        expect(preferences).toContain("<Select");
        expect(preferences).not.toContain("选择模型");
        expect(preferences).not.toContain("修改后立即生效，例如 1024 × 1536");
        expect(preferences).not.toContain("恢复智能");
        expect(composer).not.toContain("CreativeImageSizeControl");
        const pointerDownHandler = composer.slice(composer.indexOf("const onPointerDown"), composer.indexOf("const onPointerMove"));
        const pointerMoveHandler = composer.slice(composer.indexOf("const onPointerMove"), composer.indexOf("const finishDrag"));
        expect(pointerDownHandler).not.toContain("setPointerCapture");
        expect(pointerMoveHandler).toContain("setPointerCapture");
        expect(inspiration).toContain("灵感发现");
        expect(inspiration).toContain("使用提示词");
        expect(inspiration).toContain("复制提示词");
        expect(inspiration).toContain("使用图片");
        expect(inspiration).toContain("listPublicGallery");
        expect(inspiration).toContain("<ResponsiveMasonryGrid");
        expect(inspiration).toContain("grid-cols-2");
        expect(inspiration).toContain("xl:grid-cols-6");
        expect(inspiration).not.toContain("columns-2");
        expect(inspiration).not.toContain("max-h-[560px]");
        expect(inspiration).toContain("<Dropdown");
        expect(inspiration).toContain("<PublicWorkPreviewModal");
        expect(inspiration).toContain("<LazyMediaImage");
        expect(inspiration).toContain("<PublicWorkCardTitle");
        expect(inspiration).not.toContain("href={`/share/");
        expect(overview).toContain('aria-labelledby="create-projects-heading"');
        expect(overview).toContain("项目与任务");
        expect(overview).toContain('"group grid h-32');
        expect(overview).toContain("sm:h-44");
        expect(overview).not.toContain("最近生成");
        expect(overview).not.toContain('aria-labelledby="create-assets-heading"');
        expect(overview).not.toContain("recentAssets");
        expect(previewModal).toContain('aria-label="引用提示词到 Agent"');
        expect(previewModal).toContain('aria-label="引用图片到 Agent"');
        expect(previewModal).not.toMatch(/>\s*引用到 Agent\s*</);
        expect(previewModal).toContain("复制提示词");
        expect(previewModal).toContain('aria-label="关闭作品详情"');
        expect(previewModal).toContain("lg:grid-cols-[minmax(0,1fr)_340px]");
        expect(previewModal).toContain("xl:grid-cols-[minmax(0,1fr)_360px]");
        expect(previewModal).toContain('asset.mediaType === "image" || asset.mediaType === "video"');
    });
});
