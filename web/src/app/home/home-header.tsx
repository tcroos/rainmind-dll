"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { SiteLogo } from "@/components/layout/site-logo";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useThemeStore } from "@/stores/use-theme-store";
import { HOME_NAVIGATION, type HomeNavigationItem } from "./home-data";
import { useHomeActions } from "./home-actions";
import styles from "./home.module.css";

export function HomeHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { authenticated, site, openLogin, openBillingPlans, openContact, openProtectedPath } = useHomeActions();
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);

    // 页面滚出首屏后，导航从「贴在玻璃上」变成「浮在内容上」：加一点实底与投影。
    // 滚动发生在 main.app-scroll-page 里，用捕获阶段监听才能收到它的 scroll 事件。
    useEffect(() => {
        const onScroll = (event: Event) => {
            const target = event.target;
            const offset = target instanceof Document ? window.scrollY : target instanceof HTMLElement ? target.scrollTop : 0;
            setScrolled(offset > 12);
        };
        document.addEventListener("scroll", onScroll, { capture: true, passive: true });
        return () => document.removeEventListener("scroll", onScroll, { capture: true });
    }, []);

    const activate = (item: HomeNavigationItem) => {
        setMobileOpen(false);
        if (item.action === "billing") openBillingPlans();
        if (item.action === "contact") openContact();
        if (item.action === "protected") openProtectedPath(item.href);
    };

    const renderDesktopItem = (item: HomeNavigationItem) =>
        item.action === "external" ? (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className={styles.navLink}>
                {item.label}
            </a>
        ) : item.action === "link" ? (
            <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
            </Link>
        ) : (
            <button key={item.href} type="button" className={styles.navLink} onClick={() => activate(item)}>
                {item.label}
            </button>
        );

    const renderMobileItem = (item: HomeNavigationItem) =>
        item.action === "external" ? (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)}>
                {item.label}
                <ArrowRight aria-hidden="true" />
            </a>
        ) : item.action === "link" ? (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
                <ArrowRight aria-hidden="true" />
            </Link>
        ) : (
            <button key={item.href} type="button" onClick={() => activate(item)}>
                {item.label}
                <ArrowRight aria-hidden="true" />
            </button>
        );

    return (
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`} data-scrolled={scrolled ? "true" : undefined}>
            <div className={styles.headerInner}>
                <Link href="/" className={styles.brand} aria-label={`${site.title} 首页`}>
                    <SiteLogo logoUrl={site.logoUrl} className={styles.brandLogo} />
                    <span>{site.title}</span>
                </Link>

                {/* 导航收到右侧、和账号动作同属一组；左侧只留品牌，
                    视线顺序变成「是谁 → 去哪 → 做什么」。 */}
                <div className={styles.headerRight}>
                    <nav className={styles.desktopNav} aria-label="官网主导航">
                        {HOME_NAVIGATION.map(renderDesktopItem)}
                    </nav>

                    <div className={styles.headerActions}>
                        <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} className={styles.themeButton} aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} />
                        <span className={styles.headerDivider} aria-hidden="true" />
                        {/* 未登录：文字「登录」回首页，实心「开始创作」直接带 next=/create。
                            已登录：只留一个「进入工作台」，避免同一位置出现两个同义入口。 */}
                        {authenticated ? (
                            <button type="button" className={styles.primarySmallButton} onClick={() => openProtectedPath("/create")}>
                                进入工作台
                            </button>
                        ) : (
                            <>
                                <button type="button" className={styles.loginLink} onClick={() => openLogin("/")}>
                                    登录
                                </button>
                                <button type="button" className={styles.primarySmallButton} onClick={() => openProtectedPath("/create")}>
                                    开始创作
                                </button>
                            </>
                        )}
                        <button type="button" className={styles.mobileMenuButton} onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen} aria-controls="home-mobile-menu" aria-label={mobileOpen ? "关闭导航菜单" : "打开导航菜单"}>
                            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>

            {mobileOpen ? (
                <nav id="home-mobile-menu" className={styles.mobileNav} aria-label="移动端导航">
                    {HOME_NAVIGATION.map(renderMobileItem)}
                    <div className={styles.mobileNavFooter}>
                        <button type="button" className={styles.mobileNavCta} onClick={() => openProtectedPath("/create")}>
                            {authenticated ? "进入工作台" : "开始创作"}
                            <ArrowRight aria-hidden="true" />
                        </button>
                    </div>
                </nav>
            ) : null}
        </header>
    );
}
