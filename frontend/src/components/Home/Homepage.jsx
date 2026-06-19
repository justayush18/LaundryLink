import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WaveBackground from '../Common/WaveBackground';
import FloatingBubbles from '../Common/FloatingBubbles';
import VeloraMascot from '../Common/VeloraMascot';
import { 
  Sparkles, 
  Clock, 
  Truck, 
  ShieldCheck, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  ThumbsUp,
  Star
} from 'lucide-react';
import FloatingNav from '../Common/FloatingNav';

export default function Homepage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'CUSTOMER') navigate('/customer/dashboard');
      else if (user.role === 'LAUNDRY_PARTNER') navigate('/partner/dashboard');
      else if (user.role === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleCTA = () => {
    if (user) {
      if (user.role === 'CUSTOMER') navigate('/customer/dashboard');
      else if (user.role === 'LAUNDRY_PARTNER') navigate('/partner/dashboard');
      else if (user.role === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="app-layout" style={{ overflowX: 'hidden' }}>
      <FloatingNav />
      
      {/* 1. HERO SECTION */}
      <section style={styles.heroSection}>
        <WaveBackground variant="hero" />
        <FloatingBubbles count={15} />
        
        <div className="page-container" style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.badgeContainer}>
              <span className="badge badge-success animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Fresh & Clean Laundry Service
              </span>
            </div>
            
            <h1 style={styles.heroTitle}>
              Fresh clothes,<br />
              <span style={{ color: 'var(--primary-teal)' }}>delivered to your door.</span>
            </h1>
            
            <p style={styles.heroSubtitle}>
              Velora connects you with the best local laundry partners and swift delivery agents. Premium care for your garments, scheduled at your convenience.
            </p>
            
            <div style={styles.heroActions}>
              <button onClick={handleCTA} className="velora-btn velora-btn-primary animate-pulse" style={{ padding: '0.875rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {user ? 'Go to Dashboard' : 'Schedule First Pickup'} <ArrowRight size={18} />
              </button>
              <a href="#how-it-works" className="velora-btn velora-btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                See How It Works
              </a>
            </div>

            <div style={styles.heroStats}>
              <div style={styles.heroStatItem}>
                <span style={styles.heroStatVal}>10k+</span>
                <span style={styles.heroStatLbl}>Orders Processed</span>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--sky-blue)' }}></div>
              <div style={styles.heroStatItem}>
                <span style={styles.heroStatVal}>99.8%</span>
                <span style={styles.heroStatLbl}>Clean Rate</span>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--sky-blue)' }}></div>
              <div style={styles.heroStatItem}>
                <span style={styles.heroStatVal}>4.9★</span>
                <span style={styles.heroStatLbl}>Customer Rating</span>
              </div>
            </div>
          </div>
          
          <div style={styles.heroImageContainer} className="animate-float">
            <div style={styles.mascotHeroWrapper}>
              <VeloraMascot state="celebrating" size={240} />
            </div>
            {/* Floating micro-cards */}
            <div style={{ ...styles.floatingMicroCard, top: '20%', left: '-10%' }} className="velora-card">
              <span style={{ fontSize: '24px' }}>🧼</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-navy)' }}>Eco Friendly</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Non-toxic detergents</div>
              </div>
            </div>
            
            <div style={{ ...styles.floatingMicroCard, bottom: '15%', right: '-5%' }} className="velora-card">
              <span style={{ fontSize: '24px' }}>⚡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-navy)' }}>Express Care</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>24-hour turnaround</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" style={styles.section}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <h2 style={styles.sectionTitle}>Laundry in 4 Simple Steps</h2>
          <p style={styles.sectionSubtitle}>We've streamlined the entire process so you can focus on what matters most.</p>
          
          <div style={styles.stepsGrid}>
            <div className="velora-card card-hover animate-fadeInUp" style={styles.stepCard}>
              <div style={{ ...styles.stepIconContainer, background: '#EBF5FF' }}>
                <Calendar size={28} color="#1A56DB" />
                <span style={styles.stepBadge}>1</span>
              </div>
              <h3 style={styles.stepTitle}>Schedule Pickup</h3>
              <p style={styles.stepDesc}>Pick a date and convenient time slot for our delivery agent to collect your laundry.</p>
            </div>

            <div className="velora-card card-hover animate-fadeInUp" style={styles.stepCard}>
              <div style={{ ...styles.stepIconContainer, background: '#EDFDFD' }}>
                <Truck size={28} color="#047857" />
                <span style={styles.stepBadge}>2</span>
              </div>
              <h3 style={styles.stepTitle}>Garment Collection</h3>
              <p style={styles.stepDesc}>Our friendly delivery driver arrives at your doorstep to pick up and secure your clothes.</p>
            </div>

            <div className="velora-card card-hover animate-fadeInUp" style={styles.stepCard}>
              <div style={{ ...styles.stepIconContainer, background: '#FFF7ED' }}>
                <Sparkles size={28} color="#C2410C" />
                <span style={styles.stepBadge}>3</span>
              </div>
              <h3 style={styles.stepTitle}>Expert Cleaning</h3>
              <p style={styles.stepDesc}>Our trusted local laundry partners clean your clothes with utmost care and quality standards.</p>
            </div>

            <div className="velora-card card-hover animate-fadeInUp" style={styles.stepCard}>
              <div style={{ ...styles.stepIconContainer, background: '#F5F3FF' }}>
                <ShoppingBag size={28} color="#6B21A8" />
                <span style={styles.stepBadge}>4</span>
              </div>
              <h3 style={styles.stepTitle}>Fresh Delivery</h3>
              <p style={styles.stepDesc}>Receive your freshly washed, folded, and clean clothes back at your doorstep in no time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICES */}
      <section style={{ ...styles.section, background: 'var(--bg-secondary)', position: 'relative' }}>
        <WaveBackground variant="section" />
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={styles.sectionTitle}>Our Premium Services</h2>
            <p style={styles.sectionSubtitle}>We handle everything from daily wear to delicate fabrics with professional care.</p>
          </div>

          <div style={styles.servicesGrid}>
            <div className="velora-card card-hover" style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={{ fontSize: '32px' }}>👕</span>
                <h3 style={styles.serviceTitle}>Wash & Fold</h3>
              </div>
              <p style={styles.serviceDesc}>Everyday garments, t-shirts, jeans, and bed linens, carefully washed, dried, and neatly folded.</p>
              <ul style={styles.serviceList}>
                <li><CheckCircle size={16} color="var(--primary-teal)" /> Eco-friendly detergents</li>
                <li><CheckCircle size={16} color="var(--primary-teal)" /> Individual loads (never mixed)</li>
              </ul>
            </div>

            <div className="velora-card card-hover" style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={{ fontSize: '32px' }}>👔</span>
                <h3 style={styles.serviceTitle}>Wash & Iron</h3>
              </div>
              <p style={styles.serviceDesc}>Perfect for work wear, shirts, trousers, and dresses. Cleaned, pressed, and returned on hangers.</p>
              <ul style={styles.serviceList}>
                <li><CheckCircle size={16} color="var(--primary-teal)" /> High-temp steam press</li>
                <li><CheckCircle size={16} color="var(--primary-teal)" /> Garment-specific temperature setting</li>
              </ul>
            </div>

            <div className="velora-card card-hover" style={styles.serviceCard}>
              <div style={styles.serviceHeader}>
                <span style={{ fontSize: '32px' }}>✨</span>
                <h3 style={styles.serviceTitle}>Dry Cleaning</h3>
              </div>
              <p style={styles.serviceDesc}>Special treatment for premium fabrics, suits, coats, silks, and woolens to preserve texture and color.</p>
              <ul style={styles.serviceList}>
                <li><CheckCircle size={16} color="var(--primary-teal)" /> Gentle organic solvents</li>
                <li><CheckCircle size={16} color="var(--primary-teal)" /> Stain pretreatments included</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE ORDER JOURNEY */}
      <section style={styles.section}>
        <div className="page-container" style={styles.journeyContainer}>
          <div style={styles.journeyContent}>
            <h2 style={{ ...styles.sectionTitle, textAlign: 'left' }}>Real-time Journey Tracking</h2>
            <p style={{ ...styles.sectionSubtitle, textAlign: 'left', margin: '1rem 0 2rem 0' }}>
              Never wonder where your favorite clothes are. Track every step of the washing cycle and delivery transit live from your customer portal.
            </p>

            <div style={styles.timeline}>
              <div style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: 'var(--primary-navy)' }}></div>
                <div>
                  <h4 style={styles.timelineTitle}>Pickup Scheduled</h4>
                  <p style={styles.timelineDesc}>Agent assigned and scheduled to arrive today.</p>
                </div>
              </div>
              
              <div style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: 'var(--primary-teal)' }}></div>
                <div>
                  <h4 style={styles.timelineTitle}>In Laundry Cycle</h4>
                  <p style={styles.timelineDesc}>Garments are currently in wash cycle at Sparkle Laundry.</p>
                </div>
              </div>

              <div style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: 'var(--sky-blue)' }}></div>
                <div>
                  <h4 style={styles.timelineTitle}>Ready for Delivery</h4>
                  <p style={styles.timelineDesc}>Clothes are washed, ironed, packaged, and sorted.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.journeyGraphicContainer} className="velora-card">
            <div style={styles.graphicHeader}>
              <div style={styles.graphicDot}></div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Live Status: Order #VL-8491</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', gap: '1.5rem' }}>
              <VeloraMascot state="happy" size={120} />
              
              <div style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>Washing & Folding</span>
                  <span style={{ color: 'var(--primary-teal)', fontWeight: 600 }}>80% Complete</span>
                </div>
                <div style={{ height: '8px', background: 'var(--sky-blue)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '80%', background: 'var(--primary-teal)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <MapPin size={18} color="var(--primary-teal)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Partner: <strong>Sparkle Laundry Centre</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section style={{ ...styles.section, background: 'var(--bg-secondary)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={styles.sectionTitle}>Loved by our customers</h2>
            <p style={styles.sectionSubtitle}>Here is what our community says about their laundry experience.</p>
          </div>

          <div style={styles.testimonialsGrid}>
            <div className="velora-card" style={styles.testimonialCard}>
              <div style={{ display: 'flex', color: '#FBBF24', gap: '2px', marginBottom: '1rem' }}>
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
              </div>
              <p style={styles.testimonialText}>
                "The pick up and delivery service is incredibly convenient. The clothes look brand new and smell fresh every single time. It has saved me so much weekend time!"
              </p>
              <div style={styles.testimonialUser}>
                <div style={styles.avatarPlaceholder}>A</div>
                <div>
                  <h4 style={styles.testimonialName}>Ananya Sharma</h4>
                  <span style={styles.testimonialRole}>Verified Customer</span>
                </div>
              </div>
            </div>

            <div className="velora-card" style={styles.testimonialCard}>
              <div style={{ display: 'flex', color: '#FBBF24', gap: '2px', marginBottom: '1rem' }}>
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
              </div>
              <p style={styles.testimonialText}>
                "Fantastic service! The dry cleaning for my suits was handled perfectly. I can track the order easily through the app, and delivery is always on time."
              </p>
              <div style={styles.testimonialUser}>
                <div style={styles.avatarPlaceholder}>R</div>
                <div>
                  <h4 style={styles.testimonialName}>Rohan Verma</h4>
                  <span style={styles.testimonialRole}>Verified Customer</span>
                </div>
              </div>
            </div>

            <div className="velora-card" style={styles.testimonialCard}>
              <div style={{ display: 'flex', color: '#FBBF24', gap: '2px', marginBottom: '1rem' }}>
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
              </div>
              <p style={styles.testimonialText}>
                "I run a busy household, and having a reliable laundry service is a life saver. The customer care is friendly, and pricing is extremely transparent and fair."
              </p>
              <div style={styles.testimonialUser}>
                <div style={styles.avatarPlaceholder}>P</div>
                <div>
                  <h4 style={styles.testimonialName}>Priya Patel</h4>
                  <span style={styles.testimonialRole}>Verified Customer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PARTNER NETWORK CTA */}
      <section style={styles.section}>
        <div className="page-container" style={styles.partnerContainer} className="velora-card">
          <div style={styles.partnerContent}>
            <h2 style={{ ...styles.sectionTitle, textAlign: 'left', color: '#FFFFFF' }}>Partner with Velora</h2>
            <p style={{ ...styles.sectionSubtitle, textAlign: 'left', color: 'rgba(255, 255, 255, 0.8)', margin: '1rem 0 2rem 0' }}>
              Are you a laundry service owner or an independent delivery agent? Join our network to grow your business, receive continuous orders, and manage your tasks seamlessly.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} className="velora-btn velora-btn-primary" style={{ background: '#FFFFFF', color: 'var(--primary-navy)' }}>
                Become a Partner
              </button>
              <button onClick={() => navigate('/register')} className="velora-btn velora-btn-secondary" style={{ borderColor: '#FFFFFF', color: '#FFFFFF' }}>
                Join as Delivery Rider
              </button>
            </div>
          </div>
          <div style={styles.partnerGraphic}>
            <VeloraMascot state="thinking" size={150} />
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section style={{ ...styles.section, background: 'var(--bg-secondary)', padding: '5rem 0', position: 'relative' }}>
        <WaveBackground variant="default" />
        <div className="page-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={styles.finalTitle}>Ready for laundry day to disappear?</h2>
          <p style={{ ...styles.sectionSubtitle, maxWidth: '500px', margin: '1rem auto 2.5rem auto' }}>
            Sign up today and get 20% off your first laundry schedule. Fresh, clean laundry is just a tap away.
          </p>
          <button onClick={handleCTA} className="velora-btn velora-btn-primary animate-pulse" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
            Schedule First Pickup
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div className="page-container" style={styles.footerContainer}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '1rem' }}>Velora</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '250px' }}>
              Fresh clothes, cleaned by professionals and delivered right to your door.
            </p>
          </div>
          <div style={styles.footerLinksGrid}>
            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Company</h4>
              <a href="#" style={styles.footerLink}>About Us</a>
              <a href="#" style={styles.footerLink}>Careers</a>
              <a href="#" style={styles.footerLink}>Press</a>
            </div>
            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Partners</h4>
              <a href="#" style={styles.footerLink}>Laundry Partners</a>
              <a href="#" style={styles.footerLink}>Delivery Riders</a>
              <a href="#" style={styles.footerLink}>Integrations</a>
            </div>
            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Support</h4>
              <a href="#" style={styles.footerLink}>Help Centre</a>
              <a href="#" style={styles.footerLink}>Safety</a>
              <a href="#" style={styles.footerLink}>Contact Us</a>
            </div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Velora Technologies Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  heroSection: {
    padding: '8rem 0 6rem 0',
    position: 'relative',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    minHeight: '85vh',
  },
  heroContainer: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '3rem',
    alignItems: 'center',
    zIndex: 1,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  badgeContainer: {
    display: 'flex',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: '1.1',
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
  },
  heroSubtitle: {
    fontSize: '1.125rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    maxWidth: '560px',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
  },
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginTop: '2rem',
  },
  heroStatItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  heroStatVal: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
  },
  heroStatLbl: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  heroImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mascotHeroWrapper: {
    background: 'var(--white)',
    padding: '3rem',
    borderRadius: '40px',
    boxShadow: 'var(--shadow-lg)',
  },
  floatingMicroCard: {
    position: 'absolute',
    padding: '12px 18px',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#FFFFFF',
  },
  section: {
    padding: '6rem 0',
  },
  sectionTitle: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    maxWidth: '540px',
    margin: '0.5rem auto 3rem auto',
    lineHeight: 1.5,
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  },
  stepCard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  stepIconContainer: {
    position: 'relative',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  stepBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: 'var(--primary-navy)',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: 700,
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #FFFFFF',
  },
  stepTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--primary-navy)',
    marginBottom: '0.75rem',
    fontFamily: 'Outfit, sans-serif',
  },
  stepDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: 0,
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },
  serviceCard: {
    padding: '2.5rem 2rem',
    background: '#FFFFFF',
  },
  serviceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1rem',
  },
  serviceTitle: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    margin: 0,
  },
  serviceDesc: {
    fontSize: '0.925rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  },
  serviceList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  journeyContainer: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '4.5rem',
    alignItems: 'center',
  },
  journeyContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'relative',
    paddingLeft: '1.5rem',
    borderLeft: '2px dashed var(--sky-blue)',
    marginLeft: '10px',
  },
  timelineItem: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  timelineDot: {
    position: 'absolute',
    left: '-31px',
    top: '4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid #FFFFFF',
  },
  timelineTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--primary-navy)',
    margin: 0,
    fontFamily: 'Outfit, sans-serif',
  },
  timelineDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  journeyGraphicContainer: {
    background: '#FFFFFF',
    overflow: 'hidden',
  },
  graphicHeader: {
    background: 'var(--bg-secondary)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--sky-blue)',
  },
  graphicDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10B981',
    animation: 'pulse 1.5s infinite',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },
  testimonialCard: {
    padding: '2.5rem 2rem',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  testimonialText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginBottom: '1.5rem',
    flex: 1,
  },
  testimonialUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--sky-blue)',
    color: 'var(--primary-navy)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  testimonialName: {
    fontSize: '0.925rem',
    fontWeight: 700,
    color: 'var(--primary-navy)',
    margin: 0,
    fontFamily: 'Outfit, sans-serif',
  },
  testimonialRole: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  partnerContainer: {
    background: 'var(--primary-navy)',
    padding: '4rem',
    borderRadius: '32px',
    display: 'grid',
    gridTemplateColumns: '1.3fr 0.7fr',
    gap: '3rem',
    alignItems: 'center',
  },
  partnerContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  partnerGraphic: {
    display: 'flex',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2rem',
    borderRadius: '24px',
  },
  finalTitle: {
    fontSize: '2.75rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
  },
  footer: {
    background: '#FFFFFF',
    borderTop: '1px solid var(--sky-blue)',
    padding: '5rem 0 2rem 0',
  },
  footerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '3rem',
    marginBottom: '3rem',
  },
  footerLinksGrid: {
    display: 'flex',
    gap: '4rem',
    flexWrap: 'wrap',
  },
  footerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  footerColTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    marginBottom: '0.5rem',
  },
  footerLink: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'var(--transition-smooth)',
  },
  footerBottom: {
    borderTop: '1px solid var(--sky-blue)',
    paddingTop: '2rem',
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
};
