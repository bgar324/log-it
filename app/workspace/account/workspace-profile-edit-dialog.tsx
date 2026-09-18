"use client";

import { useState } from "react";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/workspace-ui/dialog";
import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/workspace-ui/select";
import type { DashboardProfileFormState } from "@/app/dashboard/_hooks/use-dashboard-profile-form";
import { USERNAME_RULE_MESSAGE } from "@/lib/username";

export type WorkspaceProfileEditDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  state: DashboardProfileFormState;
};

type WorkspaceProfileEditFormProps = {
  onClose: () => void;
  state: DashboardProfileFormState;
};

/**
 * Identity edits are one explicit save. The fields live in a child component so
 * every open seeds from the saved profile and a cancel discards the draft,
 * which is what Radix's own unmount-on-close already gives us.
 */
export function WorkspaceProfileEditDialog({
  onOpenChange,
  open,
  state,
}: WorkspaceProfileEditDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // A save in flight owns the dialog: dismissing it would leave the user
        // unsure whether their new username was taken.
        if (!next && state.isSaving) {
          return;
        }

        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (state.isSaving) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (state.isSaving) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Your name and username are what other people see when your profile
            is public.
          </DialogDescription>
        </DialogHeader>

        <WorkspaceProfileEditForm state={state} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceProfileEditForm({ onClose, state }: WorkspaceProfileEditFormProps) {
  const [firstName, setFirstName] = useState(state.profile.firstName ?? "");
  const [lastName, setLastName] = useState(state.profile.lastName ?? "");
  const [username, setUsername] = useState(state.profile.username);
  const [isPublic, setIsPublic] = useState(state.profile.publicProfileEnabled);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (state.isSaving) {
      return;
    }

    const saved = await state.saveIdentity({
      firstName,
      lastName,
      username: username.trim(),
      publicProfileEnabled: isPublic,
    });

    // A rejected username or a dropped request leaves the draft exactly as it
    // was typed, so nothing has to be retyped to try again.
    if (saved) {
      onClose();
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workspaceProfileFirstName">First name</Label>
          <Input
            id="workspaceProfileFirstName"
            value={firstName}
            maxLength={40}
            autoComplete="given-name"
            disabled={state.isSaving}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workspaceProfileLastName">Last name</Label>
          <Input
            id="workspaceProfileLastName"
            value={lastName}
            maxLength={40}
            autoComplete="family-name"
            disabled={state.isSaving}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceProfileUsername">Username</Label>
        <Input
          id="workspaceProfileUsername"
          value={username}
          maxLength={24}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          disabled={state.isSaving}
          onChange={(event) => setUsername(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">{USERNAME_RULE_MESSAGE}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceProfileVisibility">Profile visibility</Label>
        <Select
          value={isPublic ? "public" : "private"}
          disabled={state.isSaving}
          onValueChange={(value) => setIsPublic(value === "public")}
        >
          <SelectTrigger id="workspaceProfileVisibility" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public profile</SelectItem>
            <SelectItem value="private">Private profile</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {isPublic
            ? "Anyone with your link can see your training summary."
            : "Only you can see your training."}
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={state.isSaving}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={state.isSaving}>
          {state.isSaving ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
