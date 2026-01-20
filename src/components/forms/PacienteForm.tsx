import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox, CheckboxGroup } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  type Paciente,
  type NovoPaciente,
  type ManifestacaoInicialLES,
  type Comorbidade,
  type MotivoIndicacaoBiopsia,
  type ClasseHistologica,
  type Imunofluorescencia,
  type Medicamento,
  type TipoPulsoterapia,
  type MelhoraClinica,
  type DesfechoAlta,
  type Sexo,
  OPCOES_SEXO,
  OPCOES_MANIFESTACOES_LES,
  OPCOES_COMORBIDADES,
  OPCOES_MOTIVO_BIOPSIA,
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_IMUNOFLUORESCENCIA,
  OPCOES_MEDICAMENTOS,
  OPCOES_TIPO_PULSOTERAPIA,
  OPCOES_MELHORA_CLINICA,
  OPCOES_DESFECHO,
} from '../../types';
import { proximoCodigo } from '../../lib/database/db';

interface PacienteFormProps {
  paciente?: Paciente;
  onSave: (paciente: Paciente) => void;
  onCancel: () => void;
}

const initialState: NovoPaciente = {
  codigo: '',
  dataInternacao: '',
  idade: 0,
  sexo: 'feminino',
  etnia: '',
  naturalidade: '',
  municipioResidencia: '',
  diagnosticoPrevioLES: false,
  anoDiagnosticoLES: undefined,
  manifestacoesIniciaisLES: [],
  outrasManifestacoes: '',
  comorbidades: [],
  outrasComorbidades: '',
  pressaoArterialSistolica: undefined,
  pressaoArterialDiastolica: undefined,
  presencaEdema: false,
  proteinuria: undefined,
  hematuria: false,
  creatininaSerica: undefined,
  tfgEstimada: undefined,
  fan: '',
  antiDsDNA: undefined,
  c3: undefined,
  c4: undefined,
  dataBiopsiaRenal: '',
  motivosIndicacaoBiopsia: [],
  outrosMotivosBiopsia: '',
  classificacaoHistologica: [],
  imunofluorescenciaPositiva: [],
  complicacoesBiopsia: false,
  quaisComplicacoesBiopsia: '',
  medicamentosAntesBiopsia: [],
  tipoPulsoterapia: undefined,
  outrosMedicamentosAntes: '',
  esquemaTerapeuticoAposBiopsia: '',
  tempoInternacao: undefined,
  necessidadeDialise: false,
  melhoraClinica: undefined,
  desfechoAlta: undefined,
  observacoes: '',
};

