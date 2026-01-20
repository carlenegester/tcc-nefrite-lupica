-- Migração: Converter classificacao_histologica de TEXT para TEXT[]
-- Permite que pacientes tenham múltiplas classes histológicas simultaneamente

-- Remover o índice existente (não pode usar índice simples em array)
DROP INDEX IF EXISTS idx_pacientes_classificacao;

-- Converter a coluna de TEXT para TEXT[]
ALTER TABLE pacientes
ALTER COLUMN classificacao_histologica TYPE TEXT[]
USING CASE
  WHEN classificacao_histologica IS NULL THEN '{}'::text[]
  ELSE ARRAY[classificacao_histologica]
END;

-- Definir valor padrão para novos registros
ALTER TABLE pacientes
ALTER COLUMN classificacao_histologica SET DEFAULT '{}';

-- Criar índice GIN para buscas em arrays
CREATE INDEX idx_pacientes_classificacao_gin ON pacientes USING GIN (classificacao_histologica);
