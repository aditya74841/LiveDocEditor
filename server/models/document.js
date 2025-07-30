// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// const documentSchema = new Schema(
//   {
//     _id: { type: String, required: true },
//     data: { type: Schema.Types.Mixed, default: {} }
//   },
//   { timestamps: true }
// );

// export default model('Document', documentSchema);


import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const documentSchema = new Schema(
  {
    _id: { 
      type: String, 
      required: true,
      index: true,          // index _id field for faster queries (usually auto indexed, but explicit is fine)
      unique: true,         // ensure _id uniqueness
    },
    data: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    // Optional: Track which users last edited the document (array of userIds)
    lastEditors: {
      type: [String],
      default: [],
      index: true           // Index if you want to query/filter documents by editors
    },
    // Optional: Version number for optimistic concurrency control
    version: {
      type: Number,
      default: 0,
      index: false          // unindexed; incremented on each save if needed
    }
  },
  { 
    timestamps: true,       // adds createdAt and updatedAt fields
    optimisticConcurrency: true, // use built-in concurrency control (added in mongoose 5.7+)
    versionKey: 'version'   // store version in `version` field (instead of __v)
  }
);

// Compound index example: query documents a particular user edited, sorted by updatedAt descending
documentSchema.index({ lastEditors: 1, updatedAt: -1 });

// TTL index example: auto-remove documents after 30 days (optional, uncomment if desired)
// documentSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default model('Document', documentSchema);
