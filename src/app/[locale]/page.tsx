import { redirect } from "next/navigation";

// Root "/" redirects to the public booking page.
// Logged-in users hit the proxy which sends them to /dashboard.
export default function RootPage() {
  redirect("/booking");
}
