import { useState, useEffect } from 'react';
import { Card, Tag, Badge, List, message } from 'antd';
import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { documentService } from '@/services/documentService';
import type { TaskStatus } from '@/types';

export function TaskMonitor() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'running':
        return '运行中';
      case 'pending':
        return '等待中';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'failed':
        return <AlertTriangle size={16} />;
      case 'running':
        return <Activity size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Activity size={20} />
          任务监控
          <Badge count={tasks.filter(t => t.status === 'running').length} />
        </div>
      }
      loading={loading}
    >
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Activity size={48} className="mx-auto mb-2 opacity-50" />
          <div>暂无任务</div>
        </div>
      ) : (
        <List
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                <span className="text-sm text-gray-400">
                  {task.progress}%
                </span>,
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(task.status)}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.taskId}</span>
                    <Tag color={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Tag>
                  </div>
                }
                description={
                  <div className="text-sm text-gray-500">
                    创建于 {new Date(task.createdAt).toLocaleString()}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}