import React, { useMemo } from 'react';

export default function FloatingBubbles({ count = 8, className = '' }) {
  const bubbles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 6 + Math.random() * 20,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 12 + Math.random() * 18,
      opacity: 0.08 + Math.random() * 0.15,
    }));
  }, [count]);

  return (
    <div className={className} style={styles.container} aria-hidden="true">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          style={{
            ...styles.bubble,
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
            opacity: bubble.opacity,
          }}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    bottom: '-10%',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(200, 217, 230, 0.6), rgba(86, 124, 141, 0.2))',
    animation: 'bubbleRise linear infinite',
  },
};
