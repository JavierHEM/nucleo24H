import Image from "next/image";
import { APP_NAME, LOGO_PATHS, LOGO_SIZE } from "@/lib/branding";
import { cn } from "@/lib/utils";

export type BrandLogoVariant =
  | "principal"
  | "negativo"
  | "isotipo"
  | "isotipoNegativo";

type BrandLogoProps = {
  /** principal: fondos claros · negativo: fondos oscuros · isotipo*: espacios reducidos */
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "principal",
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "isotipo" || variant === "isotipoNegativo") {
    return (
      <Image
        src={LOGO_PATHS[variant]}
        alt={APP_NAME}
        width={160}
        height={160}
        priority={priority}
        unoptimized
        className={cn("shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <Image
      src={LOGO_PATHS[variant]}
      alt={APP_NAME}
      width={LOGO_SIZE.width}
      height={LOGO_SIZE.height}
      priority={priority}
      className={cn("h-auto object-contain", className)}
      sizes="(max-width: 768px) 192px, 256px"
    />
  );
}
