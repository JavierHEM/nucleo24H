import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";
import { IconArrowLeft } from "@tabler/icons-react";
import { TicketThread } from "./TicketThread";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { rol: true } });
  if (!dbUser || dbUser.rol === "trabajador_local") notFound();

  return (
    <div className="space-y-4 w-full">
      <Link
        href="/comunicaciones"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6980] hover:text-[#0B1B33] min-h-10"
      >
        <IconArrowLeft size={16} />
        Volver a peticiones
      </Link>
      <TicketThread ticketId={id} userId={user.id} userRole={dbUser.rol} />
    </div>
  );
}
