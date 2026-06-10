import { useState, useEffect, useRef } from 'react';
import {
  FileCode,
  Rocket,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Upload,
  Search,
  ChevronDown,
  Loader2,
  Trash2,
} from 'lucide-react';
import { documentService } from '@/services/documentService';
import { projectService } from '@/services/projectService';
import { wsService } from '@/services/websocket';
import { ragService } from '@/services/ragService';
import type { GenerateRequest, TaskStatus, Project, DocumentSummary } from '@/types';

export function DocumentGenerator() {
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // RAG Q&A state
  const [ragQuestion, setRagQuestion] = useState('');
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [ragSources, setRagSources] = useState<{ source: string; excerpt: string }[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragIndexed, setRagIndexed] = useState(false);
  const [ragProjectPath, setRagProjectPath] = useState<string | null>(null);

  // 已有文档相关状态
  const [uploadedDocs, setUploadedDocs] = useState<DocumentSummary[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [indexingDoc, setIndexingDoc] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    projectName: '',
    projectPath: '',
    docType: 'readme',
    language: 'chinese',
  });

  // 下拉菜单状态
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [docTypeDropdownOpen, setDocTypeDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  // 文档上传
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 用户选择文件夹后上传
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const firstPath = fileList[0].webkitRelativePath || fileList[0].name;
    const projectName = firstPath.split('/')[0] || 'uploaded-project';

    setUploading(true);
    try {
      const result = await documentService.uploadProject(Array.from(fileList), projectName);
      showToast(`项目上传成功！${result.filesCount} 个文件`);
      setFormData(prev => ({ ...prev, projectPath: result.containerPath }));
      loadProjectDocuments(undefined, result.containerPath);
    } catch (error: any) {
      showToast('上传失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 加载项目列表
  useEffect(() => {
    projectService.getAll()
      .then(setProjects)
      .catch(() => showToast('加载项目列表失败', 'error'));
  }, []);

  // 状态更新逻辑
  const handleStatusUpdate = (data: TaskStatus) => {
    setTaskStatus(data);
    if (data.status === 'completed') {
      showToast('文档生成完成！');
      setLoading(false);
      stopPolling();
    } else if (data.status === 'failed') {
      showToast('文档生成失败：' + (data.error || '未知错误'), 'error');
      setLoading(false);
      stopPolling();
    }
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (currentTaskId) {
      wsService.subscribeToTask(currentTaskId, handleStatusUpdate);

      stopPolling();
      pollTimerRef.current = setInterval(async () => {
        try {
          const status = await documentService.getTaskStatus(currentTaskId);
          if (status) {
            handleStatusUpdate(status);
          }
        } catch {
          // 轮询失败静默忽略
        }
      }, 2000);

      return () => {
        wsService.unsubscribeFromTask(currentTaskId);
        stopPolling();
      };
    }
  }, [currentTaskId]);

  // 文档生成完成后自动索引
  useEffect(() => {
    if (taskStatus?.status === 'completed' && taskStatus.result && !ragIndexed) {
      ragService.index({
        project_path: formData.projectPath,
        doc_content: taskStatus.result,
      }).then(() => {
        setRagIndexed(true);
        setRagProjectPath(formData.projectPath);
        loadProjectDocuments(undefined, formData.projectPath);
      }).catch(() => {
        // 索引失败静默忽略
      });
    }
  }, [taskStatus?.status, taskStatus?.result]);

  // 重置 RAG 状态
  useEffect(() => {
    if (taskStatus?.status === 'running' || taskStatus?.status === 'pending') {
      setRagIndexed(false);
      setRagAnswer(null);
      setRagSources([]);
      setRagQuestion('');
    }
  }, [taskStatus?.status]);

  // 加载已有文档
  const loadProjectDocuments = async (projectId?: number, projectPath?: string) => {
    let project = null;
    if (projectId) {
      project = projects.find((p) => p.id === projectId);
    }
    if (!project && projectPath) {
      project = projects.find((p) => p.path === projectPath);
    }
    if (!project) {
      setUploadedDocs([]);
      return;
    }

    setCurrentProjectId(project.id);
    setDocsLoading(true);
    try {
      const docs = await documentService.getProjectDocuments(project.id);
      setUploadedDocs(docs);
    } catch {
      setUploadedDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  // 索引已有文档
  const handleIndexExistingDoc = async (docType: string) => {
    if (!formData.projectPath) {
      showToast('请先选择项目', 'error');
      return;
    }

    const project = projects.find((p) => p.path === formData.projectPath);
    if (!project) return;

    setIndexingDoc(docType);
    try {
      const doc = await documentService.getDocument(project.id, docType);
      await ragService.index({
        project_path: formData.projectPath,
        doc_content: doc.content,
      });
      setRagIndexed(true);
      setRagProjectPath(formData.projectPath);
      setRagAnswer(null);
      setRagSources([]);
      showToast(`已索引文档: ${docType}`);
    } catch (error: any) {
      showToast('索引失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setIndexingDoc(null);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!currentProjectId) return;
    try {
      await documentService.deleteDoc(documentId);
      showToast('文档已删除');
      loadProjectDocuments(currentProjectId);
    } catch (error: any) {
      showToast('删除失败：' + (error.message || '未知错误'), 'error');
    }
  };

  const handleIndexProjectDocs = async () => {
    if (!currentProjectId) {
      showToast('请先选择项目', 'error');
      return;
    }

    setIsIndexing(true);
    try {
      await documentService.indexDocs(currentProjectId, true);
      showToast('索引完成');
      setRagIndexed(true);
      setRagProjectPath(formData.projectPath);
      loadProjectDocuments(currentProjectId);
    } catch (error: any) {
      showToast('索引失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setIsIndexing(false);
    }
  };

  // RAG 问答
  const handleRagQuery = async () => {
    if (!ragQuestion.trim()) return;
    const projectPath = formData.projectPath || ragProjectPath;
    if (!projectPath) {
      showToast('请先选择项目或生成文档', 'error');
      return;
    }

    setRagLoading(true);
    setRagAnswer(null);
    setRagSources([]);
    try {
      const result = await ragService.query({
        project_path: projectPath,
        question: ragQuestion,
        top_k: 5,
      });
      setRagAnswer(result.answer);
      setRagSources(result.sources);
    } catch (error: any) {
      showToast('问答失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setRagLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.projectPath) {
      showToast('请输入项目路径', 'error');
      return;
    }

    try {
      const data: GenerateRequest = {
        projectPath: formData.projectPath,
        docType: formData.docType,
        language: formData.language,
        projectName: formData.projectName || undefined,
      };

      setLoading(true);
      setTaskStatus(null);
      setCurrentTaskId(null);
      stopPolling();

      const response = await documentService.generate(data);
      setCurrentTaskId(response.taskId);
      setTaskStatus({
        taskId: response.taskId,
        status: response.status,
        progress: 0,
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
      });
      showToast('任务已创建，开始处理...');
    } catch (error: any) {
      showToast('创建任务失败：' + (error.message || '未知错误'), 'error');
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!taskStatus) return null;
    switch (taskStatus.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-[var(--success-color)]" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-[var(--error-color)]" />;
      default:
        return <Loader2 className="w-6 h-6 text-[var(--primary-color)] animate-spin" />;
    }
  };

  const getStatusText = () => {
    if (!taskStatus) return '';
    switch (taskStatus.status) {
      case 'pending': return '等待中';
      case 'created': return '已创建';
      case 'running': return '生成中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'error': return '错误';
      default: return taskStatus.status;
    }
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
    p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    p.path.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  const handleProjectSelect = (project: Project) => {
    setFormData(prev => ({ ...prev, projectName: String(project.id), projectPath: project.path }));
    setCurrentProjectId(project.id);
    loadProjectDocuments(project.id, project.path);
    setProjectDropdownOpen(false);
    setProjectSearchTerm('');
  };

  const docTypes = [
    { value: 'readme', label: 'README' },
    { value: 'api', label: 'API 文档' },
    { value: 'all', label: '全部文档' },
  ];

  const languages = [
    { value: 'chinese', label: '中文' },
    { value: 'english', label: '英文' },
  ];

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--secondary-dark)] flex items-center justify-center">
          <FileCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">文档生成器</h2>
          <p className="text-sm text-[var(--text-secondary)]">上传项目并自动生成技术文档</p>
        </div>
      </div>

      {/* 表单卡片 */}
      <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 关联项目 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">关联项目</label>
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-left transition-all hover:border-[var(--border-color)]"
              >
                {formData.projectName ? (
                  projects.find(p => String(p.id) === formData.projectName)?.name || '已选择项目'
                ) : (
                  <span className="text-[var(--text-placeholder)]">选择已有项目（可选）</span>
                )}
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {projectDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden">
                  <div className="p-3 border-b border-[var(--border-color)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        placeholder="搜索项目..."
                        className="w-full pl-9 pr-3 py-2 bg-[var(--gray-blue-light)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project)}
                          className="w-full px-4 py-3 text-left hover:bg-[var(--gray-blue-light)] transition-colors"
                        >
                          <div className="font-medium text-[var(--text-primary)]">{project.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{project.path}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-[var(--text-placeholder)]">
                        {projectSearchTerm ? '未找到匹配的项目' : '暂无项目'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 项目路径 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">项目路径</label>
            <input
              type="text"
              value={formData.projectPath}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({ ...prev, projectPath: value }));
                if (value) {
                  const matched = projects.find((p) => p.path === value);
                  if (matched) {
                    setCurrentProjectId(matched.id);
                    loadProjectDocuments(matched.id, value);
                  } else {
                    setCurrentProjectId(null);
                    setUploadedDocs([]);
                  }
                } else {
                  setCurrentProjectId(null);
                  setUploadedDocs([]);
                }
              }}
              placeholder="例如: /app/projects/你的项目名"
              className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all"
            />
          </div>

          {/* 文档类型 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">文档类型</label>
            <div className="relative">
              <button
                onClick={() => setDocTypeDropdownOpen(!docTypeDropdownOpen)}
                className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-left transition-all hover:border-[var(--border-color)]"
              >
                {docTypes.find(t => t.value === formData.docType)?.label || '选择文档类型'}
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] transition-transform ${docTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {docTypeDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden">
                  {docTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, docType: type.value }));
                        setDocTypeDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        formData.docType === type.value ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'hover:bg-[var(--gray-blue-light)]'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 文档语言 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">文档语言</label>
            <div className="relative">
              <button
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="w-full px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-left transition-all hover:border-[var(--border-color)]"
              >
                {languages.find(l => l.value === formData.language)?.label || '选择语言'}
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {languageDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, language: lang.value }));
                        setLanguageDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        formData.language === lang.value ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'hover:bg-[var(--gray-blue-light)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 已有文档快捷索引 */}
        {formData.projectPath && (
          <div className="mt-4 p-4 bg-[var(--secondary-light)]/30 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--secondary-dark)] mb-3">
              <Upload className="w-4 h-4" />
              已有文档（点击索引，用于问答）
            </div>
            {docsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-[var(--primary-color)] animate-spin" />
              </div>
            ) : uploadedDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                      ragIndexed && ragProjectPath === formData.projectPath
                        ? 'bg-[var(--success-color)]/10 text-[var(--success-color)]'
                        : 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                    }`}
                  >
                    {indexingDoc === doc.docType ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => handleIndexExistingDoc(doc.docType)}
                    >
                      {doc.docType} (v{doc.version})
                    </span>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="hover:text-[var(--error-color)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-placeholder)]">暂无已有文档，生成文档后可在此索引</p>
            )}
          </div>
        )}

        {/* 隐藏的文件夹选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          {...({ webkitdirectory: '', directory: '' } as any)}
          style={{ display: 'none' }}
          onChange={handleFolderSelect}
        />

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--gray-blue-light)] transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? '上传中...' : '上传项目文件夹'}
          </button>
          <button
            onClick={handleIndexProjectDocs}
            disabled={isIndexing || !currentProjectId || uploadedDocs.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--gray-blue-light)] transition-all disabled:opacity-50"
          >
            {isIndexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isIndexing ? '索引中...' : '索引项目文档'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleGenerate}
            disabled={loading || !formData.projectPath}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
        <p className="text-xs text-[var(--text-placeholder)] mt-3">
          支持上传 PDF、Word、Markdown、TXT，文件大小受后端配置限制。
        </p>
      </div>

      {/* 任务状态 */}
      {taskStatus && (
        <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            {getStatusIcon()}
            <div>
              <div className="font-semibold text-[var(--text-primary)]">任务 {taskStatus.taskId}</div>
              <div className="text-sm text-[var(--text-secondary)]">{getStatusText()}</div>
            </div>
          </div>

          {taskStatus.status !== 'failed' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
                <span>进度</span>
                <span>{taskStatus.progress}%</span>
              </div>
              <div className="h-2 bg-[var(--gray-blue-light)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-dark)] rounded-full transition-all duration-500"
                  style={{ width: `${taskStatus.progress}%` }}
                />
              </div>
            </div>
          )}

          {taskStatus.error && (
            <div className="p-3 bg-[var(--error-color)]/10 rounded-lg text-sm text-[var(--error-color)]">
              {taskStatus.error}
            </div>
          )}

          {taskStatus.result && (
            <div className="mt-4 p-4 bg-[var(--gray-blue-light)] rounded-xl">
              <h4 className="font-medium text-[var(--text-primary)] mb-2">生成结果预览</h4>
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] max-h-60 overflow-y-auto">
                {taskStatus.result}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* RAG 文档问答 */}
      <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--secondary-dark)] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">文档问答</h3>
            {ragIndexed && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--success-color)]/10 text-[var(--success-color)] rounded-full">已索引</span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <textarea
            value={ragQuestion}
            onChange={(e) => setRagQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (!e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                handleRagQuery();
              }
            }}
            placeholder={
              ragIndexed
                ? "对文档提问，例如：这个项目的核心功能是什么？"
                : "请先选择项目，然后点击上方已有文档标签进行索引，或先生成文档"
            }
            rows={2}
            disabled={ragLoading}
            className="flex-1 px-4 py-3 bg-[var(--gray-blue-light)] border border-transparent rounded-xl text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-white transition-all resize-none"
          />
          <button
            onClick={handleRagQuery}
            disabled={!ragQuestion.trim() || !ragIndexed || ragLoading}
            className="px-5 py-3 bg-[var(--secondary-dark)] text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {ragLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {ragLoading ? '提问中' : '提问'}
          </button>
        </div>

        {!ragIndexed && (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--text-placeholder)]">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">选择项目后可查看已有文档，点击文档标签即可索引</p>
            <p className="text-xs mt-1">也支持生成新文档后自动索引</p>
          </div>
        )}

        {ragAnswer && (
          <div className="mt-4 p-4 bg-[var(--secondary-light)]/30 rounded-xl">
            <div className="font-medium text-[var(--secondary-dark)] mb-2">回答：</div>
            <div className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{ragAnswer}</div>

            {ragSources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-placeholder)] mb-2">参考来源：</div>
                {ragSources.map((s, i) => (
                  <div key={i} className="text-xs text-[var(--text-secondary)] mb-1">
                    • <span className="font-mono text-[var(--primary-color)]">{s.source}</span>
                    <span className="mx-1">—</span>
                    {s.excerpt.slice(0, 100)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
