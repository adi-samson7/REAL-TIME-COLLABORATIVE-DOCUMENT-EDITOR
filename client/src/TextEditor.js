import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import './texteditor.css';

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor() {
  const { id: roomId } = useParams(); // ✅ Alias 'id' to 'roomId'
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const s = io('http://localhost:3001', {
      query: { token },
    });

    s.on('users-in-room', (userList) => {
      setUsers(userList);
      setLoadingUsers(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
  if (socket == null || quill == null) return;

  // Load from REST API (e.g. when first opening the editor directly)
  const fetchDocumentFromAPI = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/documents/${roomId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      quill.setContents(response.data.content || { ops: [{ insert: '\n' }] });
    } catch (err) {
      console.error('Error loading document:', err);
    }
  };

  // Load from socket (real-time shared document)
  const handleSocketDocumentLoad = (document) => {
    quill.setContents(document || { ops: [{ insert: '\n' }] });
    quill.enable();
  };

  socket.emit('join-room', roomId);
  socket.once('document-loaded', handleSocketDocumentLoad);

  // Optionally call REST API first (fallback or initial load)
  fetchDocumentFromAPI();

  return () => {
    socket.off('document-loaded', handleSocketDocumentLoad);
  };
}, [socket, quill, roomId]);


  useEffect(() => {
  if (wrapperRef.current == null) return;

  const wrapper = wrapperRef.current; // ✅ Store in a variable
  wrapper.innerHTML = '';
  const editor = document.createElement('div');
  wrapper.append(editor);
  const q = new Quill(editor, {
    theme: 'snow',
    modules: { toolbar: TOOLBAR_OPTIONS },
  });
  q.disable();
  q.setText('Loading...');
  setQuill(q);

  return () => {
    wrapper.innerHTML = ''; // ✅ Use the cached ref
  };
}, []);


  useEffect(() => {
    if (quill == null || socket == null) return;

    quill.enable();
    quill.setText('');

    const interval = setInterval(() => {
      if (quill) {
        socket.emit('save-document', {
          roomId,
          content: quill.getContents(),
        });
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [quill, socket, roomId]);

  useEffect(() => {
    if (quill == null || socket == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };

    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (quill == null || socket == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [quill, socket]);

  const downloadDocument = useCallback(async () => {
  if (!quill) return;

  const content = quill.getContents();
  const { Paragraph, TextRun, ImageRun, Document, Packer } = docx;

  const children = [];

  for (const op of content.ops) {
    if (typeof op.insert === 'string') {
      const lines = op.insert.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isLastLine = i === lines.length - 1;
        if (line || !isLastLine) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: op.attributes?.bold,
                  italic: op.attributes?.italic,
                  underline: op.attributes?.underline,
                }),
              ],
            })
          );
        }
      }
    }

    // Handle image
    else if (op.insert?.image && op.insert.image.startsWith("data:image/")) {
      try {
        const response = await fetch(op.insert.image);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const imageRun = new ImageRun({
          data: uint8Array,
          transformation: {
            width: 400,
            height: 300,
          },
        });

        children.push(new Paragraph({ children: [imageRun] }));
      } catch (err) {
        console.error("Error decoding image:", err);
        children.push(new Paragraph({ text: "[Image could not be rendered]" }));
      }
    }
  }

  // Ensure document has at least one valid paragraph (Word can error on empty sections)
  if (children.length === 0) {
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Document-${roomId}.docx`);
}, [quill, roomId]);




  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', roomId);
    }
    navigate('/room');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (socket) {
      socket.emit('leave-room', roomId);
      socket.disconnect();
    }
    window.location.href = '/login';
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      alert(`Room ID "${roomId}" copied to clipboard!`);
    }
  };

  return (
    <div className="editor-container">
      <nav className="editor-navbar">
        <div className="navbar-left">
          <div className="room-id-box" onClick={copyRoomId} title="Click to copy Room ID">
            Room ID: <strong>{roomId || 'N/A'}</strong>
          </div>
        </div>

        <div className="navbar-center">
          <h2 className="navbar-title">Realtime DocEditor</h2>
        </div>

        <div className="navbar-right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleLeaveRoom} className="nav-btn leave-room-btn">
                Leave Room
              </button>
              <button onClick={handleLogout} className="nav-btn logout-btn">
                Logout
              </button>
            </div>
            <button onClick={downloadDocument} className="nav-btn download-btn">
              Download
            </button>
          </div>
        </div>


      </nav>
      <div className="editor-content">
        <div className="sidebar">
          <h3>Online Users ({users.length})</h3>
          <ul className="user-list">
            {loadingUsers ? (
              <li>Loading users...</li>
            ) : (
              users.map((user) => (
                <li key={user.id} className="user-item">
                  <span className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="user-name">{user.name || 'User'}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="quill-container" ref={wrapperRef}></div>
      </div>
    </div>
  );
}