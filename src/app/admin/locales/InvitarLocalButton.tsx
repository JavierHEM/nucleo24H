import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

export function InvitarLocalButton() {
  return (
    <Link
      href="/admin/locales/nueva"
      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md bg-[#2F6B2A] hover:bg-[#255620] text-white text-sm font-medium w-full sm:w-auto shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B2A] focus-visible:ring-offset-2"
    >
      <IconPlus size={16} />
      Nueva empresa
    </Link>
  );
}
