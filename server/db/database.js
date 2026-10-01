import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toPlainObject } from '../utils/toPlainObject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db_fallback.json');

// In-memory fallback collection storage
class MemoryCollection {
  constructor(name, getStorage, saveStorage) {
    this.name = name;
    this.getStorage = getStorage;
    this.saveStorage = saveStorage;
  }

  _getItems() {
    const storage = this.getStorage();
    if (!storage[this.name]) storage[this.name] = [];
    return storage[this.name];
  }

  async find(filter = {}) {
    const items = this._getItems();
    return items.filter(item => {
      for (const [key, val] of Object.entries(filter)) {
        if (val && typeof val === 'object' && val.$in) {
          if (!val.$in.includes(item[key])) return false;
        } else if (item[key] !== val) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    const items = await this.find(filter);
    return items[0] || null;
  }

  async findById(id) {
    const items = this._getItems();
    return items.find(item => String(item._id) === String(id) || String(item.id) === String(id)) || null;
  }

  async create(data) {
    const items = this._getItems();
    const doc = {
      _id: data._id || 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(doc);
    this.saveStorage();
    return doc;
  }

  async insertMany(docs) {
    const created = [];
    for (const doc of docs) {
      created.push(await this.create(doc));
    }
    return created;
  }

  async findByIdAndUpdate(id, update = {}, options = {}) {
    const items = this._getItems();
    const idx = items.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (idx === -1) return null;

    const current = items[idx];
    const updated = {
      ...current,
      ...(update.$set || update),
      updatedAt: new Date().toISOString()
    };
    items[idx] = updated;
    this.saveStorage();
    return updated;
  }

  async updateOne(filter = {}, update = {}) {
    const item = await this.findOne(filter);
    if (!item) return { modifiedCount: 0 };
    return this.findByIdAndUpdate(item._id, update);
  }

  async deleteOne(filter = {}) {
    const items = this._getItems();
    const idx = items.findIndex(item => {
      for (const [key, val] of Object.entries(filter)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
    if (idx !== -1) {
      items.splice(idx, 1);
      this.saveStorage();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async countDocuments(filter = {}) {
    const items = await this.find(filter);
    return items.length;
  }
}

class FallbackDB {
  constructor() {
    this.data = {};
    this.collections = {};
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[DB] Fallback storage init error:', err.message);
      this.data = {};
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Error persisting fallback DB:', err.message);
    }
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new MemoryCollection(
        name,
        () => this.data,
        () => this.save()
      );
    }
    return this.collections[name];
  }
}

export const fallbackDb = new FallbackDB();
export let isMongooseConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduproctor';
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongooseConnected = true;
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.log(`[DB] Native MongoDB not available (${err.message}). Using resilient embedded fallback storage.`);
    isMongooseConnected = false;
    return false;
  }
}

/**
 * Universal model accessor that seamlessly supports both Mongoose and FallbackDB
 */
export function getModel(name, schema) {
  const collectionName = name.toLowerCase() + 's';
  const memoryCol = fallbackDb.collection(collectionName);

  let mongooseModel = null;
  if (schema) {
    try {
      mongooseModel = mongoose.models[name] || mongoose.model(name, schema);
    } catch (e) {
      // Ignored if mongoose fails
    }
  }

  return {
    find: async (filter = {}) => {
      if (isMongooseConnected && mongooseModel) {
        try { return await mongooseModel.find(filter).lean(); } catch (e) {}
      }
      return await memoryCol.find(filter);
    },
    findOne: async (filter = {}) => {
      if (isMongooseConnected && mongooseModel) {
        try { return await mongooseModel.findOne(filter).lean(); } catch (e) {}
      }
      return await memoryCol.findOne(filter);
    },
    findById: async (id) => {
      if (isMongooseConnected && mongooseModel) {
        try { return await mongooseModel.findById(id).lean(); } catch (e) {}
      }
      return await memoryCol.findById(id);
    },
    create: async (data) => {
      if (isMongooseConnected && mongooseModel) {
        try {
          const doc = await mongooseModel.create(data);
          return toPlainObject(doc);
        } catch (e) {}
      }
      return await memoryCol.create(data);
    },
    insertMany: async (docs) => {
      if (isMongooseConnected && mongooseModel) {
        try {
          const created = await mongooseModel.insertMany(docs);
          return created.map(d => d.toObject ? d.toObject() : d);
        } catch (e) {}
      }
      return await memoryCol.insertMany(docs);
    },
    findByIdAndUpdate: async (id, update, options = { new: true }) => {
      if (isMongooseConnected && mongooseModel) {
        try {
          return await mongooseModel.findByIdAndUpdate(id, update, { new: true }).lean();
        } catch (e) {}
      }
      return await memoryCol.findByIdAndUpdate(id, update, options);
    },
    updateOne: async (filter, update) => {
      if (isMongooseConnected && mongooseModel) {
        try { return await mongooseModel.updateOne(filter, update); } catch (e) {}
      }
      return await memoryCol.updateOne(filter, update);
    },
    deleteOne: async (filter) => {
      if (isMongooseConnected && mongooseModel) {
        try { return await mongooseModel.deleteOne(filter); } catch (e) {}
      }
      return await memoryCol.deleteOne(filter);
    },
    countDocuments: async (filter = {}) => {
      if (isMongooseConnected && mongooseModel) {
        try { return await mongooseModel.countDocuments(filter); } catch (e) {}
      }
      return await memoryCol.countDocuments(filter);
    }
  };
}
