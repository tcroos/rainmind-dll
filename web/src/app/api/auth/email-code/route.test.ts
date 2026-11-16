import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    checkAuthRateLimit: vi.fn(),
    createEmailVerificationCode: vi.fn(),
    getAuthSettings: vi.fn(),
    getCurrentUser: vi.fn(),
    isMailServiceConfigured: vi.fn(),
    readJsonBody: vi.fn(),
    sendSmtpMail: vi.fn(),
    verifySmtpConnection: vi.fn(),
}));

vi.mock("@/lib/auth/request", () => ({ readJsonBody: mocks.readJsonBody }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/auth/store", () => ({
    createEmailVerificationCode: mocks.createEmailVerificationCode,
    getAuthSettings: mocks.getAuthSettings,
    isAuthInputError: vi.fn(() => false),
}));
vi.mock("@/lib/mail/smtp", () => ({ sendSmtpMail: mocks.sendSmtpMail, isMailServiceConfigured: mocks.isMailServiceConfigured, verifySmtpConnection: mocks.verifySmtpConnection }));
vi.mock("@/lib/server/security", () => ({ checkAuthRateLimit: mocks.checkAuthRateLimit }));

import { POST } from "./route";

describe("POST /api/auth/email-code", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.checkAuthRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 });
        mocks.getCurrentUser.mockResolvedValue(null);
        mocks.readJsonBody.mockResolvedValue({ purpose: "password-reset", email: "person@example.com" });
        mocks.getAuthSettings.mockResolvedValue({ site: { title: "无限创作" }, mail: { host: "smtp.example.com", username: "bot@example.com", password: "secret" } });
        mocks.isMailServiceConfigured.mockReturnValue(true);
        mocks.verifySmtpConnection.mockResolvedValue(undefined);
        mocks.sendSmtpMail.mockResolvedValue(undefined);
    });

    it("returns the same success payload for an unknown password-reset email", async () => {
        mocks.createEmailVerificationCode.mockResolvedValue({ code: "123456", email: "person@example.com", deliverEmail: false });

        const response = await POST(new Request("http://localhost/api/auth/email-code", { method: "POST", headers: { "user-agent": "browser-one" } }));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ ok: true, delivered: false });
        expect(mocks.sendSmtpMail).not.toHaveBeenCalled();
    });

    it("uses the same success payload when the password-reset email is delivered", async () => {
        mocks.createEmailVerificationCode.mockResolvedValue({ code: "123456", email: "person@example.com", deliverEmail: true });

        const response = await POST(new Request("http://localhost/api/auth/email-code", { method: "POST", headers: { "user-agent": "browser-one" } }));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ ok: true, delivered: true });
        expect(mocks.sendSmtpMail).toHaveBeenCalledWith(expect.objectContaining({ to: "person@example.com" }));
        expect(mocks.sendSmtpMail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: "无限创作 重置密码验证码",
                text: expect.stringContaining("你的 无限创作 重置密码验证码是：123456"),
            }),
        );
    });

    it("refuses to send when the mail service is not configured", async () => {
        mocks.isMailServiceConfigured.mockReturnValue(false);
        mocks.getAuthSettings.mockResolvedValue({ site: { title: "无限创作" }, mail: { host: "", username: "", password: "" } });

        const response = await POST(new Request("http://localhost/api/auth/email-code", { method: "POST", headers: { "user-agent": "browser-one" } }));

        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toEqual({ error: expect.stringContaining("邮件服务尚未配置") });
        // 未配置时不该生成验证码，也不该消耗限流额度
        expect(mocks.createEmailVerificationCode).not.toHaveBeenCalled();
        expect(mocks.sendSmtpMail).not.toHaveBeenCalled();
        expect(mocks.verifySmtpConnection).not.toHaveBeenCalled();
        expect(mocks.checkAuthRateLimit).not.toHaveBeenCalled();
    });

    it("returns the SMTP failure reason instead of a vague send error", async () => {
        mocks.verifySmtpConnection.mockRejectedValue(new Error("535 Login Fail. Please enter your authorization code"));
        mocks.createEmailVerificationCode.mockResolvedValue({ code: "123456", email: "person@example.com", deliverEmail: false });

        const response = await POST(new Request("http://localhost/api/auth/email-code", { method: "POST", headers: { "user-agent": "browser-one" } }));

        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toEqual({ error: expect.stringContaining("邮件服务不可用：535 Login Fail") });
        expect(mocks.createEmailVerificationCode).not.toHaveBeenCalled();
        expect(mocks.sendSmtpMail).not.toHaveBeenCalled();
    });
});
