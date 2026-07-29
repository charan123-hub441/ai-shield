import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import API from '../api/axios';
import Navbar from '../components/Navbar';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const StatCard = ({ label, value, icon, color, subtitle, badgeText }) => (
  <div className={`stat-card ${color}`}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <div className="stat-icon-wrapper">
        {icon}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.4rem' }}>
      <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {badgeText && (
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '0.15rem 0.45rem',
          borderRadius: '6px',
          background: 'var(--accent-light)',
          color: 'var(--accent)'
        }}>
          {badgeText}
        </span>
      )}
    </div>
    {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.3rem' }}>{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const doughnutData = stats ? {
    labels: ['Safe', 'Offensive', 'Cyberbullying', 'Severe Harassment'],
    datasets: [{
      data: [stats.safe_count, stats.offensive_count, stats.cyberbullying_count, stats.severe_count],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#ec4899'],
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 6
    }]
  } : null;

  const barData = stats ? {
    labels: ['Safe', 'Offensive', 'Cyberbullying', 'Severe'],
    datasets: [{
      label: 'Analyzed Messages',
      data: [stats.safe_count, stats.offensive_count, stats.cyberbullying_count, stats.severe_count],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#ec4899'],
      borderRadius: 8,
      borderWidth: 0,
      maxBarThickness: 42
    }]
  } : null;

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgb(148, 163, 184)',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        padding: 12,
        cornerRadius: 10,
        displayColors: true
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: 'rgb(148, 163, 184)', font: { family: 'Plus Jakarta Sans', weight: '600' } },
        grid: { display: false }
      },
      y: {
        ticks: { color: 'rgb(148, 163, 184)', font: { family: 'Plus Jakarta Sans' } },
        grid: { color: 'rgba(148, 163, 184, 0.1)', strokeDash: [4, 4] },
        beginAtZero: true
      }
    }
  };

  if (loading) return (
    <div style={{ flex: 1 }}>
      <Navbar title="Executive Dashboard" subtitle="Real-time social media threat monitoring and analytics" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1 }} className="animate-in">
      <Navbar title="Executive Dashboard" subtitle="Real-time social media threat monitoring and analytics" />

      {/* Row 1 Primary Threat Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.2rem', marginBottom: '1.8rem' }}>
        <StatCard label="Total Messages" value={stats?.total_messages ?? 0} icon="📊" color="purple" subtitle="All processed content" badgeText="Realtime" />
        <StatCard label="Safe Content" value={stats?.safe_count ?? 0} icon="🛡️" color="green" subtitle="No violations detected" />
        <StatCard label="Offensive Content" value={stats?.offensive_count ?? 0} icon="⚠️" color="orange" subtitle="Mild language violations" />
        <StatCard label="Cyberbullying" value={stats?.cyberbullying_count ?? 0} icon="🚨" color="red" subtitle="Actionable threats" />
      </div>

      {/* Row 2 Action Items & Escalation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.2rem', marginBottom: '2.2rem' }}>
        <StatCard label="Severe Harassment" value={stats?.severe_count ?? 0} icon="☠️" color="red" subtitle="High priority action" />
        <StatCard label="Auto-Flagged" value={stats?.flagged_count ?? 0} icon="🚩" color="orange" subtitle="Held for moderation" />
        <StatCard label="Total User Reports" value={stats?.total_reports ?? 0} icon="📋" color="blue" subtitle="Community submissions" />
        <StatCard label="Pending Review" value={stats?.pending_reports ?? 0} icon="⏱️" color="orange" subtitle="Awaiting admin action" />
      </div>

      {/* Visual Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Threat Breakdown
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Proportion</span>
          </div>
          {doughnutData && stats.total_messages > 0 ? (
            <div style={{ height: 260, position: 'relative' }}>
              <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '72%' }} />
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>📈</span>
              <span>No analyzed messages yet. Test with the Analyzer!</span>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Classification Volume
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category Distribution</span>
          </div>
          {barData && stats.total_messages > 0 ? (
            <div style={{ height: 260 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>📊</span>
              <span>No analyzed messages yet. Test with the Analyzer!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
