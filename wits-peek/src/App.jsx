import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');

  const [enrollments, setEnrollments] = useState([]);
  const [selectedTermIndex, setSelectedTermIndex] = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    let token, internalId;

    try {
      const loginRes = await axios.post('/api/login', {
        studentId: studentId,
        password: password
      });

      token = loginRes.data.token;
      internalId = loginRes.data.userInfo.studentId;

      if (loginRes.data.userInfo && loginRes.data.userInfo.fullName) {
        setUserName(loginRes.data.userInfo.fullName);
      }
    } catch (err) {
      alert("Login Failed: Please check your ID and Password.");
      console.error("Auth Error:", err);
      setLoading(false);
      return;
    }

    try {
      // 1. Make sure it says /api/grades
      const gradesRes = await axios.get('/api/grades', { 
        // 2. Put the token back inside the params object
        params: { studentId: internalId, token: token } 
      });

      const allEnrollments = gradesRes.data?.items?.studentEnrollments || [];

      setEnrollments(allEnrollments);
      setSelectedTermIndex(0);
      setIsLoggedIn(true);
    } catch (err) {
      const errorMsg = err.response ? `Server returned ${err.response.status}` : err.message;
      alert(`Sync Failed. Reason: ${errorMsg}`);
      console.error("Grades Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- OMNI-EXTRACTORS ---
  const getYearStr = (enr) => {
    return enr.schoolYear || enr.term?.schoolYear || enr.academicYear || enr.sy || "Academic Year";
  };

  const getSemStr = (enr) => {
    // If the API returns the term as a direct string
    if (typeof enr.term === 'string') return enr.term;
    return enr.semester || enr.semesterName || enr.termName || enr.term?.semester || enr.term?.semesterName || "Semester";
  };

  
  const getCourses = (enr) => {
    if (!enr) return [];

    // Check the current active semester format first
    if (enr.enrolledCourseGradeDetails && enr.enrolledCourseGradeDetails.length > 0) {
      return enr.enrolledCourseGradeDetails;
    }

    // Dynamic fallback for past semesters
    for (const key in enr) {
      if (Array.isArray(enr[key]) && enr[key].length > 0 && (enr[key][0].courseCode || enr[key][0].subjectCode)) {
        return enr[key];
      }
    }

    return [];
  };

  const activeEnrollment = enrollments[selectedTermIndex] || {};
  const courses = getCourses(activeEnrollment);

  const calculateGWA = () => {
    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach(c => {
      const finalGrade = c.gradeDetailFinal?.grade;

      if (finalGrade) {
        const grade = parseFloat(finalGrade);
        const units = parseFloat(c.units);

        if (!isNaN(grade) && !isNaN(units)) {
          totalPoints += (grade * units);
          totalUnits += units;
        }
      }
    });

    return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "0.00";
  };

  const calculateTotalUnits = () => {
    let total = 0;
    courses.forEach(c => {
      const units = parseFloat(c.units);
      if (!isNaN(units)) total += units;
    });
    return total;
  };

  if (!isLoggedIn) {
    return (
      <div className="app-container">
        <div className="cyber-card">
          <div className="login-header">
            <div className="logo-icon">W</div>
            <h1 className="brand-title">WITS-PEEK</h1>
            <p className="brand-subtitle">Alternate Grade Viewer</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Student ID</label>
              <input
                type="text"
                placeholder="XX-XXXX-XXX"
                className="cyber-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="cyber-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="cyber-button" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">

      {/* Top Main Header */}
      <header className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{userName || "Student Dashboard"}</h2>
          <span className="font-mono text-muted">ID: {studentId}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="logout-btn"
          style={{ marginTop: 0 }}
        >
          Logout
        </button>
      </header>

      <div className="dashboard-layout">

        {/* SIDEBAR: Academic History */}
        <aside className="cyber-sidebar">
          <h3 className="sidebar-title">Academic History</h3>
          {enrollments.map((enr, i) => {
            const isSelected = selectedTermIndex === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedTermIndex(i)}
                className={`sidebar-item ${isSelected ? 'selected' : ''}`}
              >
                <div className="sidebar-item-year">{getYearStr(enr)}</div>
                <div className="sidebar-item-term">{getSemStr(enr)}</div>
              </div>
            );
          })}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="main-content">

          {/* Main Table Card */}
          <div className="table-container">

            {/* Table Header Area with Stats */}
            <div className="dash-stats-row">
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>{getYearStr(activeEnrollment)}</h2>
                <span className="font-mono text-muted">{getSemStr(activeEnrollment)}</span>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="stat-box">
                  GWA: {calculateGWA()}
                </div>
                <div className="stat-box">
                  Units: {calculateTotalUnits()}
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>CODE</th>
                    <th>SUBJECT</th>
                    <th style={{ textAlign: 'center' }}>UNITS</th>
                    <th style={{ textAlign: 'center' }}>MIDTERM</th>
                    <th style={{ textAlign: 'center' }}>FINAL</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, i) => {
                    const midtermGrade = c.gradeDetails?.[0]?.grade;
                    const finalGrade = c.gradeDetailFinal?.grade;

                    let statusBadge = <span className="badge-pending">-</span>;
                    if (finalGrade) {
                      const numericGrade = parseFloat(finalGrade);
                      if (numericGrade >= 3.0) {
                        statusBadge = <span className="badge-pass">PASSED</span>;
                      } else {
                        statusBadge = <span className="badge-fail">FAILED</span>;
                      }
                    }

                    return (
                      <tr key={i}>
                        <td className="col-code">{c.courseCode || c.subjectCode}</td>
                        <td className="col-title">{c.courseTitle || c.subjectTitle}</td>
                        <td className="col-units">{c.units}</td>

                        <td className="col-grade" style={{ textAlign: 'center', color: 'var(--text-main)', fontWeight: '500' }}>
                          {midtermGrade || <span style={{ color: 'var(--border-color)' }}>-</span>}
                        </td>

                        <td className="col-grade" style={{ textAlign: 'center' }}>
                          {finalGrade ? <span className="grade-val">{finalGrade}</span> : <span style={{ color: 'var(--border-color)' }}>-</span>}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;