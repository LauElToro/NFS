import { redirect } from "next/navigation";
import { ActivationsPanel } from "@/components/ActivationsPanel";
import { currentAccount } from "@/lib/access";

export default async function ActivationsPage() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") redirect("/app");
  return <ActivationsPanel />;
}
