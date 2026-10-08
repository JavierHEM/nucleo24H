"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { PlanillaSheet } from "@/components/registros/PlanillaSheet";

export function NuevoRegistroSheet() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button
        onClick={() => setAbierto(true)}
        className="bg-[#4B8B2E] hover:bg-[#3A6E24] text-white gap-2"
        size="sm"
      >
        <IconPlus size={16} />
        Nuevo registro
      </Button>
      <PlanillaSheet abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
