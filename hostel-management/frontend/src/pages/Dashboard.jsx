import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminHostels from '../components/AdminHostels';  // we’ll create it next

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <p>Welcome, {user.full_name} ({user.role})</p>
      <hr />
      {user.role === 'admin' ? (
        <AdminHostels />
      ) : (
        <div>
          <h3>Student Dashboard</h3>
          <p>Welcome, {user.full_name}!</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/hostels"><button>Browse Hostels</button></Link>
            <Link to="/bookings"><button>My Bookings</button></Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;