import { useState, useEffect } from 'react';
import { Heart, Server, Bot, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { documentService } from '@/services/documentService';

export function HealthStatus() {
  const [status, setStatus] = useState<{ backend: string; agent: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await documentService.healthCheck();
      setStatus(data);
    } catch (error) {
      setStatus({ backend: 'unhealthy', agent: 'unhealthy' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    checkHealth();
  };

  const getStatusConfig = (status: string) => {
    if (status === 'healthy') {
      return {
        icon: CheckCircle,
        color: 'text-[var(--success-color)]',
        bgColor: 'bg-[var(--success-color)]/10',
        badgeText: '正常',
        badgeClass: 'bg-[var(--success-color)]/10 text-[var(--success-color)]',
      };
    }
    return {
      icon: AlertCircle,
      color: 'text-[var(--error-color)]',
      bgColor: 'bg-[var(--error-color)]/10',
      badgeText: '异常',
      badgeClass: 'bg-[var(--error-color)]/10 text-[var(--error-color)]',
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--border-color)] p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-dark)] flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">系统状态</h2>
            <p className="text-sm text-[var(--text-secondary)]">实时监控服务健康状况</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 后端服务 */}
          <div className="p-5 bg-[var(--gray-blue-light)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${getStatusConfig(status?.backend || 'unknown').bgColor} flex items-center justify-center`}>
                <Server className={`w-6 h-6 ${getStatusConfig(status?.backend || 'unknown').color}`} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)] mb-1">后端服务</div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusConfig(status?.backend || 'unknown').badgeClass}`}>
                  {getStatusConfig(status?.backend || 'unknown').badgeText}
                </span>
              </div>
            </div>
          </div>

          {/* Agent 服务 */}
          <div className="p-5 bg-[var(--gray-blue-light)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${getStatusConfig(status?.agent || 'unknown').bgColor} flex items-center justify-center`}>
                <Bot className={`w-6 h-6 ${getStatusConfig(status?.agent || 'unknown').color}`} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[var(--text-secondary)] mb-1">Agent 服务</div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusConfig(status?.agent || 'unknown').badgeClass}`}>
                  {getStatusConfig(status?.agent || 'unknown').badgeText}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态更新时间 */}
      {!loading && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-placeholder)]">
            最后更新: {new Date().toLocaleTimeString('zh-CN')}
          </p>
        </div>
      )}
    </div>
  );
}