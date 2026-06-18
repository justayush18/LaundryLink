import React from 'react';

export default function WaveBackground({ variant = 'default', className = '' }) {
  if (variant === 'hero') {
    return (
      <div className={className} style={styles.heroContainer}>
        <svg style={styles.heroWave} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            d="M0,224L48,218.7C96,213,192,203,288,186.7C384,171,480,149,576,154.7C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#C8D9E6"
            fillOpacity="0.4"
            style={{ animation: 'waveMotion1 8s ease-in-out infinite' }}
          />
          <path
            d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,224C672,235,768,245,864,234.7C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#567C8D"
            fillOpacity="0.15"
            style={{ animation: 'waveMotion2 10s ease-in-out infinite' }}
          />
          <path
            d="M0,256L48,261.3C96,267,192,277,288,272C384,267,480,245,576,234.7C672,224,768,224,864,229.3C960,235,1056,245,1152,240C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#C8D9E6"
            fillOpacity="0.25"
            style={{ animation: 'waveMotion3 12s ease-in-out infinite' }}
          />
        </svg>
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className={className} style={styles.sectionContainer}>
        <svg style={styles.sectionWave} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,60L80,55C160,50,320,40,480,45C640,50,800,70,960,75C1120,80,1280,70,1360,65L1440,60L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            fill="#C8D9E6"
            fillOpacity="0.3"
            style={{ animation: 'waveMotion1 10s ease-in-out infinite' }}
          />
        </svg>
      </div>
    );
  }

  // Default — subtle page background decoration
  return (
    <div className={className} style={styles.defaultContainer}>
      <svg style={styles.defaultWave} viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path
          d="M0,128L60,122.7C120,117,240,107,360,112C480,117,600,139,720,138.7C840,139,960,117,1080,112C1200,107,1320,117,1380,122.7L1440,128L1440,200L1380,200C1320,200,1200,200,1080,200C960,200,840,200,720,200C600,200,480,200,360,200C240,200,120,200,60,200L0,200Z"
          fill="#C8D9E6"
          fillOpacity="0.2"
          style={{ animation: 'waveMotion1 12s ease-in-out infinite' }}
        />
        <path
          d="M0,160L60,154.7C120,149,240,139,360,144C480,149,600,171,720,170.7C840,171,960,149,1080,138.7C1200,128,1320,128,1380,128L1440,128L1440,200L1380,200C1320,200,1200,200,1080,200C960,200,840,200,720,200C600,200,480,200,360,200C240,200,120,200,60,200L0,200Z"
          fill="#567C8D"
          fillOpacity="0.08"
          style={{ animation: 'waveMotion2 14s ease-in-out infinite' }}
        />
      </svg>
    </div>
  );
}

const styles = {
  heroContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 0,
  },
  heroWave: {
    width: '100%',
    height: '200px',
    display: 'block',
  },
  sectionContainer: {
    position: 'relative',
    width: '100%',
    pointerEvents: 'none',
    marginTop: '-1px',
  },
  sectionWave: {
    width: '100%',
    height: '80px',
    display: 'block',
  },
  defaultContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  defaultWave: {
    width: '100%',
    height: '150px',
    display: 'block',
  },
};
