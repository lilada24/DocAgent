import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Edit,
  Eye,
  Save,
  X,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { documentService } from '@/services/documentService';
import type { Project, Document, DocumentSummary } from '@/types';

interface DocumentBrowserProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentBrowser({ project, open, onClose }: DocumentBrowserProps) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 编辑状态
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && project) {
      setView('list');
      setSelectedDoc(null);
      setEditing(false);
      loadDocuments(project.id);
    }
  }, [open, project?.id]);

  const loadDocuments = async (projectId: number) => {
    setLoading(true);
    try {
      const data = await documentService.getProjectDocuments(projectId);
      setDocuments(data);
    } catch {
      showToast('加载文档列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentDetail = async (docType: string) => {
    if (!project) return;
    setLoadingDoc(true);
    setEditing(false);
    try {
      const data = await documentService.getDocument(project.id, docType);
      setSelectedDoc(data);
      setEditContent(data.content || '');
      setView('detail');
    } catch {
      showToast('加载文档内容失败', 'error');
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedDoc(null);
    setEditing(false);
  };

  const handleUploadDocuments = async (fileList: FileList | null) => {
    if (!project || !fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setUploading(true);
    setUploadProgress(0);
    try {
      await documentService.uploadDocs(files, project.id, (progress) => {
        setUploadProgress(progress);
      });
      showToast(`已上传 ${files.length} 个文档并开始解析`);
      loadDocuments(project.id);
    } catch (error: any) {
      showToast('文档上传失败：' + (error.message || '未知错误'), 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUploadDocuments = () => {
    if (!project) {
      showToast('请先选择项目', 'error');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleStartEdit = () => {
    setEditContent(selectedDoc?.content || '');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(selectedDoc?.content || '');
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!project || !selectedDoc) return;
    setSaving(true);
    try {
      await documentService.saveDocument(project.id, selectedDoc.docType, editContent);
      showToast('文档已保存');
      const updated = await documentService.getDocument(project.id, selectedDoc.docType);
      setSelectedDoc(updated);
      setEditing(false);
      loadDocuments(project.id);
    } catch {
      showToast('保存文档失败', 'error');
    } finally {
      setSaving(false);
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

  const drawerTitle =
    view === 'list'
      ? `文档浏览 - ${project?.name ?? ''}`
      : editing
        ? `编辑 - ${selectedDoc?.docType ?? ''}`
        : selectedDoc?.docType ?? '文档详情';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* 抽屉内容 */}
      <div className="relative ml-auto w-full max-w-[800px] bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{drawerTitle}</h2>
          <div className="flex items-center gap-2">
            {view === 'detail' && (
              <>
                {!editing ? (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--secondary-dark)] text-white text-sm rounded-lg hover:shadow-md transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] text-sm rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      取消
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--secondary-dark)] text-white text-sm rounded-lg hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? '保存中' : '保存'}
                    </button>
                  </>
                )}
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-2 px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--gray-blue-light)] text-sm rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--gray-blue-light)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <>
              {/* 工具栏 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">文档列表</h3>
                  <p className="text-sm text-[var(--text-secondary)]">上传后可在此查看并继续编辑文档内容</p>
                </div>
                <button
                  onClick={triggerUploadDocuments}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary-dark)] text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? '上传中' : '上传文档'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.md,.txt"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadDocuments(e.target.files)}
                />
              </div>

              {/* 上传进度 */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
                    <span>上传进度</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-[var(--gray-blue-light)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--secondary-dark)] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 加载状态 */}
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--text-placeholder)]">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">暂无文档</p>
                  <p className="text-sm mt-1">请先上传或生成文档</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.docType}
                      onClick={() => loadDocumentDetail(doc.docType)}
                      className="p-4 bg-[var(--gray-blue-light)] rounded-xl hover:bg-[var(--border-color)] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--secondary-dark)]/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[var(--primary-color)]" />
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{doc.docType}</div>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              <span>版本 v{doc.version}</span>
                              <span className="text-[var(--text-placeholder)]">·</span>
                              <span>{new Date(doc.updatedAt).toLocaleString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-[var(--text-placeholder)] group-hover:text-[var(--primary-color)] transition-colors rotate-[-90deg]" />
                      </div>
                      {doc.preview && (
                        <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-2 pl-13">{doc.preview}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            loadingDoc ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
              </div>
            ) : selectedDoc ? (
              <>
                {/* 文档信息 */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[var(--gray-blue-light)] rounded-xl">
                  <div>
                    <div className="text-xs text-[var(--text-placeholder)] mb-1">文档类型</div>
                    <span className="px-2 py-1 text-xs bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-full">
                      {selectedDoc.docType}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-placeholder)] mb-1">版本</div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">v{selectedDoc.version}</span>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-placeholder)] mb-1">创建时间</div>
                    <span className="text-sm text-[var(--text-secondary)]">{new Date(selectedDoc.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-placeholder)] mb-1">更新时间</div>
                    <span className="text-sm text-[var(--text-secondary)]">{new Date(selectedDoc.updatedAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>

                {/* 编辑模式 */}
                {editing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 320px)' }}>
                    <div className="bg-white border border-[var(--border-color)] rounded-xl p-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Edit className="w-4 h-4 text-[var(--primary-color)]" />
                        <h4 className="font-medium text-[var(--text-primary)]">Markdown 编辑</h4>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 font-mono text-sm p-3 bg-[var(--gray-blue-light)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/20"
                        placeholder="在此编辑 Markdown 内容..."
                      />
                    </div>
                    <div className="bg-white border border-[var(--border-color)] rounded-xl p-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-4 h-4 text-[var(--primary-color)]" />
                        <h4 className="font-medium text-[var(--text-primary)]">实时预览</h4>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 bg-[var(--gray-blue-light)] rounded-lg">
                        <div className="markdown-body">
                          {editContent ? (
                            <ReactMarkdown>{editContent}</ReactMarkdown>
                          ) : (
                            <div className="text-center py-8 text-[var(--text-placeholder)]">暂无内容</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--gray-blue-light)] rounded-xl p-6">
                    <h4 className="font-medium text-[var(--text-primary)] mb-4">文档内容</h4>
                    <div className="markdown-body whitespace-pre-wrap">
                      <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}