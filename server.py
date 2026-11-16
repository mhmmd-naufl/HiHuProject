"""FastAPI backend server untuk HiHuJoki dengan SQLite.

Backend ini melayani API JSON dan juga hasil build frontend (folder dist)
sehingga aplikasi bisa dibuka langsung di http://localhost:5000.
"""
import hashlib
import json
import os
import re
import secrets
import sqlite3
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "hihujoki.db")
DIST_DIR = os.path.join(BASE_DIR, "dist")
VITE_PORT = 5173

app = FastAPI(title="HiHuJoki API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://localhost:{VITE_PORT}",
        f"http://127.0.0.1:{VITE_PORT}",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Pydantic Models ----------


class User(BaseModel):
    id: str
    nama: str
    phone: str
    role: str
    aktif: bool = True
    created_at: Optional[str] = None


class UserCreate(BaseModel):
    nama: str = Field(min_length=2, max_length=80)
    phone: str
    password: str = Field(min_length=6, max_length=100)


class LoginRequest(BaseModel):
    phone: str
    password: str


class Product(BaseModel):
    id: str
    nama: str
    kategori: str
    harga: int
    stok: int
    deskripsi: str
    image_url: str
    unggulan: bool
    seller_nama: Optional[str] = None


class ProductPayload(BaseModel):
    nama: str = Field(min_length=1, max_length=80)
    kategori: str = Field(min_length=1, max_length=40)
    harga: int = Field(ge=0)
    stok: int = Field(ge=0)
    deskripsi: str = Field(min_length=1, max_length=600)
    image_url: str = "local-placeholder://green"
    unggulan: bool = False
    seller_id: Optional[str] = None


class SettingsPayload(BaseModel):
    whatsapp: Optional[str] = None
    categories: Optional[List[str]] = None


# ---------- Database Helpers ----------


def get_db():
    """Koneksi ke SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    """Hash password agar tidak tersimpan sebagai teks biasa."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def normalize_phone(phone: str) -> str:
    """Normalisasi nomor HP: hanya digit, awalan 0 diganti 62."""
    digits = re.sub(r"\D", "", str(phone or ""))
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    return digits


def is_valid_phone(phone: str) -> bool:
    return bool(re.fullmatch(r"\d{8,15}", phone))


def query_db(query: str, args: tuple = (), one: bool = False):
    """Eksekusi query SELECT dan tutup koneksi."""
    conn = get_db()
    try:
        rows = conn.execute(query, args).fetchall()
    finally:
        conn.close()
    if one:
        return rows[0] if rows else None
    return rows


def init_db():
    """Inisialisasi tabel dan data contoh jika belum ada."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            nama TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            aktif INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            nama TEXT NOT NULL,
            kategori TEXT NOT NULL,
            harga INTEGER DEFAULT 0,
            stok INTEGER DEFAULT 0,
            deskripsi TEXT,
            image_url TEXT DEFAULT 'local-placeholder://green',
            unggulan INTEGER DEFAULT 0,
            seller_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users (id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT,
            event_type TEXT NOT NULL,
            user_id TEXT,
            at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            user_id TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            expires_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_users = [
            ("u-001", "Admin HiHuJoki", "6281100000001", "admin123", "admin", 1),
            ("u-002", "Rani Prameswari", "6281234500002", "seller123", "seller", 1),
            ("u-003", "Bima Saputra", "6281234500003", "seller123", "seller", 1),
            ("u-004", "Dewi Lestari", "6281234500004", "pembeli123", "buyer", 1),
            ("u-005", "Fajar Nugroho", "6281234500005", "pembeli123", "buyer", 1),
        ]
        cursor.executemany(
            "INSERT INTO users (id, nama, phone, password, role, aktif) VALUES (?, ?, ?, ?, ?, ?)",
            seed_users,
        )

    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        seed_products = [
            (
                "p-001",
                "Paket Konsultasi Bab 1",
                "Konsultasi",
                75000,
                12,
                "Diskusi arah penelitian, perumusan masalah, dan struktur Bab 1 yang rapi",
                "local-placeholder://green",
                1,
                "u-002",
            ),
            (
                "p-002",
                "Review Proposal Skripsi",
                "Konsultasi",
                120000,
                8,
                "Masukan terstruktur untuk proposal agar siap dipresentasikan",
                "local-placeholder://green",
                1,
                "u-002",
            ),
            (
                "p-003",
                "Pengetikan Naskah Rapi",
                "Pengetikan",
                50000,
                20,
                "Pengetikan dan perapian dokumen sesuai pedoman format kampus",
                "local-placeholder://green",
                0,
                "u-003",
            ),
        ]
        cursor.executemany(
            """
            INSERT INTO products
                (id, nama, kategori, harga, stok, deskripsi, image_url, unggulan, seller_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            seed_products,
        )

    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        settings_default = {
            "whatsapp": "6281234567890",
            "categories": json.dumps(
                ["Konsultasi", "Pengetikan", "Analisis Data", "Desain", "Presentasi"]
            ),
        }
        cursor.executemany(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            list(settings_default.items()),
        )

    conn.commit()
    conn.close()


def create_session(user_id: str) -> str:
    """Buat token sesi 30 hari untuk user."""
    token = secrets.token_hex(16)
    now = datetime.now()
    expires = now + timedelta(days=30)
    conn = get_db()
    try:
        conn.execute(
            """
            REPLACE INTO sessions (user_id, token, created_at, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, token, now.isoformat(), expires.isoformat()),
        )
        conn.commit()
    finally:
        conn.close()
    return token


def public_user(row) -> dict:
    return {
        "id": row["id"],
        "nama": row["nama"],
        "phone": row["phone"],
        "role": row["role"],
        "aktif": bool(row["aktif"]),
        "created_at": row["created_at"],
    }


def read_categories() -> List[str]:
    row = query_db("SELECT value FROM settings WHERE key = 'categories'", one=True)
    if not row or not row["value"]:
        return []
    try:
        value = json.loads(row["value"])
    except (TypeError, ValueError):
        return []
    return [str(item) for item in value] if isinstance(value, list) else []


def read_settings() -> dict:
    rows = query_db("SELECT key, value FROM settings")
    settings = {row["key"]: row["value"] for row in rows}
    settings["categories"] = read_categories()
    return settings


# ---------- API Routes ----------


@app.get("/api/health")
def api_health():
    """Cek server hidup."""
    return {"ok": True, "status": "running"}


@app.post("/api/login")
def api_login(login_data: LoginRequest):
    """Login user dengan nomor HP + kata sandi."""
    digits = normalize_phone(login_data.phone)
    user = query_db(
        "SELECT * FROM users WHERE phone = ? AND aktif = 1", (digits,), one=True
    )

    # Terima hash baru maupun kata sandi seed lama (teks biasa).
    stored = user["password"] if user else None
    password_ok = bool(stored) and stored in (
        login_data.password,
        hash_password(login_data.password),
    )
    if not user or not password_ok:
        raise HTTPException(
            status_code=401, detail="Nomor HP atau kata sandi tidak cocok"
        )

    token = create_session(user["id"])
    return {"ok": True, "user": public_user(user), "token": token}


@app.post("/api/register")
def api_register(user_data: UserCreate):
    """Daftar akun pembeli baru dan langsung membuat sesi."""
    nama = user_data.nama.strip()
    digits = normalize_phone(user_data.phone)

    if len(nama) < 2:
        raise HTTPException(status_code=400, detail="Nama pengguna minimal 2 karakter")
    if not is_valid_phone(digits):
        raise HTTPException(
            status_code=400, detail="Nomor HP harus 8–15 digit. Contoh: 081234500006"
        )

    existing = query_db("SELECT id FROM users WHERE phone = ?", (digits,), one=True)
    if existing:
        raise HTTPException(
            status_code=409, detail="Nomor HP sudah terdaftar. Silakan login."
        )

    user_id = f"u-{secrets.token_hex(6)}"
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (id, nama, phone, password, role, aktif) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, nama, digits, hash_password(user_data.password), "buyer", 1),
        )
        conn.commit()
    finally:
        conn.close()

    user = query_db("SELECT * FROM users WHERE id = ?", (user_id,), one=True)
    token = create_session(user_id)
    return {"ok": True, "user": public_user(user), "token": token}


@app.get("/api/users", response_model=List[User])
def api_users():
    """Ambil semua pengguna (tanpa kata sandi)."""
    rows = query_db(
        "SELECT id, nama, phone, role, aktif, created_at FROM users ORDER BY created_at"
    )
    return [public_user(row) for row in rows]


@app.get("/api/products", response_model=List[Product])
def api_products():
    """Ambil semua produk beserta nama seller."""
    rows = query_db(
        """
        SELECT p.*, u.nama AS seller_nama
        FROM products p
        LEFT JOIN users u ON p.seller_id = u.id
        ORDER BY p.created_at DESC
        """
    )
    return [
        {
            "id": row["id"],
            "nama": row["nama"],
            "kategori": row["kategori"],
            "harga": row["harga"],
            "stok": row["stok"],
            "deskripsi": row["deskripsi"] or "",
            "image_url": row["image_url"] or "local-placeholder://green",
            "unggulan": bool(row["unggulan"]),
            "seller_nama": row["seller_nama"],
        }
        for row in rows
    ]


@app.post("/api/products", response_model=Product)
def api_create_product(payload: ProductPayload):
    """Tambah produk baru."""
    if not payload.seller_id:
        raise HTTPException(status_code=400, detail="seller_id wajib diisi")
    seller = query_db(
        "SELECT id FROM users WHERE id = ? AND role = 'seller'",
        (payload.seller_id,),
        one=True,
    )
    if not seller:
        raise HTTPException(status_code=404, detail="Seller tidak ditemukan")

    product_id = f"p-{secrets.token_hex(6)}"
    now = datetime.now().isoformat()
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO products
                (id, nama, kategori, harga, stok, deskripsi, image_url, unggulan,
                 seller_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                product_id,
                payload.nama.strip(),
                payload.kategori.strip(),
                payload.harga,
                payload.stok,
                payload.deskripsi.strip(),
                payload.image_url or "local-placeholder://green",
                int(payload.unggulan),
                payload.seller_id,
                now,
                now,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    row = query_db(
        "SELECT p.*, u.nama AS seller_nama FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = ?",
        (product_id,),
        one=True,
    )
    return {
        "id": row["id"],
        "nama": row["nama"],
        "kategori": row["kategori"],
        "harga": row["harga"],
        "stok": row["stok"],
        "deskripsi": row["deskripsi"] or "",
        "image_url": row["image_url"],
        "unggulan": bool(row["unggulan"]),
        "seller_nama": row["seller_nama"],
    }


@app.put("/api/products/{product_id}", response_model=Product)
def api_update_product(product_id: str, payload: ProductPayload):
    """Perbarui produk yang sudah ada."""
    existing = query_db("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    conn = get_db()
    try:
        conn.execute(
            """
            UPDATE products
            SET nama = ?, kategori = ?, harga = ?, stok = ?, deskripsi = ?,
                image_url = ?, unggulan = ?, seller_id = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                payload.nama.strip(),
                payload.kategori.strip(),
                payload.harga,
                payload.stok,
                payload.deskripsi.strip(),
                payload.image_url or existing["image_url"],
                int(payload.unggulan),
                payload.seller_id or existing["seller_id"],
                datetime.now().isoformat(),
                product_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    row = query_db(
        "SELECT p.*, u.nama AS seller_nama FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.id = ?",
        (product_id,),
        one=True,
    )
    return {
        "id": row["id"],
        "nama": row["nama"],
        "kategori": row["kategori"],
        "harga": row["harga"],
        "stok": row["stok"],
        "deskripsi": row["deskripsi"] or "",
        "image_url": row["image_url"],
        "unggulan": bool(row["unggulan"]),
        "seller_nama": row["seller_nama"],
    }


@app.delete("/api/products/{product_id}")
def api_delete_product(product_id: str):
    """Hapus produk."""
    existing = query_db("SELECT id FROM products WHERE id = ?", (product_id,), one=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    conn = get_db()
    try:
        conn.execute("DELETE FROM analytics WHERE product_id = ?", (product_id,))
        conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
    finally:
        conn.close()
    return {"ok": True}


@app.get("/api/settings")
def api_settings():
    """Ambil pengaturan toko."""
    settings = read_settings()
    categories = settings.pop("categories", [])
    return {"ok": True, "settings": settings, "categories": categories}


@app.put("/api/settings")
def api_update_settings(payload: SettingsPayload):
    """Simpan nomor WhatsApp dan/atau daftar kategori."""
    conn = get_db()
    try:
        if payload.whatsapp is not None:
            digits = normalize_phone(payload.whatsapp)
            if not is_valid_phone(digits):
                raise HTTPException(
                    status_code=400,
                    detail="Nomor WA harus 8–15 digit. Contoh: 6281234567890",
                )
            conn.execute(
                "REPLACE INTO settings (key, value) VALUES ('whatsapp', ?)", (digits,)
            )

        if payload.categories is not None:
            categories = []
            for item in payload.categories:
                name = str(item).strip()
                if name and name.lower() not in {c.lower() for c in categories}:
                    categories.append(name)
            if not categories:
                raise HTTPException(
                    status_code=400, detail="Minimal harus ada satu kategori"
                )
            conn.execute(
                "REPLACE INTO settings (key, value) VALUES ('categories', ?)",
                (json.dumps(categories),),
            )

        conn.commit()
    finally:
        conn.close()

    settings = read_settings()
    categories = settings.pop("categories", [])
    return {"ok": True, "settings": settings, "categories": categories}


# ---------- Frontend Serving ----------


def dist_file(relative_path: str) -> Optional[str]:
    """Path file aman di dalam folder dist (mencegah path traversal)."""
    candidate = os.path.abspath(os.path.join(DIST_DIR, relative_path))
    if candidate == DIST_DIR or candidate.startswith(DIST_DIR + os.sep):
        return candidate
    return None


@app.get("/", include_in_schema=False)
async def serve_index():
    """Serve halaman utama hasil build Vite."""
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "HiHuJoki API running. Build frontend dengan 'npm run build' untuk membuka website."
    }


@app.get("/{path:path}", include_in_schema=False)
async def serve_static(path: str):
    """Serve aset hasil build dan fallback SPA untuk semua route frontend."""
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Endpoint tidak ditemukan")

    file_path = dist_file(path)
    if file_path and os.path.isfile(file_path):
        return FileResponse(file_path)

    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    raise HTTPException(
        status_code=404, detail="Frontend belum dibuild. Jalankan 'npm run build'."
    )


# Inisialisasi database saat modul diimpor (uvicorn server:app juga bekerja).
init_db()

# ---------- Main ----------

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    print("\n=== HiHuJoki FastAPI Backend Running ===")
    print(f"Website:      http://localhost:{port}")
    print(f"API docs:     http://localhost:{port}/docs")
    print(f"Database:     SQLite ({DATABASE})")
    print("\nEndpoint utama:")
    print("  POST   /api/login    - Login user")
    print("  POST   /api/register - Register user baru")
    print("  GET    /api/users    - Daftar users")
    print("  GET    /api/products - Daftar products")
    print("  GET    /api/settings - Pengaturan (whatsapp, categories)")
    print("\nKetik Ctrl+C untuk berhenti\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
