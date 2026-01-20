// Tipos baseados no Formulário de Coleta de Dados - Nefrite Lúpica (Apêndice E do TCC)

// Sexo do paciente
export type Sexo = 'feminino' | 'masculino';

// Manifestações iniciais do LES
export type ManifestacaoInicialLES =
  | 'artralgia_artrite'
  | 'lesoes_cutaneas'
  | 'febre'
  | 'serosites'
  | 'psicose'
  | 'alteracoes_hematologicas'
  | 'acometimento_renal'
  | 'outros';

// Comorbidades
export type Comorbidade =
  | 'has'
  | 'dm'
  | 'infeccoes_repeticao'
  | 'tuberculose'
  | 'outras';

// Motivo da indicação da biópsia
export type MotivoIndicacaoBiopsia =
  | 'proteinuria_maior_1g'
  | 'hematuria_dismorfismo'
  | 'reducao_tfg'
  | 'dislipidemia'
  | 'outros';

// Classificação histológica ISN/RPS 2018
export type ClasseHistologica =
  | 'classe_i'
  | 'classe_ii'
  | 'classe_iii'
  | 'classe_iv'
  | 'classe_v'
  | 'classe_vi'
  | 'inconclusivo';

// Imunofluorescência
export type Imunofluorescencia = 'igg' | 'iga' | 'igm' | 'c3' | 'c1q';

// Medicamentos
export type Medicamento =
  | 'corticoide'
  | 'micofenolato'
  | 'ciclofosfamida'
  | 'hidroxicloroquina'
  | 'pulsoterapia'
  | 'outros';

// Tipo de pulsoterapia
export type TipoPulsoterapia = 'dexametasona' | 'metilprednisolona';

// Desfecho da alta
export type DesfechoAlta = 'alta' | 'obito' | 'transferencia';

// Melhora clínica
export type MelhoraClinica = 'sim' | 'parcial' | 'nao';

// Interface principal do Paciente
export interface Paciente {
  id: string;
  codigo: string; // Código do paciente (01, 02, etc.)

  // Identificação
  dataInternacao: string; // formato ISO
  idade: number;
  dataNascimento?: string;
  sexo: Sexo;
  etnia: string;
  naturalidade: string;
  municipioResidencia: string;

  // 1. Perfil Clínico-Epidemiológico
  diagnosticoPrevioLES: boolean;
  anoDiagnosticoLES?: number;
  manifestacoesIniciaisLES: ManifestacaoInicialLES[];
  outrasManifestacoes?: string;
  comorbidades: Comorbidade[];
  outrasComorbidades?: string;

  // 2. Dados Clínicos na Admissão Hospitalar
  pressaoArterialSistolica?: number;
  pressaoArterialDiastolica?: number;
  presencaEdema: boolean;
  proteinuria?: number; // g/24h
  hematuria: boolean;
  creatininaSerica?: number; // mg/dL
  tfgEstimada?: number; // mL/min (CKD-EPI)

  // Exames laboratoriais
  fan?: string;
  antiDsDNA?: 'reagente' | 'nao_reagente';
  c3?: number;
  c4?: number;

  // 3. Biópsia Renal
  dataBiopsiaRenal?: string;
  motivosIndicacaoBiopsia: MotivoIndicacaoBiopsia[];
  outrosMotivosBiopsia?: string;
  classificacaoHistologica: ClasseHistologica[];
  imunofluorescenciaPositiva: Imunofluorescencia[];
  complicacoesBiopsia: boolean;
  quaisComplicacoesBiopsia?: string;

  // 4. Manejo Clínico
  medicamentosAntesBiopsia: Medicamento[];
  tipoPulsoterapia?: TipoPulsoterapia;
  outrosMedicamentosAntes?: string;
  esquemaTerapeuticoAposBiopsia?: string;

  // 5. Evolução Clínica e Desfecho
  tempoInternacao?: number; // dias
  necessidadeDialise: boolean;
  melhoraClinica?: MelhoraClinica;
  desfechoAlta?: DesfechoAlta;

  // Metadados
  criadoEm: string;
  atualizadoEm: string;
  observacoes?: string;
}

// Interface para criação de novo paciente (sem id e metadados)
export type NovoPaciente = Omit<Paciente, 'id' | 'criadoEm' | 'atualizadoEm'>;

// Interface para estatísticas descritivas
export interface EstatisticasDescritivas {
  n: number;
  media: number;
  mediana: number;
  desvioPadrao: number;
  minimo: number;
  maximo: number;
  q1: number;
  q3: number;
}

