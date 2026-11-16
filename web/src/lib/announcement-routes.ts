/**
 * 这些页面是「进入站点的门」：访客还没进站，登录/注册/找回密码页上不该出现
 * 站点公告抽屉。以前只在营销页 `/` 做了拦截，登录前先到 `/register` 的用户
 * 会先在表单右侧被弹一次，登录进站后又按「登录后弹窗」弹第二次。
 */
const AUTH_PATHS = ["/login", "/register", "/forgot-password"] as const;

export function isAnnouncementSuppressedPath(pathname: string | null | undefined) {
    if (!pathname) return false;
    if (pathname === "/") return true;
    return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
