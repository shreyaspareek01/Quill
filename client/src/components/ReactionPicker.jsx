import { useState, useEffect } from 'react';
import { ThumbsUp, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getReactions, addReaction, removeReaction } from '../api/reactions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReactionPicker({ postId }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ like: 0, love: 0, celebrate: 0, funny: 0, sad: 0 });
  const [userReaction, setUserReaction] = useState(null);
  const [details, setDetails] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let active = true;
    getReactions(postId)
      .then(data => {
        if (active) {
          setCounts({
            like: data.like || 0,
            love: data.love || 0,
            celebrate: data.celebrate || 0,
            funny: data.funny || 0,
            sad: data.sad || 0
          });
          setUserReaction(data.user_reaction);
          setDetails(data.details || []);
        }
      })
      .catch(err => console.error("Failed to fetch reactions", err));
    return () => { active = false; };
  }, [postId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isOpen]);

  const handleSelectReaction = async (type) => {
    if (!user) {
      toast.error('Sign in to react');
      return;
    }
    
    const isRemoving = userReaction === type;
    const oldReaction = userReaction;
    const oldDetails = [...details];
    
    // Optimistic UI updates
    setUserReaction(isRemoving ? null : type);
    setCounts(prev => {
      const next = { ...prev };
      if (oldReaction) {
        next[oldReaction] = Math.max(0, next[oldReaction] - 1);
      }
      if (!isRemoving) {
        next[type] = (next[type] || 0) + 1;
      }
      return next;
    });

    setDetails(prev => {
      let next = [...prev];
      if (oldReaction) {
        next = next.filter(item => item.user_id !== user.id);
      }
      if (!isRemoving) {
        next.push({
          user_id: user.id,
          username: user.username || user.email?.split('@')[0] || 'user',
          full_name: user.full_name || 'User',
          avatar_url: user.avatar_url,
          reaction_type: type
        });
      }
      return next;
    });

    try {
      if (isRemoving) {
        await removeReaction(postId);
      } else {
        await addReaction(postId, type);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update reaction');
      // Rollback on error
      setUserReaction(oldReaction);
      setDetails(oldDetails);
      setCounts(prev => {
        const next = { ...prev };
        if (!isRemoving) {
          next[type] = Math.max(0, next[type] - 1);
        }
        if (oldReaction) {
          next[oldReaction] = (next[oldReaction] || 0) + 1;
        }
        return next;
      });
    }
    setIsOpen(false);
  };

  const [touchTimeoutId, setTouchTimeoutId] = useState(null);

  const handleTouchStart = (e) => {
    const id = setTimeout(() => {
      setIsOpen(true);
    }, 450);
    setTouchTimeoutId(id);
  };

  const handleTouchEnd = (e) => {
    if (touchTimeoutId) {
      clearTimeout(touchTimeoutId);
      setTouchTimeoutId(null);
    }
  };

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userReaction) {
      handleSelectReaction(userReaction);
    } else {
      handleSelectReaction('like');
    }
  };

  const totalReactions = counts.like + counts.love + counts.celebrate + counts.funny + counts.sad;

  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    celebrate: '🎉',
    funny: '😂',
    sad: '😢'
  };

  const filteredDetails = activeTab === 'all' 
    ? details 
    : details.filter(item => item.reaction_type === activeTab);

  return (
    <div 
      className="reaction-container"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => { e.stopPropagation(); }}
    >
      <div className={`reaction-picker-tray ${isOpen ? 'open' : ''}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('like'); }} 
          className={`reaction-option-btn opt-like ${userReaction === 'like' ? 'active' : ''}`}
          title="Like (👍)"
        >
          👍
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('love'); }} 
          className={`reaction-option-btn opt-love ${userReaction === 'love' ? 'active' : ''}`}
          title="Love (❤️)"
        >
          ❤️
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('celebrate'); }} 
          className={`reaction-option-btn opt-celebrate ${userReaction === 'celebrate' ? 'active' : ''}`}
          title="Celebrate (🎉)"
        >
          🎉
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('funny'); }} 
          className={`reaction-option-btn opt-funny ${userReaction === 'funny' ? 'active' : ''}`}
          title="Funny (😂)"
        >
          😂
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('sad'); }} 
          className={`reaction-option-btn opt-sad ${userReaction === 'sad' ? 'active' : ''}`}
          title="Sad (😢)"
        >
          😢
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          onClick={handleTriggerClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`reaction-trigger-btn ${userReaction ? 'reacted' : ''}`}
          title="React to post"
        >
          {userReaction ? (
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{reactionEmojis[userReaction]}</span>
          ) : (
            <ThumbsUp size={18} strokeWidth={1.5} />
          )}
        </button>

        {totalReactions > 0 && (
          <div
            className="reactions-summary"
            onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="reaction-summary-count">{totalReactions}</span>
          </div>
        )}
      </div>

      {showDetailsModal && (
        <div className="reaction-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="reaction-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reaction-modal-header">
              <h3 className="font-serif" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Reactions</h3>
              <button className="reaction-modal-close" onClick={() => setShowDetailsModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="reaction-modal-tabs">
              <button 
                className={`reaction-modal-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({totalReactions})
              </button>
              {counts.like > 0 && (
                <button 
                  className={`reaction-modal-tab ${activeTab === 'like' ? 'active' : ''}`}
                  onClick={() => setActiveTab('like')}
                >
                  👍 Like ({counts.like})
                </button>
              )}
              {counts.love > 0 && (
                <button 
                  className={`reaction-modal-tab ${activeTab === 'love' ? 'active' : ''}`}
                  onClick={() => setActiveTab('love')}
                >
                  ❤️ Love ({counts.love})
                </button>
              )}
              {counts.celebrate > 0 && (
                <button 
                  className={`reaction-modal-tab ${activeTab === 'celebrate' ? 'active' : ''}`}
                  onClick={() => setActiveTab('celebrate')}
                >
                  🎉 Celebrate ({counts.celebrate})
                </button>
              )}
              {counts.funny > 0 && (
                <button 
                  className={`reaction-modal-tab ${activeTab === 'funny' ? 'active' : ''}`}
                  onClick={() => setActiveTab('funny')}
                >
                  😂 Funny ({counts.funny})
                </button>
              )}
              {counts.sad > 0 && (
                <button 
                  className={`reaction-modal-tab ${activeTab === 'sad' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sad')}
                >
                  😢 Sad ({counts.sad})
                </button>
              )}
            </div>
            
            <div className="reaction-modal-list">
              {filteredDetails.length === 0 ? (
                <div className="reaction-modal-empty">No reactions in this category</div>
              ) : (
                filteredDetails.map((item) => {
                  const itemDisplayName = item.full_name || item.username || 'User';
                  const itemUsername = item.username || 'user';
                  
                  return (
                    <div 
                      key={item.user_id} 
                      className="reaction-modal-user-row"
                      onClick={() => {
                        setShowDetailsModal(false);
                        navigate(`/profile/${item.user_id}`);
                      }}
                    >
                      <div 
                        className="avatar avatar-sm" 
                        style={{ 
                          width: '38px', 
                          height: '38px', 
                          background: item.avatar_url ? `url(${item.avatar_url}) center/cover` : undefined,
                          position: 'relative',
                          borderRadius: '50%'
                        }}
                      >
                        <span className="reaction-user-badge">
                          {reactionEmojis[item.reaction_type]}
                        </span>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                          {itemDisplayName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          @{itemUsername}
                        </div>
                      </div>
                      <div className={`reaction-pill-badge badge-${item.reaction_type}`}>
                        <span>{reactionEmojis[item.reaction_type]}</span>
                        <span style={{ textTransform: 'capitalize' }}>{item.reaction_type}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
