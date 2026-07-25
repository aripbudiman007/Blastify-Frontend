import { LegalLayout } from './LegalLayout'
import { APP_NAME } from '@/lib/constants'

export function TermsPage() {
  return (
    <LegalLayout
      title="Syarat Layanan"
      subtitle="Ketentuan penggunaan platform yang mengikat secara hukum"
      icon="mdi:file-document-outline"
      lastUpdated="1 Januari 2025"
    >

      <p>
        Selamat datang di {APP_NAME}. Dengan mengakses atau menggunakan layanan kami, Anda
        menyetujui Syarat Layanan ini secara penuh. Harap baca dengan cermat sebelum mendaftar
        atau menggunakan platform.
      </p>

      <h2>1. Definisi</h2>

      <ul>
        <li><strong>"Platform"</strong> — layanan {APP_NAME} termasuk website, API, dan dashboard</li>
        <li><strong>"Pengguna"</strong> — individu atau entitas yang mendaftar dan menggunakan platform</li>
        <li><strong>"Device"</strong> — nomor WhatsApp yang dihubungkan ke akun pengguna</li>
        <li><strong>"Pesan"</strong> — konten yang dikirimkan melalui platform kepada nomor WhatsApp tujuan</li>
        <li><strong>"API Key"</strong> — kunci unik untuk mengakses platform secara programatik</li>
        <li><strong>"Konten"</strong> — semua teks, gambar, video, dokumen, dan media lainnya yang dikirim</li>
      </ul>

      <h2>2. Pendaftaran dan Akun</h2>

      <h3>2.1 Persyaratan Pendaftaran</h3>
      <ul>
        <li>Anda harus berusia minimal 18 tahun atau memiliki izin wali yang sah</li>
        <li>Informasi yang diberikan saat pendaftaran harus akurat dan terkini</li>
        <li>Satu orang atau entitas hanya diperbolehkan memiliki satu akun aktif</li>
        <li>Akun tidak dapat dipindahkan kepada pihak lain tanpa persetujuan tertulis kami</li>
      </ul>

      <h3>2.2 Keamanan Akun</h3>
      <p>
        Anda bertanggung jawab penuh atas keamanan akun dan API Key Anda. Jaga kerahasiaan
        kredensial login dan API Key dari pihak tidak berwenang. Kami tidak bertanggung jawab
        atas kerugian yang timbul akibat penggunaan tidak sah atas akun Anda. Segera laporkan
        jika akun Anda dikompromikan melalui{' '}
        <a href="mailto:support@blastify.id">support@blastify.id</a>.
      </p>

      <h2>3. Penggunaan yang Diizinkan</h2>

      <p>Platform ini ditujukan untuk keperluan yang sah, antara lain:</p>

      <ul>
        <li>Pengiriman pesan transaksional (konfirmasi pesanan, notifikasi pembayaran, OTP)</li>
        <li>Komunikasi layanan pelanggan yang sah dengan pelanggan yang sudah mengenal bisnis Anda</li>
        <li>Broadcast informasi kepada kontak yang telah memberikan persetujuan (<em>opt-in</em>)</li>
        <li>Otomasi respons pesan masuk yang relevan dan membantu pengguna</li>
        <li>Integrasi sistem bisnis dengan WhatsApp melalui API</li>
      </ul>

      <h2>4. Penggunaan yang Dilarang</h2>

      <p>
        Anda <strong>dilarang keras</strong> menggunakan platform untuk aktivitas berikut.
        Pelanggaran dapat mengakibatkan penangguhan atau penghapusan akun segera.
      </p>

      <h3>4.1 Konten Terlarang</h3>
      <ul>
        <li>Spam, phishing, atau penipuan dalam bentuk apapun</li>
        <li>Konten pornografi, kekerasan, atau melanggar norma kesusilaan</li>
        <li>Penyebaran informasi palsu (hoaks) atau disinformasi yang menyesatkan</li>
        <li>Ujaran kebencian berdasarkan ras, agama, suku, gender, atau orientasi seksual</li>
        <li>Promosi perjudian online, narkoba, atau barang/jasa ilegal</li>
        <li>Pelanggaran hak kekayaan intelektual milik pihak lain</li>
      </ul>

      <h3>4.2 Aktivitas Teknis Terlarang</h3>
      <ul>
        <li>Melakukan <em>reverse engineering</em>, decompiling, atau memodifikasi platform</li>
        <li>Menggunakan bot atau scraping untuk mengekstrak data platform secara tidak sah</li>
        <li>Mencoba menembus keamanan sistem atau mengeksploitasi celah keamanan</li>
        <li>Berbagi API Key kepada pihak lain di luar kendali Anda</li>
        <li>Mengirim pesan massal tanpa persetujuan penerima (<em>unsolicited messages</em>)</li>
        <li>Menggunakan platform untuk tindakan yang melanggar Kebijakan Penggunaan WhatsApp/Meta</li>
      </ul>

      <h3>4.3 Penyalahgunaan Sumber Daya</h3>
      <ul>
        <li>Melampaui batas kuota plan yang berlangganan dengan cara apapun</li>
        <li>Mengganggu stabilitas sistem yang dapat memengaruhi pengguna lain</li>
        <li>Membuat beberapa akun untuk menghindari batasan plan</li>
      </ul>

      <h2>5. Plan dan Pembayaran</h2>

      <h3>5.1 Plan Berlangganan</h3>
      <p>
        Platform tersedia dalam beberapa plan: <strong>FREE, LITE, REGULAR, MASTER,</strong> dan{' '}
        <strong>ULTRA</strong>. Setiap plan memiliki batas device, pesan, kontak, dan fitur yang
        berbeda sesuai yang tercantum di halaman harga.
      </p>

      <h3>5.2 Mekanisme Pembayaran</h3>
      <ul>
        <li>Pembayaran dilakukan di muka (prepaid) melalui transfer bank atau e-wallet</li>
        <li>Konfirmasi pembayaran dilakukan oleh tim kami dalam 1×24 jam kerja</li>
        <li>Setelah dikonfirmasi, plan langsung aktif dan berlaku 30 hari</li>
        <li>Bukti pembayaran harus disertakan saat melakukan konfirmasi</li>
      </ul>

      <h3>5.3 Perpanjangan</h3>
      <p>
        Perpanjangan tidak dilakukan secara otomatis. Anda perlu melakukan pembayaran baru
        sebelum atau saat plan berakhir. Jika tidak diperpanjang, akun akan kembali ke plan
        FREE dengan batas yang lebih rendah. Data yang sudah ada tidak akan hilang.
      </p>

      <h3>5.4 Perubahan Plan</h3>
      <p>
        Upgrade plan berlaku segera setelah konfirmasi pembayaran. Downgrade berlaku pada
        siklus berikutnya. Tidak ada perhitungan prorata untuk perubahan plan di tengah periode aktif.
      </p>

      <h3>5.5 Pembayaran Bersifat Final — Tidak Ada Pengembalian Dana</h3>
      <p>
        <strong>Semua pembayaran yang telah dikonfirmasi bersifat final dan tidak dapat
        dikembalikan (non-refundable)</strong> dalam kondisi apapun, termasuk namun tidak terbatas
        pada: pembatalan langganan di tengah periode aktif, ketidakgunaan fitur, pemblokiran
        nomor WhatsApp oleh pihak WhatsApp/Meta, atau perubahan kebutuhan bisnis.
      </p>
      <p>
        Dengan melakukan pembayaran dan mengaktifkan plan berlangganan, Anda secara tegas
        menyatakan telah membaca, memahami, dan <strong>menyetujui ketentuan pembayaran
        final ini</strong>. Konfirmasi pembayaran dianggap sebagai persetujuan penuh atas
        seluruh Syarat Layanan ini.
      </p>
      <p>
        Satu-satunya pengecualian adalah jika terjadi gangguan teknis yang sepenuhnya
        disebabkan oleh sistem kami dan berlangsung lebih dari <strong>72 jam berturut-turut</strong>,
        di mana kami dapat memberikan perpanjangan masa aktif setara sebagai kompensasi —
        bukan pengembalian dana tunai.
      </p>

      <h2>6. Batas Pengiriman Pesan</h2>

      <p>
        Untuk mencegah penyalahgunaan dan melindungi infrastruktur bersama, kami menerapkan:
      </p>

      <ul>
        <li>Kuota pesan bulanan sesuai plan yang dipilih</li>
        <li>Disarankan tidak mengirim lebih dari 1.000 pesan per jam dari satu device</li>
        <li>Fitur anti-ban tersedia di semua plan: delay acak antar pesan, pengaturan jam kerja, dan batas harian</li>
      </ul>

      <p>
        Kami tidak bertanggung jawab atas pemblokiran nomor WhatsApp Anda oleh WhatsApp/Meta
        akibat penggunaan yang tidak sesuai rekomendasi atau yang melanggar kebijakan platform mereka.
      </p>

      <h2>7. Ketersediaan Layanan</h2>

      <h3>7.1 Target Uptime</h3>
      <p>
        Kami berupaya mempertahankan ketersediaan layanan <strong>99,5%</strong> per bulan.
        Pemeliharaan terjadwal akan diberitahukan minimal 24 jam sebelumnya melalui
        banner pengumuman di dashboard.
      </p>

      <h3>7.2 Ketergantungan Pihak Ketiga</h3>
      <p>
        Platform ini bergantung pada teknologi WhatsApp Web melalui library open-source Baileys.
        Perubahan sepihak dari WhatsApp/Meta dapat memengaruhi fungsi layanan. Kami akan berupaya
        memperbarui sistem sesegera mungkin, namun tidak dapat menjamin ketersediaan penuh
        dalam kondisi tersebut.
      </p>

      <h2>8. Penghentian Layanan</h2>

      <h3>8.1 Penghentian oleh Pengguna</h3>
      <p>
        Anda dapat menghentikan penggunaan layanan kapan saja dengan menghapus akun melalui
        halaman Pengaturan Akun. Penghapusan bersifat permanen dan tidak dapat dibatalkan.
        Data akan dihapus dalam 30 hari setelah permintaan penghapusan.
      </p>

      <h3>8.2 Penghentian oleh Kami</h3>
      <p>Kami berhak menangguhkan atau menghapus akun Anda jika:</p>
      <ul>
        <li>Terdapat pelanggaran terhadap Syarat Layanan ini</li>
        <li>Terdapat aktivitas mencurigakan atau berpotensi merugikan pengguna lain atau pihak ketiga</li>
        <li>Diwajibkan oleh hukum, regulasi, atau otoritas berwenang</li>
        <li>Akun tidak aktif lebih dari 12 bulan pada plan FREE</li>
      </ul>

      <h2>9. Batasan Tanggung Jawab</h2>

      <p>
        Layanan diberikan "<em>sebagaimana adanya</em>" (<em>as-is</em>) tanpa jaminan apapun,
        tersurat maupun tersirat. Kami tidak bertanggung jawab atas:
      </p>

      <ul>
        <li>Pemblokiran nomor WhatsApp Anda oleh WhatsApp/Meta</li>
        <li>Kerugian bisnis akibat gangguan layanan di luar kendali kami</li>
        <li>Konten pesan yang Anda kirimkan kepada penerima</li>
        <li>Tindakan atau kelalaian penyedia layanan pihak ketiga yang terintegrasi</li>
        <li>Kehilangan data akibat <em>force majeure</em> (bencana alam, serangan siber skala besar)</li>
      </ul>

      <p>
        Tanggung jawab maksimal kami kepada Anda tidak melebihi total pembayaran yang Anda
        bayarkan kepada kami dalam <strong>30 hari terakhir</strong> sebelum klaim diajukan.
      </p>

      <h2>10. Hak Kekayaan Intelektual</h2>

      <p>
        Seluruh hak kekayaan intelektual atas platform — termasuk kode, desain, nama merek,
        dan konten — adalah milik {APP_NAME}. Anda tidak diperkenankan menggunakan, menyalin,
        atau mendistribusikan materi tersebut tanpa izin tertulis kami.
      </p>

      <p>
        Konten yang Anda kirimkan melalui platform tetap menjadi milik Anda. Dengan menggunakan
        platform, Anda memberikan kami lisensi terbatas untuk memproses konten tersebut guna
        menyampaikan layanan.
      </p>

      <h2>11. Hukum yang Berlaku</h2>

      <p>
        Syarat Layanan ini diatur oleh hukum Negara Kesatuan Republik Indonesia.
        Setiap sengketa diselesaikan secara musyawarah terlebih dahulu. Jika tidak
        tercapai kesepakatan dalam 30 hari, sengketa diselesaikan melalui pengadilan
        yang berwenang di wilayah hukum Indonesia.
      </p>

      <h2>12. Perubahan Syarat Layanan</h2>

      <p>
        Kami dapat mengubah Syarat Layanan ini sewaktu-waktu. Perubahan material akan
        diberitahukan melalui email terdaftar dan/atau pengumuman di dashboard minimal{' '}
        <strong>14 hari</strong> sebelum berlaku. Penggunaan berkelanjutan setelah tanggal
        efektif dianggap sebagai penerimaan atas syarat yang diperbarui.
      </p>

      <h2>13. Kontak</h2>

      <p>Untuk pertanyaan atau keberatan terkait Syarat Layanan ini, hubungi kami:</p>

      <ul>
        <li>Email: <a href="mailto:legal@blastify.id">legal@blastify.id</a></li>
        <li>WhatsApp: <a href="https://wa.me/6281234567890">+62 812-3456-7890</a></li>
        <li>Jam layanan: Senin–Jumat, 09.00–17.00 WIB</li>
      </ul>

    </LegalLayout>
  )
}
