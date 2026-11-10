"use client";

import { useState } from "react";
import { IconLoader2, IconMailForward } from "@tabler/icons-react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

export function InvitarDueñoButton({ tenantId }: { tenantId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const invitar = trpc.empresas.invitarAdmin.useMutation();

  async function enviar() {
    await invitar.mutateAsync({ tenant_id: tenantId, email });
    setAbierto(false);
    setEmail("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg text-xs font-medium text-[#16294A] border border-[#DDE3EA] hover:bg-[#F4F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        <IconMailForward size={13} />
        Invitar dueño
      </button>
      <Dialogo
        abierto={abierto}
        titulo="Invitar administrador del local"
        onCerrar={() => setAbierto(false)}
        pie={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={invitar.isPending || email.trim().length < 5}
              onClick={enviar}
              className="min-h-12 rounded-xl bg-[#2F6B2A] hover:bg-[#255620] text-white"
            >
              {invitar.isPending && <IconLoader2 size={16} className="animate-spin" />}
              Enviar invitación
            </Button>
          </div>
        }
      >
        <div>
          <Label htmlFor={`invite-${tenantId}`}>Email</Label>
          <input
            id={`invite-${tenantId}`}
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            className="mt-1 w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3 py-2 text-sm text-[#0B1B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
          />
          {invitar.error && (
            <p className="text-sm text-[#B42318] bg-red-50 rounded-xl px-3 py-2 mt-3" role="alert">
              {invitar.error.message}
            </p>
          )}
        </div>
      </Dialogo>
    </>
  );
}
