const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

async function main() {
  const [email, nama, password, role = "admin"] = process.argv.slice(2);

  if (!email || !nama || !password) {
    console.error(
      'Pemakaian: node scripts/buat-admin.js <email> "<nama>" <password> [admin|customer_service]',
    );
    process.exit(1);
  }
  if (!["admin", "customer_service"].includes(role)) {
    console.error("Role harus 'admin' atau 'customer_service'.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "admin",
    database: process.env.DB_NAME || "nss_express",
  });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      `INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nama = VALUES(nama), password = VALUES(password), role = VALUES(role)`,
      [nama, email, hash, role],
    );
    console.log(
      result.affectedRows === 1
        ? `Akun ${email} (${role}) berhasil dibuat.`
        : `Akun ${email} sudah ada — nama, password & role diperbarui.`,
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Gagal membuat akun:", error.message);
  process.exit(1);
});
