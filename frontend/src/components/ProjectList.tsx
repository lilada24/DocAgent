import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Delete,
  FileText,
  LayoutGrid,
  List,
  Rocket,
  Download,
  FolderOpen,
  Clock,
  FileCode,
  Search,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
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
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    language: 'chinese',
    description: '',
  });

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
      showToast('加载项目失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatsForProject = (projectId: number): ProjectStats | undefined => {
    return projectStats.find((s) => s.projectId === projectId);
  };

  const handleCreate = () => {
    setEditingProject(null);
    setSelectedFiles(null);
    setFormData({ name: '', path: '', language: 'chinese', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setSelectedFiles(null);
    setFormData({
      name: project.name,
      path: project.path,
      language: project.language,
      description: project.description || '',
    });
    setIsModalOpen(true);
  };

  // 处理文件夹选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      const folderName = files[0].webkitRelativePath?.split('/')[0] || '已选择文件';
      setFormData(prev => ({ ...prev, path: `${folderName} (${files.length} 个文件)` }));
    }
  };

  // 触发文件夹选择
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await projectService.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
      showToast('删除成功');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || '删除失败';
      showToast('删除失败：' + errMsg, 'error');
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
        showToast('该项目暂无文档可导出', 'error');
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
      showToast(`已导出 ${docs.length} 篇文档`);
    } catch {
      showToast('导出失败', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('请输入项目名称', 'error');
      return;
    }
    if (!editingProject && !selectedFiles?.length) {
      showToast('请选择项目文件夹', 'error');
      return;
    }

    try {
      setUploading(true);

      // 如果是新创建项目且有选中文件，先上传文件
      if (!editingProject && selectedFiles && selectedFiles.length > 0) {
        await documentService.uploadProject(selectedFiles, formData.name);
      }

      const data: ProjectRequest = {
        name: formData.name,
        path: formData.path,
        language: formData.language,
        description: formData.description,
      };

      if (editingProject) {
        await projectService.update(editingProject.id, data);
        showToast('更新成功');
      } else {
        await projectService.create(data);
        showToast('创建成功');
      }

      setIsModalOpen(false);
      setSelectedFiles(null);
      loadProjects();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || '操作失败';
      showToast(errMsg, 'error');
    } finally {
      setUploading(false);
    }
  };

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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--secondary-dark)] flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">项目管理</h2>
            <p className="text-sm text-[var(--text-secondary)]">管理和组织您的项目文档</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 视图切换 */}
          <div className="flex bg-[var(--gray-blue-light)] rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              卡片
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-4 h-4" />
              列表
            </button>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            创建项目
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索项目名称或路径..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all"
        />
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-placeholder)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--gray-blue-light)] flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium">暂无项目</p>
          <p className="text-sm mt-1">{searchTerm ? '未找到匹配的项目' : '点击"创建项目"开始'}</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[var(--border-color)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--gray-blue-light)]">
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-primary)]">项目名称</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-primary)]">路径</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-primary)]">语言</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-primary)]">文档数</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-[var(--text-primary)]">创建时间</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-[var(--text-primary)]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const stats = getStatsForProject(project.id);
                return (
                  <tr key={project.id} className="border-t border-[var(--border-color)] hover:bg-[var(--gray-blue-light)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-[var(--text-secondary)] truncate">{project.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] truncate max-w-xs">{project.path}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.language === 'chinese'
                          ? 'bg-[var(--success-color)]/10 text-[var(--success-color)]'
                          : 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                      }`}>
                        {project.language === 'chinese' ? '中文' : 'English'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{stats?.docCount ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{timeAgo(project.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDocuments(project)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition-all"
                          title="查看文档"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition-all"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--error-color)] hover:bg-[var(--error-color)]/10 rounded-lg transition-all"
                          title="删除"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 卡片视图 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const stats = getStatsForProject(project.id);
            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-[var(--border-color)] p-5 hover:shadow-lg transition-all group"
              >
                {/* 头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.language === 'chinese'
                      ? 'bg-[var(--success-color)]/10 text-[var(--success-color)]'
                      : 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                  }`}>
                    {project.language === 'chinese' ? '中文' : 'English'}
                  </span>
                </div>

                {/* 路径 */}
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
                  <FolderOpen className="w-4 h-4" />
                  <span className="truncate">{project.path}</span>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center gap-4 py-3 px-4 bg-[var(--gray-blue-light)] rounded-xl mb-4">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span className="text-sm">
                      <span className="font-semibold text-[var(--text-primary)]">{stats?.docCount ?? 0}</span> 文档
                    </span>
                  </div>
                  {stats?.docTypes && stats.docTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {stats.docTypes.slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 text-xs bg-white rounded-full text-[var(--text-secondary)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 时间 */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-placeholder)] mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  创建于 {timeAgo(project.createdAt)}
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onNavigateToGenerator}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--secondary-dark)] text-white text-sm rounded-lg hover:shadow-md transition-all"
                  >
                    <Rocket className="w-4 h-4" />
                    生成文档
                  </button>
                  <button
                    onClick={() => handleViewDocuments(project)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 text-sm rounded-lg transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    查看
                  </button>
                  <button
                    onClick={() => handleExport(project)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 text-sm rounded-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    导出
                  </button>
                  <button
                    onClick={() => handleEdit(project)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 text-sm rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--error-color)] hover:bg-[var(--error-color)]/10 text-sm rounded-lg transition-all"
                  >
                    <Delete className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 文档浏览器抽屉 */}
      <DocumentBrowser
        project={selectedProject}
        open={docDrawerOpen}
        onClose={() => setDocDrawerOpen(false)}
      />

      {/* 创建/编辑项目弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {editingProject ? '编辑项目' : '创建项目'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* 隐藏的文件夹选择 input */}
            <input
              ref={fileInputRef}
              type="file"
              {...({ webkitdirectory: '', directory: '' } as any)}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* 表单内容 */}
            <div className="p-6 space-y-4">
              {/* 项目名称 */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">项目名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入项目名称"
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                />
              </div>

              {/* 项目文件 */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">项目文件</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.path}
                    readOnly
                    placeholder="点击按钮选择文件夹"
                    className="flex-1 px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] cursor-not-allowed"
                  />
                  <button
                    onClick={triggerFileSelect}
                    disabled={editingProject !== null}
                    className="px-4 py-3 bg-white border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--gray-blue-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    选择
                  </button>
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--success-color)] mt-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    已选择 {selectedFiles.length} 个文件
                  </div>
                )}
                {editingProject && (
                  <div className="text-xs text-[var(--text-placeholder)] mt-2">
                    编辑模式下无法更改文件
                  </div>
                )}
              </div>

              {/* 文档语言 */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">文档语言</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
                >
                  <option value="chinese">中文</option>
                  <option value="english">English</option>
                </select>
              </div>

              {/* 项目描述 */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">项目描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入项目描述"
                  rows={2}
                  className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {uploading ? '上传中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
