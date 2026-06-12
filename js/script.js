// ===========================
// Global Variables
// ===========================
let transactions = [];
let chart = null;
const HIGH_SPENDING_LIMIT = 100; // $100

// ===========================
// DOM Elements
// ===========================
const expenseForm = document.getElementById('expenseForm');
const itemNameInput = document.getElementById('itemName');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const transactionList = document.getElementById('transactionList');
const totalBalanceDisplay = document.getElementById('totalBalance');
const themeToggle = document.getElementById('themeToggle');
const sortHighestBtn = document.getElementById('sortHighest');
const sortLowestBtn = document.getElementById('sortLowest');
const sortDefaultBtn = document.getElementById('sortDefault');

// ===========================
// Initialize App
// ===========================
function initApp() {
    console.log('Initializing app...');
    loadFromLocalStorage();
    renderTransactions();
    updateBalance();
    initChart();
    loadTheme();
    attachEventListeners();
    console.log('Sort buttons:', sortHighestBtn, sortLowestBtn, sortDefaultBtn);
}

// ===========================
// Event Listeners
// ===========================
function attachEventListeners() {
    expenseForm.addEventListener('submit', handleFormSubmit);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Check if sort buttons exist before attaching listeners
    if (sortHighestBtn) {
        sortHighestBtn.addEventListener('click', () => {
            console.log('Sorting by highest');
            sortTransactions('highest');
        });
    } else {
        console.error('sortHighestBtn not found!');
    }
    
    if (sortLowestBtn) {
        sortLowestBtn.addEventListener('click', () => {
            console.log('Sorting by lowest');
            sortTransactions('lowest');
        });
    } else {
        console.error('sortLowestBtn not found!');
    }
    
    if (sortDefaultBtn) {
        sortDefaultBtn.addEventListener('click', () => {
            console.log('Sorting by default');
            sortTransactions('default');
        });
    } else {
        console.error('sortDefaultBtn not found!');
    }
}

// ===========================
// Form Submission Handler
// ===========================
function handleFormSubmit(e) {
    e.preventDefault();

    // Get form values
    const itemName = itemNameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    // Strict validation
    if (!itemName || !amount || !category) {
        alert('❌ Please fill in all fields before submitting!');
        return;
    }

    if (amount <= 0) {
        alert('❌ Amount must be greater than zero!');
        return;
    }

    // Create transaction object
    const transaction = {
        id: Date.now(),
        itemName,
        amount,
        category,
        timestamp: new Date().toISOString()
    };

    // Add to transactions array
    transactions.push(transaction);

    // Save to localStorage
    saveToLocalStorage();

    // Update UI
    renderTransactions();
    updateBalance();
    updateChart();

    // Reset form
    expenseForm.reset();

    // Show success feedback
    showNotification('✅ Transaction added successfully!');
}

// ===========================
// Delete Transaction
// ===========================
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        renderTransactions();
        updateBalance();
        updateChart();
        showNotification('🗑️ Transaction deleted!');
    }
}

// ===========================
// Render Transactions
// ===========================
function renderTransactions() {
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p class="empty-state">No transactions yet. Add your first expense above!</p>';
        return;
    }

    transactionList.innerHTML = transactions.map(transaction => {
        const isHighSpending = transaction.amount > HIGH_SPENDING_LIMIT;
        const highSpendingClass = isHighSpending ? 'high-spending' : '';

        return `
            <div class="transaction-item ${highSpendingClass}" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-name">${transaction.itemName}</div>
                    <div class="transaction-details">
                        <span class="transaction-amount">$${formatNumber(transaction.amount)}</span>
                        <span class="transaction-category category-${transaction.category}">${transaction.category}</span>
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteTransaction(${transaction.id})">Delete</button>
            </div>
        `;
    }).join('');
}

// ===========================
// Update Total Balance
// ===========================
function updateBalance() {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    totalBalanceDisplay.textContent = `$ ${formatNumber(total)}`;
}

// ===========================
// Sorting Functions
// ===========================
function sortTransactions(sortType) {
    console.log('Sorting transactions by:', sortType);
    
    if (transactions.length === 0) {
        alert('⚠️ No transactions to sort!');
        return;
    }
    
    if (sortType === 'highest') {
        transactions.sort((a, b) => b.amount - a.amount);
        showNotification('📊 Sorted by Highest Amount');
    } else if (sortType === 'lowest') {
        transactions.sort((a, b) => a.amount - b.amount);
        showNotification('📊 Sorted by Lowest Amount');
    } else if (sortType === 'default') {
        transactions.sort((a, b) => a.id - b.id);
        showNotification('📊 Reset to Default Order');
    }

    renderTransactions();
    console.log('Transactions after sorting:', transactions);
}

// ===========================
// Chart.js Integration
// ===========================
function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#f093fb',
                    '#4facfe',
                    '#43e97b'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: $${formatNumber(value)}`;
                        }
                    }
                }
            }
        }
    });

    updateChart();
}

function updateChart() {
    // Calculate spending by category
    const categoryTotals = {
        Food: 0,
        Transport: 0,
        Fun: 0
    };

    transactions.forEach(t => {
        categoryTotals[t.category] += t.amount;
    });

    // Filter out categories with zero spending
    const labels = [];
    const data = [];

    Object.keys(categoryTotals).forEach(category => {
        if (categoryTotals[category] > 0) {
            labels.push(category);
            data.push(categoryTotals[category]);
        }
    });

    // Update chart
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    }
}

// ===========================
// Local Storage Functions
// ===========================
function saveToLocalStorage() {
    localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('budgetTransactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// ===========================
// Theme Toggle (Dark/Light Mode)
// ===========================
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const icon = themeToggle.querySelector('.icon');
    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = themeToggle.querySelector('.icon');
    icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// ===========================
// Utility Functions
// ===========================
function formatNumber(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showNotification(message) {
    // Simple notification - can be enhanced with a toast library
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===========================
// Start the App
// ===========================
document.addEventListener('DOMContentLoaded', initApp);
