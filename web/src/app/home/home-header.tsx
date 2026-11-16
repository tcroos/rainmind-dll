"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useThemeStore } from "@/stores/use-theme-store";
import { HOME_NAVIGATION, type HomeNavigationItem } from "./home-data";
import { useHomeActions } from "./home-actions";
import styles from "./home.module.css";

export function HomeHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { authenticated, site, openLogin, openBillingPlans, openProtectedPath } = useHomeActions();
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
        if (item.action === "protected") openProtectedPath(item.href);
    };

    /* 品牌区只留字标：原来那枚 ∞ 图形在小尺寸下更像产品图标，
     * 放在官网导航里会削弱「正式站点」的观感，去掉后由字号和字重承担识别。 */
    return (
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`} data-scrolled={scrolled ? "true" : undefined}>
            <div className={styles.headerInner}>
                <Link href="/" className={styles.brand} aria-label={`${site.title} 首页`}>
                    <span>{site.title}</span>
                </Link>

                <nav className={styles.desktopNav} aria-label="官网主导航">
                    {HOME_NAVIGATION.map((item) =>
                        item.action !== "link" ? (
                            <button key={item.href} type="button" className={styles.navLink} onClick={() => activate(item)}>
                                {item.label}
                            </button>
                        ) : (
                            <Link key={item.href} href={item.href} className={styles.navLink}>
                                {item.label}
                            </Link>
                        ),
                    )}
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

            {mobileOpen ? (
                <nav id="home-mobile-menu" className={styles.mobileNav} aria-label="移动端导航">
                    {HOME_NAVIGATION.map((item) =>
                        item.action !== "link" ? (
                            <button key={item.href} type="button" onClick={() => activate(item)}>
                                {item.label}
                                <ArrowRight aria-hidden="true" />
                            </button>
                        ) : (
                            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                                {item.label}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        ),
                    )}
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
