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
    if (p.classificacaoHistologica && p.classificacaoHistologica.length > 0) {
      p.classificacaoHistologica.forEach((classe) => {
        classesContagem[classe] = (classesContagem[classe] || 0) + 1;
      });
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
export function formatarNumero(valor: number | undefined | null, casas: number = 2): string {
  if (valor === undefined || valor === null || isNaN(valor)) return '-';
  return valor.toFixed(casas);
}

// Formatar porcentagem
export function formatarPorcentagem(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) return '-';
  return `${valor.toFixed(1)}%`;
}

// ========== TESTES ESTATÍSTICOS PARA ASSOCIAÇÕES ==========

// Interface para resultado de teste estatístico
export interface ResultadoTeste {
  teste: string;
  estatistica: number;
  pValor: number;
  grausLiberdade?: number;
  significativo: boolean; // p < 0.05
  interpretacao: string;
}

// Interface para tabela de contingência
export interface TabelaContingencia {
  linhas: string[];
  colunas: string[];
  dados: number[][];
  totaisLinhas: number[];
  totaisColunas: number[];
  total: number;
}

// Cria tabela de contingência 2x2 ou NxM
export function criarTabelaContingencia(
  dados: Array<{ linha: string; coluna: string }>,
  rotulasLinhas?: string[],
  rotulasColunas?: string[]
): TabelaContingencia {
  // Identifica valores únicos
  const linhasUnicas = rotulasLinhas || [...new Set(dados.map(d => d.linha))].sort();
  const colunasUnicas = rotulasColunas || [...new Set(dados.map(d => d.coluna))].sort();

  // Cria matriz de contagem
  const matriz: number[][] = linhasUnicas.map(() =>
    colunasUnicas.map(() => 0)
  );

  // Preenche a matriz
  dados.forEach(({ linha, coluna }) => {
    const i = linhasUnicas.indexOf(linha);
    const j = colunasUnicas.indexOf(coluna);
    if (i >= 0 && j >= 0) {
      matriz[i][j]++;
    }
  });

  // Calcula totais
  const totaisLinhas = matriz.map(row => row.reduce((a, b) => a + b, 0));
  const totaisColunas = colunasUnicas.map((_, j) =>
    matriz.reduce((sum, row) => sum + row[j], 0)
  );
  const total = totaisLinhas.reduce((a, b) => a + b, 0);

  return {
    linhas: linhasUnicas,
    colunas: colunasUnicas,
    dados: matriz,
    totaisLinhas,
    totaisColunas,
    total
  };
}

// Função gamma para cálculo do p-valor do qui-quadrado
function gammaLn(x: number): number {
  const coef = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.001208650973866179, -0.000005395239384953
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    ser += coef[j] / ++y;
  }

  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// Função gamma incompleta regularizada (para p-valor do qui-quadrado)
function gammainc(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x === 0) return 0;

  const EPSILON = 1e-10;
  const MAX_ITERATIONS = 200;

  if (x < a + 1) {
    // Série
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < MAX_ITERATIONS; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < EPSILON) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gammaLn(a));
  } else {
    // Fração continuada
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;

    for (let i = 1; i < MAX_ITERATIONS; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPSILON) break;
    }

    return 1 - Math.exp(-x + a * Math.log(x) - gammaLn(a)) * h;
  }
}

// P-valor da distribuição qui-quadrado
function chiSquarePValue(chiSquare: number, df: number): number {
  if (chiSquare <= 0 || df <= 0) return 1;
  return 1 - gammainc(df / 2, chiSquare / 2);
}

// Teste Qui-quadrado de independência
export function testeQuiQuadrado(tabela: TabelaContingencia): ResultadoTeste {
  const { dados, totaisLinhas, totaisColunas, total } = tabela;

  if (total === 0) {
    return {
      teste: 'Qui-quadrado',
      estatistica: 0,
      pValor: 1,
      grausLiberdade: 0,
      significativo: false,
      interpretacao: 'Dados insuficientes para análise'
    };
  }

  let chiSquare = 0;
  const nLinhas = dados.length;
  const nColunas = dados[0]?.length || 0;

  // Calcula qui-quadrado
  for (let i = 0; i < nLinhas; i++) {
    for (let j = 0; j < nColunas; j++) {
      const observado = dados[i][j];
      const esperado = (totaisLinhas[i] * totaisColunas[j]) / total;
      if (esperado > 0) {
        chiSquare += Math.pow(observado - esperado, 2) / esperado;
      }
    }
  }

  const df = (nLinhas - 1) * (nColunas - 1);
  const pValor = chiSquarePValue(chiSquare, df);
  const significativo = pValor < 0.05;

  let interpretacao: string;
  if (pValor < 0.001) {
    interpretacao = 'Associação altamente significativa (p < 0.001)';
  } else if (pValor < 0.01) {
    interpretacao = 'Associação muito significativa (p < 0.01)';
  } else if (pValor < 0.05) {
    interpretacao = 'Associação significativa (p < 0.05)';
  } else if (pValor < 0.1) {
    interpretacao = 'Tendência à associação (p < 0.1)';
  } else {
    interpretacao = 'Sem associação significativa (p ≥ 0.05)';
  }

  return {
    teste: 'Qui-quadrado',
    estatistica: chiSquare,
    pValor,
    grausLiberdade: df,
    significativo,
    interpretacao
  };
}

