import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, BookOpen, ChevronRight, BarChart2, MessageSquare, Award } from 'lucide-react';
import { getAuthorAnalytics } from '../api/analytics';
import { useToast } from '../context/ToastContext';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null); // { x, y, date, views }

  useEffect(() => {
    getAuthorAnalytics()
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load analytics data'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className="skeleton" style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '32px' }} />
        <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: 'var(--radius-sm)' }} />
      </div>
    );
  }

  const { total_views, avg_read_through, views_over_time, funnel, top_highlights, posts_performance } = data;

  // SVG Line Chart calculations
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 20;

  const maxViews = Math.max(...views_over_time.map(p => p.views), 10); // minimum scale ceiling of 10
  const pointsCount = views_over_time.length;

  const getCoordinates = () => {
    return views_over_time.map((point, index) => {
      const x = paddingX + (index / (pointsCount - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - (point.views / maxViews) * (chartHeight - paddingY * 2);
      return { x, y, date: point.date, views: point.views };
    });
  };

  const points = getCoordinates();
  
  // Create path strings
  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  // Formatting helper for date labels on X axis
  const formatXLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Funnel calculations
  const totalFunnelViews = Object.values(funnel).reduce((a, b) => a + b, 0) || 1;
  const getFunnelPercentage = (val) => Math.round((val / totalFunnelViews) * 100);

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="font-serif" style={{ fontSize: '28px', fontWeight: 700 }}>Creator Analytics</h1>
          <p className="text-caption">Understand your readers and tracking details for your stories.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Metric 1: Total Views */}
        <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
            <Eye size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Story Views</span>
            <h2 className="font-serif" style={{ fontSize: '32px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>{total_views}</h2>
          </div>
        </div>

        {/* Metric 2: Avg. Read-Through */}
        <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Read-Through</span>
            <h2 className="font-serif" style={{ fontSize: '32px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>{avg_read_through}%</h2>
          </div>
        </div>
      </div>

      {/* Views Over Time Section */}
      <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: '32px' }}>
        <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} style={{ color: 'var(--color-gold)' }} />
          Story Views (Last 30 Days)
        </h3>

        {/* Custom SVG Line Chart */}
        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = paddingY + (i / 3) * (chartHeight - paddingY * 2);
              const labelVal = Math.round(maxViews - (i / 3) * maxViews);
              return (
                <g key={i}>
                  <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="4 4" />
                  <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">{labelVal}</text>
                </g>
              );
            })}

            {/* Area Path */}
            {points.length > 0 && (
              <path d={areaPath} fill="url(#areaGrad)" />
            )}

            {/* Line Path */}
            {points.length > 0 && (
              <path d={linePath} fill="none" stroke="var(--color-gold)" strokeWidth={2} />
            )}

            {/* Data Dots & Hover Overlay */}
            {points.map((p, idx) => (
              <g key={idx}>
                {/* Visible dot on hover or every 5th point to keep layout clean */}
                {(hoveredPoint?.date === p.date || idx % 5 === 0 || idx === points.length - 1) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? 6 : 3}
                    fill={hoveredPoint?.date === p.date ? 'var(--color-gold)' : 'var(--color-bg)'}
                    stroke="var(--color-gold)"
                    strokeWidth={2}
                    style={{ transition: 'r 0.1s ease, fill 0.1s ease' }}
                  />
                )}
                
                {/* Large transparent interactable circle for easy hover targeting */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={12}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}

            {/* X-axis labels (Start, Middle, End) */}
            {points.length > 0 && (
              <>
                <text x={paddingX} y={chartHeight - 4} fontSize="10" fill="var(--color-text-muted)" textAnchor="start">
                  {formatXLabel(points[0].date)}
                </text>
                <text x={chartWidth / 2} y={chartHeight - 4} fontSize="10" fill="var(--color-text-muted)" textAnchor="middle">
                  {formatXLabel(points[Math.floor(points.length / 2)].date)}
                </text>
                <text x={chartWidth - paddingX} y={chartHeight - 4} fontSize="10" fill="var(--color-text-muted)" textAnchor="end">
                  {formatXLabel(points[points.length - 1].date)}
                </text>
              </>
            )}
          </svg>

          {/* Interactive Tooltip HUD */}
          {hoveredPoint && (
            <div style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100 - 45}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border-strong)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '11px',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}>
              <div style={{ fontWeight: 600 }}>{formatXLabel(hoveredPoint.date)}</div>
              <div style={{ color: 'var(--color-gold)' }}>{hoveredPoint.views} views</div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Funnel + Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        
        {/* Funnel: Reading Retention */}
        <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
          <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--color-gold)' }} />
            Readership Funnel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Bounce */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Bounced (<span className="text-caption">&lt; 20% read</span>)</span>
                <span style={{ fontWeight: 600 }}>{funnel.bounce} views ({getFunnelPercentage(funnel.bounce)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${getFunnelPercentage(funnel.bounce)}%`, backgroundColor: '#ff4d4f', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Shallow */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Shallow (<span className="text-caption">20% – 50% read</span>)</span>
                <span style={{ fontWeight: 600 }}>{funnel.shallow} views ({getFunnelPercentage(funnel.shallow)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${getFunnelPercentage(funnel.shallow)}%`, backgroundColor: '#ffc069', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Deep */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Deep (<span className="text-caption">50% – 80% read</span>)</span>
                <span style={{ fontWeight: 600 }}>{funnel.deep} views ({getFunnelPercentage(funnel.deep)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${getFunnelPercentage(funnel.deep)}%`, backgroundColor: '#bae7ff', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Complete */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Complete Story Read (<span className="text-caption">&ge; 80% read</span>)</span>
                <span style={{ fontWeight: 600 }}>{funnel.complete} views ({getFunnelPercentage(funnel.complete)}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${getFunnelPercentage(funnel.complete)}%`, backgroundColor: '#73d13d', borderRadius: '4px' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Highlights: Top crowd-sourced quotes */}
        <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} style={{ color: 'var(--color-gold)' }} />
            Top Crowdsourced Highlights
          </h3>

          {top_highlights.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px 0' }}>
              <p className="text-caption">No readers have highlighted your text yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {top_highlights.map((h, i) => (
                <div key={i} style={{ borderLeft: '3px solid var(--color-gold)', paddingLeft: '12px', position: 'relative' }}>
                  <p className="font-serif" style={{ fontSize: '13px', fontStyle: 'italic', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                    "{h.text.length > 120 ? h.text.substring(0, 120) + '...' : h.text}"
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>{h.post_title}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>{h.count} highlights</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Performance Table */}
      <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
        <h3 className="font-serif" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
          Story Performance Breakdown
        </h3>
        
        {posts_performance.length === 0 ? (
          <p className="text-caption" style={{ textAlign: 'center', padding: '20px 0' }}>Write your first story to see statistics here!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Story Title</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Views</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Avg. Completion</th>
                  <th style={{ padding: '12px 8px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {posts_performance.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: '14px 8px' }}>{p.views}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{p.avg_read_through}%</span>
                        <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.avg_read_through}%`, backgroundColor: 'var(--color-gold)' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      <button onClick={() => navigate(`/posts/${p.id}`)} className="btn-icon" style={{ padding: '4px' }}>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
