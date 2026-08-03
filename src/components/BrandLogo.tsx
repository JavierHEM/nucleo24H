import Image from "next/image";
import { APP_NAME, LOGO_SRC } from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** full = emblema + tipografía; mark = solo emblema recortado */
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "full",
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-white shrink-0",
          className
        )}
      >
        <Image
          src={LOGO_SRC}
          alt={APP_NAME}
          fill
          priority={priority}
          className="object-cover object-[center_12%]"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <Image
      src={LOGO_SRC}
      alt={APP_NAME}
      width={845}
      height={913}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      sizes="(max-width: 768px) 160px, 220px"
    />
  );
}
