"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export function EliminarProveedorButton({ id }: { id: string }) {
  const router = useRouter();
  const eliminar = trpc.proveedores.eliminar.useMutation({
    onSuccess: () => {
      router.push("/proveedores");
      router.refresh();
    },
  });
  return (
    <button
      type="button"
      disabled={eliminar.isPending}
      onClick={() => {
        if (window.confirm("¿Eliminar este proveedor?")) eliminar.mutate({ id });
      }}
      className="text-xs text-[#9A1C12] underline underline-offset-2"
    >
      Eliminar
    </button>
  );
}
