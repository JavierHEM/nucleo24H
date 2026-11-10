import Link from "next/link";
import { IconBuildingPlus } from "@tabler/icons-react";
import { claveRut } from "@/lib/empresas";

export function AgregarSucursalButton({ rut }: { rut: string }) {
  return (
    <Link
      href={`/admin/locales/${encodeURIComponent(claveRut(rut))}/nueva-sucursal`}
      className="inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-sm font-medium text-white hover:bg-[#255620] w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] focus-visible:ring-offset-2"
    >
      <IconBuildingPlus size={16} />
      Nueva sucursal
    </Link>
  );
}