// Teste t de Student para amostras independentes
export function testeTStudent(grupo1: number[], grupo2: number[]): ResultadoTeste {
  const n1 = grupo1.length;
  const n2 = grupo2.length;

  if (n1 < 2 || n2 < 2) {
    return {
      teste: 'Teste t',
      estatistica: 0,
      pValor: 1,
      grausLiberdade: 0,
      significativo: false,
      interpretacao: 'Dados insuficientes (mínimo 2 por grupo)'
    };
  }

  const media1 = mean(grupo1);
  const media2 = mean(grupo2);
  const var1 = grupo1.reduce((sum, x) => sum + Math.pow(x - media1, 2), 0) / (n1 - 1);
  const var2 = grupo2.reduce((sum, x) => sum + Math.pow(x - media2, 2), 0) / (n2 - 1);

  // Teste t com variâncias combinadas (pooled)
  const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
  const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));

  if (se === 0) {
    return {
      teste: 'Teste t',
      estatistica: 0,
      pValor: 1,
      grausLiberdade: n1 + n2 - 2,
      significativo: false,
      interpretacao: 'Variância zero - grupos idênticos'
    };
  }

  const t = (media1 - media2) / se;
  const df = n1 + n2 - 2;

  // Aproximação do p-valor usando a distribuição t
  const pValor = tDistributionPValue(Math.abs(t), df) * 2; // Bicaudal
  const significativo = pValor < 0.05;

  let interpretacao: string;
  if (pValor < 0.001) {
    interpretacao = `Diferença altamente significativa (p < 0.001). Média G1: ${media1.toFixed(2)}, G2: ${media2.toFixed(2)}`;
  } else if (pValor < 0.01) {
    interpretacao = `Diferença muito significativa (p < 0.01). Média G1: ${media1.toFixed(2)}, G2: ${media2.toFixed(2)}`;
  } else if (pValor < 0.05) {
    interpretacao = `Diferença significativa (p < 0.05). Média G1: ${media1.toFixed(2)}, G2: ${media2.toFixed(2)}`;
  } else {
    interpretacao = `Sem diferença significativa (p = ${pValor.toFixed(3)}). Média G1: ${media1.toFixed(2)}, G2: ${media2.toFixed(2)}`;
  }

  return {
    teste: 'Teste t',
    estatistica: t,
    pValor,
    grausLiberdade: df,
    significativo,
    interpretacao
  };
}

// Aproximação do p-valor da distribuição t
function tDistributionPValue(t: number, df: number): number {
  // Aproximação usando a distribuição beta incompleta
  const x = df / (df + t * t);
  return 0.5 * betaIncomplete(df / 2, 0.5, x);
}

// Função beta incompleta regularizada
function betaIncomplete(a: number, b: number, x: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  const EPSILON = 1e-10;
  const MAX_ITERATIONS = 200;

  // Usa a fração continuada
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITERATIONS; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < EPSILON) break;
  }

  const bt = Math.exp(
    gammaLn(a + b) - gammaLn(a) - gammaLn(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  );

  return bt * h / a;
}

// Interface para resultado de associação
export interface ResultadoAssociacao {
  variavel1: string;
  variavel2: string;
  tipo: 'categorica_categorica' | 'categorica_continua' | 'continua_continua';
  tabela?: TabelaContingencia;
  teste: ResultadoTeste;
  hipotese: string;
}

// Formatar p-valor
export function formatarPValor(pValor: number): string {
  if (pValor < 0.001) return '< 0.001';
  if (pValor < 0.01) return pValor.toFixed(3);
  return pValor.toFixed(2);
}
