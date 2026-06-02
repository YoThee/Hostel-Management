import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHostels, createHostel, updateHostel, deleteHostel } from '../api/hostels';
import api from '../api/axios';

function AdminHostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const fetchHostels = async () => {
    try {
      const res = await getHostels();
      setHostels(res.data);
    } catch (err) {
      setError('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', address: '', image_url: '' });
    setEditingHostel(null);
    setShowForm(false);
    setImagePreview('');
    setUploading(false);
  };

  const startEdit = (hostel) => {
    setFormData({
      name: hostel.name,
      description: hostel.description,
      address: hostel.address,
      image_url: hostel.image_url
    });
    setEditingHostel(hostel);
    setShowForm(true);
    setImagePreview(hostel.image_url);   // show current image
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = res.data.imageUrl;
      setFormData({ ...formData, image_url: imageUrl });
      setImagePreview(imageUrl);   // ✅ correct variable
      setUploading(false);
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHostel) {
        await updateHostel(editingHostel.id, formData);
      } else {
        await createHostel(formData);
      }
      resetForm();
      fetchHostels();
    } catch (err) {
      setError('Operation failed');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hostel?')) return;
    try {
      await deleteHostel(id);
      fetchHostels();
    } catch (err) {
      setError('Delete failed');
    }
  };

  if (loading) return <p>Loading hostels...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Manage Hostels</h3>
        <button onClick={() => {
          if (showForm) {
            resetForm();
          } else {
            setFormData({ name: '', description: '', address: '', image_url: '' });
            setEditingHostel(null);
            setShowForm(true);
            setImagePreview('');
            setUploading(false);
          }
        }}>
          {showForm ? 'Cancel' : 'Add Hostel'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px' }}>
          <h4>{editingHostel ? 'Edit Hostel' : 'New Hostel'}</h4>
          <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} />

          {/* ---- File upload ---- */}
          <div style={{ margin: '10px 0' }}>
            <label>Hostel Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <span> Uploading...</span>}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: '100px', display: 'block', marginTop: '5px' }}
              />
            )}
            {/* hidden field to keep formData.image_url */}
            <input type="hidden" name="image_url" value={formData.image_url} />
          </div>

          <button type="submit">{editingHostel ? 'Update' : 'Create'}</button>
          <button type="button" onClick={resetForm}>Cancel</button>
        </form>
      )}

      {hostels.length === 0 ? (
        <p>No hostels found. Add one!</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '20px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Address</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hostels.map((hostel) => (
              <tr key={hostel.id}>
                <td>{hostel.id}</td>
                <td>{hostel.name}</td>
                <td>{hostel.address}</td>
                <td>{hostel.image_url ? <img src={hostel.image_url} alt="" width="50" /> : 'No image'}</td>
                <td>
                  <button onClick={() => startEdit(hostel)}>Edit</button>
                  <Link to={`/admin/hostels/${hostel.id}/rooms`}>
                    <button style={{ marginLeft: '5px' }}>Rooms</button>
                  </Link>
                  <button onClick={() => handleDelete(hostel.id)} style={{ marginLeft: '5px', color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminHostels;