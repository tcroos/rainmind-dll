"use client";

import { App, Empty, Modal, Spin } from "antd";
import { BadgeCheck, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BillingPlanGrid } from "@/components/billing/billing-plan-grid";
import { listBillingProducts, type BillingProduct } from "@/services/api/billing";

export function BillingPlansModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (product: BillingProduct) => void }) {
    const { message } = App.useApp();
    const [products, setProducts] = useState<BillingProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (!open || loadedRef.current) return;
        loadedRef.current = true;
        setLoading(true);
        void listBillingProducts()
            .then((payload) => setProducts(payload.products || []))
            .catch((error) => message.error(error instanceof Error ? error.message : "套餐加载失败"))
            .finally(() => setLoading(false));
    }, [message, open]);

    return (
        <Modal
            rootClassName="billing-plans-modal profile-page-scroll"
            title={null}
            open={open}
            width={modalWidth(products.length)}
            centered
            footer={null}
            closable={false}
            onCancel={onClose}
            styles={{
                container: { padding: 0, overflow: "hidden" },
                body: { padding: 0, maxHeight: "calc(100dvh - 32px)", overflowY: "auto" },
                mask: { background: "rgba(17, 17, 19, 0.52)", backdropFilter: "blur(8px)" },
            }}
        >
            <div className="bg-[#fafafa] text-stone-950 dark:bg-[#0d0d0f] dark:text-stone-100">
                <div className="relative border-b border-stone-200/80 bg-white px-4 py-4 sm:px-6 dark:border-stone-800 dark:bg-stone-950">
                    <button
                        type="button"
                        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 disabled:text-stone-300 dark:bg-white/[0.06] dark:text-stone-400 dark:hover:bg-white/[0.1] dark:hover:text-white"
                        aria-label="关闭套餐选择"
                        title="关闭"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </button>
                    <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 pr-11">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e2671f] text-white shadow-[0_8px_20px_-8px_rgba(226,103,31,0.7)]">
                                <Sparkles className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <div className="text-[15px] font-semibold tracking-[-0.01em]">升级创作套餐</div>
                                <div className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">选择方案后进入安全结算</div>
                            </div>
                        </div>
                        <span className="hidden items-center gap-1.5 text-xs font-medium text-stone-500 sm:inline-flex dark:text-stone-400">
                            <BadgeCheck className="size-4 text-emerald-600 dark:text-emerald-400" /> 支付成功自动到账
                        </span>
                    </div>
                </div>

                <div className="px-3 py-3 sm:px-6 sm:py-6">
                    {loading ? (
                        <div className="grid min-h-32 place-items-center">
                            <Spin />
                        </div>
                    ) : products.length ? (
                        <div className="mx-auto max-w-[1080px]">
                            <BillingPlanGrid
                                variant="modal"
                                products={products}
                                onSelect={(product) => {
                                    onClose();
                                    onSelect(product);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-stone-300 bg-white py-8 dark:border-stone-700 dark:bg-stone-950">
                            <Empty description="暂无已上架套餐" />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function modalWidth(productCount: number) {
    if (productCount <= 1) return "min(94vw, 520px)";
    if (productCount === 2) return "min(94vw, 860px)";
    if (productCount === 3) return "min(96vw, 1040px)";
    return "min(96vw, 1120px)";
}
