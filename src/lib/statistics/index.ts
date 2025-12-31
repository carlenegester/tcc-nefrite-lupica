import {
  mean,
  median,
  standardDeviation,
  min,
  max,
  quantile,
} from 'simple-statistics';
import type {
  Paciente,
  EstatisticasDescritivas,
  DistribuicaoFrequencia,
  ComparacaoGrupo,
} from '../../types';

// Calcula estatísticas descritivas para um array de números
export function calcularEstatisticasDescritivas(valores: number[]): EstatisticasDescritivas | null {
  if (valores.length === 0) return null;

  const sorted = [...valores].sort((a, b) => a - b);

  return {
    n: valores.length,
    media: mean(valores),
    mediana: median(sorted),
    desvioPadrao: valores.length > 1 ? standardDeviation(valores) : 0,
    minimo: min(valores),
    maximo: max(valores),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
  };
}

// Calcula distribuição de frequência para valores categóricos
export function calcularDistribuicaoFrequencia<T extends string>(
  valores: T[],
  opcoes: readonly { value: T; label: string }[]
): DistribuicaoFrequencia[] {
  const total = valores.length;
  if (total === 0) return [];

  const contagem: Record<string, number> = {};

  // Inicializa contagem com zero para todas as opções
  opcoes.forEach((opt) => {
    contagem[opt.value] = 0;
  });

  // Conta ocorrências
  valores.forEach((valor) => {
    if (contagem[valor] !== undefined) {
      contagem[valor]++;
    }
  });

  // Converte para array de distribuição
  return opcoes.map((opt) => ({
    valor: opt.value,
    rotulo: opt.label,
    frequenciaAbsoluta: contagem[opt.value] || 0,
    frequenciaRelativa: (contagem[opt.value] || 0) / total,
    porcentagem: ((contagem[opt.value] || 0) / total) * 100,
  }));
}

// Calcula distribuição de frequência para arrays (múltipla escolha)
export function calcularDistribuicaoMultipla<T extends string>(
  arrays: T[][],
  opcoes: readonly { value: T; label: string }[]
): DistribuicaoFrequencia[] {
  const totalPacientes = arrays.length;
  if (totalPacientes === 0) return [];

  const contagem: Record<string, number> = {};

  // Inicializa contagem
  opcoes.forEach((opt) => {
    contagem[opt.value] = 0;
  });

  // Conta ocorrências (cada paciente conta uma vez por opção)
  arrays.forEach((arr) => {
    arr.forEach((valor) => {
      if (contagem[valor] !== undefined) {
        contagem[valor]++;
      }
    });
  });

  return opcoes.map((opt) => ({
    valor: opt.value,
    rotulo: opt.label,
    frequenciaAbsoluta: contagem[opt.value] || 0,
    frequenciaRelativa: (contagem[opt.value] || 0) / totalPacientes,
    porcentagem: ((contagem[opt.value] || 0) / totalPacientes) * 100,
  }));
}

// Agrupa pacientes por um campo categórico
export function agruparPacientes<K extends keyof Paciente>(
  pacientes: Paciente[],
  campo: K
): Map<string, Paciente[]> {
  const grupos = new Map<string, Paciente[]>();

  pacientes.forEach((paciente) => {
    const valor = String(paciente[campo] ?? 'Não informado');
    if (!grupos.has(valor)) {
      grupos.set(valor, []);
    }
    grupos.get(valor)!.push(paciente);
  });

  return grupos;
}

// Compara estatísticas entre grupos
export function compararGruposNumericos(
  pacientes: Paciente[],
  campoAgrupamento: keyof Paciente,
  campoNumerico: keyof Paciente,
  rotulosGrupos: Record<string, string>
): ComparacaoGrupo[] {
  const grupos = agruparPacientes(pacientes, campoAgrupamento);
  const resultado: ComparacaoGrupo[] = [];

  grupos.forEach((pacientesGrupo, grupo) => {
    const valores = pacientesGrupo
      .map((p) => p[campoNumerico])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    resultado.push({
      grupo,
      rotulo: rotulosGrupos[grupo] || grupo,
      n: pacientesGrupo.length,
      estatisticas: calcularEstatisticasDescritivas(valores) || undefined,
    });
  });

  return resultado;
}

// Estatísticas gerais da amostra
export function calcularEstatisticasGerais(pacientes: Paciente[]) {
  const total = pacientes.length;

  // Idade
  const idades = pacientes.map((p) => p.idade).filter((i) => i > 0);
  const estatisticasIdade = calcularEstatisticasDescritivas(idades);

  // Sexo
  const feminino = pacientes.filter((p) => p.sexo === 'feminino').length;
  const masculino = pacientes.filter((p) => p.sexo === 'masculino').length;

  // Classes histológicas
  const classesContagem: Record<string, number> = {};
  pacientes.forEach((p) => {
    if (p.classificacaoHistologica) {
      classesContagem[p.classificacaoHistologica] =
        (classesContagem[p.classificacaoHistologica] || 0) + 1;
    }
  });

  // Desfechos
  const desfechosContagem: Record<string, number> = {};
  pacientes.forEach((p) => {
    if (p.desfechoAlta) {
      desfechosContagem[p.desfechoAlta] =
        (desfechosContagem[p.desfechoAlta] || 0) + 1;
    }
  });

  // Diálise
  const necessitaramDialise = pacientes.filter((p) => p.necessidadeDialise).length;

  // Tempo de internação
  const temposInternacao = pacientes
    .map((p) => p.tempoInternacao)
    .filter((t): t is number => typeof t === 'number' && t > 0);
  const estatisticasInternacao = calcularEstatisticasDescritivas(temposInternacao);

  // Creatinina
  const creatininas = pacientes
    .map((p) => p.creatininaSerica)
    .filter((c): c is number => typeof c === 'number' && c > 0);
  const estatisticasCreatinina = calcularEstatisticasDescritivas(creatininas);

  // TFG
  const tfgs = pacientes
    .map((p) => p.tfgEstimada)
    .filter((t): t is number => typeof t === 'number' && t > 0);
  const estatisticasTFG = calcularEstatisticasDescritivas(tfgs);

  return {
    total,
    sexo: {
      feminino,
      masculino,
      porcentagemFeminino: total > 0 ? (feminino / total) * 100 : 0,
      porcentagemMasculino: total > 0 ? (masculino / total) * 100 : 0,
    },
    idade: estatisticasIdade,
    classesHistologicas: classesContagem,
    desfechos: desfechosContagem,
    dialise: {
      necessitaram: necessitaramDialise,
      porcentagem: total > 0 ? (necessitaramDialise / total) * 100 : 0,
    },
    tempoInternacao: estatisticasInternacao,
    creatinina: estatisticasCreatinina,
    tfg: estatisticasTFG,
  };
}

// Formatar número com casas decimais
export function formatarNumero(valor: number | undefined, casas: number = 2): string {
  if (valor === undefined || isNaN(valor)) return '-';
  return valor.toFixed(casas);
}

// Formatar porcentagem
export function formatarPorcentagem(valor: number | undefined): string {
  if (valor === undefined || isNaN(valor)) return '-';
  return `${valor.toFixed(1)}%`;
}
