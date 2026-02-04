CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, -- always 'main'
  store_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  header_text TEXT NOT NULL,
  footer_text TEXT NOT NULL,
  opt_show_logo INTEGER NOT NULL,
  opt_show_txn_id INTEGER NOT NULL,
  opt_compact INTEGER NOT NULL,
  opt_print_qr INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO settings (
  id, store_name, phone, address, header_text, footer_text,
  opt_show_logo, opt_show_txn_id, opt_compact, opt_print_qr, updated_at
) VALUES (
  'main',
  'Warung Kopi rifdev',
  '+62 812-3456-7890',
  'Jl. Merdeka No. 45, Jakarta Selatan, Indonesia',
  'Welcome to {store_name}!\nPlease enjoy your stay.',
  'Thank you for your visit.\nFollow us @rifdevpos for more info!\nGoods once sold are not returnable.',
  1, 1, 0, 1,
  strftime('%s','now')
);
