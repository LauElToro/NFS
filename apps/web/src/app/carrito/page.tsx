import { CartPage } from "@/components/store/CartPage";
import { getSession } from "@/lib/session";

export default async function Page() {
  const session = await getSession();
  return <CartPage loggedIn={Boolean(session)} />;
}
