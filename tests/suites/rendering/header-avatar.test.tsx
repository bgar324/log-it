import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { AppShell, AppTopBar } from "@/app/components/app-nav";
import { WorkspaceDesignProvider } from "@/app/components/workspace-design-context";
import { render } from "./render";

test("changing or deleting a profile photo never reuses an older embedded photo", async () => {
  const originalUrl = "/api/profile/avatar?v=old-photo";
  const originalImage = "data:image/webp;base64,UklGRg==";
  function shell(avatarUrl: string | null) {
    return <WorkspaceDesignProvider enabled={false} benEnabled={false} avatar={{ url: originalUrl, dataUrl: originalImage }}>
      <AppShell user={{ displayName: "Ben Garcia", username: "ben", avatarUrl }}>
        <AppTopBar title="Home" />
      </AppShell>
    </WorkspaceDesignProvider>;
  }
  const mounted = await render(shell(originalUrl));
  try {
    assert.equal(mounted.container.querySelector("header img")?.getAttribute("src"), originalImage);
    await mounted.rerender(shell("/api/profile/avatar?v=new-photo"));
    const updatedImage = mounted.container.querySelector("header img")?.getAttribute("src");
    assert.ok(updatedImage?.includes("v=new-photo"));
    assert.notEqual(updatedImage, originalImage);
    await mounted.rerender(shell(null));
    assert.equal(mounted.container.querySelector("header img"), null);
    assert.equal(mounted.container.querySelector('header a[aria-label="Profile"]')?.textContent, "BG");
  } finally {
    mounted.unmount();
  }
});
