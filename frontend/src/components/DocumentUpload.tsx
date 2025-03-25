import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiUpload, FiFile, FiLink, FiX, FiCheck } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { Document } from '../types';
import { marked } from 'marked';

interface DocumentUploadProps {
  campaignId?: string;
  entityType: 'campaign' | 'task';
  entityId: string;
  onSuccess?: () => void;
}

interface LinkedDocument {
  id: string;
  entity_id: string;
  entity_type: string;
  document_id: string;
  created_at: string;
  document?: Document;
}

// Styled components
const Container = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
`;

const UploadArea = styled.div`
  border: 2px dashed #ddd;
  border-radius: 6px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #5c6bc0;
    background: #f9f9ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: #5c6bc0;
  margin-bottom: 0.5rem;
`;

const UploadText = styled.p`
  color: #666;
  margin: 0;
`;

const Input = styled.input`
  display: none;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? '#5c6bc0' : 'transparent')};
  color: ${({ active }) => (active ? '#5c6bc0' : '#666')};
  font-weight: ${({ active }) => (active ? '500' : '400')};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const DocumentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const DocumentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  gap: 1rem;
  
  &:hover {
    background: #f9f9f9;
  }
`;

const DocumentIcon = styled.div`
  color: #5c6bc0;
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const DocumentMeta = styled.div`
  font-size: 0.75rem;
  color: #777;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #5c6bc0;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #4a5ab9;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 2rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
  
  &:hover {
    color: #333;
  }
`;

const MarkdownContent = styled.div`
  line-height: 1.6;
  color: #333;

  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  p {
    margin-bottom: 1em;
  }

  ul, ol {
    margin-bottom: 1em;
    padding-left: 2em;
  }

  code {
    font-family: monospace;
    background: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    margin-left: 0;
    color: #666;
  }
`;

