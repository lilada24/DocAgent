import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Progress, Card, message, Spin } from 'antd';
import { FileCode, Rocket, CheckCircle, AlertCircle } from 'lucide-react';
import { documentService } from '@/services/documentService';
import { wsService } from '@/services/websocket';
import type { GenerateRequest, TaskStatus } from '@/types';

export function DocumentGenerator() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (currentTaskId) {
      wsService.subscribeToTask(currentTaskId, (data) => {
        setTaskStatus(data);
        if (data.status === 'completed') {
          message.success('文档生成完成！');
          setLoading(false);
        } else if (data.status === 'failed') {
          message.error('文档生成失败：' + data.error);
          setLoading(false);
        }
      });

      return () => {
        wsService.unsubscribeFromTask(currentTaskId);
      };
    }
  }, [currentTaskId]);

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      const data: GenerateRequest = {
        projectPath: values.projectPath,
        docType: values.docType,
        language: values.language,
        model: values.model,
        apiKey: values.apiKey || undefined,
        baseUrl: values.baseUrl || undefined,
      };

      setLoading(true);
      const response = await documentService.generate(data);
      setCurrentTaskId(response.taskId);
      setTaskStatus({
        taskId: response.taskId,
        status: response.status,
        progress: 0,
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
      });
      message.success('任务已创建');
    } catch (error: any) {
      message.error('创建任务失败：' + (error.message || '未知错误'));
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!taskStatus) return null;
    switch (taskStatus.status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'failed':
        return <AlertCircle className="text-red-500" size={24} />;
      default:
        return <Spin size="small" />;
    }
  };

  const getStatusText = () => {
    if (!taskStatus) return '';
    switch (taskStatus.status) {
      case 'pending':
        return '等待中';
      case 'running':
        return '生成中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return taskStatus.status;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <FileCode size={28} className="text-blue-500" />
        <h2 className="text-xl font-bold">文档生成器</h2>
      </div>

      <Card className="mb-4">
        <Form form={form} layout="vertical" onFinish={handleGenerate}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              name="projectPath"
              label="项目路径"
              rules={[{ required: true, message: '请输入项目路径' }]}
            >
              <Input placeholder="例如: /path/to/project" />
            </Form.Item>

            <Form.Item
              name="docType"
              label="文档类型"
            >
              <Select
                options={[
                  { value: 'readme', label: 'README' },
                  { value: 'api', label: 'API 文档' },
                  { value: 'all', label: '全部文档' },
                ]}
                defaultValue="readme"
              />
            </Form.Item>

            <Form.Item
              name="language"
              label="文档语言"
            >
              <Select
                options={[
                  { value: 'chinese', label: '中文' },
                  { value: 'english', label: '英文' },
                ]}
                defaultValue="chinese"
              />
            </Form.Item>

            <Form.Item
              name="model"
              label="AI 模型"
            >
              <Select
                options={[
                  { value: 'deepseek-chat', label: 'DeepSeek' },
                  { value: 'kimi-k2.5', label: 'Kimi K2.5' },
                  { value: 'gpt-4o', label: 'GPT-4o' },
                  { value: 'qwen2.5-coder', label: 'Qwen 2.5 Coder' },
                ]}
                defaultValue="deepseek-chat"
              />
            </Form.Item>

            <Form.Item
              name="apiKey"
              label="API Key（可选）"
            >
              <Input.Password placeholder="留空则使用系统配置" />
            </Form.Item>

            <Form.Item
              name="baseUrl"
              label="API 地址（可选）"
            >
              <Input placeholder="留空则使用默认地址" />
            </Form.Item>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<Rocket size={18} />}
              loading={loading}
              htmlType="submit"
            >
              开始生成
            </Button>
          </div>
        </Form>
      </Card>

      {taskStatus && (
        <Card title="任务状态">
          <div className="flex items-center gap-4 mb-4">
            {getStatusIcon()}
            <div>
              <div className="font-medium">任务 {taskStatus.taskId}</div>
              <div className="text-sm text-gray-500">{getStatusText()}</div>
            </div>
          </div>

          {taskStatus.status !== 'failed' && (
            <div className="mb-4">
              <Progress
                percent={taskStatus.progress}
                showInfo={true}
                strokeColor={{
                  '0%': '#5470c6',
                  '100%': '#91cc75',
                }}
              />
            </div>
          )}

          {taskStatus.error && (
            <div className="text-red-500 text-sm">
              错误: {taskStatus.error}
            </div>
          )}

          {taskStatus.result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">生成结果预览</h4>
              <pre className="whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
                {taskStatus.result}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}