import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TextEditor from './TextEditor';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Room from './components/Room';
import './styles.css';

function App() {
  // Safely get user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error('Invalid JSON in localStorage:', err);
      return null;
    }
  });

  // Optional: resync from localStorage on change
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (!user && savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Invalid JSON on sync:', err);
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/room" : "/login"} replace />} />
        
        <Route path="/login" element={
          user ? <Navigate to="/room" replace /> : <Login setUser={setUser} />
        } />
        
        <Route path="/register" element={
          user ? <Navigate to="/room" replace /> : <Register setUser={setUser} />
        } />
        
        <Route path="/room" element={
          user ? <Room user={user} /> : <Navigate to="/login" replace />
        } />
        
        <Route path="/editor/:id" element={
          user ? <TextEditor /> : <Navigate to="/login" replace />
        } />
        
        <Route path="*" element={<Navigate to={user ? "/room" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
