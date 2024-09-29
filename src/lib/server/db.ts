import Database from "better-sqlite3";
import type { ExtendedGlobal } from "../../app";

export const GlobalThisDB = Symbol.for('sveltekit.db');

export const initDB = async () => {
  console.log('[db:kit] setup');

  try {    
    const db = new Database('db.sqlite');
  
    // We can create a basic table in the db
    const query = "CREATE TABLE IF NOT EXISTS obs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, ip TEXT, port INT, password TEXT, online BOOLEAN DEFAULT false, recording BOOLEAN DEFAULT false)"
    db.exec(query);
  
    (globalThis as ExtendedGlobal)[GlobalThisDB] = db;
  } catch (error) {
    console.error(error)
  }
}