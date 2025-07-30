import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';

// Register quill-cursors if you want cursors later (optional)
// import QuillCursors from 'quill-cursors';
// Quill.register('modules/cursors', QuillCursors);

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
  ['image', 'video'],           // <-- Added image/video for embeds
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

  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get('mode');
  const readOnly = modeParam === 'readonly';

  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMode, setShareMode] = useState('write');
  const [userCanShare] = useState(true);

  useEffect(() => {
    // Custom image handler for inserting images by URL
    const ImageHandler = function () {
      const url = prompt('Please enter the image URL:');
      if (url) {
        const range = this.quill.getSelection();
        this.quill.insertEmbed(range ? range.index : 0, 'image', url, 'user');
      }
    };

    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            image: ImageHandler,
          },
        },
      },
      readOnly,
    });

    if (readOnly) quill.disable();
    else quill.enable();

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    const socket = io('http://localhost:9000');
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
    if (readOnly) return;

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

  const openShareDialog = () => {
    if (!userCanShare) {
      alert('You do not have permission to share this document.');
      return;
    }
    setShareDialogOpen(true);
    setShareMode(readOnly ? 'readonly' : 'write');
  };

  const copyShareLink = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/docs/${id}?mode=${shareMode}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopySuccess(`Copied ${shareMode === 'readonly' ? 'Read-Only' : 'Editable'} link to clipboard!`);
        setShareDialogOpen(false);
      })
      .catch(() => {
        setCopySuccess('Failed to copy link');
        setShareDialogOpen(false);
      });
  };

  const handleCloseSnackbar = () => {
    setCopySuccess('');
  };

  const handleNewDocument = () => {
    const newDocId = crypto.randomUUID();
    navigate(`/docs/${newDocId}?mode=write`);
  };

  return (
    <>
      <div style={styles.pageContainer}>
        <header style={styles.header}>
          <div style={styles.titleGroup}>
            <h1 style={styles.title}>
              Collaborative Document Editor {readOnly && (<span style={styles.readOnlyTag}>(Read Only)</span>)}
            </h1>
          </div>
          <div style={styles.actionGroup}>
            <Button
              variant="contained"
              color="primary"
              onClick={openShareDialog}
              disabled={loading || readOnly}
              style={readOnly ? styles.disabledButton : {}}
            >
              Share Link
            </Button>
            <Button
              variant="outlined"
              onClick={handleNewDocument}
              style={{ marginLeft: 12 }}
            >
              New Document
            </Button>
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

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, py: 2, px: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Share Document Link</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="share-mode-label">Permission</InputLabel>
            <Select
              labelId="share-mode-label"
              value={shareMode}
              label="Permission"
              onChange={(e) => setShareMode(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="write">Allow Edit</MenuItem>
              <MenuItem value="readonly">Read Only</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            The generated link will allow users to {shareMode === 'readonly' ? 'view only' : 'edit'} this document. You can copy and share this link.
          </Typography>
          <div style={{ whiteSpace: 'nowrap', overflowX: 'auto', background: '#f8f8fa', borderRadius: 6, fontSize: '0.95rem', padding: 7, margin: '8px 0 0 0', border: '1px solid #eee' }}>
            {`${window.location.origin}/docs/${id}?mode=${shareMode}`}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)} variant="text" color="primary">Cancel</Button>
          <Button variant="contained" onClick={copyShareLink}>Copy Link</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!copySuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={copySuccess.includes('Failed') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {copySuccess}
        </Alert>
      </Snackbar>
    </>
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
    margin: '0 auto 24px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#0f3057',
    fontWeight: 700,
    lineHeight: 1.2,
    wordBreak: 'break-word',
  },
  readOnlyTag: {
    color: '#b89d13',
    fontSize: '1rem',
    marginLeft: 8,
    fontWeight: 500,
    letterSpacing: 1,
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  disabledButton: {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
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
    inset: 0,
    zIndex: 15,
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

