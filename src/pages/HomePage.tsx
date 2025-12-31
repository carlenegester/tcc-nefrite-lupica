import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import { Card } from '../components/ui/Card';
import {
  Users,
  FileEdit,
  BarChart3,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export function HomePage() {
  const { pacientes } = usePacientes();
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');

  useEffect(() => {
    if (pacientes.length > 0) {
      const maisRecente = pacientes.reduce((prev, curr) =>
        new Date(curr.atualizadoEm) > new Date(prev.atualizadoEm) ? curr : prev
      );
      setUltimaAtualizacao(
        new Date(maisRecente.atualizadoEm).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [pacientes]);

  const totalPacientes = pacientes.length;
  const pacientesCompletos = pacientes.filter(
    (p) => p.classificacaoHistologica && p.desfechoAlta
  ).length;
  const pacientesIncompletos = totalPacientes - pacientesCompletos;

  const quickStats = [
    {
      label: 'Total de Pacientes',
      value: totalPacientes,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Registros Completos',
      value: pacientesCompletos,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Registros Incompletos',
      value: pacientesIncompletos,
      icon: AlertCircle,
      color: 'bg-yellow-500',
    },
  ];

  const quickLinks = [
    {
      label: 'Novo Paciente',
      description: 'Adicionar novo registro de paciente',
      icon: FileEdit,
      path: '/entrada',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    },
    {
      label: 'Ver Pacientes',
      description: 'Listar todos os pacientes cadastrados',
      icon: Users,
      path: '/pacientes',
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
    },
    {
      label: 'Dashboard',
      description: 'Visualizar estatísticas e gráficos',
      icon: BarChart3,
      path: '/dashboard',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
    },
    {
      label: 'Exportar Dados',
      description: 'Exportar para Excel ou PDF',
      icon: Download,
      path: '/exportar',
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          TCC - Nefrite Lúpica
        </h1>
        <p className="text-gray-600 mt-2">
          Perfil Clínico, Histopatológico e Imunofluorescência de Pacientes com
          Nefrite Lúpica
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Fundação Santa Casa de Misericórdia do Pará (FSCM-PA)
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4"
            >
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <Card title="Acesso Rápido">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`${link.color} rounded-lg p-4 transition-colors`}
              >
                <Icon className="w-8 h-8 mb-3" />
                <h3 className="font-semibold">{link.label}</h3>
                <p className="text-sm opacity-75">{link.description}</p>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Sobre o Projeto">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Este sistema foi desenvolvido para auxiliar na coleta e análise de
              dados do TCC sobre Nefrite Lúpica.
            </p>
            <p>
              <strong>Objetivo:</strong> Avaliar o perfil clínico,
              histopatológico e imunofluorescência dos pacientes com nefrite
              lúpica (NL).
            </p>
            <p>
              <strong>Período:</strong> 2024-2025
            </p>
            <p>
              <strong>Instituição:</strong> CESUPA - Centro Universitário do
              Estado do Pará
            </p>
          </div>
        </Card>

        <Card title="Status da Coleta">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progresso</span>
                <span>
                  {totalPacientes > 0
                    ? Math.round((pacientesCompletos / totalPacientes) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${
                      totalPacientes > 0
                        ? (pacientesCompletos / totalPacientes) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Meta:</strong> 50 pacientes
              </p>
              <p>
                <strong>Cadastrados:</strong> {totalPacientes}
              </p>
              {ultimaAtualizacao && (
                <p>
                  <strong>Última atualização:</strong> {ultimaAtualizacao}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
