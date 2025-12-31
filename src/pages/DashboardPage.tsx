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
  formatarNumero,
  formatarPorcentagem,
} from '../lib/statistics';
import {
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_DESFECHO,
  OPCOES_COMORBIDADES,
  OPCOES_MANIFESTACOES_LES,
  getFaixaEtaria,
} from '../types';
import { Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function DashboardPage() {
  const { pacientes } = usePacientes();

  const estatisticas = useMemo(() => {
    if (pacientes.length === 0) return null;
    return calcularEstatisticasGerais(pacientes);
  }, [pacientes]);

  const distribuicaoClasses = useMemo(() => {
    const valores = pacientes
      .map((p) => p.classificacaoHistologica)
      .filter((c): c is string => !!c);
    return calcularDistribuicaoFrequencia(valores, OPCOES_CLASSE_HISTOLOGICA);
  }, [pacientes]);

  const distribuicaoDesfechos = useMemo(() => {
    const valores = pacientes
      .map((p) => p.desfechoAlta)
      .filter((d): d is string => !!d);
    return calcularDistribuicaoFrequencia(valores, OPCOES_DESFECHO);
  }, [pacientes]);

  const distribuicaoComorbidades = useMemo(() => {
    const arrays = pacientes.map((p) => p.comorbidades);
    return calcularDistribuicaoMultipla(arrays, OPCOES_COMORBIDADES);
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Histológicas */}
        <Card title="Classificação Histológica">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribuicaoClasses.filter((d) => d.frequenciaAbsoluta > 0)}
                dataKey="frequenciaAbsoluta"
                nameKey="rotulo"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name.split(' - ')[0]} (${(percent * 100).toFixed(0)}%)`
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

        {/* Comorbidades */}
        <Card title="Comorbidades Associadas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={distribuicaoComorbidades}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="rotulo" />
              <Tooltip />
              <Bar dataKey="porcentagem" fill="#F59E0B" name="%" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

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
        <Card title="Função Renal">
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
