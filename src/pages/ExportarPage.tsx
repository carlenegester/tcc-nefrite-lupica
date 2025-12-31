import { useState } from 'react';
import { usePacientes } from '../hooks/usePacientes';
import { exportarDados, importarDados, limparTodosDados } from '../lib/database/db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  calcularEstatisticasGerais,
  calcularDistribuicaoFrequencia,
  formatarNumero,
  formatarPorcentagem,
} from '../lib/statistics';
import {
  OPCOES_CLASSE_HISTOLOGICA,
  OPCOES_DESFECHO,
  OPCOES_SEXO,
  type ClasseHistologica,
  type DesfechoAlta,
} from '../types';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Database,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function ExportarPage() {
  const { pacientes } = usePacientes();
  const [loading, setLoading] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);

  const mostrarMensagem = (tipo: 'sucesso' | 'erro', texto: string) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleExportarExcel = async () => {
    if (pacientes.length === 0) {
      mostrarMensagem('erro', 'Não há dados para exportar');
      return;
    }

    setLoading('excel');
    try {
      const dados = pacientes.map((p) => ({
        Código: p.codigo,
        'Data Internação': p.dataInternacao,
        Idade: p.idade,
        Sexo: p.sexo === 'masculino' ? 'Masculino' : 'Feminino',
        Etnia: p.etnia,
        'Diagnóstico Prévio LES': p.diagnosticoPrevioLES ? 'Sim' : 'Não',
        'Manifestações LES': p.manifestacoesIniciaisLES?.join(', ') || '',
        Comorbidades: p.comorbidades?.join(', ') || '',
        'PA Sistólica': p.pressaoArterialSistolica,
        'PA Diastólica': p.pressaoArterialDiastolica,
        Edema: p.presencaEdema ? 'Sim' : 'Não',
        'Proteinúria': p.proteinuria,
        'Creatinina Sérica': p.creatininaSerica,
        'TFG Estimada': p.tfgEstimada,
        'Data Biópsia': p.dataBiopsiaRenal,
        'Indicação Biópsia': p.motivosIndicacaoBiopsia?.join(', ') || '',
        'Classificação Histológica': p.classificacaoHistologica,
        'Imunofluorescência': p.imunofluorescenciaPositiva?.join(', ') || '',
        'Medicamentos Pré-biópsia': p.medicamentosAntesBiopsia?.join(', ') || '',
        'Esquema Terapêutico Pós-biópsia': p.esquemaTerapeuticoAposBiopsia || '',
        'Tempo Internação': p.tempoInternacao,
        'Necessidade Diálise': p.necessidadeDialise ? 'Sim' : 'Não',
        'Melhora Clínica': p.melhoraClinica || '',
        'Desfecho Alta': p.desfechoAlta,
      }));

      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');

      // Ajustar largura das colunas
      const colWidths = Object.keys(dados[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `nefrite_lupica_dados_${new Date().toISOString().split('T')[0]}.xlsx`);
      mostrarMensagem('sucesso', 'Arquivo Excel exportado com sucesso!');
    } catch (error) {
      mostrarMensagem('erro', 'Erro ao exportar Excel');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleExportarPDF = async () => {
    if (pacientes.length === 0) {
      mostrarMensagem('erro', 'Não há dados para exportar');
      return;
    }

    setLoading('pdf');
    try {
      const doc = new jsPDF();
      const estatisticas = calcularEstatisticasGerais(pacientes);
      const distribuicaoClasses = calcularDistribuicaoFrequencia(
        pacientes.map((p) => p.classificacaoHistologica).filter((c): c is ClasseHistologica => !!c),
        OPCOES_CLASSE_HISTOLOGICA
      );
      const distribuicaoDesfechos = calcularDistribuicaoFrequencia(
        pacientes.map((p) => p.desfechoAlta).filter((d): d is DesfechoAlta => !!d),
        OPCOES_DESFECHO
      );
      const distribuicaoSexo = calcularDistribuicaoFrequencia(
        pacientes.map((p) => p.sexo),
        OPCOES_SEXO
      );

      // Título
      doc.setFontSize(16);
      doc.text('Perfil Clínico e Histopatológico - Nefrite Lúpica', 14, 20);
      doc.setFontSize(10);
      doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
      doc.text(`Total de pacientes: ${pacientes.length}`, 14, 34);

      let yPos = 45;

      // Estatísticas descritivas
      doc.setFontSize(12);
      doc.text('Estatísticas Descritivas', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Variável', 'N', 'Média', 'Mediana', 'DP', 'Mín', 'Máx']],
        body: [
          [
            'Idade (anos)',
            String(estatisticas?.idade?.n || '-'),
            formatarNumero(estatisticas?.idade?.media, 1),
            formatarNumero(estatisticas?.idade?.mediana, 1),
            formatarNumero(estatisticas?.idade?.desvioPadrao, 2),
            String(estatisticas?.idade?.minimo || '-'),
            String(estatisticas?.idade?.maximo || '-'),
          ],
          [
            'Creatinina (mg/dL)',
            String(estatisticas?.creatinina?.n || '-'),
            formatarNumero(estatisticas?.creatinina?.media),
            formatarNumero(estatisticas?.creatinina?.mediana),
            formatarNumero(estatisticas?.creatinina?.desvioPadrao),
            formatarNumero(estatisticas?.creatinina?.minimo),
            formatarNumero(estatisticas?.creatinina?.maximo),
          ],
          [
            'TFG (mL/min)',
            String(estatisticas?.tfg?.n || '-'),
            formatarNumero(estatisticas?.tfg?.media, 1),
            formatarNumero(estatisticas?.tfg?.mediana, 1),
            formatarNumero(estatisticas?.tfg?.desvioPadrao, 1),
            formatarNumero(estatisticas?.tfg?.minimo, 1),
            formatarNumero(estatisticas?.tfg?.maximo, 1),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Distribuição por sexo
      doc.setFontSize(12);
      doc.text('Distribuição por Sexo', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Sexo', 'N', '%']],
        body: distribuicaoSexo.map((d) => [
          d.rotulo,
          String(d.frequenciaAbsoluta),
          formatarPorcentagem(d.frequenciaRelativa * 100),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Classes histológicas
      doc.setFontSize(12);
      doc.text('Classificação Histológica (ISN/RPS 2018)', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Classe', 'N', '%']],
        body: distribuicaoClasses
          .filter((d) => d.frequenciaAbsoluta > 0)
          .map((d) => [
            d.rotulo,
            String(d.frequenciaAbsoluta),
            formatarPorcentagem(d.frequenciaRelativa * 100),
          ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Nova página para desfechos
      doc.addPage();
      yPos = 20;

      // Desfechos
      doc.setFontSize(12);
      doc.text('Desfechos', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Desfecho', 'N', '%']],
        body: distribuicaoDesfechos
          .filter((d) => d.frequenciaAbsoluta > 0)
          .map((d) => [
            d.rotulo,
            String(d.frequenciaAbsoluta),
            formatarPorcentagem(d.frequenciaRelativa * 100),
          ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Indicadores clínicos
      doc.setFontSize(12);
      doc.text('Indicadores Clínicos', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Indicador', 'N', '%']],
        body: [
          [
            'Necessidade de Diálise',
            String(estatisticas?.dialise?.necessitaram || 0),
            formatarPorcentagem(estatisticas?.dialise?.porcentagem || 0),
          ],
          [
            'Sexo Feminino',
            String(estatisticas?.sexo?.feminino || 0),
            formatarPorcentagem(estatisticas?.sexo?.porcentagemFeminino || 0),
          ],
          [
            'Diagnóstico Prévio de LES',
            String(pacientes.filter((p) => p.diagnosticoPrevioLES).length),
            formatarPorcentagem(
              (pacientes.filter((p) => p.diagnosticoPrevioLES).length / pacientes.length) * 100
            ),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`nefrite_lupica_relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
      mostrarMensagem('sucesso', 'Relatório PDF exportado com sucesso!');
    } catch (error) {
      mostrarMensagem('erro', 'Erro ao exportar PDF');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleExportarBackup = async () => {
    setLoading('backup');
    try {
      const json = await exportarDados();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_nefrite_lupica_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      mostrarMensagem('sucesso', 'Backup exportado com sucesso!');
    } catch (error) {
      mostrarMensagem('erro', 'Erro ao exportar backup');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleImportarBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading('importar');
    try {
      const texto = await file.text();
      const quantidade = await importarDados(texto);
      mostrarMensagem('sucesso', `${quantidade} pacientes importados com sucesso!`);
    } catch (error) {
      mostrarMensagem('erro', 'Erro ao importar backup. Verifique o formato do arquivo.');
      console.error(error);
    } finally {
      setLoading(null);
      event.target.value = '';
    }
  };

  const handleLimparDados = async () => {
    if (!confirmarLimpeza) {
      setConfirmarLimpeza(true);
      return;
    }

    setLoading('limpar');
    try {
      await limparTodosDados();
      mostrarMensagem('sucesso', 'Todos os dados foram removidos');
      setConfirmarLimpeza(false);
    } catch (error) {
      mostrarMensagem('erro', 'Erro ao limpar dados');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Exportar Dados</h1>

      {mensagem && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {mensagem.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar para TCC */}
        <Card title="Exportar para TCC">
          <p className="text-gray-600 mb-4">
            Exporte os dados e estatísticas em formatos prontos para usar no seu TCC.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleExportarExcel}
              loading={loading === 'excel'}
              disabled={pacientes.length === 0}
              className="w-full"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Exportar Excel (Dados Completos)
            </Button>
            <Button
              onClick={handleExportarPDF}
              loading={loading === 'pdf'}
              disabled={pacientes.length === 0}
              className="w-full"
            >
              <FileText className="w-5 h-5" />
              Exportar PDF (Relatório Estatístico)
            </Button>
          </div>
          {pacientes.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              Adicione pacientes para habilitar a exportação.
            </p>
          )}
        </Card>

        {/* Backup e Restauração */}
        <Card title="Backup e Restauração">
          <p className="text-gray-600 mb-4">
            Faça backup dos seus dados para não perdê-los. Recomendado antes de limpar o navegador.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleExportarBackup}
              loading={loading === 'backup'}
              variant="secondary"
              className="w-full"
            >
              <Download className="w-5 h-5" />
              Exportar Backup (JSON)
            </Button>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImportarBackup}
                className="hidden"
                disabled={loading === 'importar'}
              />
              <span
                className="inline-flex items-center justify-center gap-2 font-medium rounded-lg px-4 py-2 transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 w-full cursor-pointer"
                onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  input?.click();
                }}
              >
                <Upload className="w-5 h-5" />
                Importar Backup (JSON)
              </span>
            </label>
          </div>
        </Card>

        {/* Informações do Banco */}
        <Card title="Informações do Banco de Dados">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pacientes.length}</p>
              <p className="text-sm text-gray-500">Pacientes cadastrados</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Os dados são armazenados localmente no seu navegador usando IndexedDB.
            Faça backups regulares para não perder os dados.
          </p>
        </Card>

        {/* Zona de Perigo */}
        <Card title="Zona de Perigo">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Limpar Todos os Dados</h4>
                <p className="text-sm text-red-600 mt-1">
                  Esta ação é irreversível. Todos os pacientes serão removidos permanentemente.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {confirmarLimpeza ? (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  Tem certeza? Esta ação não pode ser desfeita!
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleLimparDados}
                    loading={loading === 'limpar'}
                    variant="danger"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sim, limpar tudo
                  </Button>
                  <Button
                    onClick={() => setConfirmarLimpeza(false)}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleLimparDados}
                variant="danger"
                disabled={pacientes.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Limpar Todos os Dados
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
