import { useState, useEffect } from 'react';
import { Card, Tag, Spin } from 'antd';
import { Heart, Server, Bot } from 'lucide-react';
import { documentService } from '@/services/documentService';

export function HealthStatus() {
  const [status, setStatus] = useState<{ backend: string; agent: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'success' : 'error';
  };

  const getStatusText = (status: string) => {
    return status === 'healthy' ? '正常' : '异常';
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-red-500" />
          系统状态
        </div>
      }
      loading={loading}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <Server size={24} className="text-blue-500" />
          <div>
            <div className="text-sm text-gray-500">后端服务</div>
            <Tag color={getStatusColor(status?.backend || 'unknown')}>
              {getStatusText(status?.backend || 'unknown')}
            </Tag>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Bot size={24} className="text-green-500" />
          <div>
            <div className="text-sm text-gray-500">Agent 服务</div>
            <Tag color={getStatusColor(status?.agent || 'unknown')}>
              {getStatusText(status?.agent || 'unknown')}
            </Tag>
          </div>
        </div>
      </div>
    </Card>
  );
}