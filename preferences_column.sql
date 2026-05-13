-- SIPO — Agregar columna preferences a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "accentColor": "#E8571A",
  "density": "normal",
  "showCompanyName": true,
  "defaultCity": "Bogotá"
}'::jsonb;
