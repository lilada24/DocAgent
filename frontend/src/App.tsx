import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, theme, Button, Dropdown, Avatar, Space, message } from 'antd';
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
        return <ProjectList />;
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
    if (key === 'logout') {
      handleLogout();
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
    </Layout>
  );
}