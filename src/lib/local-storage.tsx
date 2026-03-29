'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Local storage types
export interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  createdAt: Date;
}

export interface LocalStorage {
  // Auth methods
  signIn: (email: string, password: string) => Promise<LocalUser>;
  signUp: (email: string, password: string, displayName: string, role: 'admin' | 'staff') => Promise<LocalUser>;
  signOut: () => Promise<void>;
  getCurrentUser: () => LocalUser | null;

  // Data methods
  getCollection: <T>(collectionName: string) => Promise<T[]>;
  addDocument: <T>(collectionName: string, data: Omit<T, 'id'>) => Promise<string>;
  updateDocument: <T>(collectionName: string, id: string, data: Partial<T>) => Promise<void>;
  deleteDocument: (collectionName: string, id: string) => Promise<void>;
  getDocument: <T>(collectionName: string, id: string) => Promise<T | null>;

  // File storage methods
  uploadFile: (file: File, path: string) => Promise<string>;
  downloadFile: (path: string) => Promise<Blob>;
  deleteFile: (path: string) => Promise<void>;
}

class LocalStorageImpl implements LocalStorage {
  private data: Record<string, any[]> = {};
  private files: Record<string, File> = {};
  private currentUser: LocalUser | null = null;

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultData();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    // Load data from localStorage
    const data = localStorage.getItem('localStorage_data');
    if (data) {
      this.data = JSON.parse(data);
    }

    // Load current user
    const user = localStorage.getItem('localStorage_currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }

    // Load files (simplified - in real implementation, you'd use IndexedDB)
    const files = localStorage.getItem('localStorage_files');
    if (files) {
      // Note: This is simplified. Real file storage would use IndexedDB
      this.files = JSON.parse(files);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    localStorage.setItem('localStorage_data', JSON.stringify(this.data));
    if (this.currentUser) {
      localStorage.setItem('localStorage_currentUser', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('localStorage_currentUser');
    }
    localStorage.setItem('localStorage_files', JSON.stringify(this.files));
  }

  private async initializeDefaultData() {
    if (typeof window === 'undefined') return;

    // Create default admin user if no users exist
    const users = await this.getCollection<any>('users');
    if (users.length === 0) {
      await this.addDocument('users', {
        id: 'admin-1',
        email: 'admin@bluelink.com',
        displayName: 'Administrator',
        role: 'admin',
        name: 'Administrator',
        phone: '',
        nrc: '',
        position: 'Administrator',
        department: 'Administration',
        status: 'active',
        approved: true,
        password: 'password123' // In a real app, this would be hashed
      });
    }
  }

  // Auth methods
  async signIn(email: string, password: string): Promise<LocalUser> {
    const users = await this.getCollection<LocalUser & { password: string }>('users');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user;
    this.currentUser = userWithoutPassword;
    this.saveToStorage();
    return userWithoutPassword;
  }

  async signUp(email: string, password: string, displayName: string, role: 'admin' | 'staff'): Promise<LocalUser> {
    const users = await this.getCollection<LocalUser & { password: string }>('users');
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser: LocalUser & { password: string } = {
      id: Date.now().toString(),
      email,
      displayName,
      role,
      password,
      createdAt: new Date(),
    };

    await this.addDocument('users', newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    this.currentUser = userWithoutPassword;
    this.saveToStorage();
    return userWithoutPassword;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.saveToStorage();
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  // Data methods
  async getCollection<T>(collectionName: string): Promise<T[]> {
    return (this.data[collectionName] || []) as T[];
  }

  async addDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const document = { ...data, id } as T;
    this.data[collectionName].push(document);
    this.saveToStorage();
    return id;
  }

  async updateDocument<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    if (!this.data[collectionName]) return;

    const index = this.data[collectionName].findIndex((doc: any) => doc.id === id);
    if (index !== -1) {
      this.data[collectionName][index] = { ...this.data[collectionName][index], ...data };
      this.saveToStorage();
    }
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    if (!this.data[collectionName]) return;

    this.data[collectionName] = this.data[collectionName].filter((doc: any) => doc.id !== id);
    this.saveToStorage();
  }

  async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    if (!this.data[collectionName]) return null;

    return this.data[collectionName].find((doc: any) => doc.id === id) as T || null;
  }

  // File storage methods (simplified)
  async uploadFile(file: File, path: string): Promise<string> {
    this.files[path] = file;
    this.saveToStorage();
    return path;
  }

  async downloadFile(path: string): Promise<Blob> {
    if (!this.files[path]) {
      throw new Error('File not found');
    }
    return this.files[path];
  }

  async deleteFile(path: string): Promise<void> {
    delete this.files[path];
    this.saveToStorage();
  }
}

const localStorageInstance = new LocalStorageImpl();

const LocalStorageContext = createContext<LocalStorage>(localStorageInstance);

export function LocalStorageProvider({ children }: { children: ReactNode }) {
  return (
    <LocalStorageContext.Provider value={localStorageInstance}>
      {children}
    </LocalStorageContext.Provider>
  );
}

export function useLocalStorage() {
  return useContext(LocalStorageContext);
}

// Compatibility layer to mimic Firebase hooks
export function useLocalUser() {
  const storage = useLocalStorage();
  return {
    user: storage.getCurrentUser(),
    loading: false,
  };
}

export function useLocalCollection<T>(collectionName: string) {
  const storage = useLocalStorage();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getCollection<T>(collectionName).then(setData).finally(() => setLoading(false));
  }, [storage, collectionName]);

  return { data, loading };
}

export function useLocalDoc<T>(collectionName: string, id: string) {
  const storage = useLocalStorage();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      storage.getDocument<T>(collectionName, id).then(setData).finally(() => setLoading(false));
    } else {
      setData(null);
      setLoading(false);
    }
  }, [storage, collectionName, id]);

  return { data, loading };
}