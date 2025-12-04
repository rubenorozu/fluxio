#!/bin/bash

# Script para ejecutar migraciones de Prisma en Supabase
# Ejecutar con: bash migrate-to-supabase.sh

echo "🚀 Ejecutando migraciones de Prisma en Supabase..."
echo ""

# URL de conexión directa a Supabase (sin pooling para migraciones)
export DATABASE_URL="postgresql://postgres.cehakvluqpojzooisbhs:L@mambanegra1@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Ejecutar migraciones
npx prisma migrate deploy

echo ""
echo "✅ Migraciones completadas!"
echo ""
echo "Ahora puedes ejecutar el script SQL para crear el superusuario en Supabase SQL Editor"