// Component
const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  campaignId,
  entityType, 
  entityId, 
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  
  // Fetch documents and linked documents on mount
  useEffect(() => {
    fetchDocuments();
    fetchLinkedDocuments();
  }, [entityId]);
  
  // Function to fetch all documents
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      
      if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch documents linked to this entity
  const fetchLinkedDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch document links with the associated document data
      const { data, error } = await supabase
        .from('document_links')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
        
      if (error) {
        console.error('Error fetching linked documents:', error);
        return;
      }
      
      if (data) {
        setLinkedDocuments(data as any);
      }
    } catch (error) {
      console.error('Error fetching linked documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      // For markdown, text, or CSV files
      if (file.type === 'text/markdown' || file.type === 'text/plain' || file.type === 'text/csv') {
        const content = await readFileAsText(file);
        setMarkdown(content);
        
        // Create a new document
        await createDocument({
          title: file.name,
          content,
          visibility: 'private',
          tags: ['imported']
        });
      } 
      // For PDF files, we could handle this differently
      else if (file.type === 'application/pdf') {
        // For now, just create a link document
        await createDocument({
          title: file.name,
          content: `# PDF: ${file.name}\n\nThis is a link to a PDF file that was uploaded.`,
          visibility: 'private',
          tags: ['pdf', 'imported']
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  
  // Create a new document
  const createDocument = async (document: Partial<Document>) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([document])
        .select();
        
      if (error) {
        console.error('Error creating document:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Link the document to the entity
        await linkDocument(data[0].id);
        
        // Refresh documents
        fetchDocuments();
        fetchLinkedDocuments();
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };
  
  // Link an existing document
  const linkDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('document_links')
        .insert([{
          entity_type: entityType,
          entity_id: entityId,
          document_id: documentId
        }]);
        
      if (error) {
        console.error('Error linking document:', error);
        return;
      }
      
      // Refresh linked documents
      fetchLinkedDocuments();
      
      // Reset selected document
      setSelectedDocId(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error linking document:', error);
    }
  };
  
  // Unlink a document
  const unlinkDocument = async (linkId: string) => {
    if (!confirm('Are you sure you want to unlink this document?')) return;
    
    try {
      const { error } = await supabase
        .from('document_links')
        .delete()
        .eq('id', linkId);
        
      if (error) {
        console.error('Error unlinking document:', error);
        return;
      }
      
      // Refresh linked documents
      fetchLinkedDocuments();
    } catch (error) {
      console.error('Error unlinking document:', error);
    }
  };
  
  // Handle document preview
  const openDocumentPreview = (document: Document) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };
  
  // Close document preview
  const closeDocumentPreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <Container>
      <Title>Documents</Title>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'upload'}
          onClick={() => setActiveTab('upload')}
        >
          Upload New
        </Tab>
        <Tab 
          active={activeTab === 'existing'}
          onClick={() => setActiveTab('existing')}
        >
          Link Existing
        </Tab>
      </TabContainer>
      
      {activeTab === 'upload' ? (
        <div>
          <UploadArea onClick={() => document.getElementById('fileInput')?.click()}>
            <Input 
              type="file" 
              id="fileInput"
              accept=".md,.txt,.pdf,.csv,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <UploadIcon>
              <FiUpload size={32} />
            </UploadIcon>
            <UploadText>
              {isUploading 
                ? 'Uploading...' 
                : 'Click to upload or drag and drop a file (.md, .txt, .pdf, .csv)'
              }
            </UploadText>
          </UploadArea>
          
          {markdown && (
            <div>
              <Title>Document Preview</Title>
              <MarkdownContent dangerouslySetInnerHTML={{ __html: marked(markdown) }} />
            </div>
          )}
        </div>
      ) : (
        <div>
          {isLoading ? (
            <p>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p>No documents found. Upload some first!</p>
          ) : (
            <>
              <DocumentList>
                {documents.map(doc => (
                  <DocumentItem key={doc.id}>
                    <DocumentIcon>
                      <FiFile size={20} />
                    </DocumentIcon>
                    <DocumentInfo>
                      <DocumentTitle>{doc.title}</DocumentTitle>
                      <DocumentMeta>
                        Updated {formatDate(doc.updated_at)}
                      </DocumentMeta>
                    </DocumentInfo>
                    <ActionButton onClick={() => openDocumentPreview(doc)}>
                      <FiEye size={16} />
                    </ActionButton>
                    <ActionButton onClick={() => linkDocument(doc.id)}>
                      <FiLink size={16} />
                    </ActionButton>
                  </DocumentItem>
                ))}
              </DocumentList>
            </>
          )}
        </div>
      )}
      
      {linkedDocuments.length > 0 && (
        <>
          <Title style={{ marginTop: '2rem' }}>Linked Documents</Title>
          <DocumentList>
            {linkedDocuments.map(link => (
              <DocumentItem key={link.id}>
                <DocumentIcon>
                  <FiFile size={20} />
                </DocumentIcon>
                <DocumentInfo>
                  <DocumentTitle>{link.document?.title || 'Unknown Document'}</DocumentTitle>
                  <DocumentMeta>
                    Linked on {formatDate(link.created_at)}
                  </DocumentMeta>
                </DocumentInfo>
                <ActionButton onClick={() => link.document && openDocumentPreview(link.document)}>
                  <FiEye size={16} />
                </ActionButton>
                <ActionButton onClick={() => unlinkDocument(link.id)}>
                  <FiX size={16} />
                </ActionButton>
              </DocumentItem>
            ))}
          </DocumentList>
        </>
      )}
      
      {/* Document Preview Modal */}
      {showPreview && previewDocument && (
        <ModalWrapper>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{previewDocument.title}</ModalTitle>
              <CloseButton onClick={closeDocumentPreview}>&times;</CloseButton>
            </ModalHeader>
            <MarkdownContent dangerouslySetInnerHTML={{ __html: marked(previewDocument.content) }} />
          </ModalContent>
        </ModalWrapper>
      )}
    </Container>
  );
};

export default DocumentUpload;