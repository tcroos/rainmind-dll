import { BookMarked, Braces, Clapperboard, Compass, FileText, GalleryVerticalEnd, Images, Maximize2, Sparkles, UserCog, UserRound, Wallet } from "lucide-react";

export const navigationGroups = [
    { id: "create", label: "创作" },
    { id: "projects", label: "项目" },
    { id: "assets", label: "资产" },
    { id: "personal", label: "个人" },
] as const;

export const landingNavigationTools = [
    { slug: "create", label: "Agent" },
    { slug: "drama", label: "短剧" },
    { slug: "gallery", label: "广场" },
] as const;

/* 分组逻辑：能做什么（创作）→ 在做什么（项目）→ 存了什么（资产）→ 我是谁（个人）。
 * 广场从「社区」挪进「资产」，因为它是作品，只是别人的；
 * 「个人」这一组才是账号相关：我的主页、钱、账号设置、对外接口。 */
export const navigationTools = [
    {
        slug: "create",
        label: "Agent",
        description: "统一创作入口",
        group: "create",
        icon: Sparkles,
        primary: true,
    },
    {
        slug: "canvas",
        label: "画布",
        description: "节点式多媒体创作",
        group: "projects",
        icon: Maximize2,
    },
    {
        slug: "drama",
        label: "短剧",
        description: "剧本、分镜与成片",
        group: "projects",
        icon: Clapperboard,
    },
    {
        slug: "works",
        label: "作品",
        description: "发布、审核与分享",
        group: "assets",
        icon: GalleryVerticalEnd,
    },
    {
        slug: "assets",
        label: "素材",
        description: "图片、视频与音频",
        group: "assets",
        icon: Images,
    },
    {
        slug: "my-prompts",
        label: "提示词",
        description: "个人提示词",
        group: "assets",
        icon: BookMarked,
    },
    {
        slug: "prompts",
        label: "词库",
        description: "公共提示词",
        group: "assets",
        icon: FileText,
    },
    {
        slug: "community",
        label: "广场",
        description: "发现公开作品",
        group: "assets",
        icon: Compass,
    },
    {
        slug: "me",
        label: "主页",
        description: "已发布与我的喜欢",
        group: "personal",
        icon: UserRound,
    },
    {
        slug: "wallet",
        label: "钱包",
        description: "积分、套餐与账单",
        group: "personal",
        icon: Wallet,
    },
    {
        slug: "profile",
        label: "个人中心",
        description: "资料、安全与帮助",
        group: "personal",
        icon: UserCog,
    },
    {
        slug: "api",
        label: "API",
        description: "开放接口与文档",
        group: "personal",
        icon: Braces,
        href: "https://api.rainmind.net",
        external: true,
    },
] as const;

export type NavigationToolSlug = (typeof navigationTools)[number]["slug"];
export type NavigationGroupId = (typeof navigationGroups)[number]["id"];

export function navigationToolHref(tool: (typeof navigationTools)[number]) {
    return "href" in tool && tool.href ? tool.href : `/${tool.slug}`;
}

export function isExternalTool(tool: (typeof navigationTools)[number]) {
    return "external" in tool && Boolean(tool.external);
}

export function navigationToolForPathname(pathname: string) {
    const slug = pathname.split("/").filter(Boolean)[0];
    return navigationTools.find((tool) => tool.slug === slug);
}
