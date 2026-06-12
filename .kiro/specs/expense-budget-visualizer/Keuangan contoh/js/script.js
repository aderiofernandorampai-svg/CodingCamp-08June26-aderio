// Mengambil elemen-elemen DOM penting dari HTML
const transactionForm = document.getElementById('transaction-form');
const itemNameInput = document.getElementById('item-name');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const transactionListElement = document.getElementById('transaction-list');
const totalBalanceElement = document.getElementById('total-balance');
const themeToggleBtn = document.getElementById('theme-toggle');
const sortSelect = document.getElementById('sort-select');

// MVP: Ambil data awal dari Local Storage jika ada, jika tidak mulai dari array kosong
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart = null;

// Fitur Opsional 3: Sistem Peringatan Batas Pengeluaran Satuan (Limit Rp 100.000)
const SPENDING_LIMIT = 100000;

// Fungsi Utama: Mengupdate dan Menggambar Ulang Semua Tampilan Aplikasi
function updateUI() {
    renderList();
    calculateBalance();
    renderChart();
    // MVP: Menyimpan data setiap kali ada perubahan data (tambah/hapus)
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Fungsi Hitung Total Saldo (Asumsi Saldo Awal Rp 0, dihitung berdasarkan pengeluaran)
function calculateBalance() {
    const total = transactions.reduce((sum, item) => sum + item.amount, 0);
    totalBalanceElement.innerText = `$ ${total.toLocaleString('id-ID')}`;
}

// Fungsi Menampilkan Daftar Item Transaksi ke Layar (Dilengkapi Fitur Sortir)
function renderList() {
    transactionListElement.innerHTML = '';
    
    // Fitur Opsional 2: Logika Pengurutan Data (Sorting)
    let displayTransactions = [...transactions];
    const sortValue = sortSelect.value;
    
    if (sortValue === 'highest') {
        displayTransactions.sort((a, b) => b.amount - a.amount);
    } else if (sortValue === 'lowest') {
        displayTransactions.sort((a, b) => a.amount - b.amount);
    } else {
        // Default: Menampilkan data terbaru di atas
        displayTransactions.reverse();
    }

    // Pembuatan Element Baris HTML secara dinamis menggunakan Vanilla JS
    displayTransactions.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="item-info">
                <div class="name">${item.name}</div>
                <div class="details">${item.category} | Rp ${item.amount.toLocaleString('id-ID')}</div>
            </div>
            <button class="btn-delete" onclick="deleteTransaction(${item.id})">Delete</button>
        `;
        transactionListElement.appendChild(li);
    });
}

// Fungsi Mengintegrasikan dan Mengupdate Grafik Lingkaran (Chart.js Pie Chart)
function renderChart() {
    // Hitung total pengeluaran per kategori secara real-time
    const categories = { Food: 0, Transport: 0, Fun: 0 };
    transactions.forEach(item => {
        if (categories[item.category] !== undefined) {
            categories[item.category] += item.amount;
        }
    });

    const ctx = document.getElementById('spending-chart').getContext('2d');
    
    // Jika grafik chart sudah ada sebelumnya, hancurkan dulu sebelum gambar ulang agar tidak tumpang tindih
    if (myChart) {
        myChart.destroy();
    }

    // Inisialisasi pembuatan chart baru menggunakan data dari sistem
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#2ecc71', '#3498db', '#f1c40f'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Fungsi Aksi: Menambah Transaksi Baru lewat Submit Form
transactionForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah reload halaman otomatis

    const name = itemNameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    // MVP: Validasi ketat agar tidak ada data kosong yang masuk
    if (!name || isNaN(amount) || amount <= 0) {
        alert('Harap isi semua kolom inputan dengan benar!');
        return;
    }

    // Fitur Opsional 3: Trigger Peringatan jika melebihi limit Rp 100.000
    if (amount > SPENDING_LIMIT) {
        alert(`⚠️ Peringatan: Pengeluaran untuk "${name}" melebihi batas Rp ${SPENDING_LIMIT.toLocaleString('id-ID')}!`);
    }

    // Bungkus data ke dalam objek model
    const newTransaction = {
        id: Date.now(), // Generate ID unik memakai timestamp waktu saat ini
        name: name,
        amount: amount,
        category: category
    };

    transactions.push(newTransaction);
    updateUI();
    
    // Bersihkan formulir kembali kosong siap pakai
    transactionForm.reset();
});

// Fungsi Aksi: Menghapus Transaksi Berdasarkan ID Unik
window.deleteTransaction = function(id) {
    transactions = transactions.filter(item => item.id !== id);
    updateUI();
};

// Fitur Opsional 1: Logika Tombol Pengganti Tema Mode Gelap/Terang
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
});

// Deteksi jika pengguna mengganti opsi pengurutan (Sortir)
sortSelect.addEventListener('change', renderList);

// Jalankan fungsi update pertama kali agar data lama dari local storage langsung termuat
updateUI();
