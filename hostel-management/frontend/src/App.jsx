import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentHostels from './components/StudentHostels';
import StudentRooms from './components/StudentRooms';
import StudentBookings from './components/StudentBookings';
import AdminRooms from './components/AdminRooms';

function App() {
  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link> | <Link to="/register">Register</Link> | <Link to="/dashboard">Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h2>Welcome to Hostel Management</h2>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Student routes */}
        <Route path="/hostels" element={<StudentHostels />} />
        <Route path="/hostels/:hostelId/rooms" element={<StudentRooms />} />
        <Route path="/bookings" element={<StudentBookings />} />
        {/* Admin routes */}
        <Route path="/admin/hostels/:hostelId/rooms" element={<AdminRooms />} />
      </Routes>
    </div>
  );
}

export default App;