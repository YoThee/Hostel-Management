import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, updateBooking } from '../api/bookings';

function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await getBookings(); // automatically only student's own because of backend logic
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await updateBooking(bookingId, { status: 'cancelled' });
      setMessage('Booking cancelled');
      fetchBookings(); // refresh
    } catch (err) {
      setMessage(err.response?.data?.error || 'Cancellation failed');
    }
  };

  if (loading) return <p>Loading bookings...</p>;

  return (
    <div>
      <h3>My Bookings</h3>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {bookings.length === 0 ? (
        <p>No bookings yet. <Link to="/hostels">Browse hostels</Link></p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hostel</th>
              <th>Room</th>
              <th>Check‑in</th>
              <th>Check‑out</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.hostel_name}</td>
                <td>{b.room_number}</td>
                <td>{b.check_in}</td>
                <td>{b.check_out}</td>
                <td>{b.status}</td>
                <td>
                  {b.status === 'confirmed' && (
                    <button onClick={() => handleCancel(b.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentBookings;