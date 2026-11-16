export function userAvatarFallback(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return Array.from(parts[0]).slice(0, 2).join("").toUpperCase();
}

/** 头像一个字足够了：两个汉字塞进 32px 圆里必然挤成一团。 */
export function userAvatarInitial(value: string) {
    const char = Array.from(value.trim())[0];
    return char ? char.toUpperCase() : "U";
}

export function userAvatarUrl(userId: string, updatedAt?: string) {
    const id = userId.trim();
    if (!id) return "";
    const version = updatedAt && Number.isFinite(Date.parse(updatedAt)) ? `?v=${encodeURIComponent(new Date(updatedAt).toISOString())}` : "";
    return `/api/public/users/${encodeURIComponent(id)}/avatar${version}`;
}
