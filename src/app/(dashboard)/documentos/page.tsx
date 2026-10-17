import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { IconFileDescription } from "@tabler/icons-react";
import { DocumentosList } from "./DocumentosList";
import { SubirDocumentoButton } from "./SubirDocumentoButton";
import { BibliotecaProtocolos } from "./BibliotecaProtocolos";
import type { UserRole } from "@/server/trpc/context";
import { puedeOperarLocal } from "@/lib/roles";

export default async function DocumentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } })
    : null;

  const userRole = (dbUser?.rol as UserRole | undefined) ?? null;
  const canSubir = puedeOperarLocal(userRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B33] flex items-center gap-2">
            <IconFileDescription size={26} className="text-[#2F6B2A]" />
            Documentos
          </h1>
          <p className="text-sm text-[#5B6980] mt-1">
            Protocolos para imprimir y documentos del local
          </p>
        </div>
      </div>

      <BibliotecaProtocolos />

      <section className="space-y-4 border-t border-[#DDE3EA] pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B1B33]">Documentos del local</h2>
            <p className="text-sm text-[#5B6980] mt-1">
              Permiso sanitario, certificados y lo que el local sube para revisión.
            </p>
          </div>
          {canSubir && <SubirDocumentoButton />}
        </div>
        <DocumentosList userRole={userRole} />
      </section>
    </div>
  );
}
