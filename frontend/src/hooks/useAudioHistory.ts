import { useState, useEffect } from 'react';
import { audioService, type AudioResult } from '../services/audioService';

export function useAudioHistory() {
  const [results, setResults] = useState<AudioResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadResults = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await audioService.listAudioResults(pageNum, 10);
      setResults(data.data);
      setTotal(data.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  return {
    results,
    loading,
    error,
    page,
    total,
    loadResults,
    refresh: () => loadResults(page),
  };
}
