import { redirect } from "next/navigation";

export default function WorkoutsRoute() {
  redirect("/dashboard?view=workouts");
}
