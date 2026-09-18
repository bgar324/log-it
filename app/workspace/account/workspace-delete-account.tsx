"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/workspace-ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/workspace-ui/alert";
import { Button } from "@/app/components/workspace-ui/button";
import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";

export type WorkspaceDeleteAccountProps = {
  className?: string;
  username: string;
};

type WorkspaceDeleteAccountFormProps = {
  onDeletingChange: (deleting: boolean) => void;
  deleting: boolean;
  username: string;
};

/**
 * Deletion is the one action in the app that cannot be undone, so it asks for
 * the username by hand and states exactly what disappears before the button
 * becomes usable.
 */
export function WorkspaceDeleteAccount({
  className,
  username,
}: WorkspaceDeleteAccountProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(next) => {
        // A delete already in flight must not be dismissed: the session is
        // about to end and a half-closed dialog would look like it failed.
        if (!next && isDeleting) {
          return;
        }

        setIsOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" className={className}>
          Delete account
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          if (isDeleting) {
            event.preventDefault();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account with every workout, split, and
            nutrition entry in it. Nothing can be recovered afterwards.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <WorkspaceDeleteAccountForm
          username={username}
          deleting={isDeleting}
          onDeletingChange={setIsDeleting}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WorkspaceDeleteAccountForm({
  deleting,
  onDeletingChange,
  username,
}: WorkspaceDeleteAccountFormProps) {
  const router = useRouter();
  const [confirmValue, setConfirmValue] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const matches = confirmValue.trim().toLowerCase() === username.toLowerCase();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (deleting || !matches) {
      return;
    }

    onDeletingChange(true);
    setFailure(null);
    const toastId = toast.loading("Deleting account...");

    try {
      const response = await fetch("/api/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: confirmValue }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error ?? "Unable to delete account.");
      }

      posthog.capture("account_deleted");
      posthog.reset();
      toast.success("Account deleted.", { id: toastId });
      router.replace("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete account.";
      setFailure(message);
      toast.error(message, { id: toastId });
      onDeletingChange(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceDeleteAccountConfirm">
          Type {username} to confirm
        </Label>
        <Input
          id="workspaceDeleteAccountConfirm"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={confirmValue}
          disabled={deleting}
          onChange={(event) => setConfirmValue(event.target.value)}
        />
      </div>

      {failure ? (
        <Alert variant="destructive">
          <AlertTitle>Account still here</AlertTitle>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleting}>
          Cancel
        </AlertDialogCancel>
        {/* Deliberately not AlertDialogAction: that closes on click, and the
            dialog has to stay up while the request runs and if it fails. */}
        <Button type="submit" variant="destructive" disabled={!matches || deleting}>
          {deleting ? "Deleting…" : "Permanently delete"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
