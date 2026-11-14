/**
 * 登录页左栏的展示视频。
 *
 * 换片子的办法有两个，任选其一：
 * 1. 直接改下面的 DEFAULT_AUTH_SHOWCASE_VIDEO_URL；
 * 2. 在 .env 里设置 NEXT_PUBLIC_AUTH_SHOWCASE_VIDEO_URL=<你的 mp4 直链>。
 *
 * 视频在左栏里是 `object-fit: cover`，会按栏位裁切，不会被拉变形，
 * 所以横屏（16:9）、方形（1:1）、竖屏（9:16）都能直接放，只是裁掉的边不一样：
 * - 竖屏/方形：几乎不裁，最贴合竖版栏位；
 * - 横屏：左右会被裁掉较多，主体尽量放中间。
 *
 * 栏位比例是 420×560（3:4），最短 560px 高，所以原生分辨率建议 ≥ 1080 宽。
 */
const DEFAULT_AUTH_SHOWCASE_VIDEO_URL = "https://v4-kling.kechuangai.com/kcdn/cdn-kcdn112452/login/zh.mp4";

export const AUTH_SHOWCASE_VIDEO_URL = process.env.NEXT_PUBLIC_AUTH_SHOWCASE_VIDEO_URL?.trim() || DEFAULT_AUTH_SHOWCASE_VIDEO_URL;

/** 可选封面图：视频加载出来之前先垫一张图，留空则用深色渐变兜底 */
export const AUTH_SHOWCASE_POSTER_URL = process.env.NEXT_PUBLIC_AUTH_SHOWCASE_POSTER_URL?.trim() || "";
