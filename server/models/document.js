const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: [true, 'Document ID is required'],
    trim: true,
    minlength: [1, 'Document ID cannot be empty']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Document content is required'],
    default: { ops: [{ insert: '\n' }] },
    validate: {
      validator: function(v) {
        // Basic Quill delta validation
        return v && 
               typeof v === 'object' && 
               Array.isArray(v.ops) && 
               v.ops.length > 0;
      },
      message: props => `Invalid Quill delta format: ${JSON.stringify(props.value)}`
    }
  },
  lastSaved: {
    type: Date,
    required: [true, 'Last saved timestamp is required'],
    default: Date.now,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: props => `${props.value} is not a valid date!`
    }
  }
}, {
  timestamps: true,
  minimize: false,
  autoIndex: process.env.NODE_ENV !== 'production' // Auto-create indexes in dev
});

// Compound index for frequently used queries
documentSchema.index({ 
  lastSaved: -1,
  updatedAt: -1 
});

// Text index if you need to search document content
documentSchema.index({
  'data.ops.insert': 'text'
}, {
  weights: {
    'data.ops.insert': 1
  },
  name: 'document_content_text_index'
});

module.exports = mongoose.model('Document', documentSchema);