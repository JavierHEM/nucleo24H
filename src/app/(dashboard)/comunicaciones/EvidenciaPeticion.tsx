import { IconFileDescription } from "@tabler/icons-react";
import { esImagenRuta, hrefArchivo } from "@/lib/storage/rutas";
import { nombreArchivoPeticion } from "@/lib/comunicaciones/adjuntos";

export function EvidenciaPeticion({
  rutas,
  compacto = false,
}: {
  rutas: string[];
  compacto?: boolean;
}) {
  if (rutas.length === 0) return null;

  return (
    <ul className={`grid gap-2 ${compacto ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
      {rutas.map((ruta, indice) => {
        const href = hrefArchivo(ruta);
        const imagen = esImagenRuta(ruta);
        const nombre = nombreArchivoPeticion(ruta);
        return (
          <li key={`${ruta}-${indice}`}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-[#DDE3EA] overflow-hidden bg-[#F4F6F3] hover:border-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
            >
              {imagen ? (
                <img
                  src={href}
                  alt={nombre}
                  className={`w-full object-cover ${compacto ? "h-20" : "h-28"}`}
                />
              ) : (
                <span className={`flex items-center justify-center gap-2 px-2 text-xs font-medium text-[#16294A] ${compacto ? "h-20" : "h-28"}`}>
                  <IconFileDescription size={16} aria-hidden />
                  <span className="truncate">{nombre}</span>
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
