import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { IconFileDescription } from "@tabler/icons-react";
import { DocumentosList } from "./DocumentosList";
import { SubirDocumentoButton } from "./SubirDocumentoButton";
import type { UserRole } from "@/server/trpc/context";

export default async function DocumentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } })
    : null;

  const userRole = (dbUser?.rol as UserRole | undefined) ?? null;
  const canSubir = userRole === "admin_local" || userRole === "admin_nucleo";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C] flex items-center gap-2">
            <IconFileDescription size={26} className="text-[#3D7A35]" />
            Documentos
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Permiso sanitario, certificados, procedimientos y más
          </p>
        </div>
        {canSubir && <SubirDocumentoButton />}
      </div>
      <DocumentosList userRole={userRole} />
    </div>
  );
}
