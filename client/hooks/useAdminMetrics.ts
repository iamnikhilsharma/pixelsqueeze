import useSWR from 'swr';

const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
};

export default function useAdminMetrics() {
  const { data, error } = useSWR('/api/admin/metrics', fetcher, { refreshInterval: 60000 });
  return {
    metrics: data?.data,
    isLoading: !error && !data,
    isError: error
  };
}
