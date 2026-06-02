import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Segmented, Card, Tag, Spin } from 'antd';
import { Plus, Edit, Delete, FileText, LayoutGrid, List, Rocket, Download } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { documentService } from '@/services/documentService';
import { DocumentBrowser } from '@/components/DocumentBrowser';
import type { Project, ProjectRequest, ProjectStats } from '@/types';

interface ProjectListProps {
  onNavigateToGenerator: () => void;
}

export function ProjectList({ onNavigateToGenerator }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [projectData, stats] = await Promise.all([
        projectService.getAll(),
        projectService.getStats(),
      ]);
      setProjects(projectData);
      setProjectStats(stats);
    } catch {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatsForProject = (projectId: number): ProjectStats | undefined => {
    return projectStats.find((s) => s.projectId === projectId);
  };

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await projectService.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const handleViewDocuments = (project: Project) => {
    setSelectedProject(project);
    setDocDrawerOpen(true);
  };

  const handleExport = async (project: Project) => {
    try {
      const docs = await documentService.getProjectDocuments(project.id);
      if (docs.length === 0) {
        message.warning('该项目暂无文档可导出');
        return;
      }
      for (const doc of docs) {
        const fullDoc = await documentService.getDocument(project.id, doc.docType);
        const blob = new Blob([fullDoc.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.docType}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
      message.success(`已导出 ${docs.length} 篇文档`);
    } catch {
      message.error('导出失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: ProjectRequest = {
        name: values.name,
        path: values.path,
        language: values.language,
        description: values.description,
      };

      if (editingProject) {
        await projectService.update(editingProject.id, data);
        message.success('更新成功');
      } else {
        await projectService.create(data);
        message.success('创建成功');
      }

      setIsModalOpen(false);
      loadProjects();
    } catch {
      message.error('操作失败');
    }
  };

  // 表格列定义（用于 table 视图）
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Project) => (
        <div className="flex gap-2">
          <Button size="small" icon={<FileText size={16} />} onClick={() => handleViewDocuments(record)}>
            文档
          </Button>
          <Button size="small" icon={<Edit size={16} />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<Delete size={16} />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 相对时间格式化
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">项目管理</h2>
          <Segmented
            size="small"
            value={viewMode}
            onChange={(val) => setViewMode(val as 'table' | 'cards')}
            options={[
              { label: '卡片', value: 'cards', icon: <LayoutGrid size={14} /> },
              { label: '表格', value: 'table', icon: <List size={14} /> },
            ]}
          />
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
          创建项目
        </Button>
      </div>

      {viewMode === 'table' ? (
        <Table
          dataSource={projects}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      ) : (
        <Spin spinning={loading}>
          {projects.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📁</div>
              <div className="text-lg">暂无项目</div>
              <div className="text-sm mt-1">点击"创建项目"开始</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => {
                const stats = getStatsForProject(project.id);
                return (
                  <Card
                    key={project.id}
                    className="hover:shadow-md transition-shadow"
                    title={
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base">{project.name}</span>
                        <Tag color={project.language === 'chinese' ? 'red' : 'blue'}>
                          {project.language === 'chinese' ? '中文' : 'English'}
                        </Tag>
                      </div>
                    }
                  >
                    {/* 项目信息 */}
                    <div className="text-sm text-gray-500 mb-3">
                      <div className="truncate mb-1">📂 {project.path}</div>
                      {project.description && (
                        <div className="truncate text-gray-400">{project.description}</div>
                      )}
                    </div>

                    {/* 统计信息 */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">文档数：</span>
                          <span className="font-semibold">{stats?.docCount ?? 0}</span>
                        </div>
                        {stats && stats.docTypes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">类型：</span>
                            {stats.docTypes.map((t) => (
                              <Tag key={t} color="blue" className="text-xs">{t}</Tag>
                            ))}
                          </div>
                        )}
                      </div>
                      {stats?.lastUpdated && (
                        <div className="text-xs text-gray-400 mt-1">
                          最后更新：{timeAgo(stats.lastUpdated)}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="primary"
                        size="small"
                        icon={<Rocket size={14} />}
                        onClick={onNavigateToGenerator}
                      >
                        生成文档
                      </Button>
                      <Button
                        size="small"
                        icon={<FileText size={14} />}
                        onClick={() => handleViewDocuments(project)}
                      >
                        查看文档
                      </Button>
                      <Button
                        size="small"
                        icon={<Download size={14} />}
                        onClick={() => handleExport(project)}
                      >
                        导出
                      </Button>
                      <Button
                        size="small"
                        icon={<Edit size={14} />}
                        onClick={() => handleEdit(project)}
                      >
                        编辑
                      </Button>
                      <Popconfirm title="确定删除？" onConfirm={() => handleDelete(project.id)}>
                        <Button danger size="small" icon={<Delete size={14} />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Spin>
      )}

      <DocumentBrowser
        project={selectedProject}
        open={docDrawerOpen}
        onClose={() => setDocDrawerOpen(false)}
      />

      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="path"
            label="项目路径"
            rules={[{ required: true, message: '请输入项目路径' }]}
          >
            <Input placeholder="请输入项目路径" />
          </Form.Item>
          <Form.Item name="language" label="文档语言">
            <Select
              options={[
                { value: 'chinese', label: '中文' },
                { value: 'english', label: '英文' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
