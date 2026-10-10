import { StoreHome } from "@/components/store/StoreHome";
import { getSession } from "@/lib/session";

export default async function StorePage() {
  const session = await getSession();
  return <StoreHome loggedIn={Boolean(session)} />;
}
