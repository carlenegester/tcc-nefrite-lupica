import { supabase } from './supabase';
import type { Paciente } from '../../types';

// Tipo para os dados do banco (snake_case)
interface PacienteDB {
  id: string;
  codigo: string;
  data_internacao: string;
  idade: number;
  data_nascimento?: string;
  sexo: string;
  etnia?: string;
  naturalidade?: string;
  municipio_residencia?: string;
  diagnostico_previo_les: boolean;
  ano_diagnostico_les?: number;
  manifestacoes_iniciais_les: string[];
  outras_manifestacoes?: string;
  comorbidades: string[];
  outras_comorbidades?: string;
  pressao_arterial_sistolica?: number;
  pressao_arterial_diastolica?: number;
  presenca_edema: boolean;
  proteinuria?: number;
  hematuria: boolean;
  creatinina_serica?: number;
  tfg_estimada?: number;
  fan?: string;
  anti_ds_dna?: number;
  c3?: number;
  c4?: number;
  data_biopsia_renal?: string;
  motivos_indicacao_biopsia: string[];
  outros_motivos_biopsia?: string;
  classificacao_histologica?: string;
  imunofluorescencia_positiva: string[];
  complicacoes_biopsia: boolean;
  quais_complicacoes_biopsia?: string;
  medicamentos_antes_biopsia: string[];
  tipo_pulsoterapia?: string;
  outros_medicamentos_antes?: string;
  esquema_terapeutico_apos_biopsia?: string;
  tempo_internacao?: number;
  necessidade_dialise: boolean;
  numero_sessoes_dialise?: number;
  melhora_funcao_renal?: boolean;
  desfecho_alta?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

// Converter de camelCase (app) para snake_case (banco)
function toSnakeCase(paciente: Omit<Paciente, 'id' | 'criadoEm' | 'atualizadoEm'>): Omit<PacienteDB, 'id' | 'criado_em' | 'atualizado_em'> {
  return {
    codigo: paciente.codigo,
    data_internacao: paciente.dataInternacao,
    idade: paciente.idade,
    data_nascimento: paciente.dataNascimento,
    sexo: paciente.sexo === 'feminino' ? 'F' : 'M',
    etnia: paciente.etnia,
    naturalidade: paciente.naturalidade,
    municipio_residencia: paciente.municipioResidencia,
    diagnostico_previo_les: paciente.diagnosticoPrevioLES,
    ano_diagnostico_les: paciente.anoDiagnosticoLES,
    manifestacoes_iniciais_les: paciente.manifestacoesIniciaisLES || [],
    outras_manifestacoes: paciente.outrasManifestacoes,
    comorbidades: paciente.comorbidades || [],
    outras_comorbidades: paciente.outrasComorbidades,
    pressao_arterial_sistolica: paciente.pressaoArterialSistolica,
    pressao_arterial_diastolica: paciente.pressaoArterialDiastolica,
    presenca_edema: paciente.presencaEdema,
    proteinuria: paciente.proteinuria,
    hematuria: paciente.hematuria,
    creatinina_serica: paciente.creatininaSerica,
    tfg_estimada: paciente.tfgEstimada,
    fan: paciente.fan,
    anti_ds_dna: paciente.antiDsDNA,
    c3: paciente.c3,
    c4: paciente.c4,
    data_biopsia_renal: paciente.dataBiopsiaRenal,
    motivos_indicacao_biopsia: paciente.motivosIndicacaoBiopsia || [],
    outros_motivos_biopsia: paciente.outrosMotivosBiopsia,
    classificacao_histologica: paciente.classificacaoHistologica,
    imunofluorescencia_positiva: paciente.imunofluorescenciaPositiva || [],
    complicacoes_biopsia: paciente.complicacoesBiopsia,
    quais_complicacoes_biopsia: paciente.quaisComplicacoesBiopsia,
    medicamentos_antes_biopsia: paciente.medicamentosAntesBiopsia || [],
    tipo_pulsoterapia: paciente.tipoPulsoterapia,
    outros_medicamentos_antes: paciente.outrosMedicamentosAntes,
    esquema_terapeutico_apos_biopsia: paciente.esquemaTerapeuticoAposBiopsia,
    tempo_internacao: paciente.tempoInternacao,
    necessidade_dialise: paciente.necessidadeDialise,
    numero_sessoes_dialise: undefined,
    melhora_funcao_renal: paciente.melhoraClinica === 'sim' ? true : paciente.melhoraClinica === 'nao' ? false : undefined,
    desfecho_alta: paciente.desfechoAlta,
    observacoes: paciente.observacoes,
  };
}

// Converter de snake_case (banco) para camelCase (app)
function toCamelCase(row: PacienteDB): Paciente {
  return {
    id: row.id,
    codigo: row.codigo,
    dataInternacao: row.data_internacao,
    idade: row.idade,
    dataNascimento: row.data_nascimento,
    sexo: row.sexo === 'F' ? 'feminino' : 'masculino',
    etnia: row.etnia || '',
    naturalidade: row.naturalidade || '',
    municipioResidencia: row.municipio_residencia || '',
    diagnosticoPrevioLES: row.diagnostico_previo_les,
    anoDiagnosticoLES: row.ano_diagnostico_les,
    manifestacoesIniciaisLES: row.manifestacoes_iniciais_les as Paciente['manifestacoesIniciaisLES'],
    outrasManifestacoes: row.outras_manifestacoes,
    comorbidades: row.comorbidades as Paciente['comorbidades'],
    outrasComorbidades: row.outras_comorbidades,
    pressaoArterialSistolica: row.pressao_arterial_sistolica,
    pressaoArterialDiastolica: row.pressao_arterial_diastolica,
    presencaEdema: row.presenca_edema,
    proteinuria: row.proteinuria,
    hematuria: row.hematuria,
    creatininaSerica: row.creatinina_serica,
    tfgEstimada: row.tfg_estimada,
    fan: row.fan,
    antiDsDNA: row.anti_ds_dna,
    c3: row.c3,
    c4: row.c4,
    dataBiopsiaRenal: row.data_biopsia_renal,
    motivosIndicacaoBiopsia: row.motivos_indicacao_biopsia as Paciente['motivosIndicacaoBiopsia'],
    outrosMotivosBiopsia: row.outros_motivos_biopsia,
    classificacaoHistologica: row.classificacao_histologica as Paciente['classificacaoHistologica'],
    imunofluorescenciaPositiva: row.imunofluorescencia_positiva as Paciente['imunofluorescenciaPositiva'],
    complicacoesBiopsia: row.complicacoes_biopsia,
    quaisComplicacoesBiopsia: row.quais_complicacoes_biopsia,
    medicamentosAntesBiopsia: row.medicamentos_antes_biopsia as Paciente['medicamentosAntesBiopsia'],
    tipoPulsoterapia: row.tipo_pulsoterapia as Paciente['tipoPulsoterapia'],
    outrosMedicamentosAntes: row.outros_medicamentos_antes,
    esquemaTerapeuticoAposBiopsia: row.esquema_terapeutico_apos_biopsia,
    tempoInternacao: row.tempo_internacao,
    necessidadeDialise: row.necessidade_dialise,
    melhoraClinica: row.melhora_funcao_renal === true ? 'sim' : row.melhora_funcao_renal === false ? 'nao' : undefined,
    desfechoAlta: row.desfecho_alta as Paciente['desfechoAlta'],
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    observacoes: row.observacoes,
  };
}

// Funções auxiliares para manipular pacientes

export async function adicionarPaciente(paciente: Omit<Paciente, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  const dados = toSnakeCase(paciente);
  const { data, error } = await supabase
    .from('pacientes')
    .insert(dados)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function atualizarPaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
  const dadosAtuais = await buscarPaciente(id);
  if (!dadosAtuais) throw new Error('Paciente não encontrado');

  const dadosCompletos = { ...dadosAtuais, ...paciente };
  const dados = toSnakeCase(dadosCompletos);

  const { error } = await supabase
    .from('pacientes')
    .update(dados)
    .eq('id', id);

  if (error) throw error;
}

export async function excluirPaciente(id: string): Promise<void> {
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function buscarPaciente(id: string): Promise<Paciente | undefined> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw error;
  }

