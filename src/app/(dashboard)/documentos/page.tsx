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
          <h1 className="text-2xl font-bold text-[#0B2545] flex items-center gap-2">
            <IconFileDescription size={26} className="text-[#4B8B2E]" />
            Documentos
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Protocolos para imprimir y documentos del local
          </p>
        </div>
      </div>

      <BibliotecaProtocolos />

      <section className="space-y-4 border-t border-[#E2E8F0] pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B2545]">Documentos del local</h2>
            <p className="text-sm text-[#64748B] mt-1">
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
