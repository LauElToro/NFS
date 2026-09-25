import { createContainer } from "@nfs/infrastructure";

const globalForContainer = globalThis as unknown as {
  nfsContainer?: ReturnType<typeof createContainer>;
};

export function getContainer() {
  if (!globalForContainer.nfsContainer) {
    globalForContainer.nfsContainer = createContainer();
  }
  return globalForContainer.nfsContainer;
}
