import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getSession } from "@/lib/session";

export default async function Page() {
  const session = await getSession();
  return <CheckoutForm loggedIn={Boolean(session)} />;
}
