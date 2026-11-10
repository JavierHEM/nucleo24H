-- El unique de email era case-sensitive. Pilar@x.cl y pilar@x.cl pasaban
-- como dos cuentas. Guardamos siempre minúsculas y un índice en lower(email).

UPDATE public."User"
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));

UPDATE auth.users
SET email = lower(btrim(email))
WHERE email IS DISTINCT FROM lower(btrim(email));

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key"
  ON public."User" (lower(email));

CREATE OR REPLACE FUNCTION public.forzar_email_minuscula()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_user_email_minuscula ON public."User";
CREATE TRIGGER trg_user_email_minuscula
  BEFORE INSERT OR UPDATE OF email ON public."User"
  FOR EACH ROW
  EXECUTE FUNCTION public.forzar_email_minuscula();

DROP TRIGGER IF EXISTS trg_auth_email_minuscula ON auth.users;
CREATE TRIGGER trg_auth_email_minuscula
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.forzar_email_minuscula();
