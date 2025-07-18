import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Room({ user }) {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/editor/${roomId}`);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    navigate(`/editor/${newRoomId}`);
  };

  const handleLogout = () => {
    // Clear local storage first
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Force a hard navigation to ensure complete cleanup
    window.location.href = '/login';
    
    // Alternatively, if you want to use navigate():
    // navigate('/login', { replace: true });
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h2>Welcome, {user.name}</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      <div className="room-actions">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Join Room</button>
        <p>or</p>
        <button onClick={handleCreateRoom}>Create New Room</button>
      </div>
    </div>
  );
}