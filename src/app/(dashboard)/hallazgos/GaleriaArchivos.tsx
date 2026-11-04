import { IconFileDescription } from "@tabler/icons-react";
import { esImagenRuta, hrefArchivo } from "@/lib/storage/rutas";

export function GaleriaArchivos({ rutas, titulo }: { rutas: string[]; titulo: string }) {
  if (rutas.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[#0B1B33]">{titulo}</h2>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rutas.map((ruta, indice) => {
          const href = hrefArchivo(ruta);
          const imagen = esImagenRuta(ruta);
          return (
            <li key={ruta}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[#DDE3EA] overflow-hidden hover:border-[#2F6B2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A]"
              >
                {imagen ? (
                  <img
                    src={href}
                    alt={`${titulo} ${indice + 1}`}
                    className="w-full h-32 object-cover bg-[#F4F6F3]"
                  />
                ) : (
                  <span className="flex min-h-32 items-center justify-center gap-2 px-3 text-sm font-medium text-[#16294A]">
                    <IconFileDescription size={16} aria-hidden />
                    Ver archivo {indice + 1}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
