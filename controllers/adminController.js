const db = require('../config/db');

// Tampilkan buku yang menunggu persetujuan
exports.getPendingBooks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM book_submissions WHERE status = $1', ['pending']);
    res.render('adminPanel', { submissions: result.rows }); // ✅ Harus ada
  } catch (err) {
    req.flash('error_msg', 'Gagal memuat buku yang menunggu persetujuan.');
    console.error(err);
    res.redirect('/');
  }
};

// Setujui buku
exports.approveBook = async (req, res) => {
  const submissionId = req.params.id;
  const adminId = req.session.user.id;

  try {
    const submissionResult = await db.query('SELECT * FROM book_submissions WHERE id = $1', [submissionId]);
    const submission = submissionResult.rows[0];

    // Pindahkan ke tabel `books`
    await db.query(
      `INSERT INTO books (judul, penulis, deskripsi, genre, tahun_terbit, sampul_url, link_baca_beli, awards)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [submission.judul, submission.penulis, submission.deskripsi, submission.genre, submission.tahun_terbit, submission.sampul_url, submission.link_baca_beli, submission.awards]
    );

    // Update status submission
    await db.query(
      `UPDATE book_submissions SET status = $1, approved_by = $2 WHERE id = $3`,
      ['approved', adminId, submissionId]
    );

    req.flash('success_msg', 'Buku berhasil disetujui.');
  } catch (err) {
    req.flash('error_msg', 'Gagal menyetujui buku.');
    console.error(err);
  }

  res.redirect('/admin/pending-books');
};

// Hapus buku (jika ditolak)
exports.rejectBook = async (req, res) => {
  const submissionId = req.params.id;

  try {
    await db.query('DELETE FROM book_submissions WHERE id = $1', [submissionId]);
    req.flash('success_msg', 'Buku berhasil ditolak dan dihapus.');
  } catch (err) {
    req.flash('error_msg', 'Gagal menolak buku.');
    console.error(err);
  }

  res.redirect('/admin/pending-books');
};

exports.deleteBook = async (req, res) => {
  const bookId = req.params.id;

  try {
    // Hapus semua ulasan dan rating terkait
    await db.query('DELETE FROM reviews WHERE book_id = $1', [bookId]);
    await db.query('DELETE FROM books WHERE id = $1', [bookId]);

    req.flash('success_msg', 'Buku dan semua ulasan berhasil dihapus.');
  } catch (err) {
    req.flash('error_msg', 'Gagal menghapus buku.');
    console.error(err);
  }

  res.redirect('/admin/approved-books');
};

// Suspend member selama 1 hari (misalnya)
exports.suspendMember = async (req, res) => {
  const userId = req.params.id;
  const { duration, reason } = req.body;

  // ✅ Hitung waktu sanksi
  const suspendedUntil = new Date();
  suspendedUntil.setHours(suspendedUntil.getHours() + parseInt(duration));

  try {
    await db.query(
      `UPDATE users 
       SET role = 'user', suspended_until = $1, suspension_reason = $2 
       WHERE id = $3`,
      [suspendedUntil, reason, userId]
    );

    req.flash('success_msg', 'Member telah ditangguhkan dan diubah menjadi user.');
  } catch (err) {
    req.flash('error_msg', 'Gagal menangguhkan member.');
    console.error(err);
  }

  res.redirect('/admin/users');
};

// Hapus sanksi dan jadikan user (opsional)
exports.demoteMember = async (req, res) => {
  const userId = req.params.id;

  try {
    await db.query(
      `UPDATE users 
       SET role = 'user', suspended_until = NULL, suspension_reason = NULL 
       WHERE id = $1`,
      [userId]
    );

    req.flash('success_msg', 'Member berhasil diturunkan menjadi user.');
  } catch (err) {
    req.flash('error_msg', 'Gagal menurunkan member.');
    console.error(err);
  }

  res.redirect('/admin/users');
};
exports.getMembers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE role = $1', ['member']);
    res.render('adminMembers', { members: result.rows });
  } catch (err) {
    req.flash('error_msg', 'Gagal memuat daftar member.');
    console.error(err);
    res.redirect('/');
  }
};

// Tampilkan semua user
exports.getManageUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, nama, email, role, suspended_until, suspension_reason FROM users WHERE role IN ($1, $2)', ['user', 'member']);
    res.render('adminUsers', { users: result.rows });
  } catch (err) {
    req.flash('error_msg', 'Gagal memuat daftar pengguna.');
    console.error(err);
    res.redirect('/');
  }
};

// Ubah role user ke member
exports.promoteToMember = async (req, res) => {
  const userId = req.params.id;

  try {
    await db.query('UPDATE users SET role = $1 WHERE id = $2', ['member', userId]);
    req.flash('success_msg', 'Pengguna berhasil diubah menjadi member.');
  } catch (err) {
    req.flash('error_msg', 'Gagal mengubah role pengguna.');
    console.error(err);
  }

  res.redirect('/admin/users');
};

// Tampilkan buku yang sudah disetujui
exports.getApprovedBooks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books ORDER BY id DESC');
    res.render('adminApprovedBooks', { books: result.rows }); // ✅ Pastikan variabel bernama `books`
  } catch (err) {
    req.flash('error_msg', 'Gagal memuat daftar buku yang disetujui.');
    console.error(err);
    res.redirect('/');
  }
};

// Hapus buku dan semua ulasan/rating terkait
exports.deleteBook = async (req, res) => {
  const bookId = req.params.id;

  try {
    // Hapus semua ulasan dan rating terkait
    await db.query('DELETE FROM reviews WHERE book_id = $1', [bookId]);
    await db.query('DELETE FROM books WHERE id = $1', [bookId]);

    req.flash('success_msg', 'Buku dan semua ulasan berhasil dihapus.');
  } catch (err) {
    req.flash('error_msg', 'Gagal menghapus buku.');
    console.error(err);
  }

  res.redirect('/admin/approved-books');
};