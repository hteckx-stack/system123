"use client"

import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { serverTimestamp } from 'firebase/firestore';
import type { MessageAttachment } from '@/lib/types';

export async function uploadFileToStorage(
  storage: FirebaseStorage,
  file: File,
  conversationId: string,
  senderId: string
): Promise<MessageAttachment> {
  try {
    // Create a unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `chat_attachments/${conversationId}/${fileName}`;

    // Upload file to Firebase Storage
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create attachment object
    const attachment: MessageAttachment = {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileUrl: downloadURL,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      uploadedAt: serverTimestamp() as any, // Will be converted to Timestamp by Firestore
    };

    return attachment;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📎';
}