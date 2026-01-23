-- Alterar coluna anti_ds_dna de DECIMAL para TEXT
-- Permite armazenar valores categóricos: 'reagente' ou 'nao_reagente'
ALTER TABLE pacientes
ALTER COLUMN anti_ds_dna TYPE TEXT;
