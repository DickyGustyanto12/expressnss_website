import { pool } from "../lib/internal/db.js";
import fs from "fs";
import path from "path";

const runMigrations = async () => {
  const folderPath = path.join(process.cwd(), "database", "migrations");

  if (!fs.existsSync(folderPath)) {
    console.error(`Folder tidak ditemukan: ${folderPath}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/^(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  if (files.length === 0) {
    console.log("Tidak ada file .sql di folder migrations");
    process.exit(0);
  }

  console.log(`Ditemukan ${files.length} file migration:\n`);
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log("");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  try {
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Menjalankan: ${file}...`);

      try {
        await pool.query(sql);
        console.log(`✅ Berhasil: ${file}`);
        successCount++;
      } catch (error: any) {
        if (error.code === "ER_TABLE_EXISTS_ERROR" || error.errno === 1050) {
          console.log(`⏭️  Diskip: ${file} (Tabel sudah ada)`);
          skipCount++;
        } else if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
          console.log(`⏭️  Diskip: ${file} (Data/Index sudah ada)`);
          skipCount++;
        } else {
          console.error(`❌ Gagal: ${file}`);
          console.error(`   ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log("\n========================================");
    console.log("Ringkasan Migrasi:");
    console.log(`  ✅ Berhasil: ${successCount}`);
    console.log(`  ⏭️  Diskip:   ${skipCount}`);
    console.log(`  ❌ Gagal:    ${errorCount}`);
    console.log("========================================\n");

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error: any) {
    console.error("Error fatal:", error.message);
    process.exit(1);
  }
};

runMigrations();
