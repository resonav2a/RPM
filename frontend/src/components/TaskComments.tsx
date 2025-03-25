import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiEdit2, FiTrash2, FiCornerDownRight, FiSmile, FiX, FiUser, FiSend } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

// Types
interface User {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  mentioned_users?: string[];
  parent_comment_id?: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  reactions?: CommentReaction[];
  replies?: Comment[];
}

interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: {
    name: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

// Common emoji reactions
const commonEmojis = ['👍', '👎', '❤️', '🎉', '😂', '🤔', '👀', '🙌'];

// Styled components
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
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TaskTitle = styled.span`
  font-size: 1rem;
  color: #666;
  margin-left: 0.5rem;
  font-weight: normal;
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

const CommentsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommentItem = styled.div<{ isReply?: boolean }>`
  background: ${({ isReply }) => isReply ? '#f9f9f9' : '#f1f5f9'};
  border-radius: 8px;
  padding: 1rem;
  margin-left: ${({ isReply }) => isReply ? '2rem' : '0'};
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const CommentAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Avatar = styled.div<{ url?: string }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${({ url }) => url ? `url(${url}) center/cover` : '#ddd'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.75rem;
`;

const AuthorName = styled.div`
  font-weight: 500;
  font-size: 0.9rem;
`;

const CommentDate = styled.div`
  font-size: 0.75rem;
  color: #777;
`;

const CommentContent = styled.div`
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CommentActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  padding: 0.25rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    color: #5c6bc0;
    text-decoration: underline;
  }
`;

const ReactionButton = styled(ActionButton)<{ active?: boolean }>`
  color: ${({ active }) => active ? '#5c6bc0' : '#777'};
  
  &:hover {
    color: ${({ active }) => active ? '#3f51b5' : '#5c6bc0'};
  }
`;

const ReactionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const Reaction = styled.button<{ active?: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  background: ${({ active }) => active ? '#e8f0fe' : '#f1f5f9'};
  border: 1px solid ${({ active }) => active ? '#5c6bc0' : '#ddd'};
  color: #333;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background: ${({ active }) => active ? '#d4e4fc' : '#e8f0fe'};
  }
`;

const ReactionCount = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

const EmojiPicker = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  z-index: 1;
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  
  &:hover {
    transform: scale(1.2);
  }
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  margin-top: auto;
`;

const CommentInput = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 80px;
  resize: none;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const CommentControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MentionSection = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const MentionLabel = styled.span`
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MentionDropdown = styled.select`
  font-size: 0.8rem;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #5c6bc0;
  }
`;

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  background: #5c6bc0;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #4a5ab9;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const MentionedUsers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const MentionTag = styled.div`
  background: #e8f0fe;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RemoveMention = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #777;
  display: flex;
  align-items: center;
  padding: 0;
  
  &:hover {
    color: #d32f2f;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
`;

const ReplyForm = styled.div`
  margin-top: 1rem;
  margin-left: 2rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #5c6bc0;
`;

const ReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ReplyTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// Component
const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, taskTitle, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [commentText, setCommentText] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [taskId]);

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to fetch data from Supabase
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:user_id (id, name, avatar_url)
        `)
        .eq('task_id', taskId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });
        
      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }
      
      // Fetch reactions for all comments
      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(comment => comment.id);
        
        const { data: reactionsData, error: reactionsError } = await supabase
          .from('task_comment_reactions')
          .select(`
            *,
            user:user_id (name)
          `)
          .in('comment_id', commentIds);
          
        if (reactionsError) {
          console.error('Error fetching reactions:', reactionsError);
        } else if (reactionsData) {
          // Group reactions by comment_id
          const reactionsById: Record<string, CommentReaction[]> = {};
          reactionsData.forEach(reaction => {
            if (!reactionsById[reaction.comment_id]) {
              reactionsById[reaction.comment_id] = [];
            }
            reactionsById[reaction.comment_id].push(reaction);
          });
          
          // Add reactions to comments
          commentsData.forEach(comment => {
            comment.reactions = reactionsById[comment.id] || [];
          });
        }
        
        // Fetch replies
        const { data: repliesData, error: repliesError } = await supabase
          .from('task_comments')
          .select(`
            *,
            user:user_id (id, name, avatar_url)
          `)
          .in('parent_comment_id', commentIds)
          .order('created_at', { ascending: true });
          
        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
        } else if (repliesData) {
          // Group replies by parent_comment_id
          const repliesById: Record<string, Comment[]> = {};
          repliesData.forEach(reply => {
            if (!repliesById[reply.parent_comment_id!]) {
              repliesById[reply.parent_comment_id!] = [];
            }
            repliesById[reply.parent_comment_id!].push(reply);
          });
          
          // Add replies to comments
          commentsData.forEach(comment => {
            comment.replies = repliesById[comment.id] || [];
          });
          
          // Fetch reactions for replies
          if (repliesData.length > 0) {
            const replyIds = repliesData.map(reply => reply.id);
            
            const { data: replyReactionsData, error: replyReactionsError } = await supabase
              .from('task_comment_reactions')
              .select(`
                *,
                user:user_id (name)
              `)
              .in('comment_id', replyIds);
              
            if (replyReactionsError) {
              console.error('Error fetching reply reactions:', replyReactionsError);
            } else if (replyReactionsData) {
              // Group reactions by comment_id
              const replyReactionsById: Record<string, CommentReaction[]> = {};
              replyReactionsData.forEach(reaction => {
                if (!replyReactionsById[reaction.comment_id]) {
                  replyReactionsById[reaction.comment_id] = [];
                }
                replyReactionsById[reaction.comment_id].push(reaction);
              });
              
              // Add reactions to replies
              commentsData.forEach(comment => {
                if (comment.replies) {
                  comment.replies.forEach(reply => {
                    reply.reactions = replyReactionsById[reply.id] || [];
                  });
                }
              });
            }
          }
        }
      }
      
      setComments(commentsData || []);
      
      // Fetch users for mentions
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url, email');
        
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else if (usersData) {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new comment
  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || !user) return;
    
    try {
      const mentionedUserIds = mentionedUsers.map(user => user.id);
      
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          content: commentText,
          mentioned_users: mentionedUserIds.length > 0 ? mentionedUserIds : null
        }])
        .select();
        
      if (error) {
        console.error('Error adding comment:', error);
        return;
      }
      
      if (data) {
        // Clear form
        setCommentText('');
        setMentionedUsers([]);
        
        // Refresh comments
        fetchData();
        
        // Scroll to bottom
        setTimeout(() => {
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Add a reply to a comment
  const addReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !replyingTo || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          content: replyText,
          parent_comment_id: replyingTo.id,
          mentioned_users: null
        }])
        .select();
        
      if (error) {
        console.error('Error adding reply:', error);
        return;
      }
      
      if (data) {
        // Clear form
        setReplyText('');
        setReplyingTo(null);
        
        // Refresh comments
        fetchData();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Update a comment
  const updateComment = async (commentId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .update({
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);
        
      if (error) {
        console.error('Error updating comment:', error);
        return;
      }
      
      // Reset editing state
      setEditingComment(null);
      
      // Refresh comments
      fetchData();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);
        
      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }
      
      // Refresh comments
      fetchData();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Toggle a reaction on a comment
  const toggleReaction = async (commentId: string, reaction: string) => {
    if (!user) return;
    
    try {
      // Check if user already reacted with this emoji
      const existingReaction = comments
        .flatMap(comment => {
          if (comment.id === commentId) {
            return comment.reactions || [];
          }
          return comment.replies?.flatMap(reply => {
            if (reply.id === commentId) {
              return reply.reactions || [];
            }
            return [];
          }) || [];
        })
        .find(r => r.comment_id === commentId && r.user_id === user.id && r.reaction === reaction);
      
      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('task_comment_reactions')
          .delete()
          .eq('id', existingReaction.id);
          
        if (error) {
          console.error('Error removing reaction:', error);
          return;
        }
      } else {
        // Add reaction
        const { error } = await supabase
          .from('task_comment_reactions')
          .insert([{
            comment_id: commentId,
            reaction
          }]);
          
        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation - reaction already exists
            console.log('Reaction already exists');
          } else {
            console.error('Error adding reaction:', error);
          }
          return;
        }
      }
      
      // Refresh comments
      fetchData();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // Add a user mention
  const addMention = () => {
    if (!selectedUser) return;
    
    const userToAdd = users.find(u => u.id === selectedUser);
    if (!userToAdd) return;
    
    // Check if user is already mentioned
    if (mentionedUsers.some(u => u.id === userToAdd.id)) return;
    
    setMentionedUsers([...mentionedUsers, userToAdd]);
    setSelectedUser('');
  };

  // Remove a user mention
  const removeMention = (userId: string) => {
    setMentionedUsers(mentionedUsers.filter(u => u.id !== userId));
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Check if user has reacted with a specific emoji
  const hasReacted = (reactions: CommentReaction[] | undefined, emoji: string): boolean => {
    if (!reactions || !user) return false;
    return reactions.some(r => r.user_id === user.id && r.reaction === emoji);
  };

  // Render reaction counters
  const renderReactions = (reactions: CommentReaction[] | undefined) => {
    if (!reactions || reactions.length === 0) return null;
    
    // Group reactions by emoji
    const reactionGroups: Record<string, CommentReaction[]> = {};
    reactions.forEach(reaction => {
      if (!reactionGroups[reaction.reaction]) {
        reactionGroups[reaction.reaction] = [];
      }
      reactionGroups[reaction.reaction].push(reaction);
    });
    
    return (
      <ReactionList>
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <Reaction 
            key={emoji} 
            active={hasReacted(reactions, emoji)}
            onClick={() => reactions[0] && toggleReaction(reactions[0].comment_id, emoji)}
          >
            {emoji} <ReactionCount>{reactions.length}</ReactionCount>
          </Reaction>
        ))}
      </ReactionList>
    );
  };

  // Render emoji picker
  const renderEmojiPicker = (commentId: string) => {
    if (showEmojiPicker !== commentId) return null;
    
    return (
      <EmojiPicker ref={emojiPickerRef}>
        {commonEmojis.map(emoji => (
          <EmojiButton 
            key={emoji} 
            onClick={() => {
              toggleReaction(commentId, emoji);
              setShowEmojiPicker(null);
            }}
          >
            {emoji}
          </EmojiButton>
        ))}
      </EmojiPicker>
    );
  };

  // Render a single comment
  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isEditing = editingComment?.id === comment.id;
    
    return (
      <CommentItem key={comment.id} isReply={isReply}>
        <CommentHeader>
          <CommentAuthor>
            <Avatar url={comment.user?.avatar_url}>
              {!comment.user?.avatar_url && (comment.user?.name?.charAt(0) || 'U')}
            </Avatar>
            <AuthorName>{comment.user?.name || 'Unknown User'}</AuthorName>
          </CommentAuthor>
          <CommentDate>{formatDate(comment.created_at)}</CommentDate>
        </CommentHeader>
        
        {isEditing ? (
          <CommentForm onSubmit={(e) => {
            e.preventDefault();
            if (commentText.trim()) {
              updateComment(comment.id, commentText);
            }
          }}>
            <CommentInput 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus
            />
            <CommentControls>
              <ActionButton type="button" onClick={() => setEditingComment(null)}>
                Cancel
              </ActionButton>
              <SubmitButton type="submit">Save Changes</SubmitButton>
            </CommentControls>
          </CommentForm>
        ) : (
          <>
            <CommentContent>{comment.content}</CommentContent>
            
            {renderReactions(comment.reactions)}
            
            <CommentActions>
              <div style={{ position: 'relative' }}>
                <ReactionButton 
                  onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                >
                  <FiSmile size={14} /> React
                </ReactionButton>
                {renderEmojiPicker(comment.id)}
              </div>
              
              {!isReply && (
                <ActionButton onClick={() => setReplyingTo(comment)}>
                  <FiCornerDownRight size={14} /> Reply
                </ActionButton>
              )}
              
              {user?.id === comment.user_id && (
                <>
                  <ActionButton onClick={() => {
                    setEditingComment(comment);
                    setCommentText(comment.content);
                  }}>
                    <FiEdit2 size={14} /> Edit
                  </ActionButton>
                  
                  <ActionButton onClick={() => deleteComment(comment.id)}>
                    <FiTrash2 size={14} /> Delete
                  </ActionButton>
                </>
              )}
            </CommentActions>
          </>
        )}
      </CommentItem>
    );
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            <FiMessageCircle /> Comments
            <TaskTitle>for {taskTitle}</TaskTitle>
          </ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        <CommentsContainer ref={commentsContainerRef}>
          {isLoading ? (
            <EmptyState>Loading comments...</EmptyState>
          ) : comments.length === 0 ? (
            <EmptyState>
              No comments yet. Be the first to add a comment!
            </EmptyState>
          ) : (
            <CommentsList>
              {comments.map(comment => (
                <React.Fragment key={comment.id}>
                  {renderComment(comment)}
                  
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginLeft: '2rem' }}>
                      {comment.replies.map(reply => renderComment(reply, true))}
                    </div>
                  )}
                  
                  {replyingTo?.id === comment.id && (
                    <ReplyForm>
                      <ReplyHeader>
                        <ReplyTitle>
                          <FiCornerDownRight /> Replying to {comment.user?.name || 'Unknown User'}
                        </ReplyTitle>
                        <ActionButton onClick={() => setReplyingTo(null)}>
                          <FiX /> Cancel
                        </ActionButton>
                      </ReplyHeader>
                      
                      <CommentForm onSubmit={addReply}>
                        <CommentInput 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          autoFocus
                        />
                        <CommentControls>
                          <div></div>
                          <SubmitButton 
                            type="submit"
                            disabled={!replyText.trim()}
                          >
                            <FiSend /> Reply
                          </SubmitButton>
                        </CommentControls>
                      </CommentForm>
                    </ReplyForm>
                  )}
                </React.Fragment>
              ))}
            </CommentsList>
          )}
        </CommentsContainer>
        
        <CommentForm onSubmit={addComment}>
          <CommentInput 
            value={commentText} 
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
          />
          
          {mentionedUsers.length > 0 && (
            <MentionedUsers>
              {mentionedUsers.map(user => (
                <MentionTag key={user.id}>
                  <FiUser size={12} /> {user.name}
                  <RemoveMention onClick={() => removeMention(user.id)}>
                    <FiX size={12} />
                  </RemoveMention>
                </MentionTag>
              ))}
            </MentionedUsers>
          )}
          
          <CommentControls>
            <MentionSection>
              <MentionLabel>
                <FiUser size={12} /> Mention:
              </MentionLabel>
              <MentionDropdown 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select user...</option>
                {users
                  .filter(u => !mentionedUsers.some(mu => mu.id === u.id))
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                }
              </MentionDropdown>
              <ActionButton 
                type="button" 
                onClick={addMention}
                disabled={!selectedUser}
              >
                Add
              </ActionButton>
            </MentionSection>
            
            <SubmitButton 
              type="submit"
              disabled={!commentText.trim()}
            >
              <FiSend /> Comment
            </SubmitButton>
          </CommentControls>
        </CommentForm>
      </ModalContent>
    </Modal>
  );
};

export default TaskComments;