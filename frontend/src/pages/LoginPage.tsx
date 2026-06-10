import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';
import { authService } from '@/services/authService';
import type { LoginRequest, RegisterRequest } from '@/types/auth';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await authService.login(values);
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await authService.register(values);
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (activeTab === 'login') {
      onLogin({
        username: formData.get('username') as string,
        password: formData.get('password') as string,
      });
    } else {
      onRegister({
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        fullName: formData.get('fullName') as string,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-white to-[var(--secondary-light)]" />
      
      {/* 装饰圆圈 */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary-color)]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--secondary-light)]/30 rounded-full blur-3xl" />
      
      {/* 登录卡片 */}
      <div className="relative w-full max-w-md mx-4">
        {/* 头部 Logo 区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-dark)] rounded-2xl shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--secondary-dark)]">DocAgent</h1>
          <p className="text-[var(--text-secondary)] mt-2">AI 智能文档生成平台</p>
        </div>

        {/* 卡片主体 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-[var(--border-color)] p-8">
          {/* 标签切换 */}
          <div className="flex mb-8 p-1 bg-[var(--gray-blue-light)] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-white text-[var(--secondary-dark)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-white text-[var(--secondary-dark)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-blue)]" />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="请输入用户名"
                  className="w-full pl-12 pr-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            {/* 邮箱（仅注册） */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-blue)]" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="请输入邮箱"
                    className="w-full pl-12 pr-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* 姓名（仅注册） */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  姓名（可选）
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-blue)]" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="请输入姓名"
                    className="w-full pl-12 pr-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-blue)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="请输入密码"
                  className="w-full pl-12 pr-12 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--gray-blue)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--secondary-dark)] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : (activeTab === 'login' ? '登录' : '注册')}
            </button>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <span className="text-sm text-[var(--text-secondary)]">
              {activeTab === 'login' ? '还没有账号？' : '已有账号？'}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
              className="ml-1 text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-hover)] transition-colors"
            >
              {activeTab === 'login' ? '立即注册' : '立即登录'}
            </button>
          </div>
        </div>

        {/* 版权信息 */}
        <p className="text-center text-xs text-[var(--text-placeholder)] mt-6">
          © 2026 DocAgent. All rights reserved.
        </p>
      </div>
    </div>
  );
}
