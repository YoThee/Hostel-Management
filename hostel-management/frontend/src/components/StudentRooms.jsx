import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRooms } from '../api/rooms';
import { createBooking } from '../api/bookings';

function StudentRooms() {
  const { hostelId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await getRooms(hostelId);
        setRooms(res.data);
      } catch (err) {
        setError('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [hostelId]);

  const handleBook = async (roomId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Simple booking: today for 7 days (for demo)
    const checkIn = new Date().toISOString().split('T')[0];
    const checkOut = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    try {
      await createBooking({ room_id: roomId, check_in: checkIn, check_out: checkOut });
      setMessage('Booking successful!');
      // Refresh the room list to show updated occupied count
      const res = await getRooms(hostelId);
      setRooms(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  if (loading) return <p>Loading rooms...</p>;

  return (
    <div>
      <Link to="/hostels">← Back to Hostels</Link>
      <h3>Rooms in Hostel #{hostelId}</h3>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {rooms.length === 0 ? (
        <p>No rooms available.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Room No.</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.room_number}</td>
                <td>{room.capacity}</td>
                <td>{room.occupied}</td>
                <td>{room.price}</td>
                <td>{room.occupied >= room.capacity ? 'Full' : `${room.capacity - room.occupied} available`}</td>
                <td>
                  <button
                    onClick={() => handleBook(room.id)}
                    disabled={room.occupied >= room.capacity}
                  >
                    Book
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentRooms;