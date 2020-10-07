import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
    from: String,
    to: String,
    message: String,
    date:  { type: Date, default: Date.now },
});
export default mongoose.model('chat', alertSchema)