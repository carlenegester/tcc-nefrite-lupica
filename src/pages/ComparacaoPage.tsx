import { useMemo, useState } from 'react';
import { usePacientes } from '../hooks/usePacientes';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  calcularEstatisticasDescritivas,
  formatarNumero,
  formatarPorcentagem,
} from '../lib/statistics';
import {
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_DESFECHO,
  getFaixaEtaria,
  type Paciente,
} from '../types';
import { AlertCircle, Users } from 'lucide-react';

type VariavelAgrupamento = 'sexo' | 'faixaEtaria' | 'etnia' | 'dialise';

const VARIAVEIS_AGRUPAMENTO = [
  { value: 'sexo', label: 'Sexo' },
  { value: 'faixaEtaria', label: 'Faixa Etária' },
  { value: 'etnia', label: 'Etnia' },
  { value: 'dialise', label: 'Necessidade de Diálise' },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function agruparPacientes(
  pacientes: Paciente[],
  variavel: VariavelAgrupamento
): Record<string, Paciente[]> {
  const grupos: Record<string, Paciente[]> = {};

  pacientes.forEach((p) => {
    let chave: string;

    switch (variavel) {
      case 'sexo':
        chave = p.sexo === 'M' ? 'Masculino' : 'Feminino';
        break;
      case 'faixaEtaria':
        chave = getFaixaEtaria(p.idade);
        break;
      case 'etnia':
        chave = p.etnia || 'Não informado';
        break;
      case 'dialise':
        chave = p.necessidadeDialise ? 'Com diálise' : 'Sem diálise';
        break;
      default:
        chave = 'Outros';
    }

    if (!grupos[chave]) {
      grupos[chave] = [];
    }
    grupos[chave].push(p);
  });

  return grupos;
}

function calcularEstatisticasGrupo(pacientes: Paciente[]) {
  const idades = pacientes.map((p) => p.idade);
  const creatininas = pacientes
    .map((p) => p.creatininaSerica)
    .filter((c): c is number => c !== undefined);
  const tfgs = pacientes
    .map((p) => p.tfgEstimada)
    .filter((t): t is number => t !== undefined);

  const comDialise = pacientes.filter((p) => p.necessidadeDialise).length;
  const feminino = pacientes.filter((p) => p.sexo === 'F').length;

  return {
    n: pacientes.length,
    idade: calcularEstatisticasDescritivas(idades),
    creatinina: calcularEstatisticasDescritivas(creatininas),
    tfg: calcularEstatisticasDescritivas(tfgs),
    porcentagemDialise: (comDialise / pacientes.length) * 100,
    porcentagemFeminino: (feminino / pacientes.length) * 100,
  };
}

export function ComparacaoPage() {
  const { pacientes } = usePacientes();
  const [variavel, setVariavel] = useState<VariavelAgrupamento>('sexo');

  const grupos = useMemo(() => {
    if (pacientes.length === 0) return {};
    return agruparPacientes(pacientes, variavel);
  }, [pacientes, variavel]);

  const estatisticasPorGrupo = useMemo(() => {
    const resultado: Record<string, ReturnType<typeof calcularEstatisticasGrupo>> = {};
    Object.entries(grupos).forEach(([nome, pacientesGrupo]) => {
      resultado[nome] = calcularEstatisticasGrupo(pacientesGrupo);
    });
    return resultado;
  }, [grupos]);

  const dadosIdade = useMemo(() => {
    return Object.entries(estatisticasPorGrupo).map(([nome, stats]) => ({
      grupo: nome,
      media: stats.idade.media,
      mediana: stats.idade.mediana,
    }));
  }, [estatisticasPorGrupo]);

  const dadosFuncaoRenal = useMemo(() => {
    return Object.entries(estatisticasPorGrupo).map(([nome, stats]) => ({
      grupo: nome,
      creatinina: stats.creatinina.media,
      tfg: stats.tfg.media,
    }));
  }, [estatisticasPorGrupo]);

  const dadosClassesPorGrupo = useMemo(() => {
    const classesPorGrupo: Record<string, Record<string, number>> = {};

    Object.entries(grupos).forEach(([nomeGrupo, pacientesGrupo]) => {
      classesPorGrupo[nomeGrupo] = {};
      OPCOES_CLASSE_HISTOLOGICA.forEach((opcao) => {
        const count = pacientesGrupo.filter(
          (p) => p.classificacaoHistologica === opcao.value
        ).length;
        classesPorGrupo[nomeGrupo][opcao.label] = count;
      });
    });

    return OPCOES_CLASSE_HISTOLOGICA.map((opcao) => {
      const item: Record<string, string | number> = { classe: opcao.label.split(' - ')[0] };
      Object.keys(grupos).forEach((nomeGrupo) => {
        item[nomeGrupo] = classesPorGrupo[nomeGrupo][opcao.label] || 0;
      });
      return item;
    });
  }, [grupos]);

  const dadosDesfechosPorGrupo = useMemo(() => {
    const desfechosPorGrupo: Record<string, Record<string, number>> = {};

    Object.entries(grupos).forEach(([nomeGrupo, pacientesGrupo]) => {
      desfechosPorGrupo[nomeGrupo] = {};
      OPCOES_DESFECHO.forEach((opcao) => {
        const count = pacientesGrupo.filter(
          (p) => p.desfechoAlta === opcao.value
        ).length;
        desfechosPorGrupo[nomeGrupo][opcao.label] = count;
      });
    });

    return OPCOES_DESFECHO.map((opcao) => {
      const item: Record<string, string | number> = { desfecho: opcao.label };
      Object.keys(grupos).forEach((nomeGrupo) => {
        item[nomeGrupo] = desfechosPorGrupo[nomeGrupo][opcao.label] || 0;
      });
      return item;
    });
  }, [grupos]);

  if (pacientes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Comparação entre Grupos</h1>
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Nenhum paciente cadastrado ainda.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Adicione pacientes para visualizar as comparações.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const nomesGrupos = Object.keys(grupos);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Comparação entre Grupos</h1>
        <div className="w-full sm:w-64">
          <Select
            label="Agrupar por"
            value={variavel}
            onChange={(e) => setVariavel(e.target.value as VariavelAgrupamento)}
            options={VARIAVEIS_AGRUPAMENTO}
          />
        </div>
      </div>

      {/* Cards de resumo por grupo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(estatisticasPorGrupo).map(([nome, stats], index) => (
          <Card key={nome}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
              >
                <Users
                  className="w-5 h-5"
                  style={{ color: COLORS[index % COLORS.length] }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{nome}</h3>
                <p className="text-sm text-gray-500">{stats.n} pacientes</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Idade média:</span>
                <span className="font-medium">
                  {formatarNumero(stats.idade.media, 1)} anos
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creatinina média:</span>
                <span className="font-medium">
                  {formatarNumero(stats.creatinina.media)} mg/dL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TFG média:</span>
                <span className="font-medium">
                  {formatarNumero(stats.tfg.media, 1)} mL/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diálise:</span>
                <span className="font-medium">
                  {formatarPorcentagem(stats.porcentagemDialise)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabela comparativa detalhada */}
      <Card title="Estatísticas Comparativas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Variável</th>
                {nomesGrupos.map((nome) => (
                  <th key={nome} className="text-center py-2 px-3">
                    {nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 px-3 font-medium text-gray-700">N</td>
                {nomesGrupos.map((nome) => (
                  <td key={nome} className="text-center py-2 px-3">
                    {estatisticasPorGrupo[nome].n}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={nomesGrupos.length + 1} className="py-2 px-3 font-semibold text-gray-800">
                  Idade (anos)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6 text-gray-600">Média ± DP</td>
                {nomesGrupos.map((nome) => (
                  <td key={nome} className="text-center py-2 px-3">
                    {formatarNumero(estatisticasPorGrupo[nome].idade.media, 1)} ±{' '}
                    {formatarNumero(estatisticasPorGrupo[nome].idade.desvioPadrao, 1)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6 text-gray-600">Mediana</td>
                {nomesGrupos.map((nome) => (
                  <td key={nome} className="text-center py-2 px-3">
                    {formatarNumero(estatisticasPorGrupo[nome].idade.mediana, 1)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={nomesGrupos.length + 1} className="py-2 px-3 font-semibold text-gray-800">
                  Creatinina Sérica (mg/dL)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6 text-gray-600">Média ± DP</td>
                {nomesGrupos.map((nome) => (
                  <td key={nome} className="text-center py-2 px-3">
                    {formatarNumero(estatisticasPorGrupo[nome].creatinina.media)} ±{' '}
                    {formatarNumero(estatisticasPorGrupo[nome].creatinina.desvioPadrao)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={nomesGrupos.length + 1} className="py-2 px-3 font-semibold text-gray-800">
                  TFG Estimada (mL/min)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6 text-gray-600">Média ± DP</td>
                {nomesGrupos.map((nome) => (
                  <td key={nome} className="text-center py-2 px-3">
                    {formatarNumero(estatisticasPorGrupo[nome].tfg.media, 1)} ±{' '}
                    {formatarNumero(estatisticasPorGrupo[nome].tfg.desvioPadrao, 1)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={nomesGrupos.length + 1} className="py-2 px-3 font-semibold text-gray-800">
                  Desfechos (%)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6 text-gray-600">Necessidade de Diálise</td>
                {nomesGrupos.map((nome) => (
                  <td key={nome} className="text-center py-2 px-3">
                    {formatarPorcentagem(estatisticasPorGrupo[nome].porcentagemDialise)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gráficos comparativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Idade por grupo */}
        <Card title="Idade Média por Grupo">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosIdade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grupo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="media" fill="#3B82F6" name="Média" />
              <Bar dataKey="mediana" fill="#10B981" name="Mediana" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Função renal por grupo */}
        <Card title="Função Renal por Grupo">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosFuncaoRenal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grupo" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="creatinina"
                fill="#F59E0B"
                name="Creatinina (mg/dL)"
              />
              <Bar
                yAxisId="right"
                dataKey="tfg"
                fill="#8B5CF6"
                name="TFG (mL/min)"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Classes histológicas por grupo */}
        <Card title="Classes Histológicas por Grupo">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosClassesPorGrupo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="classe" />
              <YAxis />
              <Tooltip />
              <Legend />
              {nomesGrupos.map((nome, index) => (
                <Bar
                  key={nome}
                  dataKey={nome}
                  fill={COLORS[index % COLORS.length]}
                  name={nome}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Desfechos por grupo */}
        <Card title="Desfechos por Grupo">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosDesfechosPorGrupo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="desfecho" width={120} />
              <Tooltip />
              <Legend />
              {nomesGrupos.map((nome, index) => (
                <Bar
                  key={nome}
                  dataKey={nome}
                  fill={COLORS[index % COLORS.length]}
                  name={nome}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
