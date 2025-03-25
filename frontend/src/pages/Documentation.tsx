import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiEdit, FiEye, FiLock, FiUsers, FiSearch, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { marked } from 'marked';

// Type definitions
interface Document {
  id: string;
  title: string;
  content: string;
  visibility: 'public' | 'private' | 'shared';
  user_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string;
  created_at: string;
}

// Styled components
const DocContainer = styled.div`
  display: flex;
  gap: 2rem;
  height: calc(100vh - 150px);
`;

const Sidebar = styled.div`
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  color: #777;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1rem;
  
  &:hover {
    background: #4a5ab9;
  }
`;

const CategoryTitle = styled.h3`
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #777;
  margin: 1.5rem 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const DocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  flex: 1;
`;

const DocItem = styled.div<{ active?: boolean }>`
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  background: ${({ active }) => active ? '#f0f2ff' : 'transparent'};
  border-left: 3px solid ${({ active }) => active ? '#5c6bc0' : 'transparent'};
  
  &:hover {
    background: ${({ active }) => active ? '#f0f2ff' : '#f9f9f9'};
  }
`;

const DocTitle = styled.div`
  font-weight: ${({ children }) => children === 'New Document' ? '600' : '400'};
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DocMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #777;
`;

const VisibilityIcon = styled.span`
  display: flex;
  align-items: center;
`;

const MainContent = styled.div`
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const DocHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
`;

const DocHeaderLeft = styled.div``;

const DocHeaderTitle = styled.h1`
  font-size: 1.75rem;
  margin: 0 0 0.5rem 0;
`;

const DocHeaderMeta = styled.div`
  font-size: 0.875rem;
  color: #777;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DocActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DocActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const DocContent = styled.div`
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

const Editor = styled.textarea`
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  font-family: monospace;
  border: 1px solid #ddd;
  border-radius: 4px;
  line-height: 1.5;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const EditorActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Modal = styled.div`
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
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

