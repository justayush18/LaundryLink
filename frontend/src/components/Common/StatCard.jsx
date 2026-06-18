import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendDirection = 'up', 
  description,
  className = '' 
}) {
  const isTrendUp = trendDirection === 'up';

  return (
    <div className={`velora-card card-hover animate-fadeInUp ${className}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '2.5rem', 
            height: '2.5rem', 
            borderRadius: '50%', 
            background: 'var(--sky-blue-light)', 
            color: 'var(--primary-teal)' 
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif' }}>
          {value}
        </span>
        {trend && (
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.125rem',
            padding: '0.125rem 0.375rem',
            borderRadius: '12px',
            background: isTrendUp ? '#DEF7EC' : '#FDE8E8',
            color: isTrendUp ? '#03543F' : '#9B1C1C'
          }}>
            {isTrendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      {(description || trend) && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {description}
        </span>
      )}
    </div>
  );
}
