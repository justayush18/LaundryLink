import React, { useState } from 'react';
import { 
  FileText, 
  XCircle, 
  DollarSign, 
  Lock, 
  Settings, 
  AlertTriangle 
} from 'lucide-react';

export default function TermsAndPolicies() {
  const [activeTab, setActiveTab] = useState('TOS'); // 'TOS' | 'CANCELLATION' | 'REFUND' | 'PRIVACY' | 'GUIDELINES' | 'RULES'

  const tabs = [
    { id: 'TOS', label: 'Terms of Service', icon: FileText },
    { id: 'CANCELLATION', label: 'Cancellation Policy', icon: XCircle },
    { id: 'REFUND', label: 'Refund Policy', icon: DollarSign },
    { id: 'PRIVACY', label: 'Privacy Policy', icon: Lock },
    { id: 'GUIDELINES', label: 'Operational Guidelines', icon: Settings },
    { id: 'RULES', label: 'Platform Rules', icon: AlertTriangle }
  ];

  return (
    <div className="main-content">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Terms & Policies
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Revisit our platform agreements, operational standards, and privacy terms anytime.
          </p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Tab Sidebar */}
        <div style={styles.sidebar} className="glass-panel">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  backgroundColor: isActive ? 'rgba(86, 124, 141, 0.08)' : 'transparent',
                  borderColor: isActive ? 'var(--primary-teal)' : 'transparent',
                  color: isActive ? 'var(--primary-navy)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 800 : 500
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--primary-teal)' : 'var(--text-muted)' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Card */}
        <div style={styles.contentCard} className="velora-card animate-fadeInUp">
          
          {activeTab === 'TOS' && (
            <div>
              <h2 style={styles.contentTitle}>📄 Terms of Service</h2>
              <p style={styles.paragraph}>
                Welcome to Velora. By accessing or using our premium laundry management and logistics services, you agree to comply with and be bound by these Terms of Service.
              </p>
              
              <h3 style={styles.subTitle}>1. Account Responsibility</h3>
              <p style={styles.paragraph}>
                All users must register a valid account with accurate details (display name, phone number, and email). You are solely responsible for keeping your login credentials confidential. Sharing accounts or de-delegating security codes to third parties is strictly prohibited.
              </p>

              <h3 style={styles.subTitle}>2. Service Definition</h3>
              <p style={styles.paragraph}>
                Velora acts as an integrated platform connecting customers, independent laundry merchants (laundry partners), and delivery agents (delivery riders). While we orchestrate transactions, orders, and automated route allocations, service execution is fulfilled by respective merchants and couriers according to platform SLA guidelines.
              </p>

              <h3 style={styles.subTitle}>3. Termination of Use</h3>
              <p style={styles.paragraph}>
                Velora reserves the right to suspend or terminate user accounts immediately for policy violations, fake bookings, payment fraud, or abusive behavior toward platform members.
              </p>
            </div>
          )}

          {activeTab === 'CANCELLATION' && (
            <div>
              <h2 style={styles.contentTitle}>❌ Cancellation Policy</h2>
              <p style={styles.paragraph}>
                To ensure scheduling reliability and offset operational costs incurred by merchants and riders, we enforce structured cancellation parameters:
              </p>

              <h3 style={styles.subTitle}>1. Customer Cancellations</h3>
              <p style={styles.paragraph}>
                Each customer profile receives <strong>3 free cancellations per month</strong>. If you cancel an order after exhausting your free limit, a progressive fee is charged based on order progress:
              </p>
              <ul style={styles.bullets}>
                <li><strong>Order Accepted by Partner:</strong> 15% of total order value fee.</li>
                <li><strong>Rider Assigned:</strong> 25% of total order value fee.</li>
                <li><strong>Rider Reached Pickup Location:</strong> 50% of total order value fee.</li>
                <li><strong>Clothes Picked Up:</strong> 75% of total order value fee.</li>
                <li><strong>Laundry Processing Initiated:</strong> 100% fee (No Refund).</li>
              </ul>

              <h3 style={styles.subTitle}>2. Delivery Partner Cancellations</h3>
              <p style={styles.paragraph}>
                Riders can reject or cancel a maximum of <strong>2 assigned tasks per day</strong>. After reaching this threshold, further cancellations are blocked by the system until the next day, requiring couriers to complete active allocations.
              </p>
            </div>
          )}

          {activeTab === 'REFUND' && (
            <div>
              <h2 style={styles.contentTitle}>💰 Refund Policy</h2>
              <p style={styles.paragraph}>
                Refunds are processed systematically according to payment methods and order statuses:
              </p>

              <h3 style={styles.subTitle}>1. Payment Failures & Timeouts</h3>
              <p style={styles.paragraph}>
                If an online checkout transaction fails, aborts, or times out, the system automatically transitions the payment to <code>FAILED</code> and cancels the order. Any transient charges deducted from your bank account during failed attempts are automatically reversed by the payment gateway within 5-7 business days.
              </p>

              <h3 style={styles.subTitle}>2. Approved Cancellation Refunds</h3>
              <p style={styles.paragraph}>
                Refunds from cancelled pre-paid orders (minus any applicable progress cancellation fees) are credited directly back to the customer's payment source. COD orders have zero cash payout but are checked off the ledger.
              </p>

              <h3 style={styles.subTitle}>3. Quality Dispute Refunds</h3>
              <p style={styles.paragraph}>
                In cases of garment damage, severe delays, or missing items, customers may log disputes. Platform administrators investigate case logs and issue partial or full refunds at their discretion.
              </p>
            </div>
          )}

          {activeTab === 'PRIVACY' && (
            <div>
              <h2 style={styles.contentTitle}>🔒 Privacy Policy</h2>
              <p style={styles.paragraph}>
                Velora is committed to safeguarding your personal data. This privacy policy describes what information we collect and how we utilize it:
              </p>

              <h3 style={styles.subTitle}>1. Data Collection</h3>
              <p style={styles.paragraph}>
                We collect personal registration details (name, email, phone number), active pickup/delivery coordinates, and order items checklists. Laundry partners and riders also submit onboarding documents (IDs, licenses) which are verified by administrators.
              </p>

              <h3 style={styles.subTitle}>2. Information Usage</h3>
              <p style={styles.paragraph}>
                Your details are utilized to coordinate orders (e.g., sharing delivery addresses with assigned riders and partners) and issue real-time notification alerts. We do not sell or trade your details with external advertising agencies.
              </p>

              <h3 style={styles.subTitle}>3. Security Protocols</h3>
              <p style={styles.paragraph}>
                All passwords are encrypted using BCrypt, and API communications are secured with JSON Web Tokens (JWT). Financial data is processed through industry-compliant simulated gateways.
              </p>
            </div>
          )}

          {activeTab === 'GUIDELINES' && (
            <div>
              <h2 style={styles.contentTitle}>⚙️ Operational Guidelines</h2>
              <p style={styles.paragraph}>
                Standardized parameters govern how logistics, pricing, and timing operate on Velora:
              </p>

              <h3 style={styles.subTitle}>1. Merchant Timing Configurations</h3>
              <p style={styles.paragraph}>
                Laundry partners must keep their opening, closing, and service SLA hours configurations accurate in their profiles. Timelines displayed to customers during order placement utilize these details.
              </p>

              <h3 style={styles.subTitle}>2. Automatic Rider Dispatch</h3>
              <p style={styles.paragraph}>
                Task allocation is automated and managed by platform algorithms based on location proximity, status availability, and active courier workloads. Riders do not choose tasks manually.
              </p>

              <h3 style={styles.subTitle}>3. Transaction Ledger Integrity</h3>
              <p style={styles.paragraph}>
                All pricing rate cards, customer invoices, and delivery payouts are computed dynamically off actual database configurations. Merchants are prohibited from adding hidden or manual fees.
              </p>
            </div>
          )}

          {activeTab === 'RULES' && (
            <div>
              <h2 style={styles.contentTitle}>⚠️ Platform Rules</h2>
              <p style={styles.paragraph}>
                Velora enforces clear behavioural and security guidelines to maintain a trusted operational ecosystem:
              </p>

              <h3 style={styles.subTitle}>1. Respectful Interactions</h3>
              <p style={styles.paragraph}>
                Any harassment, hostile behaviour, or abuse directed toward customers, couriers, partners, or support agents will result in immediate profile suspension.
              </p>

              <h3 style={styles.subTitle}>2. Fake Booking Suspensions</h3>
              <p style={styles.paragraph}>
                Customers who repeatedly place mock bookings, provide fake addresses, or manipulate order checkout screens to bypass payment checkpoints will be blacklisted.
              </p>

              <h3 style={styles.subTitle}>3. Periodic Revisions</h3>
              <p style={styles.paragraph}>
                Velora reserves the right to modify these rules and policies at any time. When updates occur, a notification alert is sent to active accounts, and terms can be reviewed on this page.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '16px',
  },
  layout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  sidebar: {
    width: '240px',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '20px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid transparent',
    background: 'none',
    textAlign: 'left',
    fontSize: '0.88rem',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box'
  },
  contentCard: {
    flex: 1,
    minWidth: '320px',
    padding: '2.5rem',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)'
  },
  contentTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    margin: '0 0 1rem 0',
    paddingBottom: '8px',
    borderBottom: '2px solid var(--bg-secondary)'
  },
  subTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--primary-teal)',
    fontFamily: 'Outfit, sans-serif',
    margin: '1.5rem 0 8px 0'
  },
  paragraph: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: '0 0 1rem 0'
  },
  bullets: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: '0 0 1rem 0',
    paddingLeft: '20px'
  }
};
