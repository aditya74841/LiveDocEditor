import { getDocument, updateDocument } from '../controllers/documentController.js';
import logger from '../utils/logger.js';

export function registerDocumentHandlers(io, socket) {
  // Socket is already authenticated at this point (via middleware)

  socket.on('get-document', async (docId) => {
    try {
      const doc = await getDocument(docId);
      socket.join(docId);
      socket.emit('load-document', doc.data);

      socket.on('send-changes', (delta) => {
        socket.to(docId).emit('receive-changes', delta);
      });

      socket.on('save-document', async (data) => {
        await updateDocument(docId, data);
      });

    } catch (err) {
      logger.error('Document handler error:', err);
      socket.emit('error', 'Failed to load or save document');
    }
  });
}
