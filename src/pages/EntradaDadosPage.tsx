import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PacienteForm } from '../components/forms/PacienteForm';
import {
  adicionarPaciente,
  atualizarPaciente,
  buscarPaciente,
} from '../lib/database/db';
import type { Paciente } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export function EntradaDadosPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<Paciente | undefined>(undefined);
  const [loading, setLoading] = useState(!!id);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (id) {
      buscarPaciente(id).then((p) => {
        setPaciente(p);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSave = async (pacienteData: Paciente) => {
    if (id) {
      await atualizarPaciente(id, pacienteData);
    } else {
      await adicionarPaciente(pacienteData);
    }
    setSalvo(true);
    setTimeout(() => {
      navigate('/pacientes');
    }, 1500);
  };

  const handleCancel = () => {
    navigate('/pacientes');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (salvo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          Paciente {id ? 'atualizado' : 'salvo'} com sucesso!
        </h2>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'Editar Paciente' : 'Novo Paciente'}
          </h1>
          <p className="text-gray-600">
            {id
              ? 'Atualize os dados do paciente'
              : 'Preencha o formulário de coleta de dados'}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <PacienteForm
        paciente={paciente}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
