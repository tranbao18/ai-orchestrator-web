import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'Cuộc trò chuyện mới'
    },
    model: {
        type: String,
        enum: ['gemini', 'gpt', 'claude'],
        default: 'gemini'
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ConversationSchema.index({ userId: 1, updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);

export default Conversation;
