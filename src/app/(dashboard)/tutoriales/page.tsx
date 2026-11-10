import Link from "next/link";
import { IconPlayerPlay, IconVideo } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";

export default async function TutorialesPage() {
  const caller = await getCaller();
  const tutoriales = await caller.tutoriales.list().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">Tutoriales</h1>
        <p className="text-sm text-[#5B6980] mt-1">Videos cortos para usar Núcleo 24H en el día a día.</p>
      </div>

      {tutoriales.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#DDE3EA] bg-white p-12 text-center">
          <IconVideo size={28} className="mx-auto text-[#2F6B2A]" />
          <p className="font-semibold text-[#0B1B33] mt-3">Aún no tienes tutoriales</p>
          <p className="text-sm text-[#5B6980] mt-1">Cuando Núcleo publique un video para tu rol, aparece acá.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tutoriales.map((tutorial) => (
            <li key={tutorial.id}>
              <Link
                href={`/tutoriales/${tutorial.id}`}
                className="block rounded-[14px] border border-[#DDE3EA] bg-white p-5 hover:border-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
              >
                <p className="font-extrabold text-[#0B1B33]">{tutorial.titulo}</p>
                {tutorial.descripcion && (
                  <p className="text-sm text-[#5B6980] mt-2 line-clamp-3">{tutorial.descripcion}</p>
                )}
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#2F6B2A]">
                  <IconPlayerPlay size={16} />
                  Ver video · {formatDate(tutorial.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
