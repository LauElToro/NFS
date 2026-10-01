import { findAccount, toPublic, type Account } from "./accounts";
import { getSession } from "./session";

export async function currentAccount(): Promise<Account | null> {
  const session = await getSession();
  if (!session) return null;
  const account = await findAccount(session.id);
  if (!account || !account.active) return null;
  return account;
}

export function publicActor(account: Account) {
  return toPublic(account);
}
