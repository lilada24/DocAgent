import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, theme, Dropdown, Avatar, Space, message, Modal, Form, Input } from 'antd';
import {
  FileCode,
  FolderOpen,
  Activity,
  Heart,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectList } from '@/components/ProjectList';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { TaskMonitor } from '@/components/TaskMonitor';
import { HealthStatus } from '@/components/HealthStatus';
import { authService } from '@/services/authService';
import { wsService } from '@/services/websocket';
import type { AuthResponse } from '@/types/auth';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

type MenuKey = 'generator' | 'projects' | 'tasks' | 'health';

export function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState<MenuKey>('generator');
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      const token = authService.getToken();
      if (token) {
        wsService.connect(token);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      wsService.disconnect();
      message.success('已退出登录');
      navigate('/login');
      window.location.reload();
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  const openProfileModal = () => {
    const currentUser = authService.getUser();
    if (currentUser) {
      profileForm.setFieldsValue({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
    }
    setProfileModalOpen(true);
  };

  const handleProfileSubmit = async () => {
    try {
      const values = await profileForm.validateFields();
      const result = await authService.updateProfile(values);
      setUser({ ...user!, ...result });
      message.success('个人信息已更新');
      setProfileModalOpen(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleSettingsSubmit = async () => {
    try {
      const values = await settingsForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码已修改，请重新登录');
      settingsForm.resetFields();
      setSettingsModalOpen(false);
      handleLogout();
    } catch (error: any) {
      message.error(error.response?.data?.message || '修改密码失败');
    }
  };

  const menuItems = [
    { key: 'generator', icon: <FileCode size={20} />, label: '文档生成' },
    { key: 'projects', icon: <FolderOpen size={20} />, label: '项目管理' },
    { key: 'tasks', icon: <Activity size={20} />, label: '任务监控' },
    { key: 'health', icon: <Heart size={20} />, label: '系统状态' },
  ];

  const renderContent = () => {
    switch (activeKey) {
      case 'generator':
        return <DocumentGenerator />;
      case 'projects':
        return <ProjectList onNavigateToGenerator={() => setActiveKey('generator')} />;
      case 'tasks':
        return <TaskMonitor />;
      case 'health':
        return <HealthStatus />;
      default:
        return <DocumentGenerator />;
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <Settings size={16} />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        openProfileModal();
        break;
      case 'settings':
        setSettingsModalOpen(true);
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: colorBgContainer,
        }}
      >
        <div className="logo py-6 px-4">
          <Title level={4} className="text-center m-0">
            <span className="text-blue-500 font-bold">Doc</span>
            <span className="text-gray-600">Agent</span>
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={(e) => setActiveKey(e.key as MenuKey)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="h-full w-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <Title level={5} className="m-0 pl-4">
              {menuItems.find((item) => item.key === activeKey)?.label}
            </Title>
          </div>

          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
          >
            <Space className="cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
              <Avatar
                style={{ backgroundColor: '#1890ff' }}
                icon={<User size={16} />}
              />
              <div className="flex flex-col items-start">
                <Text strong>{user?.username || '用户'}</Text>
                <Text type="secondary" className="text-xs">
                  {user?.email || ''}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>

      {/* 个人信息 Modal */}
      <Modal
        title="个人信息"
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        onOk={handleProfileSubmit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={profileForm} layout="vertical">
          <Form.Item label="用户名">
            <Input value={user?.username || ''} disabled />
          </Form.Item>
          <Form.Item name="fullName" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码 Modal */}
      <Modal
        title="修改密码"
        open={settingsModalOpen}
        onCancel={() => {
          setSettingsModalOpen(false);
          settingsForm.resetFields();
        }}
        onOk={handleSettingsSubmit}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={settingsForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}