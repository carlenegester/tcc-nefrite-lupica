import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import { excluirPaciente } from '../lib/database/db';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_SEXO,
  OPCOES_DESFECHO,
} from '../types';

export function PacientesPage() {
  const { pacientes } = usePacientes();
  const [busca, setBusca] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  const [pacienteExcluir, setPacienteExcluir] = useState<string | null>(null);

  const pacientesFiltrados = pacientes.filter((p) => {
    const matchBusca =
      busca === '' ||
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      p.etnia?.toLowerCase().includes(busca.toLowerCase()) ||
      p.municipioResidencia?.toLowerCase().includes(busca.toLowerCase());

    const matchSexo = filtroSexo === '' || p.sexo === filtroSexo;
    const matchClasse =
      filtroClasse === '' || p.classificacaoHistologica === filtroClasse;

    return matchBusca && matchSexo && matchClasse;
  });

  const handleExcluir = async (id: string) => {
    await excluirPaciente(id);
    setPacienteExcluir(null);
  };

  const getClasseLabel = (classe: string | undefined) => {
    if (!classe) return '-';
    const opcao = OPCOES_CLASSE_HISTOLOGICA.find((o) => o.value === classe);
    return opcao?.label.split(' - ')[0] || classe;
  };

  const getDesfechoLabel = (desfecho: string | undefined) => {
    if (!desfecho) return '-';
    const opcao = OPCOES_DESFECHO.find((o) => o.value === desfecho);
    return opcao?.label || desfecho;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
          <p className="text-gray-600">
            {pacientes.length} paciente(s) cadastrado(s)
          </p>
        </div>
        <Link to="/entrada">
          <Button>
            <Plus className="w-4 h-4" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por código, etnia, município..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={OPCOES_SEXO}
            value={filtroSexo}
            onChange={(e) => setFiltroSexo(e.target.value)}
            placeholder="Todos os sexos"
          />
          <Select
            options={OPCOES_CLASSE_HISTOLOGICA}
            value={filtroClasse}
            onChange={(e) => setFiltroClasse(e.target.value)}
            placeholder="Todas as classes"
          />
          <Button
            variant="secondary"
            onClick={() => {
              setBusca('');
              setFiltroSexo('');
              setFiltroClasse('');
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        {pacientesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum paciente encontrado</p>
            {pacientes.length === 0 && (
              <Link to="/entrada">
                <Button className="mt-4">
                  <Plus className="w-4 h-4" />
                  Cadastrar primeiro paciente
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Código
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Idade
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Sexo
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Etnia
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Classe
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Desfecho
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Internação
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.map((paciente) => (
                  <tr
                    key={paciente.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium">{paciente.codigo}</td>
                    <td className="py-3 px-4">{paciente.idade} anos</td>
                    <td className="py-3 px-4 capitalize">{paciente.sexo}</td>
                    <td className="py-3 px-4">{paciente.etnia || '-'}</td>
                    <td className="py-3 px-4">
                      {getClasseLabel(paciente.classificacaoHistologica)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          paciente.desfechoAlta === 'alta'
                            ? 'bg-green-100 text-green-700'
                            : paciente.desfechoAlta === 'obito'
                            ? 'bg-red-100 text-red-700'
                            : paciente.desfechoAlta === 'transferencia'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getDesfechoLabel(paciente.desfechoAlta)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(paciente.dataInternacao).toLocaleDateString(
                        'pt-BR'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/entrada/${paciente.id}`}>
                          <button
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                          onClick={() => setPacienteExcluir(paciente.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de confirmação de exclusão */}
      {pacienteExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Confirmar exclusão</h3>
                <p className="text-gray-600 text-sm">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este paciente? Todos os dados serão
              perdidos permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPacienteExcluir(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => handleExcluir(pacienteExcluir)}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
