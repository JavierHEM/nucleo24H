-- El tipo del registro deja de estar limitado a las 4 planillas genéricas.
-- El código del anexo (R-BPM-xx-yy) vive en Registro.codigo.
ALTER TABLE "Registro" DROP CONSTRAINT IF EXISTS "Registro_tipo_check";
