import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { User, Lock, Mail } from 'lucide-react';
import { authService } from '@/services/authService';
import type { LoginRequest, RegisterRequest } from '@/types/auth';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  const onLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await authService.login(values);
      message.success('登录成功');
      navigate('/');
      window.location.reload();
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await authService.register(values);
      message.success('注册成功');
      navigate('/');
      window.location.reload();
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">DocAgent</h1>
          <p className="text-gray-500 mt-2">AI 智能文档生成平台</p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  name="login"
                  onFinish={onLogin}
                  layout="vertical"
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      prefix={<User size={16} className="text-gray-400" />}
                      placeholder="请输入用户名"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<Lock size={16} className="text-gray-400" />}
                      placeholder="请输入密码"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      className="mt-4"
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form
                  name="register"
                  onFinish={onRegister}
                  layout="vertical"
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少3个字符' },
                    ]}
                  >
                    <Input
                      prefix={<User size={16} className="text-gray-400" />}
                      placeholder="请输入用户名"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<Mail size={16} className="text-gray-400" />}
                      placeholder="请输入邮箱"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少6个字符' },
                    ]}
                  >
                    <Input.Password
                      prefix={<Lock size={16} className="text-gray-400" />}
                      placeholder="请输入密码"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="fullName"
                    label="姓名（可选）"
                  >
                    <Input
                      placeholder="请输入姓名"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      className="mt-4"
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}