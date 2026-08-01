import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { getReactions, addReaction, removeReaction } from '../api/reactions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReactionPicker({ postId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [counts, setCounts] = useState({ insightful: 0, agreed: 0, debatable: 0 });
  const [userReaction, setUserReaction] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getReactions(postId)
      .then(data => {
        if (active) {
          setCounts({
            insightful: data.insightful || 0,
            agreed: data.agreed || 0,
            debatable: data.debatable || 0
          });
          setUserReaction(data.user_reaction);
        }
      })
      .catch(err => console.error("Failed to fetch reactions", err));
    return () => { active = false; };
  }, [postId]);

  const handleSelectReaction = async (type) => {
    if (!user) {
      toast.error('Sign in to react');
      return;
    }
    
    const isRemoving = userReaction === type;
    const oldReaction = userReaction;
    
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

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userReaction) {
      handleSelectReaction(userReaction); // Remove current reaction
    } else {
      handleSelectReaction('insightful'); // Default to insightful
    }
  };

  const totalReactions = counts.insightful + counts.agreed + counts.debatable;

  const reactionEmojis = {
    insightful: '💡',
    agreed: '✅',
    debatable: '💬'
  };

  return (
    <div 
      className="reaction-container"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => { e.stopPropagation(); }}
    >
      <div className={`reaction-picker-tray ${isOpen ? 'open' : ''}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('insightful'); }} 
          className={`reaction-option-btn ${userReaction === 'insightful' ? 'active' : ''}`}
          title="Insightful (💡)"
        >
          💡
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('agreed'); }} 
          className={`reaction-option-btn ${userReaction === 'agreed' ? 'active' : ''}`}
          title="Agreed (✅)"
        >
          ✅
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleSelectReaction('debatable'); }} 
          className={`reaction-option-btn ${userReaction === 'debatable' ? 'active' : ''}`}
          title="Debatable (💬)"
        >
          💬
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleTriggerClick}
          className="btn-icon"
          style={{ 
            color: userReaction ? 'var(--color-accent)' : 'inherit', 
            width: '36px', 
            height: '36px',
            fontSize: userReaction ? '18px' : 'inherit'
          }}
          title="React to post"
        >
          {userReaction ? (
            reactionEmojis[userReaction]
          ) : (
            <Heart size={20} strokeWidth={1.5} />
          )}
        </button>
        
        {totalReactions > 0 && (
          <div className="reaction-badge-group">
            {counts.insightful > 0 && (
              <span 
                className={`reaction-badge ${userReaction === 'insightful' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleSelectReaction('insightful'); }}
                title="Insightful"
              >
                💡 {counts.insightful}
              </span>
            )}
            {counts.agreed > 0 && (
              <span 
                className={`reaction-badge ${userReaction === 'agreed' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleSelectReaction('agreed'); }}
                title="Agreed"
              >
                ✅ {counts.agreed}
              </span>
            )}
            {counts.debatable > 0 && (
              <span 
                className={`reaction-badge ${userReaction === 'debatable' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleSelectReaction('debatable'); }}
                title="Debatable"
              >
                💬 {counts.debatable}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
