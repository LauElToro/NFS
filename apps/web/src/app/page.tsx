import { HomeLanding } from "@/components/store/HomeLanding";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  return <HomeLanding loggedIn={Boolean(session)} />;
}
