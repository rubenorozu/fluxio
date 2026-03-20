-- Ejecutar en el Editor SQL de Supabase (SQL Editor)

-- 1. Crear el bucket 'reservations' (si no existe) y hacerlo público
INSERT INTO storage.buckets (id, name, public)
VALUES ('reservations', 'reservations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir acceso de lectura público a las evidencias de reservaciones
CREATE POLICY "Accesos públicos para evidencias" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reservations');

-- 3. Permitir a los usuarios autenticados subir evidencias (INSERT)
CREATE POLICY "Permitir subida de evidencias" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reservations' AND auth.role() = 'authenticated');
