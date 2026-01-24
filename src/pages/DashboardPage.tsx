import { useMemo } from 'react';
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
} from 'recharts';
import {
  calcularEstatisticasGerais,
  calcularDistribuicaoFrequencia,
  calcularDistribuicaoMultipla,
  calcularEstatisticasDescritivas,
  formatarNumero,
  formatarPorcentagem,
} from '../lib/statistics';
import {
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_DESFECHO,
  OPCOES_COMORBIDADES,
  OPCOES_IMUNOFLUORESCENCIA,
  OPCOES_MEDICAMENTOS,
  getFaixaEtaria,
  type DesfechoAlta,
} from '../types';
import { Users, Activity, TrendingUp, AlertCircle, Pill, FlaskConical } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function DashboardPage() {
  const { pacientes } = usePacientes();

  const estatisticas = useMemo(() => {
    if (pacientes.length === 0) return null;
    return calcularEstatisticasGerais(pacientes);
  }, [pacientes]);

  const distribuicaoClasses = useMemo(() => {
    const arrays = pacientes.map((p) => p.classificacaoHistologica || []);
    return calcularDistribuicaoMultipla(arrays, OPCOES_CLASSE_HISTOLOGICA);
  }, [pacientes]);

  const distribuicaoDesfechos = useMemo(() => {
    const valores = pacientes
      .map((p) => p.desfechoAlta)
      .filter((d): d is DesfechoAlta => !!d);
    return calcularDistribuicaoFrequencia(valores, OPCOES_DESFECHO);
  }, [pacientes]);

  // Distribuição de comorbidades com detalhamento de "Outras"
  const distribuicaoComorbidades = useMemo(() => {
    const arrays = pacientes.map((p) => p.comorbidades);
    const distribuicao = calcularDistribuicaoMultipla(arrays, OPCOES_COMORBIDADES);

    // Coletar detalhes das "outras" comorbidades
    const outrasComorbidadesDetalhes: Record<string, number> = {};
    pacientes.forEach((p) => {
      if (p.comorbidades?.includes('outras') && p.outrasComorbidades) {
        const descricao = p.outrasComorbidades.trim();
        if (descricao) {
          outrasComorbidadesDetalhes[descricao] = (outrasComorbidadesDetalhes[descricao] || 0) + 1;
        }
      }
    });

    return { distribuicao, outrasComorbidadesDetalhes };
  }, [pacientes]);

  const distribuicaoIdade = useMemo(() => {
    const faixas: Record<string, number> = {};
    pacientes.forEach((p) => {
      const faixa = getFaixaEtaria(p.idade);
      faixas[faixa] = (faixas[faixa] || 0) + 1;
    });
    return Object.entries(faixas).map(([faixa, count]) => ({
      faixa,
      quantidade: count,
    }));
  }, [pacientes]);

  // TFG por sexo
  const tfgPorSexo = useMemo(() => {
    const feminino = pacientes.filter((p) => p.sexo === 'feminino');
    const masculino = pacientes.filter((p) => p.sexo === 'masculino');

    const tfgFeminino = feminino
      .map((p) => p.tfgEstimada)
      .filter((t): t is number => typeof t === 'number' && !isNaN(t) && t > 0);
    const tfgMasculino = masculino
      .map((p) => p.tfgEstimada)
      .filter((t): t is number => typeof t === 'number' && !isNaN(t) && t > 0);

    const creatininaFeminino = feminino
      .map((p) => p.creatininaSerica)
      .filter((c): c is number => typeof c === 'number' && !isNaN(c) && c > 0);
    const creatininaMasculino = masculino
      .map((p) => p.creatininaSerica)
      .filter((c): c is number => typeof c === 'number' && !isNaN(c) && c > 0);

    return {
      feminino: {
        n: feminino.length,
        tfg: calcularEstatisticasDescritivas(tfgFeminino),
        creatinina: calcularEstatisticasDescritivas(creatininaFeminino),
      },
      masculino: {
        n: masculino.length,
        tfg: calcularEstatisticasDescritivas(tfgMasculino),
        creatinina: calcularEstatisticasDescritivas(creatininaMasculino),
      },
    };
  }, [pacientes]);

  // Pacientes com múltiplas classes histológicas
  const pacientesMultiplasClasses = useMemo(() => {
    const pacientesComMultiplas = pacientes.filter(
      (p) => p.classificacaoHistologica && p.classificacaoHistologica.length > 1
    );

    // Contar combinações
    const combinacoes: Record<string, number> = {};
    pacientesComMultiplas.forEach((p) => {
      const classes = p.classificacaoHistologica
        .map((c) => {
          const opcao = OPCOES_CLASSE_HISTOLOGICA.find((o) => o.value === c);
          return opcao ? opcao.label.split(' - ')[0] : c;
        })
        .sort()
        .join(' + ');
      combinacoes[classes] = (combinacoes[classes] || 0) + 1;
    });

    return {
      total: pacientesComMultiplas.length,
      porcentagem: (pacientesComMultiplas.length / pacientes.length) * 100,
      combinacoes: Object.entries(combinacoes)
        .map(([combinacao, count]) => ({ combinacao, quantidade: count }))
        .sort((a, b) => b.quantidade - a.quantidade),
    };
  }, [pacientes]);

  // Comparação de medicações antes e após biópsia
  const comparacaoMedicacoes = useMemo(() => {
    const medicamentosAntes: Record<string, number> = {};
    const medicamentosApos: Record<string, number> = {};
    const mudancaTerapeutica: { comMudanca: number; semMudanca: number; semDados: number } = {
      comMudanca: 0,
      semMudanca: 0,
      semDados: 0,
    };

    pacientes.forEach((p) => {
      // Medicamentos antes
      p.medicamentosAntesBiopsia?.forEach((med) => {
        const opcao = OPCOES_MEDICAMENTOS.find((o) => o.value === med);
        const label = opcao ? opcao.label : med;
        medicamentosAntes[label] = (medicamentosAntes[label] || 0) + 1;
      });

      // Medicamentos após (do campo esquemaTerapeuticoAposBiopsia)
      if (p.esquemaTerapeuticoAposBiopsia) {
        const esquema = p.esquemaTerapeuticoAposBiopsia.toLowerCase();

        // Detectar medicamentos no texto
        if (esquema.includes('corticoide') || esquema.includes('prednisona') || esquema.includes('prednisolona')) {
          medicamentosApos['Corticoide'] = (medicamentosApos['Corticoide'] || 0) + 1;
        }
        if (esquema.includes('micofenolato') || esquema.includes('cellcept')) {
          medicamentosApos['Micofenolato'] = (medicamentosApos['Micofenolato'] || 0) + 1;
        }
        if (esquema.includes('ciclofosfamida')) {
          medicamentosApos['Ciclofosfamida'] = (medicamentosApos['Ciclofosfamida'] || 0) + 1;
        }
        if (esquema.includes('hidroxicloroquina') || esquema.includes('plaquinol')) {
          medicamentosApos['Hidroxicloroquina'] = (medicamentosApos['Hidroxicloroquina'] || 0) + 1;
        }
        if (esquema.includes('pulsoterapia') || esquema.includes('pulso')) {
          medicamentosApos['Pulsoterapia'] = (medicamentosApos['Pulsoterapia'] || 0) + 1;
        }
        if (esquema.includes('rituximab') || esquema.includes('azatioprina') || esquema.includes('belimumab')) {
          medicamentosApos['Outros'] = (medicamentosApos['Outros'] || 0) + 1;
        }
      }

      // Verificar mudança terapêutica
      if (!p.esquemaTerapeuticoAposBiopsia && (!p.medicamentosAntesBiopsia || p.medicamentosAntesBiopsia.length === 0)) {
        mudancaTerapeutica.semDados++;
      } else if (p.esquemaTerapeuticoAposBiopsia) {
        mudancaTerapeutica.comMudanca++;
      } else {
        mudancaTerapeutica.semMudanca++;
      }
    });

    // Preparar dados para o gráfico comparativo
    const todasMedicacoes = new Set([...Object.keys(medicamentosAntes), ...Object.keys(medicamentosApos)]);
    const dadosComparativo = Array.from(todasMedicacoes).map((med) => ({
      medicamento: med,
      antes: medicamentosAntes[med] || 0,
      apos: medicamentosApos[med] || 0,
    }));

    return {
      medicamentosAntes,
      medicamentosApos,
      mudancaTerapeutica,
      dadosComparativo,
    };
  }, [pacientes]);

  // Correlação classificação histopatológica com autoanticorpos
  const correlacaoHistoAutoanticorpos = useMemo(() => {
    const correlacao: Record<string, { antiDsDNAPositivo: number; antiDsDNANegativo: number; total: number; c3Baixo: number; c4Baixo: number }> = {};

    pacientes.forEach((p) => {
      p.classificacaoHistologica?.forEach((classe) => {
        const opcao = OPCOES_CLASSE_HISTOLOGICA.find((o) => o.value === classe);
        const label = opcao ? opcao.label.split(' - ')[0] : classe;

        if (!correlacao[label]) {
          correlacao[label] = { antiDsDNAPositivo: 0, antiDsDNANegativo: 0, total: 0, c3Baixo: 0, c4Baixo: 0 };
        }

        correlacao[label].total++;

        if (p.antiDsDNA === 'reagente') {
          correlacao[label].antiDsDNAPositivo++;
        } else if (p.antiDsDNA === 'nao_reagente') {
          correlacao[label].antiDsDNANegativo++;
        }

        // C3 baixo (valor de referência: < 90 mg/dL)
        if (p.c3 !== undefined && p.c3 < 90) {
          correlacao[label].c3Baixo++;
        }

        // C4 baixo (valor de referência: < 10 mg/dL)
        if (p.c4 !== undefined && p.c4 < 10) {
          correlacao[label].c4Baixo++;
        }
      });
    });

    // Preparar dados para visualização
    const dadosGrafico = Object.entries(correlacao)
      .filter(([_, dados]) => dados.total > 0)
      .map(([classe, dados]) => ({
        classe,
        antiDsDNAPositivo: Math.round((dados.antiDsDNAPositivo / dados.total) * 100),
        c3Baixo: Math.round((dados.c3Baixo / dados.total) * 100),
        c4Baixo: Math.round((dados.c4Baixo / dados.total) * 100),
        total: dados.total,
      }));

    return { correlacao, dadosGrafico };
  }, [pacientes]);

  // Distribuição de imunofluorescência
  const distribuicaoImunofluorescencia = useMemo(() => {
    const arrays = pacientes.map((p) => p.imunofluorescenciaPositiva || []);
    return calcularDistribuicaoMultipla(arrays, OPCOES_IMUNOFLUORESCENCIA);
  }, [pacientes]);

  if (pacientes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Nenhum paciente cadastrado ainda.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Adicione pacientes para visualizar as estatísticas.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas?.total}</p>
              <p className="text-sm text-gray-500">Total de Pacientes</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatarNumero(estatisticas?.idade?.media, 1)}
              </p>
              <p className="text-sm text-gray-500">Idade Média (anos)</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatarPorcentagem(estatisticas?.sexo.porcentagemFeminino)}
              </p>
              <p className="text-sm text-gray-500">Sexo Feminino</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatarPorcentagem(estatisticas?.dialise.porcentagem)}
              </p>
              <p className="text-sm text-gray-500">Necessitaram Diálise</p>
            </div>
          </div>
        </Card>
      </div>

      {/* TFG por Sexo */}
      <Card title="Taxa de Filtração Glomerular (TFG) por Sexo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-pink-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              Feminino (n={tfgPorSexo.feminino.n})
            </h4>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-1 text-gray-600">TFG Média</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.feminino.tfg?.media, 1)} mL/min
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">TFG Mediana</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.feminino.tfg?.mediana, 1)} mL/min
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">TFG DP</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.feminino.tfg?.desvioPadrao, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Creatinina Média</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.feminino.creatinina?.media)} mg/dL
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-blue-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Masculino (n={tfgPorSexo.masculino.n})
            </h4>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-1 text-gray-600">TFG Média</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.masculino.tfg?.media, 1)} mL/min
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">TFG Mediana</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.masculino.tfg?.mediana, 1)} mL/min
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">TFG DP</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.masculino.tfg?.desvioPadrao, 1)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Creatinina Média</td>
                  <td className="py-1 text-right font-medium">
                    {formatarNumero(tfgPorSexo.masculino.creatinina?.media)} mg/dL
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                {
                  sexo: 'Feminino',
                  tfg: tfgPorSexo.feminino.tfg?.media || 0,
                  creatinina: tfgPorSexo.feminino.creatinina?.media || 0,
                },
                {
                  sexo: 'Masculino',
                  tfg: tfgPorSexo.masculino.tfg?.media || 0,
                  creatinina: tfgPorSexo.masculino.creatinina?.media || 0,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sexo" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'TFG (mL/min)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Creatinina (mg/dL)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="tfg" fill="#EC4899" name="TFG (mL/min)" />
              <Bar yAxisId="right" dataKey="creatinina" fill="#3B82F6" name="Creatinina (mg/dL)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Histológicas */}
        <Card title="Classificação Histológica">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribuicaoClasses.filter((d) => d.frequenciaAbsoluta > 0) as unknown as Record<string, unknown>[]}
                dataKey="frequenciaAbsoluta"
                nameKey="rotulo"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${(name ?? '').split(' - ')[0]} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
              >
                {distribuicaoClasses.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Desfechos */}
        <Card title="Desfechos">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribuicaoDesfechos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rotulo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="frequenciaAbsoluta" fill="#3B82F6" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição por Idade */}
        <Card title="Distribuição por Faixa Etária">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribuicaoIdade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="faixa" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#10B981" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Comorbidades com detalhamento de "Outras" */}
        <Card title="Comorbidades Associadas">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={distribuicaoComorbidades.distribuicao}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="rotulo" />
              <Tooltip />
              <Bar dataKey="porcentagem" fill="#F59E0B" name="%" />
            </BarChart>
          </ResponsiveContainer>
          {Object.keys(distribuicaoComorbidades.outrasComorbidadesDetalhes).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Detalhamento de "Outras" Comorbidades:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(distribuicaoComorbidades.outrasComorbidadesDetalhes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([descricao, count]) => (
                    <li key={descricao} className="flex justify-between">
                      <span>{descricao}</span>
                      <span className="font-medium">{count} ({formatarPorcentagem((count / pacientes.length) * 100)})</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Pacientes com Múltiplas Classes Histológicas */}
      <Card title="Pacientes com Múltiplas Classes Histológicas na Biópsia">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{pacientesMultiplasClasses.total}</p>
            <p className="text-sm text-gray-600">Pacientes com múltiplas classes</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {formatarPorcentagem(pacientesMultiplasClasses.porcentagem)}
            </p>
            <p className="text-sm text-gray-600">Do total de pacientes</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{pacientesMultiplasClasses.combinacoes.length}</p>
            <p className="text-sm text-gray-600">Combinações diferentes</p>
          </div>
        </div>
        {pacientesMultiplasClasses.combinacoes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Combinações de Classes:</h4>
            <ResponsiveContainer width="100%" height={Math.max(200, pacientesMultiplasClasses.combinacoes.length * 40)}>
              <BarChart
                data={pacientesMultiplasClasses.combinacoes}
                layout="vertical"
                margin={{ left: 150 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="combinacao" width={140} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8B5CF6" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {pacientesMultiplasClasses.total === 0 && (
          <p className="text-gray-500 text-center py-4">
            Nenhum paciente com múltiplas classes histológicas registrado.
          </p>
        )}
      </Card>

      {/* Comparação de Medicações Antes e Após Biópsia */}
      <Card title="Comparação do Manejo Terapêutico: Antes vs Após Biópsia">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-700">Mudança Terapêutica</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{comparacaoMedicacoes.mudancaTerapeutica.comMudanca}</p>
            <p className="text-sm text-gray-600">Com mudança terapêutica</p>
            <p className="text-xs text-gray-500">
              ({formatarPorcentagem((comparacaoMedicacoes.mudancaTerapeutica.comMudanca / pacientes.length) * 100)})
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{comparacaoMedicacoes.mudancaTerapeutica.semMudanca}</p>
            <p className="text-sm text-gray-600">Sem mudança terapêutica</p>
            <p className="text-xs text-gray-500">
              ({formatarPorcentagem((comparacaoMedicacoes.mudancaTerapeutica.semMudanca / pacientes.length) * 100)})
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{comparacaoMedicacoes.mudancaTerapeutica.semDados}</p>
            <p className="text-sm text-gray-600">Sem dados completos</p>
            <p className="text-xs text-gray-500">
              ({formatarPorcentagem((comparacaoMedicacoes.mudancaTerapeutica.semDados / pacientes.length) * 100)})
            </p>
          </div>
        </div>
        <h4 className="font-medium text-gray-700 mb-3">Comparativo de Medicamentos:</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparacaoMedicacoes.dadosComparativo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="medicamento" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="antes" fill="#3B82F6" name="Antes da Biópsia" />
            <Bar dataKey="apos" fill="#10B981" name="Após a Biópsia" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Correlação Classificação Histopatológica x Autoanticorpos */}
      <Card title="Correlação: Classificação Histopatológica x Perfil de Autoanticorpos">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            Análise da relação entre classe histológica e marcadores imunológicos (Anti-dsDNA, C3, C4)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={correlacaoHistoAutoanticorpos.dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="classe" />
            <YAxis label={{ value: 'Porcentagem (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="antiDsDNAPositivo" fill="#EF4444" name="Anti-dsDNA Positivo (%)" />
            <Bar dataKey="c3Baixo" fill="#F59E0B" name="C3 Baixo (%)" />
            <Bar dataKey="c4Baixo" fill="#8B5CF6" name="C4 Baixo (%)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">Tabela Detalhada:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-3">Classe</th>
                  <th className="text-center py-2 px-3">N</th>
                  <th className="text-center py-2 px-3">Anti-dsDNA (+)</th>
                  <th className="text-center py-2 px-3">C3 Baixo</th>
                  <th className="text-center py-2 px-3">C4 Baixo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(correlacaoHistoAutoanticorpos.correlacao)
                  .filter(([_, dados]) => dados.total > 0)
                  .map(([classe, dados]) => (
                    <tr key={classe}>
                      <td className="py-2 px-3 font-medium">{classe}</td>
                      <td className="text-center py-2 px-3">{dados.total}</td>
                      <td className="text-center py-2 px-3">
                        {dados.antiDsDNAPositivo} ({formatarPorcentagem((dados.antiDsDNAPositivo / dados.total) * 100)})
                      </td>
                      <td className="text-center py-2 px-3">
                        {dados.c3Baixo} ({formatarPorcentagem((dados.c3Baixo / dados.total) * 100)})
                      </td>
                      <td className="text-center py-2 px-3">
                        {dados.c4Baixo} ({formatarPorcentagem((dados.c4Baixo / dados.total) * 100)})
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">Interpretação Clínica:</h5>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Anti-dsDNA positivo está associado a maior atividade da doença</li>
              <li>Consumo de complemento (C3/C4 baixos) indica atividade imunológica</li>
              <li>Classes III e IV geralmente apresentam maior positividade de autoanticorpos</li>
              <li>A presença de múltiplos marcadores sugere doença mais ativa</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Gráfico de Imunofluorescência */}
      <Card title="Resultados da Imunofluorescência">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribuicaoImunofluorescencia.filter((d) => d.frequenciaAbsoluta > 0) as unknown as Record<string, unknown>[]}
                  dataKey="frequenciaAbsoluta"
                  nameKey="rotulo"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {distribuicaoImunofluorescencia.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Distribuição dos Marcadores:</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={distribuicaoImunofluorescencia}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="rotulo" />
                <Tooltip />
                <Bar dataKey="frequenciaAbsoluta" fill="#06B6D4" name="Quantidade">
                  {distribuicaoImunofluorescencia.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Frequência de Positividade:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {distribuicaoImunofluorescencia.map((item, index) => (
              <div
                key={item.valor}
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
              >
                <p
                  className="text-xl font-bold"
                  style={{ color: COLORS[index % COLORS.length] }}
                >
                  {item.frequenciaAbsoluta}
                </p>
                <p className="text-sm text-gray-600">{item.rotulo}</p>
                <p className="text-xs text-gray-500">{formatarPorcentagem(item.porcentagem)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-cyan-50 rounded-lg">
            <h5 className="font-medium text-cyan-800 mb-2">Padrão "Full House":</h5>
            <p className="text-sm text-cyan-700">
              O padrão "full house" (IgG, IgA, IgM, C3 e C1q positivos) é característico da nefrite lúpica e
              ajuda a diferenciar de outras glomerulonefrites. A presença de C1q é particularmente específica para LES.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabelas de estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas descritivas */}
        <Card title="Estatísticas Descritivas - Idade">
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 text-gray-600">N</td>
                <td className="py-2 text-right font-medium">
                  {estatisticas?.idade?.n || '-'}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Média</td>
                <td className="py-2 text-right font-medium">
                  {formatarNumero(estatisticas?.idade?.media, 1)} anos
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Mediana</td>
                <td className="py-2 text-right font-medium">
                  {formatarNumero(estatisticas?.idade?.mediana, 1)} anos
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Desvio Padrão</td>
                <td className="py-2 text-right font-medium">
                  {formatarNumero(estatisticas?.idade?.desvioPadrao, 2)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Mínimo</td>
                <td className="py-2 text-right font-medium">
                  {estatisticas?.idade?.minimo || '-'} anos
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Máximo</td>
                <td className="py-2 text-right font-medium">
                  {estatisticas?.idade?.maximo || '-'} anos
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Creatinina e TFG */}
        <Card title="Função Renal - Geral">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Creatinina Sérica (mg/dL)
              </h4>
              <table className="w-full">
                <tbody className="divide-y divide-gray-100 text-sm">
                  <tr>
                    <td className="py-1 text-gray-600">Média</td>
                    <td className="py-1 text-right">
                      {formatarNumero(estatisticas?.creatinina?.media)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Mediana</td>
                    <td className="py-1 text-right">
                      {formatarNumero(estatisticas?.creatinina?.mediana)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">DP</td>
                    <td className="py-1 text-right">
                      {formatarNumero(estatisticas?.creatinina?.desvioPadrao)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                TFG Estimada (mL/min)
              </h4>
              <table className="w-full">
                <tbody className="divide-y divide-gray-100 text-sm">
                  <tr>
                    <td className="py-1 text-gray-600">Média</td>
                    <td className="py-1 text-right">
                      {formatarNumero(estatisticas?.tfg?.media, 1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Mediana</td>
                    <td className="py-1 text-right">
                      {formatarNumero(estatisticas?.tfg?.mediana, 1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">DP</td>
                    <td className="py-1 text-right">
                      {formatarNumero(estatisticas?.tfg?.desvioPadrao, 1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
