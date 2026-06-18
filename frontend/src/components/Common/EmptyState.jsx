import React from 'react';
import VeloraMascot from './VeloraMascot';

export default function EmptyState({ 
  title = 'No data available', 
  description = 'There is nothing to display here right now.', 
  actionLabel, 
  onAction,
  mascotState = 'thinking',
  className = '' 
}) {
  return (
    <div 
      className={`velora-card animate-fadeInUp ${className}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center', 
        padding: '3rem 2rem',
        background: 'var(--card-bg)',
        border: '2px dashed var(--sky-blue)',
        borderRadius: '24px',
        maxWidth: '500px',
        margin: '2rem auto'
      }}
    >
      <VeloraMascot state={mascotState} size={130} style={{ marginBottom: '1.5rem' }} />
      
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 700, 
        color: 'var(--primary-navy)', 
        margin: '1rem 0 0.5rem 0',
        fontFamily: 'Outfit, sans-serif'
      }}>
        {title}
      </h3>
      
      <p style={{ 
        fontSize: '0.875rem', 
        color: 'var(--text-secondary)', 
        maxWidth: '320px', 
        margin: '0 0 1.5rem 0',
        lineHeight: 1.5
      }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="velora-btn velora-btn-primary animate-pulse"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
