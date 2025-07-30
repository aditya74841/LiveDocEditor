// import Document from '../models/document.js';

// export async function getDocument(id) {
//   if (!id) throw new Error('Document ID required');
//   const existing = await Document.findById(id).lean();
//   if (existing) return existing;
//   return await Document.create({ _id: id, data: {} });
// }

// export async function updateDocument(id, data) {
//   if (!id) throw new Error('Document ID required');
//   await Document.findByIdAndUpdate(id, { data }, { upsert: true });
// }


import Document from '../models/document.js';

/**
 * Retrieve the document by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object>} - Document object
 * @throws {Error} If ID is not provided or DB errors occur
 */
export async function getDocument(id) {
  if (!id) throw new Error('Document ID required');
  const existing = await Document.findById(id).lean();
  if (existing) return existing;

  // Create new empty document if not exists
  return await Document.create({ _id: id, data: {}, lastEditors: [], version: 0 });
}

/**
 * Update document data with optimistic concurrency and track editors
 * @param {string} id - Document ID
 * @param {Object} data - Document content to update
 * @param {string} [userId] - Optional User ID to track editor
 * @param {number} [version] - Optional current version for concurrency check
 * @returns {Promise<Object>} - Updated document
 * @throws {Error} On concurrency conflict or missing parameters
 */
export async function updateDocument(id, data, userId = null, version = null) {
  if (!id) throw new Error('Document ID required');
  if (typeof data !== 'object') throw new Error('Invalid data');

  // Prepare update payload
  const update = {
    data,
  };

  // If userId given, update the lastEditors array (push if not present, keep max 10 editors)
  if (userId) {
    update.$addToSet = { lastEditors: userId }; // addToSet prevents duplicates
  }

  // Options for findOneAndUpdate
  const options = {
    new: true,       // return updated doc
    upsert: false,   // don't create if missing, expect should exist
    runValidators: true,
  };

  // If version provided, use optimistic concurrency control
  // by using the version key (__v by default, here configured as 'version')
  if (typeof version === 'number') {
    // Mongoose's version key is incremented automatically on save,
    // to implement concurrency control we include the version in the filter
    const filter = { _id: id, version };

    // Construct the update query
    // Also increment version manually (Mongoose normally does it internally in save, 
    // but with findOneAndUpdate we do manually)
    update.$inc = { version: 1 };

    const updatedDoc = await Document.findOneAndUpdate(filter, update, options).lean();

    if (!updatedDoc) {
      // version mismatch: document was updated elsewhere
      throw new Error('Conflict: Document was modified by another process');
    }

    // If userId provided, make sure lastEditors length is limited (max 10)
    if (userId) {
      await Document.updateOne(
        { _id: id },
        { $slice: { lastEditors: -10 } } // keep only last 10 editors
      );
    }

    return updatedDoc;
  } else {
    // No version control — just update blindly

    const updatedDoc = await Document.findByIdAndUpdate(id, update, { ...options, upsert: true }).lean();

    return updatedDoc;
  }
}
