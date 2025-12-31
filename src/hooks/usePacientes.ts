import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/database/supabase';
import { listarPacientes } from '../lib/database/db';
import type { Paciente } from '../types';

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPacientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarPacientes();
      setPacientes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar pacientes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch inicial
    fetchPacientes();

    // Subscription para updates em tempo real
    const channel = supabase
      .channel('pacientes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pacientes' },
        () => {
          fetchPacientes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPacientes]);

  return { pacientes, loading, error, refetch: fetchPacientes };
}
