import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { Plus, Edit, Delete, FileText } from 'lucide-react';
import { projectService } from '@/services/projectService';
import type { Project, ProjectRequest } from '@/types';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      message.error('删除失败');
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
    } catch (error) {
      message.error('操作失败');
    }
  };

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
      render: (_, record: Project) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<FileText size={16} />}
            onClick={() => handleEdit(record)}
          >
            文档
          </Button>
          <Button
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<Delete size={16} />}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">项目管理</h2>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleCreate}>
          创建项目
        </Button>
      </div>

      <Table
        dataSource={projects}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
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
            name="description"
            label="项目描述"
          >
            <Input.TextArea placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}