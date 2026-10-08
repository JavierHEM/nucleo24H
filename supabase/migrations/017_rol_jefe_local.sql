-- Rol jefe_local: opera uno o más locales (UserTenant) sin acceso a suscripción.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_rol_check";
ALTER TABLE "User" ADD CONSTRAINT "User_rol_check"
  CHECK (rol IN (
    'trabajador_local',
    'jefe_local',
    'admin_local',
    'asesor',
    'admin_nucleo'
  ));
