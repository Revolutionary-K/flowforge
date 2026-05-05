import { useState, useEffect, useCallback } from 'react';
import { processesApi, ListProcessesParams } from '@/lib/api/processes';
import { ProcessData, PaginatedResponse } from '@/types/api';

export function useProcessList(params?: ListProcessesParams) {
  const [data, setData] = useState<PaginatedResponse<ProcessData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await processesApi.list(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  return { data, loading, error, refetch: fetchProcesses };
}

export function useProcess(id: string) {
  const [process, setProcess] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    processesApi
      .get(id)
      .then(setProcess)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  const update = useCallback(
    async (data: Partial<ProcessData>) => {
      const updated = await processesApi.update(id, data);
      setProcess(updated);
      return updated;
    },
    [id]
  );

  return { process, loading, error, update };
}
