NASI BUKUH RUNNER — V1
Sistem tracking runner yang berdiri sendiri. Projek ini TIDAK menggunakan Google Apps Script, Google Sheet Orders, atau backend NASI BUKUH sedia ada.
V1 features
Runner buka `runner.html`
Browser ambil GPS
Lokasi dihantar ke Cloudflare Worker
Cloudflare KV simpan lokasi terakhir
Admin buka `admin.html`
Admin lihat marker runner pada map
Admin refresh lokasi setiap 5 saat
Runner dianggap offline jika tiada update >45 saat
Struktur
```text
nasi-bukuh-runner/
├── index.html
├── runner.html
├── admin.html
├── css/
│   └── style.css
├── worker/
│   ├── src/
│   │   └── index.js
│   └── wrangler.toml
└── README.md
```
1. Cloudflare KV
Create KV namespace, contoh nama:
`NASI\_BUKUK\_RUNNER`
Copy KV Namespace ID.
Edit:
`worker/wrangler.toml`
Gantikan:
`PASTE\_YOUR\_KV\_NAMESPACE\_ID\_HERE`
dengan ID sebenar.
2. Worker secrets
Cloudflare Worker Settings > Variables and Secrets > Add secret:
`RUNNER\_TOKEN`
`ADMIN\_TOKEN`
Jangan commit token ke GitHub.
3. Deploy Worker
Deploy `worker/` sebagai Cloudflare Worker.
Jika guna Wrangler CLI:
```bash
cd worker
npx wrangler deploy
```
Selepas deploy, test:
```text
https://YOUR-WORKER.workers.dev/
```
Ia sepatutnya pulangkan JSON dengan `success: true`.
4. Set API URL
Dalam kedua-dua:
`runner.html`
`admin.html`
cari:
```javascript
API\_URL: "PASTE\_WORKER\_URL\_HERE"
```
Gantikan dengan URL Worker sebenar.
Contoh:
```javascript
API\_URL: "https://nasi-bukuh-runner-api.example.workers.dev"
```
5. Deploy Pages
Connect repository ini ke Cloudflare Pages.
Build command: kosong
Build output directory: `/`
6. Test
Telefon runner
Buka:
`/runner.html`
Runner ID:
`R001`
Masukkan `RUNNER\_TOKEN`.
Tekan `MULA DELIVERY`.
Benarkan GPS.
Telefon admin
Buka:
`/admin.html`
Masukkan `ADMIN\_TOKEN`.
Runner ID:
`R001`
Tekan `MULA MONITOR`.
Map sepatutnya menunjukkan marker runner.
Nota penting
V1 menggunakan browser Geolocation API. Sesetengah Android/browser boleh mengehadkan GPS apabila tab masuk background atau skrin dikunci. Untuk ujian V1, biarkan halaman runner aktif.
Security
V1 menggunakan token Bearer untuk membezakan endpoint runner dan admin.
Untuk production, langkah seterusnya patut termasuk:
token per-runner yang boleh revoke
login admin
HTTPS custom domain
rate limiting
audit log
route/order assignment
delivery status
customer tracking
