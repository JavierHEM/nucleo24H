import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { getCaller } from "@/lib/trpc/server";
import { hrefArchivo } from "@/lib/storage/rutas";

export default async function TutorialDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await getCaller();
  const tutorial = await caller.tutoriales.get({ id }).catch(() => null);
  if (!tutorial) notFound();

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        href="/tutoriales"
        className="inline-flex items-center gap-1 text-sm font-bold text-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
      >
        <IconArrowLeft size={16} />
        Volver a tutoriales
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-[#0B1B33]">{tutorial.titulo}</h1>
        {tutorial.descripcion && <p className="text-sm text-[#5B6980] mt-2">{tutorial.descripcion}</p>}
      </div>
      <div className="bg-black rounded-[14px] overflow-hidden">
        <video
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video bg-black"
          src={hrefArchivo(tutorial.ruta_video)}
        >
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    </div>
  );
}
