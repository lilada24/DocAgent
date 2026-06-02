import { useState, useEffect } from 'react';
import { Drawer, Card, Tag, Descriptions, Spin, Empty, Button, message, Input } from 'antd';
import { ArrowLeft, Edit, Eye, Save, X } from 'lucide-react';
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
      message.error('加载文档列表失败');
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
      message.error('加载文档内容失败');
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedDoc(null);
    setEditing(false);
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
      message.success('文档已保存');
      // 重新加载文档内容以获取最新版本号
      const updated = await documentService.getDocument(project.id, selectedDoc.docType);
      setSelectedDoc(updated);
      setEditing(false);
      // 刷新列表（版本号可能已变）
      loadDocuments(project.id);
    } catch {
      message.error('保存文档失败');
    } finally {
      setSaving(false);
    }
  };

  const drawerTitle =
    view === 'list'
      ? `文档浏览 - ${project?.name ?? ''}`
      : editing
        ? `编辑 - ${selectedDoc?.docType ?? ''}`
        : selectedDoc?.docType ?? '文档详情';

  return (
    <Drawer
      title={drawerTitle}
      open={open}
      onClose={onClose}
      width={editing ? 1000 : 800}
      extra={
        view === 'detail' ? (
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button
                type="primary"
                size="small"
                icon={<Edit size={14} />}
                onClick={handleStartEdit}
              >
                编辑
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  icon={<X size={14} />}
                  onClick={handleCancelEdit}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<Save size={14} />}
                  loading={saving}
                  onClick={handleSaveEdit}
                >
                  保存
                </Button>
              </>
            )}
            <Button
              type="text"
              icon={<ArrowLeft size={16} />}
              onClick={handleBackToList}
            >
              返回列表
            </Button>
          </div>
        ) : null
      }
    >
      {view === 'list' ? (
        <Spin spinning={loading}>
          {documents.length === 0 && !loading ? (
            <div className="flex justify-center py-20">
              <Empty description="暂无文档，请先生成文档" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <Card
                  key={doc.docType}
                  hoverable
                  onClick={() => loadDocumentDetail(doc.docType)}
                  className="transition-shadow hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Tag color="blue">{doc.docType}</Tag>
                      <span className="text-sm text-gray-500">
                        版本 v{doc.version}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(doc.updatedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {doc.preview && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {doc.preview}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Spin>
      ) : (
        <Spin spinning={loadingDoc}>
          {selectedDoc && (
            <>
              <Descriptions bordered size="small" column={2} className="mb-4">
                <Descriptions.Item label="文档类型">
                  <Tag color="blue">{selectedDoc.docType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="版本">
                  v{selectedDoc.version}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(selectedDoc.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {new Date(selectedDoc.updatedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>

              {editing ? (
                <div className="grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 280px)' }}>
                  <Card title="Markdown 编辑" className="flex flex-col">
                    <Input.TextArea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 font-mono text-sm"
                      style={{ height: '100%', minHeight: 400, resize: 'none' }}
                      placeholder="在此编辑 Markdown 内容..."
                    />
                  </Card>
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <Eye size={16} />
                        实时预览
                      </div>
                    }
                  >
                    <div className="markdown-body overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                      {editContent ? (
                        <ReactMarkdown>{editContent}</ReactMarkdown>
                      ) : (
                        <div className="text-gray-400 text-center py-10">暂无内容</div>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card title="文档内容">
                  <div className="markdown-body">
                    <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                  </div>
                </Card>
              )}
            </>
          )}
        </Spin>
      )}
    </Drawer>
  );
}
