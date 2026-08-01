

const BADGE_MAP = {
  prolific_writer: {
    emoji: '✍️',
    label: 'Prolific Writer',
    description: 'Published 5 or more posts',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  thought_leader: {
    emoji: '💡',
    label: 'Thought Leader',
    description: 'Received 5 or more post reactions',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.08)',
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  frequent_debater: {
    emoji: '💬',
    label: 'Frequent Debater',
    description: 'Written 5 or more comments',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  early_adopter: {
    emoji: '🚀',
    label: 'Early Adopter',
    description: 'One of the first 10 members of Quill',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
};

export const getMiniBadge = (badgeKey) => {
  return BADGE_MAP[badgeKey] || null;
};

export default function BadgeRow({ badges = [], size = 'md' }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div 
      className="badge-row" 
      style={{ 
        display: 'inline-flex', 
        gap: '6px', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        margin: '4px 0'
      }}
    >
      {badges.map((key) => {
        const badge = BADGE_MAP[key];
        if (!badge) return null;

        const isSmall = size === 'sm';

        return (
          <div
            key={key}
            className="badge-item"
            title={`${badge.label}: ${badge.description}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isSmall ? '2px 6px' : '4px 10px',
              fontSize: isSmall ? '10px' : '12px',
              fontWeight: 600,
              color: badge.color,
              backgroundColor: badge.bgColor,
              border: `1px solid ${badge.borderColor}`,
              borderRadius: 'var(--radius-full)',
              cursor: 'help',
              transition: 'all 200ms ease',
              userSelect: 'none',
            }}
          >
            <span>{badge.emoji}</span>
            {!isSmall && <span>{badge.label}</span>}
          </div>
        );
      })}
    </div>
  );
}
