"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/components/workspace-ui/button";
import type { DashboardProfileViewProps } from "@/app/dashboard/_components/dashboard-profile-view";
import { WorkspaceAccountCredentials } from "@/app/workspace/account/workspace-account-credentials";
import { WorkspaceAvatarEditor } from "@/app/workspace/account/workspace-avatar-editor";
import { WorkspaceDeleteAccount } from "@/app/workspace/account/workspace-delete-account";
import { WorkspaceProfileEditDialog } from "@/app/workspace/account/workspace-profile-edit-dialog";

/**
 * Who you are, how you sign in, and how to leave. Three sentences of state and
 * the controls that change them; no tiles, no duplicated numbers.
 */
export function WorkspaceProfileView({ state }: DashboardProfileViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const avatarUrl = state.profile.profileImageUpdatedAt
    ? `/api/profile/avatar?v=${encodeURIComponent(state.profile.profileImageUpdatedAt)}`
    : null;
  const displayedAvatarUrl = state.avatarRemovalPending
    ? null
    : state.avatarPreviewUrl ?? avatarUrl;
  const displayName =
    [state.profile.firstName, state.profile.lastName]
      .map((value) => (value ?? "").trim())
      .filter(Boolean)
      .join(" ") || state.profile.username;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <WorkspaceAvatarEditor
          displayedAvatarUrl={displayedAvatarUrl}
          hasAvatar={Boolean(displayedAvatarUrl)}
          isSaving={state.isSaving}
          onAvatarDelete={state.handleAvatarDelete}
          onAvatarFileChange={state.handleAvatarFileChange}
        />

        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h1 className="cn-font-heading truncate text-xl leading-tight font-medium">
              {displayName}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Edit profile"
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil strokeWidth={1.9} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            You are @{state.profile.username} and joined in{" "}
            {state.profile.joinedAtLabel}.{" "}
            {state.profile.publicProfileEnabled ? (
              <>
                Your profile is public at{" "}
                <Link
                  className="relative underline underline-offset-3 before:absolute before:inset-x-0 before:-inset-y-3.5 hover:text-foreground"
                  href={`/u/${state.profile.username}`}
                >
                  /u/{state.profile.username}
                </Link>
                .
              </>
            ) : (
              "Your profile is private, so only you can see your training."
            )}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="cn-font-heading text-base font-medium">Account</h2>
          <p className="text-sm text-muted-foreground">
            How you sign in. Changing either one asks for your current password
            first.
          </p>
        </div>
        <WorkspaceAccountCredentials currentEmail={state.profile.email} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="cn-font-heading text-base font-medium text-destructive">
            Delete account
          </h2>
          <p className="text-sm text-muted-foreground">
            Deleting your account removes every workout, split, and nutrition
            entry with it. This cannot be undone.
          </p>
        </div>
        <div>
          <WorkspaceDeleteAccount username={state.profile.username} />
        </div>
      </section>

      <WorkspaceProfileEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        state={state}
      />
    </div>
  );
}
