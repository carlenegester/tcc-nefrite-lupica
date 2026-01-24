import { useMemo, useState } from 'react';
import { usePacientes } from '../hooks/usePacientes';
import { Card } from '../components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from 'recharts';
import {
  calcularEstatisticasDescritivas,
  formatarNumero,
  formatarPorcentagem,
  calcularDistribuicaoFrequencia,
  calcularDistribuicaoMultipla,
  criarTabelaContingencia,
  testeQuiQuadrado,
  testeTStudent,
  formatarPValor,
  type ResultadoTeste,
  type TabelaContingencia,
} from '../lib/statistics';
import {
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_DESFECHO,
  OPCOES_IMUNOFLUORESCENCIA,
  type ClasseHistologica,
  type DesfechoAlta,
} from '../types';
import {
  Calculator,
  BarChart3,
  PieChartIcon,
  TrendingUp,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  GitBranch,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const CLASSES_COLORS: Record<string, string> = {
  'classe_i': '#2ECC71',
  'classe_ii': '#3498DB',
  'classe_iii': '#F39C12',
  'classe_iv': '#E74C3C',
  'classe_v': '#9B59B6',
  'classe_vi': '#34495E',
  'em_fase_remissao': '#95A5A6',
  'inconclusivo': '#BDC3C7',
};

// Descrições das classes histológicas
const CLASSES_DESCRICAO: Record<string, string> = {
  'classe_i': 'Mesangial mínima',
  'classe_ii': 'Mesangial proliferativa',
  'classe_iii': 'Proliferativa focal',
  'classe_iv': 'Proliferativa difusa',
  'classe_v': 'Membranosa',
  'classe_vi': 'Esclerose avançada',
  'em_fase_remissao': 'Em fase de remissão',
  'inconclusivo': 'Inconclusivo',
};

// Valor padrão para estatísticas vazias
const STATS_VAZIO = {
  n: 0,
  media: 0,
  mediana: 0,
  desvioPadrao: 0,
  minimo: 0,
  maximo: 0,
  q1: 0,
  q3: 0,
};

// Função auxiliar para filtrar valores numéricos válidos
function filtrarNumerosValidos(valores: (number | undefined | null)[]): number[] {
  return valores.filter((v): v is number =>
    v !== undefined && v !== null && typeof v === 'number' && !isNaN(v) && isFinite(v)
  );
}

export function AnalisesEstatisticasPage() {
  const { pacientes } = usePacientes();
  const [secaoAberta, setSecaoAberta] = useState<string>('descritiva');

  // Estatísticas descritivas das variáveis contínuas
  const estatisticasDescritivas = useMemo(() => {
    if (pacientes.length === 0) return null;

    const idade = filtrarNumerosValidos(pacientes.map((p) => p.idade)).filter(v => v > 0);
    const proteinuria = filtrarNumerosValidos(pacientes.map((p) => p.proteinuria));
    const creatinina = filtrarNumerosValidos(pacientes.map((p) => p.creatininaSerica));
    const tfg = filtrarNumerosValidos(pacientes.map((p) => p.tfgEstimada));
    const c3 = filtrarNumerosValidos(pacientes.map((p) => p.c3));
    const c4 = filtrarNumerosValidos(pacientes.map((p) => p.c4));
    const tempoInternacao = filtrarNumerosValidos(pacientes.map((p) => p.tempoInternacao));
    const pasSistolica = filtrarNumerosValidos(pacientes.map((p) => p.pressaoArterialSistolica));
    const pasDiastolica = filtrarNumerosValidos(pacientes.map((p) => p.pressaoArterialDiastolica));

    return {
      idade: calcularEstatisticasDescritivas(idade) ?? STATS_VAZIO,
      proteinuria: calcularEstatisticasDescritivas(proteinuria) ?? STATS_VAZIO,
      creatinina: calcularEstatisticasDescritivas(creatinina) ?? STATS_VAZIO,
      tfg: calcularEstatisticasDescritivas(tfg) ?? STATS_VAZIO,
      c3: calcularEstatisticasDescritivas(c3) ?? STATS_VAZIO,
      c4: calcularEstatisticasDescritivas(c4) ?? STATS_VAZIO,
      tempoInternacao: calcularEstatisticasDescritivas(tempoInternacao) ?? STATS_VAZIO,
      pasSistolica: calcularEstatisticasDescritivas(pasSistolica) ?? STATS_VAZIO,
      pasDiastolica: calcularEstatisticasDescritivas(pasDiastolica) ?? STATS_VAZIO,
    };
  }, [pacientes]);

  // Distribuição por sexo
  const distribuicaoSexo = useMemo(() => {
    const feminino = pacientes.filter((p) => p.sexo === 'feminino').length;
    const masculino = pacientes.filter((p) => p.sexo === 'masculino').length;
    const total = pacientes.length || 1;
    return [
      { name: 'Feminino', value: feminino, percentual: (feminino / total * 100) },
      { name: 'Masculino', value: masculino, percentual: (masculino / total * 100) },
    ];
  }, [pacientes]);

  // Distribuição por etnia
  const distribuicaoEtnia = useMemo(() => {
    const contagem: Record<string, number> = {};
    pacientes.forEach((p) => {
      if (p.etnia) {
        contagem[p.etnia] = (contagem[p.etnia] || 0) + 1;
      }
    });
    const total = pacientes.length || 1;
    return Object.entries(contagem)
      .map(([etnia, count]) => ({
        name: etnia.charAt(0).toUpperCase() + etnia.slice(1),
        value: count,
        percentual: (count / total * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [pacientes]);

  // Distribuição por classe histológica
  const distribuicaoClasses = useMemo(() => {
    const arrays = pacientes.map((p) => p.classificacaoHistologica || []);
    const dist = calcularDistribuicaoMultipla(arrays, OPCOES_CLASSE_HISTOLOGICA);
    return dist.map((item) => ({
      categoria: item.valor,
      quantidade: item.frequenciaAbsoluta,
      percentual: item.porcentagem,
      descricao: CLASSES_DESCRICAO[item.valor] || item.rotulo,
      color: CLASSES_COLORS[item.valor] || '#999',
    }));
  }, [pacientes]);

  // Distribuição de imunofluorescência
  const distribuicaoImuno = useMemo(() => {
    const marcadores = ['igg', 'iga', 'igm', 'c3', 'c1q'] as const;
    return marcadores.map((marcador) => {
      const positivos = pacientes.filter((p) => {
        return p.imunofluorescenciaPositiva?.includes(marcador);
      }).length;
      return {
        marcador: marcador.toUpperCase(),
        positivos,
        negativos: pacientes.length - positivos,
        percentual: pacientes.length > 0 ? (positivos / pacientes.length * 100) : 0,
      };
    });
  }, [pacientes]);

  // Correlação TFG vs Classe Histológica
  const tfgPorClasse = useMemo(() => {
    const dadosPorClasse: Record<string, number[]> = {};
    pacientes.forEach((p) => {
      const tfgValido = p.tfgEstimada !== undefined && p.tfgEstimada !== null &&
                        typeof p.tfgEstimada === 'number' && !isNaN(p.tfgEstimada) && isFinite(p.tfgEstimada);
      if (tfgValido && p.classificacaoHistologica) {
        p.classificacaoHistologica.forEach((classe) => {
          if (!dadosPorClasse[classe]) dadosPorClasse[classe] = [];
          dadosPorClasse[classe].push(p.tfgEstimada!);
        });
      }
    });

    return Object.entries(dadosPorClasse)
      .map(([classe, valores]) => {
        const stats = calcularEstatisticasDescritivas(valores) ?? STATS_VAZIO;
        return {
          classe,
          descricao: CLASSES_DESCRICAO[classe] || classe,
          media: stats.media,
          mediana: stats.mediana,
          dp: stats.desvioPadrao,
          min: stats.minimo,
          max: stats.maximo,
          n: valores.length,
        };
      })
      .filter((item) => item.n > 0)
      .sort((a, b) => {
        const ordem = ['classe_i', 'classe_ii', 'classe_iii', 'classe_iv', 'classe_v', 'classe_vi', 'em_fase_remissao', 'inconclusivo'];
        return ordem.indexOf(a.classe) - ordem.indexOf(b.classe);
      });
  }, [pacientes]);

  // Desfechos clínicos
  const distribuicaoDesfechos = useMemo(() => {
    const valores = pacientes
      .map((p) => p.desfechoAlta)
      .filter((d): d is DesfechoAlta => !!d);
    return calcularDistribuicaoFrequencia(valores, OPCOES_DESFECHO);
  }, [pacientes]);

  // Necessidade de diálise
  const distribuicaoDialise = useMemo(() => {
    const necessitou = pacientes.filter((p) => p.necessidadeDialise === true).length;
    const naoNecessitou = pacientes.filter((p) => p.necessidadeDialise === false).length;
    const total = pacientes.length || 1; // Evita divisão por zero
    return [
      { name: 'Sim', value: necessitou, percentual: (necessitou / total * 100) },
      { name: 'Não', value: naoNecessitou, percentual: (naoNecessitou / total * 100) },
    ];
  }, [pacientes]);

  // Melhora clínica
  const distribuicaoMelhora = useMemo(() => {
    const contagem: Record<string, number> = {};
    pacientes.forEach((p) => {
      if (p.melhoraClinica) {
        contagem[p.melhoraClinica] = (contagem[p.melhoraClinica] || 0) + 1;
      }
    });
    const total = pacientes.length || 1;
    return Object.entries(contagem).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentual: (count / total * 100),
    }));
  }, [pacientes]);

  // ========== ANÁLISES DE ASSOCIAÇÃO ==========

  // Função auxiliar para mapear classe para categoria simplificada
  const getClasseSimplificada = (classes: string[]): string => {
    if (!classes || classes.length === 0) return 'Não informado';
    // Prioriza classes mais graves
    if (classes.includes('classe_iv')) return 'Classe IV (Difusa)';
    if (classes.includes('classe_iii')) return 'Classe III (Focal)';
    if (classes.includes('classe_v')) return 'Classe V (Membranosa)';
    if (classes.includes('classe_vi')) return 'Classe VI (Esclerose)';
    if (classes.includes('classe_ii')) return 'Classe II';
    if (classes.includes('classe_i')) return 'Classe I';
    return 'Outras';
  };

  // 1. Associação: Classe Histológica vs Necessidade de Diálise
  const associacaoClasseDialise = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.necessidadeDialise ? 'Sim' : 'Não'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Necessidade de Diálise',
      hipotese: 'H0: A classe histológica é independente da necessidade de diálise',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre a classe histológica e a necessidade de diálise, sugerindo que classes mais graves podem requerer mais frequentemente terapia dialítica.'
        : 'Não foi encontrada associação significativa entre a classe histológica e a necessidade de diálise nesta amostra.'
    };
  }, [pacientes]);

  // 2. Associação: Sexo vs Desfecho
  const associacaoSexoDesfecho = useMemo(() => {
    const dados = pacientes
      .filter(p => p.sexo && p.desfechoAlta)
      .map(p => ({
        linha: p.sexo === 'feminino' ? 'Feminino' : 'Masculino',
        coluna: p.desfechoAlta === 'alta' ? 'Alta' : p.desfechoAlta === 'obito' ? 'Óbito' : 'Transferência'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Sexo vs Desfecho Hospitalar',
      hipotese: 'H0: O sexo é independente do desfecho hospitalar',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre sexo e desfecho hospitalar, indicando possível diferença no prognóstico entre os sexos.'
        : 'Não foi encontrada associação significativa entre sexo e desfecho hospitalar nesta amostra.'
    };
  }, [pacientes]);

  // 3. Associação: Classe Histológica vs Desfecho
  const associacaoClasseDesfecho = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.desfechoAlta)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.desfechoAlta === 'alta' ? 'Alta' : p.desfechoAlta === 'obito' ? 'Óbito' : 'Transferência'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Desfecho Hospitalar',
      hipotese: 'H0: A classe histológica é independente do desfecho hospitalar',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre a classe histológica e o desfecho, sugerindo que a classificação ISN/RPS pode ter valor prognóstico.'
        : 'Não foi encontrada associação significativa entre classe histológica e desfecho nesta amostra.'
    };
  }, [pacientes]);

  // 4. Teste t: Idade entre pacientes com e sem diálise
  const testeIdadeDialise = useMemo(() => {
    const comDialise = pacientes
      .filter(p => p.necessidadeDialise === true && p.idade > 0)
      .map(p => p.idade);
    const semDialise = pacientes
      .filter(p => p.necessidadeDialise === false && p.idade > 0)
      .map(p => p.idade);

    if (comDialise.length < 2 || semDialise.length < 2) return null;

    const teste = testeTStudent(comDialise, semDialise);

    return {
      titulo: 'Comparação de Idade: Pacientes com vs sem Diálise',
      hipotese: 'H0: Não há diferença na idade média entre pacientes que necessitaram e não necessitaram de diálise',
      grupo1: { nome: 'Com Diálise', n: comDialise.length, media: comDialise.reduce((a, b) => a + b, 0) / comDialise.length },
      grupo2: { nome: 'Sem Diálise', n: semDialise.length, media: semDialise.reduce((a, b) => a + b, 0) / semDialise.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na idade entre os grupos, sugerindo que a idade pode ser um fator associado à necessidade de diálise.'
        : 'Não foi encontrada diferença significativa na idade entre pacientes com e sem necessidade de diálise.'
    };
  }, [pacientes]);

  // 5. Teste t: Creatinina entre pacientes com e sem diálise
  const testeCreatininaDialise = useMemo(() => {
    const comDialise = pacientes
      .filter(p => p.necessidadeDialise === true && p.creatininaSerica !== undefined)
      .map(p => p.creatininaSerica!);
    const semDialise = pacientes
      .filter(p => p.necessidadeDialise === false && p.creatininaSerica !== undefined)
      .map(p => p.creatininaSerica!);

    if (comDialise.length < 2 || semDialise.length < 2) return null;

    const teste = testeTStudent(comDialise, semDialise);

    return {
      titulo: 'Comparação de Creatinina: Pacientes com vs sem Diálise',
      hipotese: 'H0: Não há diferença na creatinina média entre pacientes que necessitaram e não necessitaram de diálise',
      grupo1: { nome: 'Com Diálise', n: comDialise.length, media: comDialise.reduce((a, b) => a + b, 0) / comDialise.length },
      grupo2: { nome: 'Sem Diálise', n: semDialise.length, media: semDialise.reduce((a, b) => a + b, 0) / semDialise.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na creatinina entre os grupos, confirmando que níveis mais elevados de creatinina estão associados à necessidade de diálise.'
        : 'Não foi encontrada diferença significativa na creatinina entre pacientes com e sem necessidade de diálise.'
    };
  }, [pacientes]);

  // 6. Associação: Etnia vs Classe Histológica
  const associacaoEtniaClasse = useMemo(() => {
    const dados = pacientes
      .filter(p => p.etnia && p.classificacaoHistologica?.length > 0)
      .map(p => ({
        linha: p.etnia.charAt(0).toUpperCase() + p.etnia.slice(1),
        coluna: getClasseSimplificada(p.classificacaoHistologica)
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Etnia vs Classe Histológica',
      hipotese: 'H0: A etnia é independente da classe histológica',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre etnia e classe histológica, sugerindo possível influência de fatores étnicos na apresentação da doença.'
        : 'Não foi encontrada associação significativa entre etnia e classe histológica nesta amostra.'
    };
  }, [pacientes]);

  // 7. Associação: Necessidade de Diálise vs Desfecho Hospitalar
  const associacaoDialiseDesfecho = useMemo(() => {
    const dados = pacientes
      .filter(p => p.necessidadeDialise !== undefined && p.desfechoAlta)
      .map(p => ({
        linha: p.necessidadeDialise ? 'Com Diálise' : 'Sem Diálise',
        coluna: p.desfechoAlta === 'alta' ? 'Alta' : p.desfechoAlta === 'obito' ? 'Óbito' : 'Transferência'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Necessidade de Diálise vs Desfecho Hospitalar',
      hipotese: 'H0: A necessidade de diálise é independente do desfecho hospitalar',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre necessidade de diálise e desfecho, sugerindo que pacientes em diálise podem ter prognóstico diferente.'
        : 'Não foi encontrada associação significativa entre necessidade de diálise e desfecho nesta amostra.'
    };
  }, [pacientes]);

  // 8. Teste t: Proteinúria entre pacientes com e sem diálise
  const testeProteinuriaDialise = useMemo(() => {
    const comDialise = pacientes
      .filter(p => p.necessidadeDialise === true && p.proteinuria !== undefined)
      .map(p => p.proteinuria!);
    const semDialise = pacientes
      .filter(p => p.necessidadeDialise === false && p.proteinuria !== undefined)
      .map(p => p.proteinuria!);

    if (comDialise.length < 2 || semDialise.length < 2) return null;

    const teste = testeTStudent(comDialise, semDialise);

    return {
      titulo: 'Comparação de Proteinúria: Pacientes com vs sem Diálise',
      hipotese: 'H0: Não há diferença na proteinúria média entre pacientes que necessitaram e não necessitaram de diálise',
      grupo1: { nome: 'Com Diálise', n: comDialise.length, media: comDialise.reduce((a, b) => a + b, 0) / comDialise.length },
      grupo2: { nome: 'Sem Diálise', n: semDialise.length, media: semDialise.reduce((a, b) => a + b, 0) / semDialise.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na proteinúria entre os grupos, sugerindo que níveis mais elevados de proteinúria estão associados à necessidade de diálise.'
        : 'Não foi encontrada diferença significativa na proteinúria entre pacientes com e sem necessidade de diálise.'
    };
  }, [pacientes]);

  // 9. Associação: HAS (comorbidade) vs Necessidade de Diálise
  const associacaoHASDialise = useMemo(() => {
    const dados = pacientes
      .filter(p => p.comorbidades && p.necessidadeDialise !== undefined)
      .map(p => ({
        linha: p.comorbidades.includes('has') ? 'Com HAS' : 'Sem HAS',
        coluna: p.necessidadeDialise ? 'Com Diálise' : 'Sem Diálise'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Hipertensão Arterial vs Necessidade de Diálise',
      hipotese: 'H0: A presença de HAS é independente da necessidade de diálise',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre HAS e necessidade de diálise, sugerindo que pacientes hipertensos podem ter maior risco de necessitar terapia dialítica.'
        : 'Não foi encontrada associação significativa entre HAS e necessidade de diálise nesta amostra.'
    };
  }, [pacientes]);

  // 10. Teste t: Tempo de Internação por Desfecho
  const testeTempoInternacaoDesfecho = useMemo(() => {
    const alta = pacientes
      .filter(p => p.desfechoAlta === 'alta' && p.tempoInternacao !== undefined)
      .map(p => p.tempoInternacao!);
    const outrosDesfechos = pacientes
      .filter(p => (p.desfechoAlta === 'obito' || p.desfechoAlta === 'transferencia') && p.tempoInternacao !== undefined)
      .map(p => p.tempoInternacao!);

    if (alta.length < 2 || outrosDesfechos.length < 2) return null;

    const teste = testeTStudent(alta, outrosDesfechos);

    return {
      titulo: 'Comparação do Tempo de Internação por Desfecho',
      hipotese: 'H0: Não há diferença no tempo de internação entre pacientes que tiveram alta e aqueles com outros desfechos (óbito/transferência)',
      grupo1: { nome: 'Alta', n: alta.length, media: alta.reduce((a, b) => a + b, 0) / alta.length },
      grupo2: { nome: 'Óbito/Transf.', n: outrosDesfechos.length, media: outrosDesfechos.reduce((a, b) => a + b, 0) / outrosDesfechos.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa no tempo de internação entre os grupos, indicando que o desfecho pode estar relacionado à duração da hospitalização.'
        : 'Não foi encontrada diferença significativa no tempo de internação entre os grupos de desfecho.'
    };
  }, [pacientes]);

  // 11. Teste t: Idade por Desfecho
  const testeIdadeDesfecho = useMemo(() => {
    const alta = pacientes
      .filter(p => p.desfechoAlta === 'alta' && p.idade > 0)
      .map(p => p.idade);
    const outrosDesfechos = pacientes
      .filter(p => (p.desfechoAlta === 'obito' || p.desfechoAlta === 'transferencia') && p.idade > 0)
      .map(p => p.idade);

    if (alta.length < 2 || outrosDesfechos.length < 2) return null;

    const teste = testeTStudent(alta, outrosDesfechos);

    return {
      titulo: 'Comparação de Idade por Desfecho',
      hipotese: 'H0: Não há diferença na idade média entre pacientes que tiveram alta e aqueles com outros desfechos',
      grupo1: { nome: 'Alta', n: alta.length, media: alta.reduce((a, b) => a + b, 0) / alta.length },
      grupo2: { nome: 'Óbito/Transf.', n: outrosDesfechos.length, media: outrosDesfechos.reduce((a, b) => a + b, 0) / outrosDesfechos.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na idade entre os grupos, sugerindo que a idade pode ser um fator prognóstico importante.'
        : 'Não foi encontrada diferença significativa na idade entre os grupos de desfecho.'
    };
  }, [pacientes]);

  // 12. Associação: Anti-dsDNA vs Classe Histológica
  const associacaoAntiDNAClasse = useMemo(() => {
    const dados = pacientes
      .filter(p => p.antiDsDNA && p.classificacaoHistologica?.length > 0)
      .map(p => ({
        linha: p.antiDsDNA === 'reagente' ? 'Reagente' : 'Não Reagente',
        coluna: getClasseSimplificada(p.classificacaoHistologica)
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Anti-dsDNA vs Classe Histológica',
      hipotese: 'H0: O resultado do Anti-dsDNA é independente da classe histológica',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre Anti-dsDNA reagente e classe histológica, sugerindo relação entre atividade sorológica e gravidade da lesão renal.'
        : 'Não foi encontrada associação significativa entre Anti-dsDNA e classe histológica nesta amostra.'
    };
  }, [pacientes]);

  // 13. Associação: Presença de Edema vs Necessidade de Diálise
  const associacaoEdemaDialise = useMemo(() => {
    const dados = pacientes
      .filter(p => p.presencaEdema !== undefined && p.necessidadeDialise !== undefined)
      .map(p => ({
        linha: p.presencaEdema ? 'Com Edema' : 'Sem Edema',
        coluna: p.necessidadeDialise ? 'Com Diálise' : 'Sem Diálise'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Presença de Edema vs Necessidade de Diálise',
      hipotese: 'H0: A presença de edema é independente da necessidade de diálise',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre presença de edema e necessidade de diálise, indicando que edema pode ser um marcador de gravidade renal.'
        : 'Não foi encontrada associação significativa entre presença de edema e necessidade de diálise nesta amostra.'
    };
  }, [pacientes]);

  // 14. Teste t: Complemento C3 entre pacientes com classes graves vs leves
  const testeC3ClasseGravidade = useMemo(() => {
    const classesGraves = ['classe_iii', 'classe_iv', 'classe_vi'];
    const graves = pacientes
      .filter(p => p.classificacaoHistologica?.some(c => classesGraves.includes(c)) && p.c3 !== undefined)
      .map(p => p.c3!);
    const leves = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && !p.classificacaoHistologica.some(c => classesGraves.includes(c)) && p.c3 !== undefined)
      .map(p => p.c3!);

    if (graves.length < 2 || leves.length < 2) return null;

    const teste = testeTStudent(graves, leves);

    return {
      titulo: 'Comparação de C3: Classes Graves vs Leves',
      hipotese: 'H0: Não há diferença no C3 médio entre pacientes com classes histológicas graves (III, IV, VI) e leves (I, II, V)',
      grupo1: { nome: 'Graves (III,IV,VI)', n: graves.length, media: graves.reduce((a, b) => a + b, 0) / graves.length },
      grupo2: { nome: 'Leves (I,II,V)', n: leves.length, media: leves.reduce((a, b) => a + b, 0) / leves.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa no C3 entre os grupos, sugerindo que níveis de complemento podem diferenciar gravidade histológica.'
        : 'Não foi encontrada diferença significativa no C3 entre classes histológicas graves e leves.'
    };
  }, [pacientes]);

  // 15. Associação: Melhora Clínica vs Classe Histológica
  const associacaoMelhoraClasse = useMemo(() => {
    const dados = pacientes
      .filter(p => p.melhoraClinica && p.classificacaoHistologica?.length > 0)
      .map(p => ({
        linha: p.melhoraClinica === 'sim' ? 'Sim' : p.melhoraClinica === 'parcial' ? 'Parcial' : 'Não',
        coluna: getClasseSimplificada(p.classificacaoHistologica)
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Melhora Clínica vs Classe Histológica',
      hipotese: 'H0: A melhora clínica é independente da classe histológica',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre melhora clínica e classe histológica, indicando que a classificação ISN/RPS pode prever resposta ao tratamento.'
        : 'Não foi encontrada associação significativa entre melhora clínica e classe histológica nesta amostra.'
    };
  }, [pacientes]);

  // 16. Teste t: Pressão Arterial Sistólica entre pacientes com e sem diálise
  const testePASDialise = useMemo(() => {
    const comDialise = pacientes
      .filter(p => p.necessidadeDialise === true && p.pressaoArterialSistolica !== undefined)
      .map(p => p.pressaoArterialSistolica!);
    const semDialise = pacientes
      .filter(p => p.necessidadeDialise === false && p.pressaoArterialSistolica !== undefined)
      .map(p => p.pressaoArterialSistolica!);

    if (comDialise.length < 2 || semDialise.length < 2) return null;

    const teste = testeTStudent(comDialise, semDialise);

    return {
      titulo: 'Comparação de PA Sistólica: Pacientes com vs sem Diálise',
      hipotese: 'H0: Não há diferença na PA sistólica média entre pacientes que necessitaram e não necessitaram de diálise',
      grupo1: { nome: 'Com Diálise', n: comDialise.length, media: comDialise.reduce((a, b) => a + b, 0) / comDialise.length },
      grupo2: { nome: 'Sem Diálise', n: semDialise.length, media: semDialise.reduce((a, b) => a + b, 0) / semDialise.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na PA sistólica entre os grupos, sugerindo associação entre níveis pressóricos e necessidade de diálise.'
        : 'Não foi encontrada diferença significativa na PA sistólica entre pacientes com e sem necessidade de diálise.'
    };
  }, [pacientes]);

  // ========== COMPARAÇÃO: DADOS HISTOLÓGICOS vs MANIFESTAÇÕES CLÍNICAS E LABORATORIAIS ==========

  // 17. Associação: Classe Histológica vs Presença de Epilepsia
  const associacaoClasseEpilepsia = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('epilepsia') ? 'Com Epilepsia' : 'Sem Epilepsia'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Presença de Epilepsia',
      hipotese: 'H0: A classe histológica é independente da presença de epilepsia como manifestação inicial',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e epilepsia, sugerindo que manifestações neuropsiquiátricas podem estar relacionadas à gravidade da nefrite.'
        : 'Não foi encontrada associação significativa entre classe histológica e epilepsia nesta amostra.'
    };
  }, [pacientes]);

  // 18. Associação: Classe Histológica vs Presença de Anemia
  const associacaoClasseAnemia = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('anemia') ? 'Com Anemia' : 'Sem Anemia'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Presença de Anemia',
      hipotese: 'H0: A classe histológica é independente da presença de anemia como manifestação inicial',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e anemia, sugerindo que alterações hematológicas podem acompanhar formas mais graves de nefrite lúpica.'
        : 'Não foi encontrada associação significativa entre classe histológica e anemia nesta amostra.'
    };
  }, [pacientes]);

  // 18b. Associação: Classe Histológica vs Artralgia/Artrite
  const associacaoClasseArtralgia = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('artralgia_artrite') ? 'Com Artralgia/Artrite' : 'Sem Artralgia/Artrite'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Artralgia/Artrite',
      hipotese: 'H0: A classe histológica é independente da presença de artralgia/artrite como manifestação inicial',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e artralgia/artrite, sugerindo correlação entre manifestações articulares e padrão histológico.'
        : 'Não foi encontrada associação significativa entre classe histológica e artralgia/artrite nesta amostra.'
    };
  }, [pacientes]);

  // 18c. Associação: Classe Histológica vs Lesões Cutâneas
  const associacaoClasseLesoesCutaneas = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('lesoes_cutaneas') ? 'Com Lesões Cutâneas' : 'Sem Lesões Cutâneas'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Lesões Cutâneas',
      hipotese: 'H0: A classe histológica é independente da presença de lesões cutâneas como manifestação inicial',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e lesões cutâneas, indicando possível relação entre manifestações dermatológicas e gravidade renal.'
        : 'Não foi encontrada associação significativa entre classe histológica e lesões cutâneas nesta amostra.'
    };
  }, [pacientes]);

  // 18d. Associação: Classe Histológica vs Febre
  const associacaoClasseFebre = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('febre') ? 'Com Febre' : 'Sem Febre'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Febre',
      hipotese: 'H0: A classe histológica é independente da presença de febre como manifestação inicial',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e febre, sugerindo que manifestações sistêmicas podem acompanhar formas específicas de nefrite.'
        : 'Não foi encontrada associação significativa entre classe histológica e febre nesta amostra.'
    };
  }, [pacientes]);

  // 18e. Associação: Classe Histológica vs Serosites
  const associacaoClasseSerosites = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('serosites') ? 'Com Serosites' : 'Sem Serosites'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Serosites',
      hipotese: 'H0: A classe histológica é independente da presença de serosites como manifestação inicial',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e serosites, indicando possível relação entre inflamação serosa e padrão histológico renal.'
        : 'Não foi encontrada associação significativa entre classe histológica e serosites nesta amostra.'
    };
  }, [pacientes]);

  // 18f. Associação: Classe Histológica vs Acometimento Renal prévio
  const associacaoClasseAcometimentoRenal = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.manifestacoesIniciaisLES)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.manifestacoesIniciaisLES.includes('acometimento_renal') ? 'Com Acometimento Renal' : 'Sem Acometimento Renal'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Acometimento Renal como Manifestação Inicial',
      hipotese: 'H0: A classe histológica é independente do acometimento renal como manifestação inicial do LES',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e acometimento renal inicial, sugerindo que pacientes com nefrite como primeira manifestação podem apresentar padrões histológicos específicos.'
        : 'Não foi encontrada associação significativa entre classe histológica e acometimento renal inicial nesta amostra.'
    };
  }, [pacientes]);

  // 19. Teste t: Creatinina média por Classe Histológica (Graves vs Leves)
  const testeCreatininaClasseGravidade = useMemo(() => {
    const classesGraves = ['classe_iii', 'classe_iv', 'classe_vi'];
    const graves = pacientes
      .filter(p => p.classificacaoHistologica?.some(c => classesGraves.includes(c)) && p.creatininaSerica !== undefined)
      .map(p => p.creatininaSerica!);
    const leves = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && !p.classificacaoHistologica.some(c => classesGraves.includes(c)) && p.creatininaSerica !== undefined)
      .map(p => p.creatininaSerica!);

    if (graves.length < 2 || leves.length < 2) return null;

    const teste = testeTStudent(graves, leves);

    return {
      titulo: 'Comparação de Creatinina: Classes Graves vs Leves',
      hipotese: 'H0: Não há diferença na creatinina média entre pacientes com classes histológicas graves (III, IV, VI) e leves (I, II, V)',
      grupo1: { nome: 'Graves (III,IV,VI)', n: graves.length, media: graves.reduce((a, b) => a + b, 0) / graves.length },
      grupo2: { nome: 'Leves (I,II,V)', n: leves.length, media: leves.reduce((a, b) => a + b, 0) / leves.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na creatinina entre os grupos, confirmando que classes histológicas mais graves apresentam maior comprometimento da função renal.'
        : 'Não foi encontrada diferença significativa na creatinina entre classes histológicas graves e leves.'
    };
  }, [pacientes]);

  // 20. Teste t: Proteinúria média por Classe Histológica (Graves vs Leves)
  const testeProteinuriaClasseGravidade = useMemo(() => {
    const classesGraves = ['classe_iii', 'classe_iv', 'classe_vi'];
    const graves = pacientes
      .filter(p => p.classificacaoHistologica?.some(c => classesGraves.includes(c)) && p.proteinuria !== undefined)
      .map(p => p.proteinuria!);
    const leves = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && !p.classificacaoHistologica.some(c => classesGraves.includes(c)) && p.proteinuria !== undefined)
      .map(p => p.proteinuria!);

    if (graves.length < 2 || leves.length < 2) return null;

    const teste = testeTStudent(graves, leves);

    return {
      titulo: 'Comparação de Proteinúria: Classes Graves vs Leves',
      hipotese: 'H0: Não há diferença na proteinúria média entre pacientes com classes histológicas graves (III, IV, VI) e leves (I, II, V)',
      grupo1: { nome: 'Graves (III,IV,VI)', n: graves.length, media: graves.reduce((a, b) => a + b, 0) / graves.length },
      grupo2: { nome: 'Leves (I,II,V)', n: leves.length, media: leves.reduce((a, b) => a + b, 0) / leves.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na proteinúria entre os grupos, indicando que classes proliferativas apresentam maior lesão glomerular.'
        : 'Não foi encontrada diferença significativa na proteinúria entre classes histológicas graves e leves.'
    };
  }, [pacientes]);

  // 21. Teste t: C4 por Classe Histológica (Graves vs Leves)
  const testeC4ClasseGravidade = useMemo(() => {
    const classesGraves = ['classe_iii', 'classe_iv', 'classe_vi'];
    const graves = pacientes
      .filter(p => p.classificacaoHistologica?.some(c => classesGraves.includes(c)) && p.c4 !== undefined)
      .map(p => p.c4!);
    const leves = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && !p.classificacaoHistologica.some(c => classesGraves.includes(c)) && p.c4 !== undefined)
      .map(p => p.c4!);

    if (graves.length < 2 || leves.length < 2) return null;

    const teste = testeTStudent(graves, leves);

    return {
      titulo: 'Comparação de C4: Classes Graves vs Leves',
      hipotese: 'H0: Não há diferença no C4 médio entre pacientes com classes histológicas graves (III, IV, VI) e leves (I, II, V)',
      grupo1: { nome: 'Graves (III,IV,VI)', n: graves.length, media: graves.reduce((a, b) => a + b, 0) / graves.length },
      grupo2: { nome: 'Leves (I,II,V)', n: leves.length, media: leves.reduce((a, b) => a + b, 0) / leves.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa no C4 entre os grupos, sugerindo maior consumo de complemento nas classes histológicas mais graves.'
        : 'Não foi encontrada diferença significativa no C4 entre classes histológicas graves e leves.'
    };
  }, [pacientes]);

  // 22. Associação: Classe Histológica vs Presença de Hematúria
  const associacaoClasseHematuria = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.hematuria !== undefined)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.hematuria ? 'Com Hematúria' : 'Sem Hematúria'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Presença de Hematúria',
      hipotese: 'H0: A classe histológica é independente da presença de hematúria',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e hematúria, indicando que classes proliferativas frequentemente se manifestam com hematúria glomerular.'
        : 'Não foi encontrada associação significativa entre classe histológica e hematúria nesta amostra.'
    };
  }, [pacientes]);

  // 23. Associação: Classe Histológica vs Presença de Edema
  const associacaoClasseEdema = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.presencaEdema !== undefined)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.presencaEdema ? 'Com Edema' : 'Sem Edema'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Presença de Edema',
      hipotese: 'H0: A classe histológica é independente da presença de edema',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e edema, sugerindo que classes com maior proteinúria (especialmente classe V membranosa) apresentam mais edema.'
        : 'Não foi encontrada associação significativa entre classe histológica e edema nesta amostra.'
    };
  }, [pacientes]);

  // 24. Teste t: TFG por Classe Histológica (Graves vs Leves)
  const testeTFGClasseGravidade = useMemo(() => {
    const classesGraves = ['classe_iii', 'classe_iv', 'classe_vi'];
    const graves = pacientes
      .filter(p => p.classificacaoHistologica?.some(c => classesGraves.includes(c)) && p.tfgEstimada !== undefined)
      .map(p => p.tfgEstimada!);
    const leves = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && !p.classificacaoHistologica.some(c => classesGraves.includes(c)) && p.tfgEstimada !== undefined)
      .map(p => p.tfgEstimada!);

    if (graves.length < 2 || leves.length < 2) return null;

    const teste = testeTStudent(graves, leves);

    return {
      titulo: 'Comparação de TFG: Classes Graves vs Leves',
      hipotese: 'H0: Não há diferença na TFG média entre pacientes com classes histológicas graves (III, IV, VI) e leves (I, II, V)',
      grupo1: { nome: 'Graves (III,IV,VI)', n: graves.length, media: graves.reduce((a, b) => a + b, 0) / graves.length },
      grupo2: { nome: 'Leves (I,II,V)', n: leves.length, media: leves.reduce((a, b) => a + b, 0) / leves.length },
      teste,
      conclusao: teste.significativo
        ? 'Existe diferença significativa na TFG entre os grupos, confirmando que classes proliferativas e esclerosantes apresentam maior comprometimento da função renal.'
        : 'Não foi encontrada diferença significativa na TFG entre classes histológicas graves e leves.'
    };
  }, [pacientes]);

  // 25. Associação: Classe Histológica vs Anti-dsDNA reagente
  const associacaoClasseAntiDNA = useMemo(() => {
    const dados = pacientes
      .filter(p => p.classificacaoHistologica?.length > 0 && p.antiDsDNA)
      .map(p => ({
        linha: getClasseSimplificada(p.classificacaoHistologica),
        coluna: p.antiDsDNA === 'reagente' ? 'Reagente' : 'Não Reagente'
      }));

    if (dados.length < 5) return null;

    const tabela = criarTabelaContingencia(dados);
    const teste = testeQuiQuadrado(tabela);

    return {
      titulo: 'Classe Histológica vs Anti-dsDNA',
      hipotese: 'H0: A classe histológica é independente da reatividade do Anti-dsDNA',
      tabela,
      teste,
      conclusao: teste.significativo
        ? 'Existe associação significativa entre classe histológica e Anti-dsDNA reagente, sugerindo que atividade sorológica correlaciona-se com gravidade histológica.'
        : 'Não foi encontrada associação significativa entre classe histológica e Anti-dsDNA nesta amostra.'
    };
  }, [pacientes]);

  const toggleSecao = (secao: string) => {
    setSecaoAberta(secaoAberta === secao ? '' : secao);
  };

  if (pacientes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Análises Estatísticas</h1>
        <Card className="p-8 text-center">
          <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Nenhum paciente cadastrado. Adicione pacientes para visualizar as análises estatísticas.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Análises Estatísticas</h1>
          <p className="text-gray-500 mt-1">
            Análise completa dos dados de {pacientes.length} pacientes com Nefrite Lúpica
          </p>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Total de Pacientes</p>
              <p className="text-2xl font-bold text-blue-800">{pacientes.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Idade Média</p>
              <p className="text-2xl font-bold text-green-800">
                {estatisticasDescritivas ? formatarNumero(estatisticasDescritivas.idade.media, 1) : '-'} anos
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <PieChartIcon className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600">Sexo Feminino</p>
              <p className="text-2xl font-bold text-purple-800">
                {formatarPorcentagem(distribuicaoSexo[0]?.percentual || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600">TFG Média</p>
              <p className="text-2xl font-bold text-orange-800">
                {estatisticasDescritivas ? formatarNumero(estatisticasDescritivas.tfg.media, 1) : '-'} mL/min
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Seção: Estatística Descritiva */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSecao('descritiva')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">1. Estatística Descritiva</span>
          </div>
          {secaoAberta === 'descritiva' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'descritiva' && estatisticasDescritivas && (
          <div className="p-6 space-y-6">
            <h3 className="font-semibold text-gray-700 mb-4">Variáveis Contínuas (Média ± DP)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variável</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">N</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Média ± DP</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mediana</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mín - Máx</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { nome: 'Idade (anos)', stats: estatisticasDescritivas.idade },
                    { nome: 'Proteinúria (g/24h)', stats: estatisticasDescritivas.proteinuria },
                    { nome: 'Creatinina (mg/dL)', stats: estatisticasDescritivas.creatinina },
                    { nome: 'TFG (mL/min)', stats: estatisticasDescritivas.tfg },
                    { nome: 'C3', stats: estatisticasDescritivas.c3 },
                    { nome: 'C4', stats: estatisticasDescritivas.c4 },
                    { nome: 'PA Sistólica (mmHg)', stats: estatisticasDescritivas.pasSistolica },
                    { nome: 'PA Diastólica (mmHg)', stats: estatisticasDescritivas.pasDiastolica },
                    { nome: 'Tempo Internação (dias)', stats: estatisticasDescritivas.tempoInternacao },
                  ].map((item) => (
                    <tr key={item.nome}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.stats.n}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">
                        {formatarNumero(item.stats.media, 2)} ± {formatarNumero(item.stats.desvioPadrao, 2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">
                        {formatarNumero(item.stats.mediana, 2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">
                        {formatarNumero(item.stats.minimo, 2)} - {formatarNumero(item.stats.maximo, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Seção: Perfil Demográfico */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSecao('demografico')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-800">2. Perfil Demográfico</span>
          </div>
          {secaoAberta === 'demografico' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'demografico' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Sexo */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Distribuição por Sexo</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={distribuicaoSexo}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, payload }: any) => `${name}: ${formatarPorcentagem(payload?.percentual || 0)}`}
                    >
                      {distribuicaoSexo.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#FF6B6B', '#4ECDC4'][index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Pacientes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Etnia */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Distribuição por Etnia</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={distribuicaoEtnia} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      formatter={(value: any, _name: any, props: any) => [
                        `${value} (${formatarPorcentagem(props.payload.percentual)})`,
                        'Pacientes',
                      ]}
                    />
                    <Bar dataKey="value" fill="#5D5FEF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Seção: Classificação Histológica */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSecao('histologica')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">3. Classificação Histológica (ISN/RPS)</span>
          </div>
          {secaoAberta === 'histologica' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'histologica' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de barras */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Distribuição por Classe</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribuicaoClasses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, _name: any, props: any) => [
                        `${value} (${formatarPorcentagem(props.payload.percentual)})`,
                        'Pacientes',
                      ]}
                      labelFormatter={(label) => `Classe ${label}: ${CLASSES_DESCRICAO[label] || ''}`}
                    />
                    <Bar dataKey="quantidade">
                      {distribuicaoClasses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela de classes */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Detalhamento</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">n</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {distribuicaoClasses.map((item) => (
                      <tr key={item.categoria}>
                        <td className="px-3 py-2 text-sm">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.categoria}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">{item.descricao}</td>
                        <td className="px-3 py-2 text-sm text-center">{item.quantidade}</td>
                        <td className="px-3 py-2 text-sm text-center">{formatarPorcentagem(item.percentual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TFG por classe */}
            {tfgPorClasse.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-4">TFG por Classe Histológica</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tfgPorClasse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="classe" />
                    <YAxis label={{ value: 'TFG (mL/min)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any) => [formatarNumero(value, 1), 'TFG média']}
                      labelFormatter={(label) => `Classe ${label}: ${CLASSES_DESCRICAO[label] || ''}`}
                    />
                    <Bar dataKey="media" fill="#E74C3C" name="Média" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Seção: Imunofluorescência */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSecao('imuno')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-gray-800">4. Perfil de Imunofluorescência</span>
          </div>
          {secaoAberta === 'imuno' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'imuno' && (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribuicaoImuno}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="marcador" />
                <YAxis label={{ value: 'Positividade (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: any) => [`${formatarPorcentagem(value)}`, 'Positividade']} />
                <Bar dataKey="percentual" name="Positividade">
                  {distribuicaoImuno.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marcador</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Positivo (n)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Positivo (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distribuicaoImuno.map((item) => (
                    <tr key={item.marcador}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.marcador}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 text-center">{item.positivos}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 text-center">{formatarPorcentagem(item.percentual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Seção: Desfechos Clínicos */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSecao('desfechos')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-800">5. Desfechos Clínicos</span>
          </div>
          {secaoAberta === 'desfechos' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'desfechos' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Necessidade de Diálise */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4 text-center">Necessidade de Diálise</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={distribuicaoDialise}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, payload }: any) => `${name}: ${formatarPorcentagem(payload?.percentual || 0)}`}
                    >
                      {distribuicaoDialise.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#E74C3C', '#2ECC71'][index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Pacientes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Melhora Clínica */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4 text-center">Melhora Clínica</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={distribuicaoMelhora}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, payload }: any) => `${name}: ${formatarPorcentagem(payload?.percentual || 0)}`}
                    >
                      {distribuicaoMelhora.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#2ECC71', '#F39C12', '#E74C3C'][index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Pacientes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Desfecho Hospitalar */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4 text-center">Desfecho Hospitalar</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={distribuicaoDesfechos as any}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="quantidade"
                      label={({ payload }: any) => `${payload?.categoria || ''}: ${formatarPorcentagem(payload?.percentual || 0)}`}
                    >
                      {distribuicaoDesfechos.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Pacientes']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Seção: Análise de Associações / Testes de Hipóteses */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSecao('associacoes')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-800">6. Análise de Associações (Testes de Hipóteses)</span>
          </div>
          {secaoAberta === 'associacoes' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'associacoes' && (
          <div className="p-6 space-y-8">
            <p className="text-gray-600 text-sm mb-6">
              Esta seção apresenta testes estatísticos para avaliar associações entre variáveis,
              auxiliando na geração de hipóteses clínicas. Valores de p &lt; 0.05 indicam associação
              estatisticamente significativa.
            </p>

            {/* Testes Qui-quadrado */}
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-800 border-b pb-2">
                Testes de Associação (Qui-quadrado)
              </h3>

              {/* Classe vs Diálise */}
              {associacaoClasseDialise && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoClasseDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoClasseDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoClasseDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoClasseDialise.hipotese}</p>

                  {/* Tabela de contingência */}
                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoClasseDialise.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoClasseDialise.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoClasseDialise.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoClasseDialise.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoClasseDialise.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoClasseDialise.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoClasseDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoClasseDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoClasseDialise.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    χ² = {formatarNumero(associacaoClasseDialise.teste.estatistica, 2)},
                    gl = {associacaoClasseDialise.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* Sexo vs Desfecho */}
              {associacaoSexoDesfecho && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoSexoDesfecho.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoSexoDesfecho.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoSexoDesfecho.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoSexoDesfecho.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoSexoDesfecho.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoSexoDesfecho.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoSexoDesfecho.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoSexoDesfecho.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoSexoDesfecho.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoSexoDesfecho.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoSexoDesfecho.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoSexoDesfecho.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoSexoDesfecho.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* Classe vs Desfecho */}
              {associacaoClasseDesfecho && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoClasseDesfecho.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoClasseDesfecho.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoClasseDesfecho.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoClasseDesfecho.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoClasseDesfecho.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoClasseDesfecho.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoClasseDesfecho.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoClasseDesfecho.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoClasseDesfecho.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoClasseDesfecho.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoClasseDesfecho.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoClasseDesfecho.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoClasseDesfecho.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* Etnia vs Classe */}
              {associacaoEtniaClasse && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoEtniaClasse.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoEtniaClasse.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoEtniaClasse.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoEtniaClasse.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoEtniaClasse.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoEtniaClasse.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoEtniaClasse.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoEtniaClasse.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoEtniaClasse.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoEtniaClasse.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoEtniaClasse.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoEtniaClasse.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoEtniaClasse.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* Diálise vs Desfecho */}
              {associacaoDialiseDesfecho && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoDialiseDesfecho.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoDialiseDesfecho.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoDialiseDesfecho.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoDialiseDesfecho.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoDialiseDesfecho.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoDialiseDesfecho.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoDialiseDesfecho.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoDialiseDesfecho.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoDialiseDesfecho.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoDialiseDesfecho.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoDialiseDesfecho.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoDialiseDesfecho.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoDialiseDesfecho.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* HAS vs Diálise */}
              {associacaoHASDialise && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoHASDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoHASDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoHASDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoHASDialise.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoHASDialise.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoHASDialise.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoHASDialise.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoHASDialise.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoHASDialise.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoHASDialise.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoHASDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoHASDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoHASDialise.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* Anti-dsDNA vs Classe */}
              {associacaoAntiDNAClasse && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoAntiDNAClasse.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoAntiDNAClasse.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoAntiDNAClasse.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoAntiDNAClasse.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoAntiDNAClasse.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoAntiDNAClasse.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoAntiDNAClasse.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoAntiDNAClasse.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoAntiDNAClasse.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoAntiDNAClasse.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoAntiDNAClasse.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoAntiDNAClasse.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoAntiDNAClasse.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* Edema vs Diálise */}
              {associacaoEdemaDialise && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoEdemaDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoEdemaDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoEdemaDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoEdemaDialise.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoEdemaDialise.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoEdemaDialise.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoEdemaDialise.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoEdemaDialise.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoEdemaDialise.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoEdemaDialise.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoEdemaDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoEdemaDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoEdemaDialise.conclusao}
                    </p>
                  </div>
                </div>
              )}

              {/* Melhora Clínica vs Classe */}
              {associacaoMelhoraClasse && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{associacaoMelhoraClasse.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      associacaoMelhoraClasse.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(associacaoMelhoraClasse.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{associacaoMelhoraClasse.hipotese}</p>

                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-600"></th>
                          {associacaoMelhoraClasse.tabela.colunas.map(col => (
                            <th key={col} className="px-3 py-2 text-center font-medium text-gray-600">{col}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoMelhoraClasse.tabela.linhas.map((linha, i) => (
                          <tr key={linha} className="border-b">
                            <td className="px-3 py-2 font-medium text-gray-700">{linha}</td>
                            {associacaoMelhoraClasse.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="px-3 py-2 text-center font-medium">{associacaoMelhoraClasse.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 font-medium">Total</td>
                          {associacaoMelhoraClasse.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="px-3 py-2 text-center font-medium">{total}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold">{associacaoMelhoraClasse.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {associacaoMelhoraClasse.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={associacaoMelhoraClasse.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {associacaoMelhoraClasse.conclusao}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Testes t de Student */}
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-800 border-b pb-2">
                Comparação de Médias (Teste t de Student)
              </h3>

              {/* Idade vs Diálise */}
              {testeIdadeDialise && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testeIdadeDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testeIdadeDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testeIdadeDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testeIdadeDialise.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeIdadeDialise.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testeIdadeDialise.grupo1.media, 1)} anos
                      </p>
                      <p className="text-xs text-gray-400">n = {testeIdadeDialise.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeIdadeDialise.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testeIdadeDialise.grupo2.media, 1)} anos
                      </p>
                      <p className="text-xs text-gray-400">n = {testeIdadeDialise.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testeIdadeDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testeIdadeDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testeIdadeDialise.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testeIdadeDialise.teste.estatistica, 2)},
                    gl = {testeIdadeDialise.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* Creatinina vs Diálise */}
              {testeCreatininaDialise && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testeCreatininaDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testeCreatininaDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testeCreatininaDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testeCreatininaDialise.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeCreatininaDialise.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testeCreatininaDialise.grupo1.media, 2)} mg/dL
                      </p>
                      <p className="text-xs text-gray-400">n = {testeCreatininaDialise.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeCreatininaDialise.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testeCreatininaDialise.grupo2.media, 2)} mg/dL
                      </p>
                      <p className="text-xs text-gray-400">n = {testeCreatininaDialise.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testeCreatininaDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testeCreatininaDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testeCreatininaDialise.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testeCreatininaDialise.teste.estatistica, 2)},
                    gl = {testeCreatininaDialise.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* Proteinúria vs Diálise */}
              {testeProteinuriaDialise && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testeProteinuriaDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testeProteinuriaDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testeProteinuriaDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testeProteinuriaDialise.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeProteinuriaDialise.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testeProteinuriaDialise.grupo1.media, 2)} g/24h
                      </p>
                      <p className="text-xs text-gray-400">n = {testeProteinuriaDialise.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeProteinuriaDialise.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testeProteinuriaDialise.grupo2.media, 2)} g/24h
                      </p>
                      <p className="text-xs text-gray-400">n = {testeProteinuriaDialise.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testeProteinuriaDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testeProteinuriaDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testeProteinuriaDialise.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testeProteinuriaDialise.teste.estatistica, 2)},
                    gl = {testeProteinuriaDialise.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* Tempo de Internação por Desfecho */}
              {testeTempoInternacaoDesfecho && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testeTempoInternacaoDesfecho.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testeTempoInternacaoDesfecho.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testeTempoInternacaoDesfecho.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testeTempoInternacaoDesfecho.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeTempoInternacaoDesfecho.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testeTempoInternacaoDesfecho.grupo1.media, 1)} dias
                      </p>
                      <p className="text-xs text-gray-400">n = {testeTempoInternacaoDesfecho.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeTempoInternacaoDesfecho.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testeTempoInternacaoDesfecho.grupo2.media, 1)} dias
                      </p>
                      <p className="text-xs text-gray-400">n = {testeTempoInternacaoDesfecho.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testeTempoInternacaoDesfecho.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testeTempoInternacaoDesfecho.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testeTempoInternacaoDesfecho.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testeTempoInternacaoDesfecho.teste.estatistica, 2)},
                    gl = {testeTempoInternacaoDesfecho.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* Idade por Desfecho */}
              {testeIdadeDesfecho && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testeIdadeDesfecho.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testeIdadeDesfecho.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testeIdadeDesfecho.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testeIdadeDesfecho.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeIdadeDesfecho.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testeIdadeDesfecho.grupo1.media, 1)} anos
                      </p>
                      <p className="text-xs text-gray-400">n = {testeIdadeDesfecho.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeIdadeDesfecho.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testeIdadeDesfecho.grupo2.media, 1)} anos
                      </p>
                      <p className="text-xs text-gray-400">n = {testeIdadeDesfecho.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testeIdadeDesfecho.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testeIdadeDesfecho.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testeIdadeDesfecho.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testeIdadeDesfecho.teste.estatistica, 2)},
                    gl = {testeIdadeDesfecho.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* C3 por Gravidade da Classe */}
              {testeC3ClasseGravidade && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testeC3ClasseGravidade.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testeC3ClasseGravidade.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testeC3ClasseGravidade.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testeC3ClasseGravidade.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeC3ClasseGravidade.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testeC3ClasseGravidade.grupo1.media, 1)}
                      </p>
                      <p className="text-xs text-gray-400">n = {testeC3ClasseGravidade.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testeC3ClasseGravidade.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testeC3ClasseGravidade.grupo2.media, 1)}
                      </p>
                      <p className="text-xs text-gray-400">n = {testeC3ClasseGravidade.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testeC3ClasseGravidade.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testeC3ClasseGravidade.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testeC3ClasseGravidade.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testeC3ClasseGravidade.teste.estatistica, 2)},
                    gl = {testeC3ClasseGravidade.teste.grausLiberdade}
                  </p>
                </div>
              )}

              {/* PA Sistólica vs Diálise */}
              {testePASDialise && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{testePASDialise.titulo}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testePASDialise.teste.significativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      p = {formatarPValor(testePASDialise.teste.pValor)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{testePASDialise.hipotese}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testePASDialise.grupo1.nome}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatarNumero(testePASDialise.grupo1.media, 0)} mmHg
                      </p>
                      <p className="text-xs text-gray-400">n = {testePASDialise.grupo1.n}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">{testePASDialise.grupo2.nome}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatarNumero(testePASDialise.grupo2.media, 0)} mmHg
                      </p>
                      <p className="text-xs text-gray-400">n = {testePASDialise.grupo2.n}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    {testePASDialise.teste.significativo ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={testePASDialise.teste.significativo ? 'text-green-700' : 'text-gray-600'}>
                      {testePASDialise.conclusao}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    t = {formatarNumero(testePASDialise.teste.estatistica, 2)},
                    gl = {testePASDialise.teste.grausLiberdade}
                  </p>
                </div>
              )}
            </div>

            {/* Comparação: Dados Histológicos vs Manifestações Clínicas */}
            <div className="space-y-6 mt-8">
              <h3 className="font-semibold text-gray-800 border-b pb-2 border-purple-300">
                <span className="text-purple-700">Comparação: Dados Histológicos vs Manifestações Clínicas</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Análises que comparam a classificação histológica ISN/RPS com as manifestações clínicas iniciais do LES.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {associacaoClasseEpilepsia && (
                  <div className={`p-4 rounded-lg ${associacaoClasseEpilepsia.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Epilepsia</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseEpilepsia.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseEpilepsia.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseEpilepsia.conclusao}</p>
                  </div>
                )}
                {associacaoClasseAnemia && (
                  <div className={`p-4 rounded-lg ${associacaoClasseAnemia.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Anemia</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseAnemia.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseAnemia.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseAnemia.conclusao}</p>
                  </div>
                )}
                {associacaoClasseArtralgia && (
                  <div className={`p-4 rounded-lg ${associacaoClasseArtralgia.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Artralgia/Artrite</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseArtralgia.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseArtralgia.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseArtralgia.conclusao}</p>
                  </div>
                )}
                {associacaoClasseLesoesCutaneas && (
                  <div className={`p-4 rounded-lg ${associacaoClasseLesoesCutaneas.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Lesões Cutâneas</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseLesoesCutaneas.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseLesoesCutaneas.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseLesoesCutaneas.conclusao}</p>
                  </div>
                )}
                {associacaoClasseFebre && (
                  <div className={`p-4 rounded-lg ${associacaoClasseFebre.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Febre</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseFebre.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseFebre.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseFebre.conclusao}</p>
                  </div>
                )}
                {associacaoClasseSerosites && (
                  <div className={`p-4 rounded-lg ${associacaoClasseSerosites.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Serosites</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseSerosites.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseSerosites.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseSerosites.conclusao}</p>
                  </div>
                )}
                {associacaoClasseAcometimentoRenal && (
                  <div className={`p-4 rounded-lg ${associacaoClasseAcometimentoRenal.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Acometimento Renal</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseAcometimentoRenal.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseAcometimentoRenal.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseAcometimentoRenal.conclusao}</p>
                  </div>
                )}
                {associacaoClasseHematuria && (
                  <div className={`p-4 rounded-lg ${associacaoClasseHematuria.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Hematúria</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseHematuria.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseHematuria.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseHematuria.conclusao}</p>
                  </div>
                )}
                {associacaoClasseEdema && (
                  <div className={`p-4 rounded-lg ${associacaoClasseEdema.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Edema</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseEdema.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseEdema.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseEdema.conclusao}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comparação: Dados Histológicos vs Parâmetros Laboratoriais */}
            <div className="space-y-6 mt-8">
              <h3 className="font-semibold text-gray-800 border-b pb-2 border-teal-300">
                <span className="text-teal-700">Comparação: Dados Histológicos vs Parâmetros Laboratoriais</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Comparação de parâmetros laboratoriais entre classes histológicas graves (III, IV, VI) e leves (I, II, V).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testeCreatininaClasseGravidade && (
                  <div className={`p-4 rounded-lg ${testeCreatininaClasseGravidade.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-teal-50 border border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Creatinina: Graves vs Leves</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${testeCreatininaClasseGravidade.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(testeCreatininaClasseGravidade.teste.pValor)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Graves:</span> {formatarNumero(testeCreatininaClasseGravidade.grupo1.media, 2)} mg/dL |
                      <span className="font-medium"> Leves:</span> {formatarNumero(testeCreatininaClasseGravidade.grupo2.media, 2)} mg/dL
                    </div>
                    <p className="text-sm text-gray-600">{testeCreatininaClasseGravidade.conclusao}</p>
                  </div>
                )}
                {testeProteinuriaClasseGravidade && (
                  <div className={`p-4 rounded-lg ${testeProteinuriaClasseGravidade.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-teal-50 border border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Proteinúria: Graves vs Leves</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${testeProteinuriaClasseGravidade.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(testeProteinuriaClasseGravidade.teste.pValor)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Graves:</span> {formatarNumero(testeProteinuriaClasseGravidade.grupo1.media, 2)} g/24h |
                      <span className="font-medium"> Leves:</span> {formatarNumero(testeProteinuriaClasseGravidade.grupo2.media, 2)} g/24h
                    </div>
                    <p className="text-sm text-gray-600">{testeProteinuriaClasseGravidade.conclusao}</p>
                  </div>
                )}
                {testeTFGClasseGravidade && (
                  <div className={`p-4 rounded-lg ${testeTFGClasseGravidade.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-teal-50 border border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">TFG: Graves vs Leves</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${testeTFGClasseGravidade.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(testeTFGClasseGravidade.teste.pValor)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Graves:</span> {formatarNumero(testeTFGClasseGravidade.grupo1.media, 1)} mL/min |
                      <span className="font-medium"> Leves:</span> {formatarNumero(testeTFGClasseGravidade.grupo2.media, 1)} mL/min
                    </div>
                    <p className="text-sm text-gray-600">{testeTFGClasseGravidade.conclusao}</p>
                  </div>
                )}
                {testeC4ClasseGravidade && (
                  <div className={`p-4 rounded-lg ${testeC4ClasseGravidade.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-teal-50 border border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">C4: Graves vs Leves</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${testeC4ClasseGravidade.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(testeC4ClasseGravidade.teste.pValor)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Graves:</span> {formatarNumero(testeC4ClasseGravidade.grupo1.media, 1)} |
                      <span className="font-medium"> Leves:</span> {formatarNumero(testeC4ClasseGravidade.grupo2.media, 1)}
                    </div>
                    <p className="text-sm text-gray-600">{testeC4ClasseGravidade.conclusao}</p>
                  </div>
                )}
                {associacaoClasseAntiDNA && (
                  <div className={`p-4 rounded-lg ${associacaoClasseAntiDNA.teste.significativo ? 'bg-green-50 border border-green-200' : 'bg-teal-50 border border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-700">Classe vs Anti-dsDNA</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${associacaoClasseAntiDNA.teste.significativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        p = {formatarPValor(associacaoClasseAntiDNA.teste.pValor)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{associacaoClasseAntiDNA.conclusao}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso sobre limitações */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">Limitações da Análise</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Os resultados apresentados são exploratórios e devem ser interpretados com cautela.
                    Para amostras pequenas (&lt; 30), os testes paramétricos podem não ser os mais adequados.
                    Recomenda-se validação com amostras maiores e análise multivariada para conclusões definitivas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Seção: Relatório Escrito */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSecao('relatorio')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-gray-800">7. Relatório das Análises Estatísticas</span>
          </div>
          {secaoAberta === 'relatorio' ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {secaoAberta === 'relatorio' && (
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  const relatorio = document.getElementById('relatorio-texto');
                  if (relatorio) {
                    navigator.clipboard.writeText(relatorio.innerText);
                    alert('Relatório copiado para a área de transferência!');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Copiar Relatório
              </button>
            </div>

            <div id="relatorio-texto" className="prose prose-sm max-w-none bg-white p-6 rounded-lg border space-y-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">RELATÓRIO DETALHADO DAS ANÁLISES ESTATÍSTICAS</h2>

              {/* ===== TESTES QUI-QUADRADO ===== */}

              {/* Classe Histológica vs Desfecho Hospitalar */}
              {associacaoClasseDesfecho && (
                <div className="border-l-4 border-indigo-500 pl-4 py-2">
                  <h3 className="text-lg font-bold text-indigo-700 mb-3">
                    Análise: {associacaoClasseDesfecho.titulo}
                  </h3>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Interpretação do Teste</h4>
                  <p className="text-gray-600 mb-3">
                    p = {formatarPValor(associacaoClasseDesfecho.teste.pValor)} significa que há {associacaoClasseDesfecho.teste.pValor < 0.05
                      ? `apenas ${(associacaoClasseDesfecho.teste.pValor * 100).toFixed(0)}% de chance de que essa associação tenha ocorrido por acaso. Como p < 0.05, rejeitamos a hipótese nula (H0) de que as variáveis são independentes.`
                      : `${(associacaoClasseDesfecho.teste.pValor * 100).toFixed(0)}% de chance de que essa associação tenha ocorrido por acaso. Como p ≥ 0.05, não podemos rejeitar a hipótese nula (H0) de que as variáveis são independentes.`}
                  </p>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">O que a Tabela Mostra</h4>
                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-3 py-2 text-left">Classe</th>
                          {associacaoClasseDesfecho.tabela.colunas.map(col => (
                            <th key={col} className="border px-3 py-2 text-center">{col}</th>
                          ))}
                          <th className="border px-3 py-2 text-center font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoClasseDesfecho.tabela.linhas.map((linha, i) => (
                          <tr key={linha}>
                            <td className="border px-3 py-2 font-medium">{linha}</td>
                            {associacaoClasseDesfecho.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="border px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="border px-3 py-2 text-center font-bold">{associacaoClasseDesfecho.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="border px-3 py-2">Total</td>
                          {associacaoClasseDesfecho.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="border px-3 py-2 text-center">{total}</td>
                          ))}
                          <td className="border px-3 py-2 text-center">{associacaoClasseDesfecho.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Observações Importantes</h4>
                  <ul className="list-disc pl-5 text-gray-600 mb-3 space-y-1">
                    {associacaoClasseDesfecho.tabela.linhas.map((linha, i) => {
                      const total = associacaoClasseDesfecho.tabela.totaisLinhas[i];
                      const percent = ((total / associacaoClasseDesfecho.tabela.total) * 100).toFixed(0);
                      return total > 0 ? (
                        <li key={linha}>{linha} representa {total} de {associacaoClasseDesfecho.tabela.total} pacientes ({percent}%)</li>
                      ) : null;
                    })}
                    {associacaoClasseDesfecho.tabela.colunas.map((col, j) => {
                      const total = associacaoClasseDesfecho.tabela.totaisColunas[j];
                      const percent = ((total / associacaoClasseDesfecho.tabela.total) * 100).toFixed(0);
                      return (
                        <li key={col}>Desfecho "{col}": {total} pacientes ({percent}%)</li>
                      );
                    })}
                  </ul>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Significado Clínico</h4>
                  <p className="text-gray-600 mb-3">
                    {associacaoClasseDesfecho.teste.significativo
                      ? 'A conclusão sugere que a classificação ISN/RPS pode ter valor prognóstico - ou seja, a classe histológica da biópsia renal pode ajudar a prever o desfecho do paciente.'
                      : 'Não foi possível estabelecer uma relação significativa entre a classe histológica e o desfecho hospitalar nesta amostra.'}
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Atenção:</strong> Com uma amostra de {associacaoClasseDesfecho.tabela.total} pacientes
                      {associacaoClasseDesfecho.tabela.totaisColunas.some(t => t < 5) && ' e algumas células com frequência baixa'},
                      os resultados devem ser interpretados com cautela. Seria ideal ter mais casos com desfechos variados para confirmar essa associação.
                    </p>
                  </div>
                </div>
              )}

              {/* Classe Histológica vs Necessidade de Diálise */}
              {associacaoClasseDialise && (
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="text-lg font-bold text-blue-700 mb-3">
                    Análise: {associacaoClasseDialise.titulo}
                  </h3>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Interpretação do Teste</h4>
                  <p className="text-gray-600 mb-3">
                    p = {formatarPValor(associacaoClasseDialise.teste.pValor)} significa que há {associacaoClasseDialise.teste.pValor < 0.05
                      ? `apenas ${(associacaoClasseDialise.teste.pValor * 100).toFixed(0)}% de chance de que essa associação tenha ocorrido por acaso. Como p < 0.05, rejeitamos a hipótese nula (H0).`
                      : `${(associacaoClasseDialise.teste.pValor * 100).toFixed(0)}% de chance de que essa associação tenha ocorrido por acaso. Como p ≥ 0.05, não rejeitamos H0.`}
                  </p>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">O que a Tabela Mostra</h4>
                  <div className="overflow-x-auto mb-3">
                    <table className="min-w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-3 py-2 text-left">Classe</th>
                          {associacaoClasseDialise.tabela.colunas.map(col => (
                            <th key={col} className="border px-3 py-2 text-center">{col}</th>
                          ))}
                          <th className="border px-3 py-2 text-center font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associacaoClasseDialise.tabela.linhas.map((linha, i) => (
                          <tr key={linha}>
                            <td className="border px-3 py-2 font-medium">{linha}</td>
                            {associacaoClasseDialise.tabela.dados[i].map((valor, j) => (
                              <td key={j} className="border px-3 py-2 text-center">{valor}</td>
                            ))}
                            <td className="border px-3 py-2 text-center font-bold">{associacaoClasseDialise.tabela.totaisLinhas[i]}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="border px-3 py-2">Total</td>
                          {associacaoClasseDialise.tabela.totaisColunas.map((total, j) => (
                            <td key={j} className="border px-3 py-2 text-center">{total}</td>
                          ))}
                          <td className="border px-3 py-2 text-center">{associacaoClasseDialise.tabela.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Significado Clínico</h4>
                  <p className="text-gray-600 mb-3">
                    {associacaoClasseDialise.teste.significativo
                      ? 'Existe associação significativa entre a classe histológica e a necessidade de diálise, sugerindo que classes mais graves podem requerer mais frequentemente terapia dialítica.'
                      : 'Não foi encontrada associação significativa entre a classe histológica e a necessidade de diálise nesta amostra.'}
                  </p>
                </div>
              )}

              {/* ===== TESTES T DE STUDENT ===== */}

              {/* Creatinina vs Diálise */}
              {testeCreatininaDialise && (
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="text-lg font-bold text-green-700 mb-3">
                    Análise: {testeCreatininaDialise.titulo}
                  </h3>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Interpretação do Teste</h4>
                  <p className="text-gray-600 mb-3">
                    p = {formatarPValor(testeCreatininaDialise.teste.pValor)} {testeCreatininaDialise.teste.significativo
                      ? 'indica diferença estatisticamente significativa entre os grupos. Rejeitamos H0 de que as médias são iguais.'
                      : 'indica que não há diferença estatisticamente significativa entre os grupos. Não rejeitamos H0.'}
                  </p>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Comparação das Médias</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="font-medium text-blue-700">{testeCreatininaDialise.grupo1.nome}</p>
                      <p className="text-2xl font-bold text-blue-800">{formatarNumero(testeCreatininaDialise.grupo1.media, 2)} mg/dL</p>
                      <p className="text-sm text-blue-600">n = {testeCreatininaDialise.grupo1.n}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="font-medium text-green-700">{testeCreatininaDialise.grupo2.nome}</p>
                      <p className="text-2xl font-bold text-green-800">{formatarNumero(testeCreatininaDialise.grupo2.media, 2)} mg/dL</p>
                      <p className="text-sm text-green-600">n = {testeCreatininaDialise.grupo2.n}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Significado Clínico</h4>
                  <p className="text-gray-600 mb-3">
                    {testeCreatininaDialise.teste.significativo
                      ? `Pacientes que necessitaram de diálise apresentaram creatinina média ${testeCreatininaDialise.grupo1.media > testeCreatininaDialise.grupo2.media ? 'maior' : 'menor'}
                         (${formatarNumero(testeCreatininaDialise.grupo1.media, 2)} vs ${formatarNumero(testeCreatininaDialise.grupo2.media, 2)} mg/dL),
                         confirmando que níveis elevados de creatinina estão associados à necessidade de terapia dialítica.`
                      : 'Não foi encontrada diferença significativa na creatinina entre pacientes com e sem necessidade de diálise.'}
                  </p>
                </div>
              )}

              {/* Idade vs Diálise */}
              {testeIdadeDialise && (
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h3 className="text-lg font-bold text-purple-700 mb-3">
                    Análise: {testeIdadeDialise.titulo}
                  </h3>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Comparação das Médias</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="font-medium text-blue-700">{testeIdadeDialise.grupo1.nome}</p>
                      <p className="text-2xl font-bold text-blue-800">{formatarNumero(testeIdadeDialise.grupo1.media, 1)} anos</p>
                      <p className="text-sm text-blue-600">n = {testeIdadeDialise.grupo1.n}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="font-medium text-green-700">{testeIdadeDialise.grupo2.nome}</p>
                      <p className="text-2xl font-bold text-green-800">{formatarNumero(testeIdadeDialise.grupo2.media, 1)} anos</p>
                      <p className="text-sm text-green-600">n = {testeIdadeDialise.grupo2.n}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-700 mt-4 mb-2">Significado Clínico</h4>
                  <p className="text-gray-600 mb-3">
                    p = {formatarPValor(testeIdadeDialise.teste.pValor)}. {testeIdadeDialise.teste.significativo
                      ? `Existe diferença significativa na idade entre os grupos, sugerindo que a idade pode ser um fator associado à necessidade de diálise.`
                      : 'Não foi encontrada diferença significativa na idade entre pacientes com e sem necessidade de diálise.'}
                  </p>
                </div>
              )}

              {/* ===== RESUMO FINAL ===== */}
              <div className="border-t-2 border-gray-300 pt-6 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">RESUMO DOS ACHADOS SIGNIFICATIVOS (p &lt; 0,05)</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  {associacaoClasseDesfecho?.teste.significativo && (
                    <li><strong>Classe Histológica vs Desfecho:</strong> Associação significativa (p={formatarPValor(associacaoClasseDesfecho.teste.pValor)}) - A classificação ISN/RPS pode ter valor prognóstico.</li>
                  )}
                  {associacaoClasseDialise?.teste.significativo && (
                    <li><strong>Classe Histológica vs Diálise:</strong> Associação significativa (p={formatarPValor(associacaoClasseDialise.teste.pValor)}) - Classes mais graves podem requerer diálise.</li>
                  )}
                  {testeCreatininaDialise?.teste.significativo && (
                    <li><strong>Creatinina vs Diálise:</strong> Diferença significativa (p={formatarPValor(testeCreatininaDialise.teste.pValor)}) - Creatinina elevada associada à necessidade de diálise.</li>
                  )}
                  {testeIdadeDialise?.teste.significativo && (
                    <li><strong>Idade vs Diálise:</strong> Diferença significativa (p={formatarPValor(testeIdadeDialise.teste.pValor)}) - Idade pode ser fator de risco para diálise.</li>
                  )}
                  {testeProteinuriaDialise?.teste.significativo && (
                    <li><strong>Proteinúria vs Diálise:</strong> Diferença significativa (p={formatarPValor(testeProteinuriaDialise.teste.pValor)}) - Proteinúria elevada associada à necessidade de diálise.</li>
                  )}
                  {associacaoHASDialise?.teste.significativo && (
                    <li><strong>HAS vs Diálise:</strong> Associação significativa (p={formatarPValor(associacaoHASDialise.teste.pValor)}) - HAS pode aumentar risco de diálise.</li>
                  )}
                  {associacaoEdemaDialise?.teste.significativo && (
                    <li><strong>Edema vs Diálise:</strong> Associação significativa (p={formatarPValor(associacaoEdemaDialise.teste.pValor)}) - Edema pode ser marcador de gravidade.</li>
                  )}
                  {![
                    associacaoClasseDesfecho?.teste.significativo,
                    associacaoClasseDialise?.teste.significativo,
                    testeCreatininaDialise?.teste.significativo,
                    testeIdadeDialise?.teste.significativo,
                    testeProteinuriaDialise?.teste.significativo,
                    associacaoHASDialise?.teste.significativo,
                    associacaoEdemaDialise?.teste.significativo,
                  ].some(Boolean) && (
                    <li>Nenhuma associação estatisticamente significativa foi encontrada nos principais testes realizados.</li>
                  )}
                </ul>
              </div>

              {/* ===== CONSIDERAÇÕES METODOLÓGICAS ===== */}
              <div className="bg-gray-100 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">CONSIDERAÇÕES METODOLÓGICAS</h3>
                <p className="text-gray-600 mb-2">
                  Os resultados apresentados são de natureza <strong>exploratória</strong> e devem ser interpretados com cautela, considerando:
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Tamanho amostral: {pacientes.length} pacientes</li>
                  <li>Teste qui-quadrado de Pearson para variáveis categóricas</li>
                  <li>Teste t de Student para comparação de médias entre grupos independentes</li>
                  <li>Nível de significância adotado: 5% (p &lt; 0,05)</li>
                  <li>Recomenda-se validação com amostras maiores e análise multivariada</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
