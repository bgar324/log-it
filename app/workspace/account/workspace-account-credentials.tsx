"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/workspace-ui/alert";
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

export type WorkspaceAccountCredentialsProps = {
  currentEmail: string;
};

type CredentialSection = "email" | "password" | null;

type MutationResponse = { ok?: boolean; error?: string; email?: string };

async function readResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as MutationResponse | null;
  const ok = response.ok && payload?.ok === true;
  return { ok, payload };
}

/**
 * Two rows that state what is currently set and open one dialog each. Both
 * mutations require the current password, so neither can be a quiet inline
 * edit: the dialog is the thing that makes the password prompt make sense.
 */
export function WorkspaceAccountCredentials({
  currentEmail,
}: WorkspaceAccountCredentialsProps) {
  const [openSection, setOpenSection] = useState<CredentialSection>(null);

  return (
    <div className="flex flex-col">
      <CredentialRow
        label="Email"
        value={currentEmail}
        actionLabel="Change email"
        onOpen={() => setOpenSection("email")}
      />
      <CredentialRow
        label="Password"
        value="••••••••"
        actionLabel="Change password"
        onOpen={() => setOpenSection("password")}
      />

      <ChangeEmailDialog
        currentEmail={currentEmail}
        open={openSection === "email"}
        onOpenChange={(next) => setOpenSection(next ? "email" : null)}
      />
      <ChangePasswordDialog
        open={openSection === "password"}
        onOpenChange={(next) => setOpenSection(next ? "password" : null)}
      />
    </div>
  );
}

type CredentialRowProps = {
  actionLabel: string;
  label: string;
  onOpen: () => void;
  value: string;
};

function CredentialRow({ actionLabel, label, onOpen, value }: CredentialRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="truncate text-sm text-muted-foreground">{value}</span>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onOpen}>
        {actionLabel}
      </Button>
    </div>
  );
}

type ChangeEmailDialogProps = {
  currentEmail: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function ChangeEmailDialog({
  currentEmail,
  onOpenChange,
  open,
}: ChangeEmailDialogProps) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) {
          return;
        }

        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Change email</DialogTitle>
          <DialogDescription>
            You sign in with this address, so your current password has to
            confirm the change.
          </DialogDescription>
        </DialogHeader>

        <ChangeEmailForm
          currentEmail={currentEmail}
          pending={pending}
          onPendingChange={setPending}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type ChangeEmailFormProps = {
  currentEmail: string;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
  pending: boolean;
};

function ChangeEmailForm({
  currentEmail,
  onClose,
  onPendingChange,
  pending,
}: ChangeEmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (pending) {
      return;
    }

    onPendingChange(true);
    setFailure(null);
    const toastId = toast.loading("Updating email...");

    try {
      const response = await fetch("/api/profile/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: password }),
      });
      const { ok, payload } = await readResponse(response);

      if (!ok) {
        throw new Error(payload?.error ?? "Unable to change email.");
      }

      setPassword("");
      toast.success("Email updated.", { id: toastId });
      router.refresh();
      onClose();
    } catch (error) {
      // Keep the typed address: a wrong password is the common failure and
      // retyping the email would be punishment for it.
      const message =
        error instanceof Error ? error.message : "Unable to change email.";
      setFailure(message);
      toast.error(message, { id: toastId });
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceAccountEmail">New email</Label>
        <Input
          id="workspaceAccountEmail"
          type="email"
          autoComplete="email"
          value={email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceAccountEmailPassword">Current password</Label>
        <Input
          id="workspaceAccountEmailPassword"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={pending}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {failure ? (
        <Alert variant="destructive">
          <AlertTitle>Email unchanged</AlertTitle>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update email"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type ChangePasswordDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function ChangePasswordDialog({ onOpenChange, open }: ChangePasswordDialogProps) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) {
          return;
        }

        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Your current password confirms it is you. The new one takes effect
            immediately.
          </DialogDescription>
        </DialogHeader>

        <ChangePasswordForm
          pending={pending}
          onPendingChange={setPending}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type ChangePasswordFormProps = {
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
  pending: boolean;
};

function ChangePasswordForm({
  onClose,
  onPendingChange,
  pending,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [failure, setFailure] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (pending) {
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "New passwords do not match.";
      setFailure(message);
      toast.error(message);
      return;
    }

    onPendingChange(true);
    setFailure(null);
    const toastId = toast.loading("Updating password...");

    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const { ok, payload } = await readResponse(response);

      if (!ok) {
        throw new Error(payload?.error ?? "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.", { id: toastId });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to change password.";
      setFailure(message);
      toast.error(message, { id: toastId });
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceAccountCurrentPassword">Current password</Label>
        <Input
          id="workspaceAccountCurrentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          disabled={pending}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceAccountNewPassword">New password</Label>
        <Input
          id="workspaceAccountNewPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          disabled={pending}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">Use at least 8 characters.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspaceAccountConfirmPassword">Confirm new password</Label>
        <Input
          id="workspaceAccountConfirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={pending}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      {failure ? (
        <Alert variant="destructive">
          <AlertTitle>Password unchanged</AlertTitle>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </DialogFooter>
    </form>
  );
}
