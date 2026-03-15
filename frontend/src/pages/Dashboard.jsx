import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import API from '../api/axios';
import Navbar from '../components/Navbar';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const StatCard = ({ label, value, icon, color, subtitle }) => (
  <div className={`stat-card ${color}`}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
    {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const doughnutData = stats ? {
    labels: ['Safe', 'Offensive', 'Cyberbullying', 'Severe'],
    datasets: [{
      data: [stats.safe_count, stats.offensive_count, stats.cyberbullying_count, stats.severe_count],
      backgroundColor: ['rgba(6,214,160,0.8)', 'rgba(255,190,11,0.8)', 'rgba(255,77,109,0.8)', 'rgba(255,0,110,0.8)'],
      borderColor: ['#06d6a0', '#ffbe0b', '#ff4d6d', '#ff006e'],
      borderWidth: 1,
    }]
  } : null;

  const barData = stats ? {
    labels: ['Safe', 'Offensive', 'Cyberbullying', 'Severe Harassment'],
    datasets: [{
      label: 'Messages',
      data: [stats.safe_count, stats.offensive_count, stats.cyberbullying_count, stats.severe_count],
      backgroundColor: ['rgba(6,214,160,0.6)', 'rgba(255,190,11,0.6)', 'rgba(255,77,109,0.6)', 'rgba(255,0,110,0.6)'],
      borderColor: ['#06d6a0', '#ffbe0b', '#ff4d6d', '#ff006e'],
      borderRadius: 8,
      borderWidth: 1,
    }]
  } : null;

  const chartOptions = {
    plugins: { legend: { labels: { color: 'rgb(139,144,167)', font: { family: 'Inter' } } } },
    responsive: true,
    maintainAspectRatio: false,
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: 'rgb(139,144,167)' }, grid: { color: 'rgba(42,45,62,0.8)' } },
      y: { ticks: { color: 'rgb(139,144,167)' }, grid: { color: 'rgba(42,45,62,0.8)' }, beginAtZero: true }
    }
  };

  if (loading) return (
    <div style={{ flex: 1 }}>
      <Navbar title="Dashboard" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1 }} className="animate-in">
      <Navbar title="Dashboard" />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Analyzed" value={stats?.total_messages ?? 0} icon="📊" color="purple" subtitle="All messages" />
        <StatCard label="Safe Messages"  value={stats?.safe_count ?? 0}    icon="✅" color="green" subtitle="No threats detected" />
        <StatCard label="Offensive"      value={stats?.offensive_count ?? 0} icon="⚠️" color="orange" subtitle="Mild violations" />
        <StatCard label="Cyberbullying"  value={stats?.cyberbullying_count ?? 0} icon="🚨" color="red" subtitle="Requires action" />
        <StatCard label="Severe"         value={stats?.severe_count ?? 0}  icon="☠️" color="red" subtitle="Immediate action" />
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Flagged"        value={stats?.flagged_count ?? 0}  icon="🚩" color="red" subtitle="Auto-flagged" />
        <StatCard label="Total Reports"  value={stats?.total_reports ?? 0}  icon="📋" color="blue" subtitle="User reports" />
        <StatCard label="Pending Review" value={stats?.pending_reports ?? 0} icon="🕐" color="orange" subtitle="Awaiting admin" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Classification Breakdown
          </h3>
          {doughnutData && stats.total_messages > 0 ? (
            <div style={{ height: 240 }}>
              <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '65%' }} />
            </div>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No data yet. Analyze some messages!
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Messages by Category
          </h3>
          {barData && stats.total_messages > 0 ? (
            <div style={{ height: 240 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No data yet. Analyze some messages!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