// Component
const Documentation: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocData, setNewDocData] = useState({
    title: '',
    content: '',
    visibility: 'private' as 'public' | 'private' | 'shared',
    tags: ''
  });

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Function to fetch documents from Supabase
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) {
        // Handle table not found error
        if (error.code === '42P01' || error.message?.includes('relation "documents" does not exist')) {
          console.error('Documents table does not exist in Supabase. Please run the setup SQL script.');
          alert('The documents table has not been set up in the database. Please see SUPABASE_SETUP.md for instructions.');
        } else {
          console.error('Error fetching documents:', error);
        }
        
        // Return early without updating state or throwing
        setIsLoading(false);
        return;
      }
      
      if (data) {
        setDocuments(data);
        if (data.length > 0 && !activeDocId) {
          setActiveDocId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get active document
  const activeDoc = documents.find(doc => doc.id === activeDocId) || null;

  // Function to create a new document
  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { title, content, visibility, tags } = newDocData;
      
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title,
            content,
            visibility,
            tags: parsedTags.length > 0 ? parsedTags : null
          }
        ])
        .select();
        
      if (error) {
        // Handle table not found error
        if (error.code === '42P01' || error.message?.includes('relation "documents" does not exist')) {
          console.error('Documents table does not exist in Supabase. Please run the setup SQL script.');
          alert('The documents table has not been set up in the database. Please see SUPABASE_SETUP.md for instructions.');
        } else {
          console.error('Error creating document:', error);
          alert('Error creating document. Check console for details.');
        }
        return;
      }
      
      if (data) {
        setDocuments([data[0], ...documents]);
        setActiveDocId(data[0].id);
        setShowNewDocModal(false);
        resetNewDocForm();
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error creating document. Check console for details.');
    }
  };

  // Function to update a document
  const updateDocument = async () => {
    if (!activeDoc) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          content: editedContent
        })
        .eq('id', activeDoc.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setDocuments(documents.map(doc => 
          doc.id === activeDoc.id ? data[0] : doc
        ));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error updating document. Check console for details.');
    }
  };

  // Function to delete a document
  const deleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
        
      if (error) {
        throw error;
      }
      
      setDocuments(documents.filter(doc => doc.id !== docId));
      
      if (activeDocId === docId) {
        setActiveDocId(documents.length > 1 ? documents[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Check console for details.');
    }
  };

  // Handle new document form changes
  const handleNewDocChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDocData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset new document form
  const resetNewDocForm = () => {
    setNewDocData({
      title: '',
      content: '',
      visibility: 'private',
      tags: ''
    });
  };

  // Start editing a document
  const startEditing = () => {
    if (activeDoc) {
      setEditedContent(activeDoc.content);
      setIsEditing(true);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
  };

  // Filter documents by search query
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get filtered documents by visibility or user
  const getFilteredDocs = (filter: { visibility?: string, userId?: string }) => {
    return filteredDocuments.filter(doc => {
      if (filter.visibility && doc.visibility !== filter.visibility) {
        return false;
      }
      if (filter.userId && doc.user_id !== filter.userId) {
        return false;
      }
      return true;
    });
  };

  // Get visibility icon based on document visibility
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <FiLock size={14} />;
      case 'shared':
        return <FiUsers size={14} />;
      default:
        return <FiEye size={14} />;
    }
  };
  
  return (
    <DocContainer>
      <Sidebar>
        <SearchContainer>
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
          <SearchInput 
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        
        <CreateButton onClick={() => setShowNewDocModal(true)}>
          <FiPlus size={16} />
          New Document
        </CreateButton>
        
        {user && (
          <>
            <CategoryTitle>My Private Documents</CategoryTitle>
            <DocList>
              {getFilteredDocs({ visibility: 'private', userId: user.id })
                .map(doc => (
                  <DocItem 
                    key={doc.id} 
                    active={activeDocId === doc.id ? true : undefined}
                    onClick={() => setActiveDocId(doc.id)}
                  >
                    <DocTitle>{doc.title}</DocTitle>
                    <DocMeta>
                      <VisibilityIcon>{getVisibilityIcon(doc.visibility)}</VisibilityIcon>
                      <span>Updated {new Date(doc.updated_at).toLocaleDateString()}</span>
                    </DocMeta>
                  </DocItem>
                ))}
            </DocList>
          </>
        )}
        
        <CategoryTitle>Public Documents</CategoryTitle>
        <DocList>
          {getFilteredDocs({ visibility: 'public' })
            .map(doc => (
              <DocItem 
                key={doc.id} 
                active={activeDocId === doc.id ? true : undefined}
                onClick={() => setActiveDocId(doc.id)}
              >
                <DocTitle>{doc.title}</DocTitle>
                <DocMeta>
                  <VisibilityIcon>{getVisibilityIcon(doc.visibility)}</VisibilityIcon>
                  <span>Updated {new Date(doc.updated_at).toLocaleDateString()}</span>
                </DocMeta>
              </DocItem>
            ))}
        </DocList>
        
        <CategoryTitle>Shared Documents</CategoryTitle>
        <DocList>
          {getFilteredDocs({ visibility: 'shared' })
            .map(doc => (
              <DocItem 
                key={doc.id} 
                active={activeDocId === doc.id ? true : undefined}
                onClick={() => setActiveDocId(doc.id)}
              >
                <DocTitle>{doc.title}</DocTitle>
                <DocMeta>
                  <VisibilityIcon>{getVisibilityIcon(doc.visibility)}</VisibilityIcon>
                  <span>Updated {new Date(doc.updated_at).toLocaleDateString()}</span>
                </DocMeta>
              </DocItem>
            ))}
        </DocList>
      </Sidebar>
      
      <MainContent>
        {isLoading ? (
          <LoadingContainer>
            <p>Loading documents...</p>
          </LoadingContainer>
        ) : activeDoc ? (
          <>
            <DocHeader>
              <DocHeaderLeft>
                <DocHeaderTitle>{activeDoc.title}</DocHeaderTitle>
                <DocHeaderMeta>
                  <span>Last updated {new Date(activeDoc.updated_at).toLocaleDateString()}</span>
                  <span>
                    {activeDoc.visibility === 'public' 
                      ? 'Public' 
                      : activeDoc.visibility === 'shared' 
                        ? 'Shared'
                        : 'Private'
                    }
                  </span>
                </DocHeaderMeta>
              </DocHeaderLeft>
              <DocActions>
                {user && user.id === activeDoc.user_id && (
                  <>
                    {isEditing ? (
                      <>
                        <DocActionButton onClick={updateDocument}>
                          <FiSave size={16} />
                          Save
                        </DocActionButton>
                        <DocActionButton onClick={cancelEditing}>
                          Cancel
                        </DocActionButton>
                      </>
                    ) : (
                      <>
                        <DocActionButton onClick={startEditing}>
                          <FiEdit size={16} />
                          Edit
                        </DocActionButton>
                        <DocActionButton onClick={() => deleteDocument(activeDoc.id)}>
                          <FiTrash2 size={16} />
                          Delete
                        </DocActionButton>
                      </>
                    )}
                  </>
                )}
              </DocActions>
            </DocHeader>
            
            {isEditing ? (
              <>
                <Editor 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
              </>
            ) : (
              <DocContent dangerouslySetInnerHTML={{ __html: marked(activeDoc.content) }} />
            )}
          </>
        ) : (
          <div>
            {documents.length === 0 ? (
              <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
                <h2>No Documents Found</h2>
                
                {!user ? (
                  <div>
                    <p>Please log in to create and manage documents.</p>
                  </div>
                ) : (
                  <div>
                    <p>You can create a new document to get started, or check the database setup.</p>
                    <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', margin: '1rem 0', textAlign: 'left' }}>
                      <h3>Troubleshooting</h3>
                      <p>If you're seeing a 404 error in the console, the documents table might not exist in your Supabase project.</p>
                      <p><strong>Solution:</strong> Please check the SUPABASE_SETUP.md file for instructions on setting up the database tables.</p>
                    </div>
                    <DocActionButton onClick={() => setShowNewDocModal(true)} style={{ margin: '1rem auto', display: 'inline-flex' }}>
                      <FiPlus size={16} />
                      Create New Document
                    </DocActionButton>
                  </div>
                )}
              </div>
            ) : (
              <p>Select a document to view</p>
            )}
          </div>
        )}
      </MainContent>
      
      {/* New Document Modal */}
      {showNewDocModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create New Document</ModalTitle>
              <CloseButton onClick={() => setShowNewDocModal(false)}>&times;</CloseButton>
            </ModalHeader>
            <Form onSubmit={createDocument}>
              <FormGroup>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={newDocData.title}
                  onChange={handleNewDocChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="content">Content (Markdown)</Label>
                <Editor
                  id="content"
                  name="content"
                  value={newDocData.content}
                  onChange={handleNewDocChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  id="visibility"
                  name="visibility"
                  value={newDocData.visibility}
                  onChange={handleNewDocChange}
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                  <option value="public">Public</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  type="text"
                  id="tags"
                  name="tags"
                  value={newDocData.tags}
                  onChange={handleNewDocChange}
                  placeholder="product, roadmap, feature"
                />
              </FormGroup>
              
              <Button type="submit">
                Create Document
              </Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </DocContainer>
  );
};

export default Documentation;