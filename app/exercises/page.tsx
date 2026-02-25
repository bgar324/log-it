import { redirect } from "next/navigation";

export default function ExercisesRoute() {
  redirect("/dashboard?view=progress");
}
