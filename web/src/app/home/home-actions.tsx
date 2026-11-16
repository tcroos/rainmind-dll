"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { BillingPlansModal } from "@/components/billing/billing-plans-modal";
import { createAgentPromptHref, type CreateAgentMode } from "@/lib/create-agent-prompt";
import { usePublicSessionStore } from "@/stores/use-public-session-store";
import { useUserStore } from "@/stores/use-user-store";
import type { HomeSiteSettings } from "./home-data";
import { HomeContactModal } from "./home-contact-modal";
import { resolveSiteTitle } from "@/lib/site-brand";

type HomeActions = {
    authenticated: boolean;
    sessionReady: boolean;
    site: HomeSiteSettings;
    openLogin: (nextPath?: string) => void;
    openBillingPlans: () => void;
    openContact: () => void;
    openProtectedPath: (path: string) => void;
    startCreating: (prompt?: string, mode?: CreateAgentMode) => void;
};

const HomeActionsContext = createContext<HomeActions | null>(null);

export function HomeActionsProvider({ initialSite, children }: { initialSite: HomeSiteSettings; children: ReactNode }) {
    const router = useRouter();
    const [billingPlansOpen, setBillingPlansOpen] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const user = useUserStore((state) => state.user);
    const session = usePublicSessionStore((state) => state.payload);
    const sessionReady = usePublicSessionStore((state) => state.ready);
    const sessionSite = session?.settings?.site;
    const site = useMemo<HomeSiteSettings>(
        () => ({
            ...initialSite,
            ...(sessionSite || {}),
            title: resolveSiteTitle(sessionSite?.title || initialSite.title),
            logoUrl: sessionSite?.logoUrl?.trim() || initialSite.logoUrl || "/logo.svg",
            contactImageUrl: sessionSite?.contactImageUrl?.trim() || initialSite.contactImageUrl || "",
            friendLinks: sessionSite?.friendLinks || initialSite.friendLinks,
            socials: (sessionSite?.socials as HomeSiteSettings["socials"] | undefined) || initialSite.socials,
        }),
        [initialSite, sessionSite],
    );
    const authenticated = sessionReady && Boolean(user);

    /* 营销页不再弹登录框：所有需要账号的入口统一跳整页登录，
     * 并把原本想去的地方放在 next 上。/login 会用 safeNextPath 校验后带回来，
     * 登录成功直接回到刚才的入口（默认 /create），hero 里输入的 prompt 也不会丢。 */
    const openLogin = (nextPath = "/create") => {
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
    };
    const openProtectedPath = (path: string) => {
        if (authenticated) router.push(path);
        else openLogin(path);
    };
    const startCreating = (prompt = "", mode: CreateAgentMode = "agent") => openProtectedPath(createAgentPromptHref(prompt, { source: "home", mode }));

    return (
        <HomeActionsContext.Provider value={{ authenticated, sessionReady, site, openLogin, openBillingPlans: () => setBillingPlansOpen(true), openContact: () => setContactOpen(true), openProtectedPath, startCreating }}>
            {children}
            <HomeContactModal open={contactOpen} imageUrl={site.contactImageUrl} siteTitle={site.title} onClose={() => setContactOpen(false)} />
            <BillingPlansModal open={billingPlansOpen} onClose={() => setBillingPlansOpen(false)} onSelect={(product) => openProtectedPath(`/billing/checkout?product=${encodeURIComponent(product.id)}`)} />
        </HomeActionsContext.Provider>
    );
}

export function useHomeActions() {
    const value = useContext(HomeActionsContext);
    if (!value) throw new Error("useHomeActions must be used within HomeActionsProvider");
    return value;
}
