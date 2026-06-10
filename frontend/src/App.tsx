import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  FolderOpen,
  Activity,
  Heart,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Key,
  Globe,
  Sparkles,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';
import { ProjectList } from '@/components/ProjectList';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { TaskMonitor } from '@/components/TaskMonitor';
import { HealthStatus } from '@/components/HealthStatus';
import { authService } from '@/services/authService';
import { wsService } from '@/services/websocket';
import { settingsService } from '@/services/settingsService';
import type { AuthResponse } from '@/types/auth';

type MenuKey = 'generator' | 'projects' | 'tasks' | 'health';

export function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState<MenuKey>('generator');
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'api' | 'password'>('api');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    apiKey: '',
    baseUrl: '',
    model: 'deepseek-chat',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      setProfileForm({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
      const token = authService.getToken();
      if (token) {
        wsService.connect(token);
      }
    }
    // Load API settings
    const apiSettings = settingsService.getApiSettings();
    setSettingsForm(prev => ({
      ...prev,
      apiKey: apiSettings.apiKey,
      baseUrl: apiSettings.baseUrl,
      model: apiSettings.model,
    }));
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      wsService.disconnect();
      navigate('/login');
    } catch {
      console.error('Logout failed');
    }
  };

  const handleProfileSubmit = async () => {
    try {
      const result = await authService.updateProfile(profileForm);
      setUser({ ...user!, ...result });
      setProfileModalOpen(false);
      showToast('个人信息已更新');
    } catch (error: any) {
      showToast(error.response?.data?.message || '更新失败', 'error');
    }
  };

  const handlePasswordSubmit = async () => {
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      showToast('两次输入的新密码不一致', 'error');
      return;
    }
    try {
      await authService.changePassword({
        oldPassword: settingsForm.oldPassword,
        newPassword: settingsForm.newPassword,
      });
      showToast('密码已修改，请重新登录');
      setSettingsModalOpen(false);
      handleLogout();
    } catch (error: any) {
      showToast(error.response?.data?.message || '修改密码失败', 'error');
    }
  };

  const handleApiSettingsSubmit = async () => {
    try {
      settingsService.saveApiSettings({
        apiKey: settingsForm.apiKey || '',
        baseUrl: settingsForm.baseUrl || '',
        model: settingsForm.model || 'deepseek-chat',
      });
      showToast('API 设置已保存');
    } catch {
      showToast('保存失败', 'error');
    }
  };

  const resetApiSettings = () => {
    settingsService.clearApiSettings();
    setSettingsForm(prev => ({
      ...prev,
      apiKey: '',
      baseUrl: '',
      model: 'deepseek-chat',
    }));
    showToast('已重置 API 设置');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
      type === 'success'
        ? 'bg-[var(--success-color)]/10 text-[var(--success-color)] border border-[var(--success-color)]/20'
        : 'bg-[var(--error-color)]/10 text-[var(--error-color)] border border-[var(--error-color)]/20'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const menuItems = [
    { key: 'generator' as MenuKey, icon: FileCode, label: '文档生成' },
    { key: 'projects' as MenuKey, icon: FolderOpen, label: '项目管理' },
    { key: 'tasks' as MenuKey, icon: Activity, label: '任务监控' },
    { key: 'health' as MenuKey, icon: Heart, label: '系统状态' },
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

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-full bg-white/80 backdrop-blur-xl border-r border-[var(--border-color)] flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-6 border-b border-[var(--border-color)]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-dark)] flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-[var(--secondary-dark)] whitespace-nowrap">
                  DocAgent
                </h1>
                <p className="text-xs text-[var(--text-secondary)] whitespace-nowrap">AI Document Platform</p>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 py-4 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveKey(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--primary-color)]/10 to-transparent text-[var(--primary-color)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'drop-shadow-[0_0_8px_rgba(89,161,213,0.5)]' : ''}`} />
                  {!collapsed && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="p-2 border-t border-[var(--border-color)]">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] transition-colors"
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-[var(--border-color)]">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {menuItems.find((item) => item.key === activeKey)?.label}
              </h2>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--gray-blue-light)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-dark)] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user?.username || 'User'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{user?.email || ''}</p>
                </div>
              </button>

              {/* User Dropdown */}
              <div className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden transition-all duration-200 ${userMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <button
                  onClick={() => { setProfileModalOpen(true); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--gray-blue-light)] transition-colors"
                >
                  <User className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">个人信息</span>
                </button>
                <button
                  onClick={() => { setSettingsModalOpen(true); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--gray-blue-light)] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">设置</span>
                </button>
                <div className="h-px bg-[var(--border-color)]" />
                <button
                  onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--error-color)]/10 hover:text-[var(--error-color)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[var(--border-color)] p-6">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setProfileModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">个人信息</h3>
              <button onClick={() => setProfileModalOpen(false)} className="p-2 hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">用户名</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">姓名</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="请输入姓名"
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">邮箱</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱"
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">手机号</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleProfileSubmit}
                  className="px-5 py-2.5 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSettingsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">设置</h3>
              <button onClick={() => setSettingsModalOpen(false)} className="p-2 hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-color)]">
              <button
                onClick={() => setActiveSettingsTab('api')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeSettingsTab === 'api'
                    ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)] bg-[var(--primary-color)]/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Key className="w-4 h-4" />
                API 设置
              </button>
              <button
                onClick={() => setActiveSettingsTab('password')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeSettingsTab === 'password'
                    ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)] bg-[var(--primary-color)]/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Settings className="w-4 h-4" />
                修改密码
              </button>
            </div>

            {/* API Settings Tab */}
            {activeSettingsTab === 'api' && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">API Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-blue)]" />
                    <input
                      type="password"
                      value={settingsForm.apiKey}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-11 pr-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">API 地址</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-blue)]" />
                    <input
                      type="text"
                      value={settingsForm.baseUrl}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.deepseek.com"
                      className="w-full pl-11 pr-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">AI 模型</label>
                  <select
                    value={settingsForm.model}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                  >
                    <option value="deepseek-chat">DeepSeek</option>
                    <option value="kimi-k2.5">Kimi K2.5</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="qwen2.5-coder">Qwen 2.5 Coder</option>
                  </select>
                </div>
                <p className="text-xs text-[var(--text-placeholder)]">
                  提示：API 设置会保存在浏览器本地存储中，刷新页面后依然有效
                </p>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                  onClick={resetApiSettings}
                  className="flex items-center gap-2 px-5 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
                <button
                  onClick={handleApiSettingsSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  保存设置
                </button>
                </div>
              </div>
            )}

            {/* Password Settings Tab */}
            {activeSettingsTab === 'password' && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">旧密码</label>
                  <input
                    type="password"
                    value={settingsForm.oldPassword}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    placeholder="请输入旧密码"
                    className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">新密码</label>
                  <input
                    type="password"
                    value={settingsForm.newPassword}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="请输入新密码"
                    className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">确认新密码</label>
                  <input
                    type="password"
                    value={settingsForm.confirmPassword}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="请再次输入新密码"
                    className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="px-5 py-2.5 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  确认修改
                </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
