-- Tabela de Pacientes para TCC Nefrite Lúpica
CREATE TABLE pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  data_internacao DATE NOT NULL,
  idade INTEGER NOT NULL,
  data_nascimento DATE,
  sexo TEXT NOT NULL CHECK (sexo IN ('F', 'M')),
  etnia TEXT,
  naturalidade TEXT,
  municipio_residencia TEXT,

  -- Perfil Clínico-Epidemiológico
  diagnostico_previo_les BOOLEAN DEFAULT false,
  ano_diagnostico_les INTEGER,
  manifestacoes_iniciais_les TEXT[] DEFAULT '{}',
  outras_manifestacoes TEXT,
  comorbidades TEXT[] DEFAULT '{}',
  outras_comorbidades TEXT,

  -- Dados Clínicos na Admissão
  pressao_arterial_sistolica INTEGER,
  pressao_arterial_diastolica INTEGER,
  presenca_edema BOOLEAN DEFAULT false,
  proteinuria DECIMAL,
  hematuria BOOLEAN DEFAULT false,
  creatinina_serica DECIMAL,
  tfg_estimada DECIMAL,
  fan TEXT,
  anti_ds_dna DECIMAL,
  c3 DECIMAL,
  c4 DECIMAL,

  -- Biópsia Renal
  data_biopsia_renal DATE,
  motivos_indicacao_biopsia TEXT[] DEFAULT '{}',
  outros_motivos_biopsia TEXT,
  classificacao_histologica TEXT,
  imunofluorescencia_positiva TEXT[] DEFAULT '{}',
  complicacoes_biopsia BOOLEAN DEFAULT false,
  quais_complicacoes_biopsia TEXT,

  -- Manejo Clínico
  medicamentos_antes_biopsia TEXT[] DEFAULT '{}',
  tipo_pulsoterapia TEXT,
  outros_medicamentos_antes TEXT,
  esquema_terapeutico_apos_biopsia TEXT,

  -- Evolução Clínica e Desfecho
  tempo_internacao INTEGER,
  necessidade_dialise BOOLEAN DEFAULT false,
  numero_sessoes_dialise INTEGER,
  melhora_funcao_renal BOOLEAN,
  desfecho_alta TEXT,

  -- Metadados
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX idx_pacientes_codigo ON pacientes(codigo);
CREATE INDEX idx_pacientes_sexo ON pacientes(sexo);
CREATE INDEX idx_pacientes_classificacao ON pacientes(classificacao_histologica);
CREATE INDEX idx_pacientes_desfecho ON pacientes(desfecho_alta);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE pacientes;

-- Row Level Security - permitir acesso público (sem autenticação)
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública" ON pacientes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública" ON pacientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública" ON pacientes
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública" ON pacientes
  FOR DELETE USING (true);
