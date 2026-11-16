import { NextResponse } from "next/server";

import { readJsonBody } from "@/lib/auth/request";
import { getCurrentUser } from "@/lib/auth/session";
import { createEmailVerificationCode, getAuthSettings, isAuthInputError, type EmailCodePurpose } from "@/lib/auth/store";
import { isMailServiceConfigured, sendSmtpMail, verifySmtpConnection } from "@/lib/mail/smtp";
import { checkAuthRateLimit } from "@/lib/server/security";

export const runtime = "nodejs";

const purposeText: Record<EmailCodePurpose, string> = {
    register: "注册账号",
    "email-change": "修改邮箱",
    "password-reset": "重置密码",
};

export async function POST(request: Request) {
    try {
        const body = await readJsonBody<{ purpose?: unknown; email?: unknown }>(request);
        const purpose = body.purpose === "email-change" || body.purpose === "password-reset" ? body.purpose : body.purpose === "register" ? body.purpose : null;
        if (!purpose) return NextResponse.json({ error: "验证码用途不正确" }, { status: 400 });
        const settings = await getAuthSettings();
        /* 先确认邮件服务真的能发信，再生成验证码、消耗限流额度。
         * 之前只填了 host 也算「配置过」，sendSmtpMail 才抛错；
         * 而密码重置对未知邮箱又是防枚举的静默成功，前端就会误报「已发送」。 */
        if (!isMailServiceConfigured(settings.mail)) {
            return NextResponse.json({ error: "邮件服务尚未配置，暂时无法发送验证码，请联系管理员" }, { status: 503 });
        }
        /* 字段齐了不代表能发：旧的授权码、错误的端口都只会在真正连接时暴露。
         * 先做一次认证探测，把 SMTP 的真实原因带回前端，避免「静默成功」或一句笼统的失败。 */
        try {
            await verifySmtpConnection(settings.mail);
        } catch (error) {
            const reason = error instanceof Error ? error.message : "请检查 SMTP 配置";
            return NextResponse.json({ error: `邮件服务不可用：${reason}` }, { status: 503 });
        }
        const emailKey = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const limit = await checkAuthRateLimit(`email-code:${purpose}`, request, emailKey, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
        if (!limit.allowed) return NextResponse.json({ error: "验证码发送过于频繁，请稍后重试", retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000) }, { status: 429 });

        const currentUser = await getCurrentUser();
        if (purpose === "email-change" && !currentUser) return NextResponse.json({ error: "请先登录" }, { status: 401 });

        const issued = await createEmailVerificationCode({
            purpose,
            email: typeof body.email === "string" ? body.email : "",
            userId: purpose === "email-change" ? currentUser?.id : undefined,
        });
        if (issued.deliverEmail) {
            const siteTitle = settings.site.title;
            await sendSmtpMail({
                mail: settings.mail,
                to: issued.email,
                subject: `${siteTitle} ${purposeText[purpose]}验证码`,
                text: [`你的 ${siteTitle} ${purposeText[purpose]}验证码是：${issued.code}`, "", "验证码 10 分钟内有效，请勿转发给他人。"].join("\r\n"),
            });
        }
        return NextResponse.json({ ok: true, delivered: issued.deliverEmail });
    } catch (error) {
        if (isAuthInputError(error)) return NextResponse.json({ error: error.message }, { status: error.status });
        console.error("Send email code failed", error);
        return NextResponse.json({ error: "发送验证码失败，请稍后重试" }, { status: 400 });
    }
}
