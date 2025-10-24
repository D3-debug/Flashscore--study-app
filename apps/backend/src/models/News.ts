import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
  id: number;
  title: string;
  content?: string;
  fullContent: string;
  preview: string;
  author: string;
  tags: string[];
  imageUrl?: string;
  viewCount: number;
  isActive: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema: Schema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    content: { type: String },
    fullContent: { type: String, required: true },
    preview: { type: String, required: true, trim: true },
    author: { type: String, required: true, default: "Admin" },
    tags: { type: [String], default: [] },
    imageUrl: { type: String },
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

NewsSchema.index({ tags: 1 });
NewsSchema.index({ author: 1 });
NewsSchema.index({ publishedAt: -1 });
NewsSchema.index({ isActive: 1 });
NewsSchema.index({ title: "text", fullContent: "text" });

export const News = mongoose.models.News || mongoose.model<INews>("News", NewsSchema);