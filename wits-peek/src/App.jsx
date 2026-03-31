import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState(''); 
  const [password, setPassword] = useState('');
  const [courses, setCourses] = useState([]);
  
  // New state to hold the actual student name from the server
  const [userName, setUserName] = useState('');

  // 1. Handle the Live Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step A: Login to get the Token, internal ID, and User Info
      const loginRes = await axios.post('/api/login', { 
        username: studentId, 
        password: password 
      });

      // Extracting the token, internal studentId, and the userInfo object
      const { token, studentId: internalId, userInfo } = loginRes.data;

      // Set the name dynamically from the login response
      if (userInfo && userInfo.fullName) {
        setUserName(userInfo.fullName);
      }

      // Step B: Fetch real-time grades using that token
      const gradesRes = await axios.get('/api/grades', { 
        params: { studentId: internalId, token } 
      });

      const enrolledDetails = gradesRes.data.items.studentEnrollments[0].enrolledCourseGradeDetails;
      
      setCourses(enrolledDetails);
      setIsLoggedIn(true);
    } catch (err) {
      alert("Login Failed: Please check your ID and Password.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Calculate GWA dynamically from live data
  const calculateGWA = () => {
    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach(c => {
      const grade = parseFloat(c.gradeDetailFinal?.grade || c.gradeDetails?.[0]?.grade);
      const units = parseFloat(c.units);

      if (!isNaN(grade) && !isNaN(units)) {
        totalPoints += (grade * units);
        totalUnits += units;
      }
    });

    return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "0.00";
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.logoCircle}>W</div>
          <h1 style={styles.brandTitle}>WITS-PEEK</h1>
          <p style={styles.brandSubtitle}>Student Portal Sync</p>

          <form onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>STUDENT ID</label>
              <input 
                type="text" 
                placeholder="XX-XXXX-XXX" 
                style={styles.input} 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                style={styles.input} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "SYNCING..." : "ENTER DASHBOARD"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Teknoy Dashboard</h2>
          {/* Displaying the dynamic name here */}
          <small style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {userName || "WELCOME TEKNOY"}
          </small>
        </div>
        <div style={styles.gwaBox}>
          <small>GWA</small>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{calculateGWA()}</div>
        </div>
      </header>

      <div style={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>CODE</th>
                <th style={styles.th}>SUBJECT</th>
                <th style={styles.th}>UNITS</th>
                <th style={styles.th}>GRADE</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={i} style={styles.row}>
                  <td style={{ fontWeight: 'bold', color: '#8a353c', padding: '15px' }}>{c.courseCode}</td>
                  <td style={{ padding: '15px' }}>{c.courseTitle}</td>
                  <td style={{ textAlign: 'center', padding: '15px' }}>{c.units}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '15px' }}>
                    {c.gradeDetailFinal?.grade || c.gradeDetails?.[0]?.grade || (
                      <span style={{ color: '#888', fontSize: '12px' }}>PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{ background: 'none', border: 'none', color: '#8a353c', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  loginPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', fontFamily: 'sans-serif' },
  loginCard: { backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '20px', width: '90%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  logoCircle: { width: '50px', height: '50px', backgroundColor: '#8a353c', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
  brandTitle: { color: 'white', margin: 0, fontSize: '24px', letterSpacing: '1px' },
  brandSubtitle: { color: '#666', fontSize: '13px', marginBottom: '30px' },
  inputGroup: { textAlign: 'left', marginBottom: '15px' },
  label: { color: '#8a353c', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#2d2d2d', color: 'white', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '14px', backgroundColor: '#8a353c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  dashboard: { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#8a353c', color: 'white', padding: '20px 30px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  gwaBox: { textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '20px' },
  tableCard: { backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#222', color: 'white' },
  th: { padding: '15px', textAlign: 'left', fontSize: '12px' },
  row: { borderBottom: '1px solid #eee' }
};

export default App;