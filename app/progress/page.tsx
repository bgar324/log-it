import { redirect } from "next/navigation";

export default function ProgressRoute() {
  redirect("/dashboard?view=progress");
}
