import type { Metadata } from "next";
import { preload } from "react-dom";
import { notFound } from "next/navigation";
import { Toaster } from "@/app/components/ui/toaster";
import {
  ProductPreview,
  ProductPreviewShell,
  type ProductPreviewView,
} from "./product-preview";

const PRODUCT_PREVIEW_VIEWS = [
  "dashboard",
  "progress",
  "split",
] as const satisfies readonly ProductPreviewView[];

export const metadata: Metadata = {
  title: "Logit product preview",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCT_PREVIEW_VIEWS.map((view) => ({ view }));
}

const VIEW_ART: Record<ProductPreviewView, string> = {
  dashboard: "/art/preview-dashboard.webp",
  progress: "/art/preview-progress.webp",
  split: "/art/preview-split.webp",
};

export default async function ProductPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<{ shell?: string }>;
}) {
  const { view } = await params;
  const { shell } = await searchParams;

  if (!PRODUCT_PREVIEW_VIEWS.some((previewView) => previewView === view)) {
    notFound();
  }

  if (shell) {
    return (
      <>
        <ProductPreviewShell view={view as ProductPreviewView} />
        <Toaster />
      </>
    );
  }

  preload(VIEW_ART[view as ProductPreviewView], { as: "image" });
  return (
    <>
      <ProductPreview view={view as ProductPreviewView} />
      <Toaster />
    </>
  );
}
