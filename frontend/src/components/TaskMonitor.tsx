import { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import type { TaskStatus } from '@/types';

interface PaginatedResponse {
  tasks: TaskStatus[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

const PAGE_SIZE = 10;

export function TaskMonitor() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadTasks = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse>('/documents/tasks', {
        params: { page, size: PAGE_SIZE },
      });
      setTasks(response.data.tasks || []);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(currentPage);
    const interval = setInterval(() => loadTasks(currentPage), 5000);
    return () => clearInterval(interval);
  }, [currentPage, loadTasks]);

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < Math.ceil(totalElements / PAGE_SIZE)) {
      setCurrentPage(page);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-[var(--success-color)]',
          bgColor: 'bg-[var(--success-color)]/10',
          badgeClass: 'bg-[var(--success-color)]/10 text-[var(--success-color)]',
          text: '已完成',
        };
      case 'failed':
        return {
          icon: AlertTriangle,
          color: 'text-[var(--error-color)]',
          bgColor: 'bg-[var(--error-color)]/10',
          badgeClass: 'bg-[var(--error-color)]/10 text-[var(--error-color)]',
          text: '失败',
        };
      case 'running':
        return {
          icon: Activity,
          color: 'text-[var(--primary-color)]',
          bgColor: 'bg-[var(--primary-color)]/10',
          badgeClass: 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]',
          text: '运行中',
        };
      default:
        return {
          icon: Clock,
          color: 'text-[var(--text-placeholder)]',
          bgColor: 'bg-[var(--gray-blue-light)]',
          badgeClass: 'bg-[var(--gray-blue-light)] text-[var(--text-secondary)]',
          text: status === 'pending' ? '等待中' : status,
        };
    }
  };

  const runningCount = tasks.filter((t) => t.status === 'running').length;

  return (
    <div className="bg-white rounded-2xl border border-[var(--border-color)] p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-dark)] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">任务监控</h2>
            <p className="text-sm text-[var(--text-secondary)]">实时追踪文档生成任务状态</p>
          </div>
        </div>
        {runningCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-full text-sm font-medium">
            <Activity className="w-4 h-4 animate-pulse" />
            {runningCount} 个任务运行中
          </span>
        )}
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-placeholder)]">
          <Activity className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">暂无任务</p>
          <p className="text-sm mt-1">文档生成任务将在此显示</p>
        </div>
      ) : (
        <>
          {/* 任务列表 */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const statusConfig = getStatusConfig(task.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={task.taskId}
                  className="p-4 bg-[var(--gray-blue-light)] rounded-xl hover:bg-[var(--border-color)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* 状态图标 */}
                    <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </div>

                    {/* 任务信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-[var(--text-primary)] truncate">
                          {task.taskId}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.badgeClass}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                        <span>创建于 {new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                        {task.status !== 'completed' && task.status !== 'failed' && (
                          <>
                            <span className="text-[var(--text-placeholder)]">·</span>
                            <span>进度 {task.progress}%</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 进度条 */}
                    {task.status !== 'completed' && task.status !== 'failed' && (
                      <div className="w-24">
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              task.status === 'running'
                                ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-dark)]'
                                : 'bg-[var(--gray-blue)]'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {task.error && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                        <p className="text-sm text-[var(--error-color)]">{task.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">
              第 {currentPage + 1} / {Math.ceil(totalElements / PAGE_SIZE)} 页
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalElements / PAGE_SIZE) - 1}
              className="p-2 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-[var(--text-placeholder)] ml-4">
              共 {totalElements} 条任务
            </span>
          </div>
        </>
      )}
    </div>
  );
}