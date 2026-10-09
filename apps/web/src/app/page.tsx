import { StoreHome } from "@/components/store/StoreHome";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  return <StoreHome loggedIn={Boolean(session)} />;
}
