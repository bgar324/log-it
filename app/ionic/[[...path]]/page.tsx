import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { isIonicEnabled } from "@/lib/ionic-feature-flag";
import { ionicSessionUser } from "../ionic-data";
import { IonicEntry } from "../ionic-entry";

export const metadata = { title: "Logit", robots: { index: false, follow: false } };

export default async function IonicPage() {
  const user = await requireSessionUser();
  if (!(await isIonicEnabled(user))) redirect("/dashboard");
  return <IonicEntry key={user.id} user={ionicSessionUser(user)} />;
}
