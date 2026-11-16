import { redirect } from "next/navigation";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
    const params = await searchParams;
    const product = Array.isArray(params.product) ? params.product[0] : params.product;
    /* 充值入口统一收进钱包：带 product 时直接进结算，其余情况落在钱包首屏（余额 + 套餐）。 */
    redirect(product?.trim() ? `/billing/checkout?product=${encodeURIComponent(product.trim())}` : "/wallet");
}