// Interface para distribuição de frequência
export interface DistribuicaoFrequencia {
  valor: string;
  rotulo: string;
  frequenciaAbsoluta: number;
  frequenciaRelativa: number;
  porcentagem: number;
}

// Interface para comparação entre grupos
export interface ComparacaoGrupo {
  grupo: string;
  rotulo: string;
  n: number;
  estatisticas?: EstatisticasDescritivas;
  distribuicao?: DistribuicaoFrequencia[];
}

// Opções para os selects do formulário
export const OPCOES_SEXO = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
] as const;

export const OPCOES_MANIFESTACOES_LES = [
  { value: 'artralgia_artrite', label: 'Artralgia/Artrite' },
  { value: 'lesoes_cutaneas', label: 'Lesões cutâneas' },
  { value: 'febre', label: 'Febre' },
  { value: 'serosites', label: 'Serosites' },
  { value: 'psicose', label: 'Psicose' },
  { value: 'alteracoes_hematologicas', label: 'Alterações hematológicas' },
  { value: 'acometimento_renal', label: 'Acometimento renal' },
  { value: 'outros', label: 'Outros' },
] as const;

export const OPCOES_COMORBIDADES = [
  { value: 'has', label: 'HAS' },
  { value: 'dm', label: 'DM' },
  { value: 'infeccoes_repeticao', label: 'Infecções de repetição' },
  { value: 'tuberculose', label: 'Tuberculose' },
  { value: 'outras', label: 'Outras' },
] as const;

export const OPCOES_MOTIVO_BIOPSIA = [
  { value: 'proteinuria_maior_1g', label: 'Proteinúria >1g/dia' },
  { value: 'hematuria_dismorfismo', label: 'Hematúria com dismorfismo' },
  { value: 'reducao_tfg', label: 'Redução da TFG' },
  { value: 'dislipidemia', label: 'Dislipidemia' },
  { value: 'outros', label: 'Outros' },
] as const;

export const OPCOES_CLASSE_HISTOLOGICA = [
  { value: 'classe_i', label: 'Classe I - Mesangial mínima' },
  { value: 'classe_ii', label: 'Classe II - Mesangial proliferativa' },
  { value: 'classe_iii', label: 'Classe III - Focal' },
  { value: 'classe_iv', label: 'Classe IV - Difusa' },
  { value: 'classe_v', label: 'Classe V - Membranosa' },
  { value: 'classe_vi', label: 'Classe VI - Esclerose avançada' },
  { value: 'inconclusivo', label: 'Inconclusivo' },
] as const;

export const OPCOES_IMUNOFLUORESCENCIA = [
  { value: 'igg', label: 'IgG' },
  { value: 'iga', label: 'IgA' },
  { value: 'igm', label: 'IgM' },
  { value: 'c3', label: 'C3' },
  { value: 'c1q', label: 'C1q' },
] as const;

export const OPCOES_MEDICAMENTOS = [
  { value: 'corticoide', label: 'Corticoide' },
  { value: 'micofenolato', label: 'Micofenolato' },
  { value: 'ciclofosfamida', label: 'Ciclofosfamida' },
  { value: 'hidroxicloroquina', label: 'Hidroxicloroquina' },
  { value: 'pulsoterapia', label: 'Pulsoterapia' },
  { value: 'outros', label: 'Outros' },
] as const;

export const OPCOES_TIPO_PULSOTERAPIA = [
  { value: 'dexametasona', label: 'Dexametasona' },
  { value: 'metilprednisolona', label: 'Metilprednisolona' },
] as const;

export const OPCOES_MELHORA_CLINICA = [
  { value: 'sim', label: 'Sim' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'nao', label: 'Não' },
] as const;

export const OPCOES_DESFECHO = [
  { value: 'alta', label: 'Alta hospitalar' },
  { value: 'obito', label: 'Óbito' },
  { value: 'transferencia', label: 'Transferência' },
] as const;

// Faixas etárias para agrupamento
export const FAIXAS_ETARIAS = [
  { min: 0, max: 17, label: '0-17 anos' },
  { min: 18, max: 29, label: '18-29 anos' },
  { min: 30, max: 39, label: '30-39 anos' },
  { min: 40, max: 49, label: '40-49 anos' },
  { min: 50, max: 59, label: '50-59 anos' },
  { min: 60, max: 150, label: '60+ anos' },
] as const;

export function getFaixaEtaria(idade: number): string {
  const faixa = FAIXAS_ETARIAS.find(f => idade >= f.min && idade <= f.max);
  return faixa?.label || 'Não informado';
}
