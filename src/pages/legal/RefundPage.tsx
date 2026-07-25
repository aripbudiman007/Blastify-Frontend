import { LegalLayout } from './LegalLayout'

const PLAN_TABLE = [
  { plan: 'LITE',    price: 'Rp 25.000',  window: '3 hari',  condition: 'Belum pernah mengirim pesan berbayar' },
  { plan: 'REGULAR', price: 'Rp 66.000',  window: '3 hari',  condition: 'Kurang dari 100 pesan terkirim'       },
  { plan: 'MASTER',  price: 'Rp 175.000', window: '7 hari',  condition: 'Kurang dari 500 pesan terkirim'       },
  { plan: 'ULTRA',   price: 'Rp 355.000', window: '7 hari',  condition: 'Kurang dari 1.000 pesan terkirim'     },
]

export function RefundPage() {
  return (
    <LegalLayout
      title="Kebijakan Refund"
      subtitle="Ketentuan pengembalian dana pembelian plan berlangganan"
      icon="mdi:cash-refund"
      lastUpdated="1 Januari 2025"
    >

      <p>
        Kami memahami bahwa terkadang layanan mungkin tidak sesuai dengan ekspektasi Anda.
        Kebijakan ini menjelaskan kondisi di mana pengembalian dana dapat diajukan, beserta
        prosedur lengkap dan jangka waktunya.
      </p>

      <h2>1. Prinsip Umum</h2>

      <ul>
        <li>Plan <strong>FREE</strong> tidak melibatkan pembayaran, sehingga tidak ada refund</li>
        <li>Refund hanya berlaku untuk pembayaran yang <strong>telah dikonfirmasi</strong> oleh tim kami</li>
        <li>Refund diberikan dalam bentuk <strong>transfer bank</strong> ke rekening asal pembayaran</li>
        <li>Biaya transfer antar bank (jika ada) ditanggung oleh pemohon</li>
        <li>Proses refund diselesaikan dalam <strong>3–7 hari kerja</strong> setelah persetujuan</li>
      </ul>

      <h2>2. Kondisi yang Memenuhi Syarat Refund</h2>

      <h3>2.1 Refund Penuh (100%)</h3>

      <p>Anda berhak mendapat pengembalian dana penuh apabila:</p>

      <ul>
        <li>
          <strong>Kegagalan teknis dari pihak kami</strong> — sistem tidak dapat digunakan sama sekali
          selama lebih dari 24 jam berturut-turut setelah aktivasi, dan kami tidak dapat memperbaikinya
          dalam waktu wajar.
        </li>
        <li>
          <strong>Double payment</strong> — pembayaran dilakukan dua kali untuk plan yang sama dalam
          periode yang sama. Bukti transfer kedua pembayaran diperlukan.
        </li>
        <li>
          <strong>Tagihan tidak sesuai</strong> — jumlah yang ditagih berbeda dari harga resmi yang
          tercantum di halaman harga saat pembelian dilakukan.
        </li>
      </ul>

      <h3>2.2 Refund Prorata</h3>

      <p>
        Jika Anda mengajukan refund dalam <strong>jendela waktu yang berlaku</strong> dan belum
        melewati batas penggunaan yang ditentukan per plan, kami memberikan refund prorata
        berdasarkan sisa hari yang tidak terpakai.
      </p>

      <p>
        Berikut ketentuan jendela waktu dan batas penggunaan per plan:
      </p>

      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Harga</th>
            <th>Jendela Refund</th>
            <th>Batas Penggunaan</th>
          </tr>
        </thead>
        <tbody>
          {PLAN_TABLE.map(row => (
            <tr key={row.plan}>
              <td><strong>{row.plan}</strong></td>
              <td>{row.price}/bln</td>
              <td>{row.window} sejak aktivasi</td>
              <td>{row.condition}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <em>
          Contoh: Plan REGULAR dibeli tanggal 1, sudah mengirim 80 pesan, refund diajukan
          tanggal 2. Memenuhi syarat (kurang dari 100 pesan, dalam 3 hari).
          Refund = (28/30) × Rp 66.000 = Rp 61.600.
        </em>
      </p>

      <h2>3. Kondisi yang Tidak Memenuhi Syarat Refund</h2>

      <p>Refund tidak dapat diberikan apabila:</p>

      <ul>
        <li>Pengajuan dilakukan di luar jendela waktu yang berlaku (melewati 3 atau 7 hari)</li>
        <li>Penggunaan sudah melebihi batas pesan yang ditetapkan per plan</li>
        <li>
          Akun dinonaktifkan atau dihapus karena <strong>pelanggaran Syarat Layanan</strong>,
          seperti spam, konten ilegal, atau penyalahgunaan platform
        </li>
        <li>
          Pemblokiran nomor WhatsApp oleh pihak WhatsApp/Meta, karena hal ini di luar
          kendali kami
        </li>
        <li>
          Ketidakpuasan subjektif yang tidak dapat dibuktikan sebagai kegagalan teknis
          dari sisi kami
        </li>
        <li>Perubahan kebijakan WhatsApp yang memengaruhi cara kerja platform secara umum</li>
        <li>Plan yang masa berlakunya sudah habis (kadaluarsa 30 hari)</li>
        <li>Perpanjangan plan yang sudah aktif dan sudah digunakan</li>
      </ul>

      <h2>4. Prosedur Pengajuan Refund</h2>

      <h3>4.1 Langkah-langkah</h3>

      <ol>
        <li>
          Kirim email ke <a href="mailto:billing@blastify.id">billing@blastify.id</a> dengan
          subjek: <code>[REFUND] - Email Akun - ID Invoice</code>
        </li>
        <li>
          Sertakan informasi berikut dalam isi email:
          <ul>
            <li>Nama lengkap dan alamat email akun</li>
            <li>Nomor atau ID invoice yang tertera di dashboard</li>
            <li>Bukti pembayaran (screenshot atau foto yang jelas)</li>
            <li>Alasan pengajuan refund secara rinci</li>
            <li>Nomor rekening tujuan refund (nama pemilik, nama bank, nomor rekening)</li>
          </ul>
        </li>
        <li>
          Tim kami akan merespons dalam <strong>1×24 jam kerja</strong> untuk mengkonfirmasi
          kelayakan pengajuan dan meminta informasi tambahan jika diperlukan.
        </li>
        <li>
          Jika disetujui, dana akan ditransfer dalam <strong>3–7 hari kerja</strong> setelah
          persetujuan diberikan.
        </li>
      </ol>

      <h3>4.2 Verifikasi Internal</h3>

      <p>
        Kami akan memverifikasi data penggunaan akun — termasuk jumlah pesan terkirim dan
        tanggal aktivasi — dari sistem internal kami sebelum menyetujui refund.
        Keputusan akhir kami bersifat final dan mengikat.
      </p>

      <h2>5. Metode Pengembalian Dana</h2>

      <ul>
        <li>
          <strong>Transfer bank</strong> — BCA, BRI, BNI, Mandiri, BSI, dan bank umum lainnya.
          Biaya transfer lintas bank sebesar Rp 6.500 ditanggung pemohon.
        </li>
        <li>
          <strong>GoPay / OVO / Dana</strong> — hanya tersedia jika pembayaran asal menggunakan
          e-wallet yang sama.
        </li>
      </ul>

      <p>
        Kami tidak memberikan refund dalam bentuk saldo kredit platform, gift card, atau
        perpanjangan masa aktif plan.
      </p>

      <h2>6. Kompensasi untuk Downtime</h2>

      <p>
        Jika layanan mengalami gangguan yang terverifikasi lebih dari 4 jam dalam satu hari
        kalender — di luar jadwal pemeliharaan yang telah diumumkan — kami memberikan kompensasi
        berupa perpanjangan masa aktif:
      </p>

      <ul>
        <li><strong>4–8 jam downtime</strong> — perpanjangan 1 hari</li>
        <li><strong>8–24 jam downtime</strong> — perpanjangan 3 hari</li>
        <li><strong>Lebih dari 24 jam berturut-turut</strong> — refund prorata atau perpanjangan setara, sesuai pilihan pengguna</li>
      </ul>

      <p>
        Klaim kompensasi downtime harus diajukan beserta bukti gangguan dalam <strong>7 hari</strong>{' '}
        setelah kejadian melalui{' '}
        <a href="mailto:support@blastify.id">support@blastify.id</a>.
      </p>

      <h2>7. Perselisihan dan Banding</h2>

      <p>
        Jika pengajuan refund ditolak dan Anda tidak setuju dengan keputusan kami, Anda dapat
        mengajukan banding melalui email{' '}
        <a href="mailto:legal@blastify.id">legal@blastify.id</a> dengan menyertakan bukti
        tambahan yang relevan. Banding akan diproses dalam <strong>3 hari kerja</strong>.
      </p>

      <p>
        Kami berkomitmen untuk menyelesaikan setiap perselisihan secara adil dan transparan.
        Jika tidak tercapai kesepakatan, proses diselesaikan sesuai ketentuan hukum yang
        berlaku di Indonesia.
      </p>

      <h2>8. Kontak</h2>

      <p>Untuk pertanyaan seputar refund dan pembayaran:</p>

      <ul>
        <li>Email billing: <a href="mailto:billing@blastify.id">billing@blastify.id</a></li>
        <li>Email legal: <a href="mailto:legal@blastify.id">legal@blastify.id</a></li>
        <li>
          WhatsApp:{' '}
          <a href="https://wa.me/6281234567890">+62 812-3456-7890</a>{' '}
          (Senin–Jumat, 09.00–17.00 WIB)
        </li>
      </ul>

    </LegalLayout>
  )
}
