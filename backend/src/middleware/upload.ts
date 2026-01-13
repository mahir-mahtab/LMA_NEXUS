import multer, { FileFilterCallback } from 'multer';
import { Request, RequestHandler } from 'express';

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

/**
 * File filter for PDF and DOCX files
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    return;
  }

  // Check file extension
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    callback(new Error('Invalid file extension. Only .pdf and .docx files are allowed.'));
    return;
  }

  callback(null, true);
};

/**
 * Multer configuration for file uploads
 * Uses memory storage for processing files in-memory
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Single file upload middleware for document field
 */
export const uploadDocument: RequestHandler = upload.single('document');

/**
 * Error messages for file upload
 */
export const UPLOAD_ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the 10MB limit',
  INVALID_TYPE: 'Invalid file type. Only PDF and DOCX files are allowed',
  NO_FILE: 'No file uploaded',
} as const;
