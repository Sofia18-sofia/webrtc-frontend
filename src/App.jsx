import React, { useState } from 'react';
import VideoRoom from './VideoRoom';

const generateRoomId = () => Math.random().toString(36).substr(2, 9);

const App = () => {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [validRooms, setValidRooms] = useState([]);
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setJustCreated(true);
    setValidRooms((prev) => [...prev, newRoomId]);
    setError('');
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID.');
      return;
    }

    if (!validRooms.includes(roomId)) {
      setError('Invalid room ID. Please create or enter a valid one.');
      return;
    }

    setJoined(true);
    setError('');
  };

  return (
    <div className="container">
      {!joined ? (
        <div className="join-form">
          <h2>WebRTC Video Chat</h2>

          <button onClick={handleCreateRoom}>Create Room</button>

          {justCreated && (
            <div style={{ marginTop: '10px' }}>
              <p>Room created! Share this ID:</p>
              <strong>{roomId}</strong>
              <br />
              <button style={{ marginTop: '5px' }} onClick={handleJoinRoom}>
                Join Created Room
              </button>
            </div>
          )}

          <div style={{ margin: '1rem 0' }}>OR</div>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>

          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      ) : (
        <VideoRoom roomId={roomId} />
      )}
    </div>
  );
};

export default App;
