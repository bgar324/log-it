"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export type PostHogUser = {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
};

export function useIdentifyPostHogUser(user?: PostHogUser) {
  const id = user?.id;
  const email = user?.email;
  const username = user?.username;
  const firstName = user?.firstName;
  const lastName = user?.lastName;

  useEffect(() => {
    if (!id || !email || !username) {
      return;
    }

    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

    posthog.identify(id, {
      email,
      username,
      ...(name ? { name } : {}),
    });
  }, [email, firstName, id, lastName, username]);
}
