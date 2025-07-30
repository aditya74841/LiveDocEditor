import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// other code (toolbarOptions, SAVE_INTERVAL_MS) unchanged...

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ direction: 'rtl' }],
  [{ size: ['small', false, 'large', 'huge'] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ['clean'],
];

const SAVE_INTERVAL_MS = 2000;


const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const quillRef = useRef(null);
  const socketRef = useRef(null);
  const lastSavedContentRef = useRef(null);

  // Read "mode" query param: "write" (default) or "readonly"
  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get('mode');
  const readOnly = modeParam === 'readonly';

  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: { toolbar: readOnly ? false : toolbarOptions },
      readOnly,
    });

    if (readOnly) {
      quill.disable();
    } else {
      quill.enable();
    }

    quillRef.current = quill;
    return () => { quillRef.current = null; };
  }, [readOnly]);

  useEffect(() => {
    const socket = io('http://localhost:9000'); // Socket server URL hardcoded
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    const quill = quillRef.current;
    if (!socket || !quill) return;

    if (!readOnly) {
      const handleTextChange = (delta, oldDelta, source) => {
        if (source !== 'user') return;
        socket.emit('send-changes', delta);
      };
      quill.on('text-change', handleTextChange);
      return () => {
        quill.off('text-change', handleTextChange);
      };
    }
  }, [readOnly]);

  useEffect(() => {
    const socket = socketRef.current;
    const quill = quillRef.current;
    if (!socket || !quill) return;

    const handleReceiveChanges = (delta) => {
      quill.updateContents(delta);
    };
    socket.on('receive-changes', handleReceiveChanges);

    socket.once('load-document', (document) => {
      quill.setContents(document);
      if (!readOnly) quill.enable();
      lastSavedContentRef.current = quill.getContents();
      setLoading(false);
    });

    socket.emit('get-document', id);

    return () => {
      socket.off('receive-changes', handleReceiveChanges);
      socket.off('load-document');
    };
  }, [id, readOnly]);

  useEffect(() => {
    if (readOnly) return; // Turn off autosave if readonly

    const socket = socketRef.current;
    const quill = quillRef.current;
    if (!socket || !quill) return;

    const intervalId = setInterval(() => {
      const currentContent = quill.getContents();
      if (JSON.stringify(currentContent) !== JSON.stringify(lastSavedContentRef.current)) {
        socket.emit('save-document', currentContent);
        lastSavedContentRef.current = currentContent;
      }
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [readOnly]);

  // SHARE LINK BUTTON: ask for mode
  const handleShareLink = () => {
    const wantsReadOnly = window.confirm(
      'Would you like to share a Read-Only link? \n\nOK: Read-Only \nCancel: Editable'
    );

    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/docs/${id}?mode=${wantsReadOnly ? 'readonly' : 'write'}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess(`Copied ${wantsReadOnly ? 'Read-Only' : 'Editable'} link to clipboard!`);
        setTimeout(() => setCopySuccess(''), 4000);
      })
      .catch(() => {
        setCopySuccess('Failed to copy link');
        setTimeout(() => setCopySuccess(''), 4000);
      });
  };

  const handleNewDocument = () => {
    const newDocId = crypto.randomUUID();
    navigate(`/docs/${newDocId}`);
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f3057', fontWeight: '700' }}>
          Collaborative Document Editor {readOnly ? '(Read Only Mode)' : ''}
        </h1>
        <div style={styles.actionGroup}>
          <button style={styles.button} onClick={handleShareLink} disabled={loading}>
            Share Link
          </button>
          {copySuccess && <span style={styles.copySuccess}>{copySuccess}</span>}
          <button style={{ ...styles.button, marginLeft: 12 }} onClick={handleNewDocument}>
            New Document
          </button>
        </div>
      </header>

      <main style={styles.editorContainer}>
        {loading && (
          <div style={styles.loadingOverlay}>
            <div>Loading document…</div>
          </div>
        )}
        <div id="editor" style={styles.editor} />
      </main>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
    padding: 24,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    maxWidth: 960,
    width: '100%',
    margin: '0 auto 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  button: {
    cursor: 'pointer',
    padding: '10px 20px',
    backgroundColor: '#0f3057',
    border: 'none',
    borderRadius: 5,
    color: 'white',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
    userSelect: 'none',
    opacity: 1,
  },
  copySuccess: {
    color: '#ffdd57',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  editorContainer: {
    flexGrow: 1,
    maxWidth: 960,
    width: '100%',
    margin: '0 auto',
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '75vh',
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 15,
    inset: 0,
    backgroundColor: 'rgba(15,48,87,0.85)',
    color: '#fff',
    fontSize: '1.3rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  editor: {
    flex: 1,
    padding: 24,
    minHeight: 400,
    overflowY: 'auto',
    backgroundColor: 'white',
    borderRadius: '0 0 10px 10px',
  },
};

export default EditorPage;



// import React, { useEffect, useRef, useState } from 'react';
// import Quill from 'quill';
// import 'quill/dist/quill.snow.css';
// import { io } from 'socket.io-client';
// import { useParams, useNavigate } from 'react-router-dom';

// const toolbarOptions = [
//   ['bold', 'italic', 'underline', 'strike'],
//   ['blockquote', 'code-block'],
//   [{ header: 1 }, { header: 2 }],
//   [{ list: 'ordered' }, { list: 'bullet' }],
//   [{ script: 'sub' }, { script: 'super' }],
//   [{ indent: '-1' }, { indent: '+1' }],
//   [{ direction: 'rtl' }],
//   [{ size: ['small', false, 'large', 'huge'] }],
//   [{ header: [1, 2, 3, 4, 5, 6, false] }],
//   [{ color: [] }, { background: [] }],
//   [{ font: [] }],
//   [{ align: [] }],
//   ['clean'],
// ];

// const SAVE_INTERVAL_MS = 2000;

// const EditorPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const quillRef = useRef(null);
//   const socketRef = useRef(null);
//   const lastSavedContentRef = useRef(null);
//   const [loading, setLoading] = useState(true);
//   const [copySuccess, setCopySuccess] = useState('');

//   useEffect(() => {
//     const quill = new Quill('#editor', {
//       theme: 'snow',
//       modules: { toolbar: toolbarOptions },
//     });
//     quill.disable();
//     quill.setText('Loading document...');
//     quillRef.current = quill;
//     return () => { quillRef.current = null; };
//   }, []);

//   useEffect(() => {
//     const socket = io('http://localhost:9000'); // Hardcoded backend URL
//     socketRef.current = socket;
//     return () => {
//       socket.disconnect();
//       socketRef.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     const socket = socketRef.current;
//     const quill = quillRef.current;
//     if (!socket || !quill) return;

//     const handleTextChange = (delta, oldDelta, source) => {
//       if (source !== 'user') return;
//       socket.emit('send-changes', delta);
//     };

//     quill.on('text-change', handleTextChange);

//     const handleReceiveChanges = (delta) => {
//       quill.updateContents(delta);
//     };
//     socket.on('receive-changes', handleReceiveChanges);

//     socket.once('load-document', (document) => {
//       quill.setContents(document);
//       quill.enable();
//       lastSavedContentRef.current = quill.getContents();
//       setLoading(false);
//     });

//     socket.emit('get-document', id);

//     return () => {
//       quill.off('text-change', handleTextChange);
//       socket.off('receive-changes', handleReceiveChanges);
//       socket.off('load-document');
//     };
//   }, [id]);

//   useEffect(() => {
//     const socket = socketRef.current;
//     const quill = quillRef.current;
//     if (!socket || !quill) return;

//     const intervalId = setInterval(() => {
//       const currentContent = quill.getContents();
//       if (JSON.stringify(currentContent) !== JSON.stringify(lastSavedContentRef.current)) {
//         socket.emit('save-document', currentContent);
//         lastSavedContentRef.current = currentContent;
//       }
//     }, SAVE_INTERVAL_MS);

//     return () => clearInterval(intervalId);
//   }, []);

//   const handleCopyLink = () => {
//     const url = window.location.origin + `/docs/${id}`;
//     navigator.clipboard.writeText(url)
//       .then(() => {
//         setCopySuccess('Link copied!');
//         setTimeout(() => setCopySuccess(''), 3000);
//       })
//       .catch(() => setCopySuccess('Failed to copy'));
//   };

//   const handleNewDocument = () => {
//     const newDocId = crypto.randomUUID();
//     navigate(`/docs/${newDocId}`);
//   };

//   return (
//     <div style={styles.pageContainer}>
//       <header style={styles.header}>
//         <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f3057', fontWeight: '700' }}>
//           Collaborative Document Editor
//         </h1>
//         <div style={styles.actionGroup}>
//           <button style={styles.button} onClick={handleCopyLink}>
//             Share Link
//           </button>
//           {copySuccess && <span style={styles.copySuccess}>{copySuccess}</span>}
//           <button style={{ ...styles.button, marginLeft: 12 }} onClick={handleNewDocument}>
//             New Document
//           </button>
//         </div>
//       </header>

//       <main style={styles.editorContainer}>
//         {loading && (
//           <div style={styles.loadingOverlay}>
//             <div>Loading document…</div>
//           </div>
//         )}
//         <div id="editor" style={styles.editor} />
//       </main>
//     </div>
//   );
// };

// const styles = {
//   pageContainer: {
//     minHeight: '100vh',
//     background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
//     padding: 24,
//     boxSizing: 'border-box',
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   header: {
//     maxWidth: 960,
//     width: '100%',
//     margin: '0 auto 28px',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   actionGroup: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '16px',
//   },
//   button: {
//     cursor: 'pointer',
//     padding: '10px 20px',
//     backgroundColor: '#0f3057',
//     border: 'none',
//     borderRadius: 5,
//     color: 'white',
//     fontSize: '1rem',
//     transition: 'background-color 0.3s ease',
//     userSelect: 'none',
//   },
//   copySuccess: {
//     color: '#ffdd57',
//     fontWeight: '600',
//     fontSize: '0.9rem',
//   },
//   editorContainer: {
//     flexGrow: 1,
//     maxWidth: 960,
//     width: '100%',
//     margin: '0 auto',
//     backgroundColor: '#f0f4ff',
//     borderRadius: 10,
//     boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
//     position: 'relative',
//     display: 'flex',
//     flexDirection: 'column',
//     minHeight: '75vh',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     zIndex: 15,
//     inset: 0,
//     backgroundColor: 'rgba(15,48,87,0.85)',
//     color: '#fff',
//     fontSize: '1.3rem',
//     fontWeight: '600',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 10,
//   },
//   editor: {
//     flex: 1,
//     padding: 24,
//     minHeight: 400,
//     overflowY: 'auto',
//     backgroundColor: 'white',
//     borderRadius: '0 0 10px 10px',
//   },
// };

// export default EditorPage;


