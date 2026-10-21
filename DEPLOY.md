# Deploy NSS Express Website (Docker)

Website berjalan sebagai 2 container:

| Container | Isi | Port |
|---|---|---|
| `nss-express-web` | Next.js + Socket.IO (`server.js`) | `APP_PORT` (default 3000) |
| `nss-express-db` | MySQL 8.0 | hanya `127.0.0.1:3307` (tidak terbuka ke internet) |

Data yang harus tetap ada disimpan di 2 volume Docker: `db_data` (database) dan `uploads` (gambar banner/info yang diupload admin).

## 1. Prasyarat server

- Linux dengan **Docker** dan **Docker Compose plugin** (`docker compose version`).
- Server bisa menjangkau server tracking internal (`TRACKING_API_URL`, default `https://172.16.1.57/ksapisvr`). Kalau tidak, fitur lacak resi gagal tapi fitur lain tetap jalan.
- Akses internet keluar ke `generativelanguage.googleapis.com` (chatbot Gemini).

## 2. Siapkan file

```bash
git clone <repo> nss-express && cd nss-express
cp .env.example .env
nano .env
```

Isi `.env` minimal:

| Variabel | Isi |
|---|---|
| `JWT_SECRET` | string acak panjang: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` atau `openssl rand -hex 48` |
| `GEMINI_API_KEY` | API key Google Gemini |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | password kuat, berbeda satu sama lain |
| `APP_PORT` | port website di server (default 3000) |

`DB_HOST` biarkan `db` (MySQL di docker-compose). Jangan pakai file `.env` dari laptop development; isinya untuk Laragon (`DB_HOST=localhost`).

## 3. Jalankan

```bash
docker compose up -d --build
docker compose ps            # tunggu kolom STATUS: (healthy)
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}
```

Saat pertama kali dijalankan, MySQL otomatis membuat semua tabel dari `database/migrations/*.sql` (001–017).

## 4. Isi data

### Opsi A: pindahkan data dari laptop (disarankan)

Di laptop (Laragon, PowerShell):

```powershell
& "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe" -u root -p --single-transaction --no-tablespaces --set-gtid-purged=OFF nss_express > nss_express.sql
```

Salin `nss_express.sql` dan folder `public/uploads` ke server, lalu di server:

```bash
# Import database (menimpa tabel kosong hasil langkah 3)
docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < nss_express.sql

# Salin gambar upload ke volume + perbaiki pemilik file
docker compose cp ./public/uploads/. app:/app/public/uploads/
docker compose exec -u root app chown -R node:node /app/public/uploads
```

### Opsi B: mulai dari database kosong

Buat akun admin pertama:

```bash
docker compose exec app node scripts/buat-admin.js admin@nssexpress.co.id "Administrator" "PasswordKuat123"
```

Script yang sama dipakai untuk **mengganti password** akun yang sudah ada. Disarankan juga untuk semua akun hasil Opsi A, karena password lamanya tertulis di `scripts/update-password.js`.

## 5. HTTPS & domain (reverse proxy)

Pasang Nginx/Caddy di depan port `APP_PORT`. **WebSocket wajib diteruskan**, karena live chat & notifikasi memakai Socket.IO. Contoh Nginx:

```nginx
server {
    server_name nssexpress.co.id;
    client_max_body_size 10M;   # upload gambar

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

Notifikasi browser untuk admin (saat browser di-minimize) hanya berfungsi lewat **HTTPS** atau `localhost`.

## 6. Monitoring

- Health check: `GET /api/health` → `200 {"status":"ok"}` jika website & database sehat, `503 {"status":"error"}` jika database bermasalah.
- Docker sudah memeriksanya otomatis tiap 30 detik (`docker compose ps` menampilkan `healthy`/`unhealthy`).

## 7. Operasional

```bash
docker compose logs -f app                 # log aplikasi
docker compose restart app                 # restart website

# Update ke versi baru
git pull && docker compose up -d --build

# Backup database
docker compose exec -T db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' > backup-$(date +%F).sql

# Backup gambar upload
docker run --rm -v nss-express_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Nama volume diawali nama folder project (contoh di atas: folder `nss-express`). Cek dengan `docker volume ls`.

**Jangan** jalankan `docker compose down -v`. Opsi `-v` menghapus volume database dan gambar upload.

## Memakai MySQL di luar Docker

Isi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dengan server MySQL tersebut. Hapus service `db` dan blok `depends_on` di `docker-compose.yml`. Jalankan file `database/migrations/*.sql` berurutan (001 → 017) di database itu.
