import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHostels } from '../api/hostels';

function StudentHostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const res = await getHostels();
        setHostels(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHostels();
  }, []);

  if (loading) return <p>Loading hostels...</p>;

  return (
    <div>
      <h3>Available Hostels</h3>
      {hostels.length === 0 ? (
        <p>No hostels available.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {hostels.map((hostel) => (
            <div key={hostel.id} style={{ border: '1px solid #ccc', padding: '10px', width: '200px' }}>
              {hostel.image_url && <img src={hostel.image_url} alt={hostel.name} style={{ width: '100%' }} />}
              <h4>{hostel.name}</h4>
              <p>{hostel.description}</p>
              <p>{hostel.address}</p>
              <Link to={`/hostels/${hostel.id}/rooms`}>
                <button>View Rooms</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentHostels;