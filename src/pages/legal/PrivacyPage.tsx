import { LegalLayout } from './LegalLayout'
import { APP_NAME } from '@/lib/constants'

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Kebijakan Privasi"
      subtitle="Bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda"
      icon="mdi:shield-lock-outline"
      lastUpdated="1 Januari 2025"
    >

      <p>
        {APP_NAME} ("kami", "platform", atau "layanan") berkomitmen untuk melindungi privasi Anda.
        Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan
        melindungi informasi yang Anda berikan saat menggunakan layanan {APP_NAME}.
      </p>

      <p>
        Dengan mendaftar dan menggunakan layanan kami, Anda menyetujui praktik yang dijelaskan
        dalam kebijakan ini. Jika Anda tidak setuju, harap tidak menggunakan layanan kami.
      </p>

      <h2>1. Data yang Kami Kumpulkan</h2>

      <h3>1.1 Data Akun</h3>
      <ul>
        <li><strong>Nama lengkap</strong> — digunakan untuk identifikasi akun dan komunikasi</li>
        <li><strong>Alamat email</strong> — digunakan untuk login, notifikasi, dan pemulihan akun</li>
        <li><strong>Password</strong> — disimpan dalam bentuk <em>hash</em> menggunakan bcrypt, tidak dapat dibaca</li>
        <li><strong>Informasi plan/langganan</strong> — jenis plan aktif dan tanggal kadaluarsa</li>
      </ul>

      <h3>1.2 Data Aktivitas</h3>
      <ul>
        <li><strong>Log pesan</strong> — riwayat pesan yang dikirim melalui platform (nomor tujuan, status, timestamp)</li>
        <li><strong>Data device</strong> — nama device, nomor WhatsApp yang terhubung, status koneksi</li>
        <li><strong>Data kontak</strong> — daftar kontak yang Anda impor atau tambahkan secara manual</li>
        <li><strong>Log webhook</strong> — payload yang diterima dari integrasi pihak ketiga</li>
        <li><strong>Log audit</strong> — aktivitas login, perubahan pengaturan, dan tindakan penting lainnya</li>
      </ul>

      <h3>1.3 Data Teknis</h3>
      <ul>
        <li><strong>Alamat IP</strong> — dicatat untuk keamanan dan pencegahan penyalahgunaan</li>
        <li><strong>User-agent browser</strong> — untuk keperluan debugging dan kompatibilitas</li>
        <li><strong>Timestamp aktivitas</strong> — waktu login, pengiriman pesan, dan tindakan lainnya</li>
      </ul>

      <h3>1.4 Data yang Tidak Kami Kumpulkan</h3>
      <ul>
        <li>Isi percakapan WhatsApp personal Anda (hanya pesan yang dikirim via API kami yang tercatat)</li>
        <li>Data kartu kredit atau rekening bank (pembayaran diverifikasi manual)</li>
        <li>Data lokasi GPS</li>
        <li>Data dari perangkat lain selain yang Anda daftarkan</li>
      </ul>

      <h2>2. Penggunaan Data</h2>

      <p>Kami menggunakan data yang dikumpulkan untuk:</p>

      <ul>
        <li>Menyediakan dan mengoperasikan layanan {APP_NAME}</li>
        <li>Memverifikasi identitas dan mengamankan akun Anda</li>
        <li>Memproses permintaan pengiriman pesan melalui API</li>
        <li>Mengirimkan notifikasi terkait layanan (invoice, batas kuota, keamanan)</li>
        <li>Mendeteksi dan mencegah penyalahgunaan, spam, atau aktivitas ilegal</li>
        <li>Meningkatkan kualitas layanan berdasarkan pola penggunaan agregat</li>
        <li>Memenuhi kewajiban hukum yang berlaku</li>
      </ul>

      <p>
        Kami <strong>tidak menjual, menyewakan, atau membagikan</strong> data pribadi Anda kepada
        pihak ketiga untuk tujuan pemasaran.
      </p>

      <h2>3. Penyimpanan dan Keamanan Data</h2>

      <h3>3.1 Lokasi Penyimpanan</h3>
      <p>
        Data Anda disimpan di server yang berlokasi di Indonesia. Kami menggunakan infrastruktur
        cloud dengan standar keamanan industri.
      </p>

      <h3>3.2 Langkah Keamanan</h3>
      <ul>
        <li>Password di-hash dengan bcrypt (salt rounds 12)</li>
        <li>Komunikasi data menggunakan HTTPS/TLS</li>
        <li>Token JWT dengan masa berlaku terbatas untuk autentikasi API</li>
        <li>API key unik per akun untuk akses programatik</li>
        <li>Audit log untuk semua tindakan sensitif</li>
      </ul>

      <h3>3.3 Durasi Penyimpanan</h3>
      <ul>
        <li><strong>Data akun aktif</strong> — disimpan selama akun aktif</li>
        <li><strong>Riwayat pesan</strong> — 90 hari sejak tanggal pengiriman</li>
        <li><strong>Log audit</strong> — 12 bulan</li>
        <li><strong>Data akun yang dihapus</strong> — dihapus permanen dalam 30 hari setelah penghapusan akun</li>
      </ul>

      <h2>4. Berbagi Data dengan Pihak Ketiga</h2>

      <p>Kami dapat berbagi data Anda hanya dalam situasi berikut:</p>

      <ul>
        <li>
          <strong>Penyedia infrastruktur</strong> — server hosting, database, CDN yang kami gunakan
          untuk mengoperasikan layanan. Mereka terikat perjanjian kerahasiaan data.
        </li>
        <li>
          <strong>Kewajiban hukum</strong> — jika diwajibkan oleh hukum Indonesia atau perintah pengadilan.
        </li>
        <li>
          <strong>Perlindungan hak</strong> — untuk mencegah penipuan, keamanan, atau penegakan Syarat Layanan kami.
        </li>
      </ul>

      <p>
        Platform integrasi pihak ketiga (Shopify, WooCommerce, dll) berinteraksi dengan layanan kami
        melalui webhook. Kami tidak bertanggung jawab atas praktik privasi platform tersebut.
      </p>

      <h2>5. Hak Anda sebagai Pengguna</h2>

      <p>Sebagai pengguna, Anda berhak untuk:</p>

      <ul>
        <li><strong>Akses data</strong> — meminta salinan data pribadi yang kami simpan tentang Anda</li>
        <li><strong>Koreksi data</strong> — memperbarui data yang tidak akurat melalui pengaturan akun</li>
        <li><strong>Penghapusan data</strong> — meminta penghapusan akun dan semua data terkait</li>
        <li><strong>Portabilitas data</strong> — mengekspor kontak dan data aktivitas Anda</li>
        <li>
          <strong>Pembatasan pemrosesan</strong> — menonaktifkan akun jika tidak ingin data diproses lebih lanjut
        </li>
      </ul>

      <p>
        Untuk mengajukan permintaan terkait hak privasi Anda, hubungi kami melalui email:{' '}
        <a href="mailto:privacy@blastify.id">privacy@blastify.id</a>
      </p>

      <h2>6. Cookie dan Penyimpanan Lokal</h2>

      <p>
        Kami menggunakan <em>localStorage</em> browser untuk menyimpan token autentikasi dan
        preferensi tampilan. Data ini tidak dikirim ke pihak ketiga dan dapat dihapus dengan
        membersihkan data browser Anda.
      </p>

      <p>
        Kami <strong>tidak menggunakan</strong> cookie pelacak iklan (<em>tracking cookies</em>) atau
        alat analitik pihak ketiga yang mengumpulkan data perilaku pengguna.
      </p>

      <h2>7. Privasi Anak-Anak</h2>

      <p>
        Layanan kami tidak ditujukan untuk pengguna di bawah usia 18 tahun. Kami tidak secara
        sengaja mengumpulkan data dari anak-anak. Jika Anda mengetahui adanya penggunaan oleh
        anak di bawah umur, harap hubungi kami segera di{' '}
        <a href="mailto:privacy@blastify.id">privacy@blastify.id</a>.
      </p>

      <h2>8. Perubahan Kebijakan</h2>

      <p>
        Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan material akan
        diberitahukan melalui email atau banner pengumuman di dashboard minimal <strong>7 hari</strong>{' '}
        sebelum berlaku. Penggunaan berkelanjutan setelah perubahan berlaku dianggap sebagai
        persetujuan atas kebijakan yang diperbarui.
      </p>

      <h2>9. Kontak</h2>

      <p>Untuk pertanyaan terkait kebijakan privasi ini, hubungi kami:</p>

      <ul>
        <li>Email: <a href="mailto:privacy@blastify.id">privacy@blastify.id</a></li>
        <li>WhatsApp Support: <a href="https://wa.me/6281234567890">+62 812-3456-7890</a></li>
      </ul>

    </LegalLayout>
  )
}
