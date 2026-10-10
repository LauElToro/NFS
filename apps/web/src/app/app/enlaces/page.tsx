import { ReviewLinkGenerator } from "@/components/ReviewLinkGenerator";
import { findAccount } from "@/lib/accounts";
import { getSession } from "@/lib/session";

export default async function Page() {
  let admin = false;
  try {
    const session = await getSession();
    const account = session ? await findAccount(session.id) : null;
    admin = account?.role === "admin";
  } catch (error) {
    console.error(error);
  }
  return <ReviewLinkGenerator admin={admin} />;
}
