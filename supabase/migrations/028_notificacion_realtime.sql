ALTER TABLE "Notificacion" REPLICA IDENTITY FULL;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE "Notificacion";
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
