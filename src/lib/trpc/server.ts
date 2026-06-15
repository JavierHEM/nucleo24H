import { t } from "@/server/trpc/trpc";
import { appRouter } from "@/server/trpc/router";
import { createContext } from "@/server/trpc/context";

const createCaller = t.createCallerFactory(appRouter);

export async function getCaller() {
  const ctx = await createContext();
  return createCaller(ctx);
}
