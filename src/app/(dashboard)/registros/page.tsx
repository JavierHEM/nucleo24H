import { IconClipboardList } from "@tabler/icons-react";
import { RegistrosList } from "./RegistrosList";
import { NuevoRegistroSheet } from "./NuevoRegistroSheet";

export default function RegistrosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] flex items-center gap-2">
            <IconClipboardList size={26} className="text-[#4B8B2E]" />
            Registros BPM
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Control diario de temperatura, limpieza y plagas
          </p>
        </div>
        <NuevoRegistroSheet />
      </div>
      <RegistrosList />
    </div>
  );
}