  return toCamelCase(data as PacienteDB);
}

export async function listarPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('codigo');

  if (error) throw error;
  return (data as PacienteDB[]).map(toCamelCase);
}

export async function buscarPacientePorCodigo(codigo: string): Promise<Paciente | undefined> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('codigo', codigo)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw error;
  }

  return toCamelCase(data as PacienteDB);
}

export async function contarPacientes(): Promise<number> {
  const { count, error } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export async function proximoCodigo(): Promise<string> {
  const count = await contarPacientes();
  return String(count + 1).padStart(2, '0');
}

// Funções de backup
export async function exportarDados(): Promise<string> {
  const pacientes = await listarPacientes();
  const dados = {
    versao: '1.0',
    exportadoEm: new Date().toISOString(),
    pacientes,
  };
  return JSON.stringify(dados, null, 2);
}

export async function importarDados(json: string): Promise<number> {
  const dados = JSON.parse(json);
  if (!dados.pacientes || !Array.isArray(dados.pacientes)) {
    throw new Error('Formato de arquivo inválido');
  }

  // Limpa dados existentes
  await limparTodosDados();

  // Importa novos dados
  for (const paciente of dados.pacientes) {
    const { id, criadoEm, atualizadoEm, ...resto } = paciente;
    await adicionarPaciente(resto);
  }

  return dados.pacientes.length;
}

export async function limparTodosDados(): Promise<void> {
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
}
