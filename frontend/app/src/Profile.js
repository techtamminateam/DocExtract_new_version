import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { Info, MoreHorizontal, CheckCircle, Clock, BookOpen, Award, ArrowUpRight } from 'lucide-react';
import './Profile.css';

const radarData = [
  { subject: 'Visual design', A: 90, B: 60, C: 40, fullMark: 100 },
  { subject: 'Client management', A: 80, B: 70, C: 60, fullMark: 100 },
  { subject: 'Metrix', A: 75, B: 50, C: 70, fullMark: 100 },
  { subject: 'User Flow', A: 85, B: 65, C: 50, fullMark: 100 },
  { subject: 'User research', A: 70, B: 85, C: 65, fullMark: 100 },
  { subject: 'Accessibility', A: 65, B: 80, C: 90, fullMark: 100 },
];

const historyData = [
  { course: 'UX Fundamentals', cert: '-', duration: '16.5h' },
  { course: 'User Research Basics', cert: 'Yes', duration: '12h' },
  { course: 'Wireframing Essentials', cert: '-', duration: '3.5h' },
  { course: 'Prototyping Skills', cert: 'Yes', duration: '8h' },
  { course: 'Usability Testing', cert: 'Yes', duration: '24.5h' },
];

const achievementData = [
  { title: 'Learning master', value: 4, max: 5, color: '#f59e0b', icon: '🎓' },
  { title: 'Skill Builder', value: 1, max: 5, color: '#94a3b8', icon: '🏗️' },
  { title: 'Leadership', value: 2, max: 2, color: '#22c55e', icon: '🌟' },
  { title: 'Communicator', value: 5, max: 10, color: '#8b5cf6', icon: '💬' },
];

export function Profile() {
  return (
    <div className="profile-page-root">
      <div className="profile-header">
        <div className="profile-breadcrumb">
          <span>Team</span> &gt; <span>Business</span> &gt; <span className="current">Young Alaska</span>
        </div>
      </div>

      <div className="profile-grid-top">
        {/* User Card */}
        <div className="profile-user-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 3, cursor: 'pointer' }}>
            <MoreHorizontal color="white" />
          </div>
          
          <h2 className="p-user-name">Young Alaska</h2>
          <div className="p-user-role">Business</div>
          
          <div className="p-avatar-wrap">
            <div className="p-avatar-arc" />
            <img src="https://i.pravatar.cc/150?img=68" alt="Young Alaska" />
          </div>
          
          <div className="p-user-stats">
            <div className="p-stat">
              <div className="p-stat-label">Technical Skills</div>
              <div className="p-stat-val">86%</div>
            </div>
            <div className="p-stat">
              <div className="p-stat-label">Soft Skills</div>
              <div className="p-stat-val">92%</div>
            </div>
            <div className="p-stat">
              <div className="p-stat-label">Experience</div>
              <div className="p-stat-val">8 years</div>
            </div>
          </div>
        </div>

        {/* Learning Time Card */}
        <div className="profile-card">
          <div className="p-card-header">
            <div className="p-card-title">
              Learning Time <Info size={14} className="p-card-title-icon" />
            </div>
            <ArrowUpRight size={16} className="p-card-expand" />
          </div>
          <div className="p-learning-time-content">
            <div className="p-radar-wrap">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Radar name="Achieved" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0} />
                  <Radar name="Progressing" dataKey="B" stroke="#eab308" fill="#eab308" fillOpacity={0} />
                  <Radar name="Want Learn" dataKey="C" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="p-radar-legend-bottom">
                <div className="p-legend-item"><div className="p-legend-dot" style={{ backgroundColor: '#22c55e' }} /> Achieved</div>
                <div className="p-legend-item"><div className="p-legend-dot" style={{ backgroundColor: '#eab308' }} /> Progressing</div>
                <div className="p-legend-item"><div className="p-legend-dot" style={{ backgroundColor: '#0ea5e9' }} /> Want Learn</div>
              </div>
            </div>
            <div className="p-competency-legend">
              <div className="p-competency-title">Legend</div>
              <div className="p-comp-item">
                <div className="p-comp-circle checked" />
                Don't know this competency
              </div>
              <div className="p-comp-item">
                <div className="p-comp-circle checked" />
                Novice
              </div>
              <div className="p-comp-item">
                <div className="p-comp-circle checked" />
                Advanced beginner
              </div>
              <div className="p-comp-item">
                <div className="p-comp-circle checked" />
                Competent
              </div>
              <div className="p-comp-item">
                <div className="p-comp-circle" style={{ border: '2px solid #eab308' }}>
                  <div style={{ width: 8, height: 8, backgroundColor: '#fef08a', borderRadius: '50%' }} />
                </div>
                Proficient
              </div>
              <div className="p-comp-item">
                <div className="p-comp-circle expert" />
                Expert
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid-bottom">
        {/* Learning History */}
        <div className="profile-card">
          <div className="p-card-header">
            <div className="p-card-title">
              Learning History <Info size={14} className="p-card-title-icon" />
            </div>
            <ArrowUpRight size={16} className="p-card-expand" />
          </div>
          <table className="p-history-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Certification</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.course}</td>
                  <td className={row.cert === 'Yes' ? 'p-cert-yes' : ''}>{row.cert}</td>
                  <td>{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Achievements */}
        <div className="profile-card">
          <div className="p-card-header">
            <div className="p-card-title">
              Achievements <Info size={14} className="p-card-title-icon" />
            </div>
            <ArrowUpRight size={16} className="p-card-expand" />
          </div>
          <div className="p-achievement-list">
            {achievementData.map((ach, idx) => {
              const pct = (ach.value / ach.max) * 100;
              return (
                <div className="p-ach-item" key={idx}>
                  <div className="p-ach-icon" style={{ backgroundColor: `${ach.color}20` }}>
                    {ach.icon}
                  </div>
                  <div className="p-ach-info">
                    <div className="p-ach-head">
                      <span>{ach.title}</span>
                      <span>{ach.value}/{ach.max}</span>
                    </div>
                    <div className="p-ach-bar-bg">
                      <div className="p-ach-bar-fill" style={{ width: `${pct}%`, backgroundColor: ach.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning Statistic */}
        <div className="profile-card">
          <div className="p-card-header">
            <div className="p-card-title">
              Learning Statistic <Info size={14} className="p-card-title-icon" />
            </div>
            <ArrowUpRight size={16} className="p-card-expand" />
          </div>
          <div className="p-stat-list">
            <div className="p-stat-row">
              <div className="p-stat-row-left">
                <Clock size={16} className="p-stat-row-icon" />
                Total learning hours
              </div>
              <div className="p-stat-row-val">254</div>
            </div>
            <div className="p-stat-row">
              <div className="p-stat-row-left">
                <Award size={16} className="p-stat-row-icon" />
                Certificates completed
              </div>
              <div className="p-stat-row-val">8</div>
            </div>
            <div className="p-stat-row">
              <div className="p-stat-row-left">
                <Clock size={16} className="p-stat-row-icon" />
                Hands-on practice hours
              </div>
              <div className="p-stat-row-val">14</div>
            </div>
            <div className="p-stat-row">
              <div className="p-stat-row-left">
                <BookOpen size={16} className="p-stat-row-icon" />
                Courses completed
              </div>
              <div className="p-stat-row-val">12</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
