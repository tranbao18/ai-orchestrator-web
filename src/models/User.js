import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên là bắt buộc'],
        trim: true,
        minlength: [2, 'Tên phải có ít nhất 2 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        // Không required vì OAuth user không có password
        select: false // Không trả về password khi query
    },
    avatar: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        enum: ['credentials', 'google', 'github'],
        default: 'credentials'
    },
    role: {
        type: String,
        enum: ['admin', 'premium', 'free'],
        default: 'free'
    },
    subscription: {
        plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
        stripeCustomerId: { type: String, default: null },
        expiresAt: { type: Date, default: null }
    },
    usage: {
        messagesUsedToday: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index cho truy vấn nhanh theo email
UserSchema.index({ email: 1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
