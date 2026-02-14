import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

async function main() {
    try {
        const db = drizzle({ 
            connection: { 
                connectionString: process.env.DATABASE_URL!,
                ssl: {
                    rejectUnauthorized: false
                }
            }
        });
        
        await migrate(db, {
            migrationsFolder: "./src/db/migrations",
        });
        console.log("Migration completed");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main(); 