export function PacienteForm({ paciente, onSave, onCancel }: PacienteFormProps) {
  const [formData, setFormData] = useState<NovoPaciente>(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paciente) {
      setFormData({
        codigo: paciente.codigo,
        dataInternacao: paciente.dataInternacao,
        idade: paciente.idade,
        sexo: paciente.sexo,
        etnia: paciente.etnia,
        naturalidade: paciente.naturalidade,
        municipioResidencia: paciente.municipioResidencia,
        diagnosticoPrevioLES: paciente.diagnosticoPrevioLES,
        anoDiagnosticoLES: paciente.anoDiagnosticoLES,
        manifestacoesIniciaisLES: paciente.manifestacoesIniciaisLES,
        outrasManifestacoes: paciente.outrasManifestacoes,
        comorbidades: paciente.comorbidades,
        outrasComorbidades: paciente.outrasComorbidades,
        pressaoArterialSistolica: paciente.pressaoArterialSistolica,
        pressaoArterialDiastolica: paciente.pressaoArterialDiastolica,
        presencaEdema: paciente.presencaEdema,
        proteinuria: paciente.proteinuria,
        hematuria: paciente.hematuria,
        creatininaSerica: paciente.creatininaSerica,
        tfgEstimada: paciente.tfgEstimada,
        fan: paciente.fan,
        antiDsDNA: paciente.antiDsDNA,
        c3: paciente.c3,
        c4: paciente.c4,
        dataBiopsiaRenal: paciente.dataBiopsiaRenal,
        motivosIndicacaoBiopsia: paciente.motivosIndicacaoBiopsia,
        outrosMotivosBiopsia: paciente.outrosMotivosBiopsia,
        classificacaoHistologica: paciente.classificacaoHistologica || [],
        imunofluorescenciaPositiva: paciente.imunofluorescenciaPositiva,
        complicacoesBiopsia: paciente.complicacoesBiopsia,
        quaisComplicacoesBiopsia: paciente.quaisComplicacoesBiopsia,
        medicamentosAntesBiopsia: paciente.medicamentosAntesBiopsia,
        tipoPulsoterapia: paciente.tipoPulsoterapia,
        outrosMedicamentosAntes: paciente.outrosMedicamentosAntes,
        esquemaTerapeuticoAposBiopsia: paciente.esquemaTerapeuticoAposBiopsia,
        tempoInternacao: paciente.tempoInternacao,
        necessidadeDialise: paciente.necessidadeDialise,
        melhoraClinica: paciente.melhoraClinica,
        desfechoAlta: paciente.desfechoAlta,
        observacoes: paciente.observacoes,
      });
    } else {
      // Novo paciente - buscar próximo código
      proximoCodigo().then((codigo) => {
        setFormData((prev) => ({ ...prev, codigo }));
      });
    }
  }, [paciente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = new Date().toISOString();
      const pacienteSalvo: Paciente = {
        ...formData,
        id: paciente?.id || uuidv4(),
        criadoEm: paciente?.criadoEm || now,
        atualizadoEm: now,
      };

      onSave(pacienteSalvo);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof NovoPaciente>(
    field: K,
    value: NovoPaciente[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identificação do Paciente */}
      <Card title="Identificação do Paciente">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Código do Paciente"
            value={formData.codigo}
            onChange={(e) => updateField('codigo', e.target.value)}
            required
          />
          <Input
            label="Data da Internação"
            type="date"
            value={formData.dataInternacao}
            onChange={(e) => updateField('dataInternacao', e.target.value)}
            required
          />
          <Input
            label="Idade"
            type="number"
            min={0}
            max={120}
            value={formData.idade || ''}
            onChange={(e) => updateField('idade', parseInt(e.target.value) || 0)}
            required
          />
          <Select
            label="Sexo"
            options={OPCOES_SEXO}
            value={formData.sexo}
            onChange={(e) => updateField('sexo', e.target.value as Sexo)}
            required
          />
          <Input
            label="Etnia"
            value={formData.etnia}
            onChange={(e) => updateField('etnia', e.target.value)}
          />
          <Input
            label="Naturalidade"
            value={formData.naturalidade}
            onChange={(e) => updateField('naturalidade', e.target.value)}
          />
          <Input
            label="Município de Residência"
            value={formData.municipioResidencia}
            onChange={(e) => updateField('municipioResidencia', e.target.value)}
          />
        </div>
      </Card>

      {/* 1. Perfil Clínico-Epidemiológico */}
      <Card title="1. Perfil Clínico-Epidemiológico">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Checkbox
              label="Diagnóstico prévio de LES"
              checked={formData.diagnosticoPrevioLES}
              onChange={(e) => updateField('diagnosticoPrevioLES', e.target.checked)}
            />
            <Input
              label="Ano do diagnóstico"
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              value={formData.anoDiagnosticoLES || ''}
              onChange={(e) =>
                updateField('anoDiagnosticoLES', parseInt(e.target.value) || undefined)
              }
              className="w-32"
            />
          </div>

          <CheckboxGroup
            label="Manifestação inicial do LES"
            options={OPCOES_MANIFESTACOES_LES}
            values={formData.manifestacoesIniciaisLES}
            onChange={(values) =>
              updateField('manifestacoesIniciaisLES', values as ManifestacaoInicialLES[])
            }
          />

          {formData.manifestacoesIniciaisLES.includes('outros') && (
            <Input
              label="Outras manifestações"
              value={formData.outrasManifestacoes || ''}
              onChange={(e) => updateField('outrasManifestacoes', e.target.value)}
            />
          )}

          <CheckboxGroup
            label="Comorbidades associadas"
            options={OPCOES_COMORBIDADES}
            values={formData.comorbidades}
            onChange={(values) => updateField('comorbidades', values as Comorbidade[])}
          />

          {formData.comorbidades.includes('outras') && (
            <Input
              label="Outras comorbidades"
              value={formData.outrasComorbidades || ''}
              onChange={(e) => updateField('outrasComorbidades', e.target.value)}
            />
          )}
        </div>
      </Card>

      {/* 2. Dados Clínicos na Admissão Hospitalar */}
      <Card title="2. Dados Clínicos na Admissão Hospitalar">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="PA Sistólica (mmHg)"
              type="number"
              value={formData.pressaoArterialSistolica || ''}
              onChange={(e) =>
                updateField('pressaoArterialSistolica', parseFloat(e.target.value) || undefined)
              }
            />
            <Input
              label="PA Diastólica (mmHg)"
              type="number"
              value={formData.pressaoArterialDiastolica || ''}
              onChange={(e) =>
                updateField('pressaoArterialDiastolica', parseFloat(e.target.value) || undefined)
              }
            />
            <div className="flex items-end">
              <Checkbox
                label="Presença de edema"
                checked={formData.presencaEdema}
                onChange={(e) => updateField('presencaEdema', e.target.checked)}
              />
            </div>
            <div className="flex items-end">
              <Checkbox
                label="Hematúria"
                checked={formData.hematuria}
                onChange={(e) => updateField('hematuria', e.target.checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Proteinúria (g/24h)"
              type="number"
              step="0.01"
              value={formData.proteinuria || ''}
              onChange={(e) =>
                updateField('proteinuria', parseFloat(e.target.value) || undefined)
              }
            />
            <Input
              label="Creatinina sérica (mg/dL)"
              type="number"
              step="0.01"
              value={formData.creatininaSerica || ''}
              onChange={(e) =>
                updateField('creatininaSerica', parseFloat(e.target.value) || undefined)
              }
            />
            <Input
              label="TFG estimada (mL/min)"
              type="number"
              step="0.1"
              value={formData.tfgEstimada || ''}
              onChange={(e) =>
                updateField('tfgEstimada', parseFloat(e.target.value) || undefined)
              }
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-gray-700 mb-3">Exames laboratoriais relevantes</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="FAN"
                value={formData.fan || ''}
                onChange={(e) => updateField('fan', e.target.value)}
                placeholder="Ex: 1:80, positivo"
              />
              <Select
                label="Anti-dsDNA"
                value={formData.antiDsDNA || ''}
                onChange={(e) =>
                  updateField('antiDsDNA', (e.target.value as 'reagente' | 'nao_reagente') || undefined)
                }
                options={[
                  { value: 'reagente', label: 'Reagente' },
                  { value: 'nao_reagente', label: 'Não Reagente' },
                ]}
              />
              <Input
                label="C3"
                type="number"
                step="0.1"
                value={formData.c3 || ''}
                onChange={(e) => updateField('c3', parseFloat(e.target.value) || undefined)}
              />
              <Input
                label="C4"
                type="number"
                step="0.1"
                value={formData.c4 || ''}
                onChange={(e) => updateField('c4', parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Biópsia Renal */}
      <Card title="3. Biópsia Renal">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data da biópsia renal"
              type="date"
              value={formData.dataBiopsiaRenal || ''}
              onChange={(e) => updateField('dataBiopsiaRenal', e.target.value)}
            />
            <CheckboxGroup
              label="Classificação histológica (ISN/RPS 2018)"
              options={OPCOES_CLASSE_HISTOLOGICA}
              values={formData.classificacaoHistologica}
              onChange={(values) =>
                updateField('classificacaoHistologica', values as ClasseHistologica[])
              }
            />
          </div>

          <CheckboxGroup
            label="Motivo da indicação da biópsia"
            options={OPCOES_MOTIVO_BIOPSIA}
            values={formData.motivosIndicacaoBiopsia}
            onChange={(values) =>
              updateField('motivosIndicacaoBiopsia', values as MotivoIndicacaoBiopsia[])
            }
          />

          {formData.motivosIndicacaoBiopsia.includes('outros') && (
            <Input
              label="Outros motivos"
              value={formData.outrosMotivosBiopsia || ''}
              onChange={(e) => updateField('outrosMotivosBiopsia', e.target.value)}
            />
          )}

          <CheckboxGroup
            label="Imunofluorescência positiva para"
            options={OPCOES_IMUNOFLUORESCENCIA}
            values={formData.imunofluorescenciaPositiva}
            onChange={(values) =>
              updateField('imunofluorescenciaPositiva', values as Imunofluorescencia[])
            }
          />

          <div className="flex items-center gap-4">
            <Checkbox
              label="Teve complicações após a biópsia"
              checked={formData.complicacoesBiopsia}
              onChange={(e) => updateField('complicacoesBiopsia', e.target.checked)}
            />
          </div>

          {formData.complicacoesBiopsia && (
            <Input
              label="Quais complicações?"
              value={formData.quaisComplicacoesBiopsia || ''}
              onChange={(e) => updateField('quaisComplicacoesBiopsia', e.target.value)}
            />
          )}
        </div>
      </Card>

      {/* 4. Manejo Clínico */}
      <Card title="4. Manejo Clínico">
        <div className="space-y-4">
          <CheckboxGroup
            label="Medicamentos utilizados antes da biópsia"
            options={OPCOES_MEDICAMENTOS}
            values={formData.medicamentosAntesBiopsia}
            onChange={(values) =>
              updateField('medicamentosAntesBiopsia', values as Medicamento[])
            }
          />

          {formData.medicamentosAntesBiopsia.includes('pulsoterapia') && (
            <Select
              label="Tipo de pulsoterapia"
              options={OPCOES_TIPO_PULSOTERAPIA}
              value={formData.tipoPulsoterapia || ''}
              onChange={(e) =>
                updateField('tipoPulsoterapia', e.target.value as TipoPulsoterapia || undefined)
              }
            />
          )}

          {formData.medicamentosAntesBiopsia.includes('outros') && (
            <Input
              label="Outros medicamentos"
              value={formData.outrosMedicamentosAntes || ''}
              onChange={(e) => updateField('outrosMedicamentosAntes', e.target.value)}
            />
          )}

          <Input
            label="Esquema terapêutico após a biópsia"
            value={formData.esquemaTerapeuticoAposBiopsia || ''}
            onChange={(e) => updateField('esquemaTerapeuticoAposBiopsia', e.target.value)}
            placeholder="Descreva os medicamentos utilizados após a biópsia"
          />
        </div>
      </Card>

      {/* 5. Evolução Clínica e Desfecho */}
      <Card title="5. Evolução Clínica e Desfecho">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Tempo de internação (dias)"
              type="number"
              min={0}
              value={formData.tempoInternacao || ''}
              onChange={(e) =>
                updateField('tempoInternacao', parseInt(e.target.value) || undefined)
              }
            />
            <Select
              label="Melhora clínica com tratamento"
              options={OPCOES_MELHORA_CLINICA}
              value={formData.melhoraClinica || ''}
              onChange={(e) =>
                updateField('melhoraClinica', e.target.value as MelhoraClinica || undefined)
              }
            />
            <Select
              label="Desfecho"
              options={OPCOES_DESFECHO}
              value={formData.desfechoAlta || ''}
              onChange={(e) =>
                updateField('desfechoAlta', e.target.value as DesfechoAlta || undefined)
              }
            />
          </div>

          <Checkbox
            label="Necessidade de diálise"
            checked={formData.necessidadeDialise}
            onChange={(e) => updateField('necessidadeDialise', e.target.checked)}
          />
        </div>
      </Card>

      {/* Observações */}
      <Card title="Observações">
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          value={formData.observacoes || ''}
          onChange={(e) => updateField('observacoes', e.target.value)}
          placeholder="Observações adicionais..."
        />
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {paciente ? 'Atualizar' : 'Salvar'} Paciente
        </Button>
      </div>
    </form>
  );
}
