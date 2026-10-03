const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "nss_express",
    multipleStatements: true,
  });

  const migrationsDir = path.join(__dirname, "../database/migrations");

  try {
    const files = fs.readdirSync(migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

    if (sqlFiles.length === 0) {
      console.log("Tidak ada file migrasi yang ditemukan.");
      await connection.end();
      return;
    }

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Menjalankan migrasi: ${file}...`);
      await connection.query(sql);
      console.log(`Berhasil: ${file}`);
    }

    console.log("Semua migrasi database berhasil dijalankan!");
  } catch (error) {
    console.error("Gagal menjalankan migrasi:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
