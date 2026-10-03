const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "nss_express",
  });

  const hashedAdmin = await bcrypt.hash("adminExpress01#*", 10);
  const hashedCs1 = await bcrypt.hash("csExpress01#*", 10);
  const hashedCs2 = await bcrypt.hash("csExpress02#*", 10);

  await connection.execute("UPDATE users SET password = ? WHERE email = ?", [
    hashedAdmin,
    "adminexpressnss@gmail.com",
  ]);

  await connection.execute("UPDATE users SET password = ? WHERE email = ?", [
    hashedCs1,
    "cs01expressnss@gmail.com",
  ]);

  await connection.execute("UPDATE users SET password = ? WHERE email = ?", [
    hashedCs2,
    "cs02expressnss@gmail.com",
  ]);

  console.log("Semua password berhasil di-bcrypt!");
  await connection.end();
}

updatePasswords();
