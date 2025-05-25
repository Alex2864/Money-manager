// --- Data Storage ---
let moneyData = JSON.parse(localStorage.getItem('moneyData')) || {};
let historyData = JSON.parse(localStorage.getItem('historyData')) || [];

// Ensure "Main" head always exists
if (!moneyData['Main']) moneyData['Main'] = 0;

function saveData() {
    localStorage.setItem('moneyData', JSON.stringify(moneyData));
    localStorage.setItem('historyData', JSON.stringify(historyData));
}

// --- UI Update Functions ---
function updateBalances() {
    const balancesList = document.getElementById('balancesList');
    balancesList.innerHTML = '';
    let total = 0;

    // Always show all heads, even if zero
    let allHeads = Object.keys(moneyData);
    if (!allHeads.includes('Main')) allHeads.unshift('Main');

    allHeads.forEach(head => {
        let amount = moneyData[head] || 0;
        let li = document.createElement('li');
        li.textContent = `${head}: ₹${amount}`;
        li.setAttribute('data-head', head);

        // Long press for head actions
        let pressTimer = null;
        li.addEventListener('touchstart', function(e) {
            pressTimer = setTimeout(() => {
                openHeadActionModal(head);
            }, 600);
        });
        li.addEventListener('touchend', function(e) {
            clearTimeout(pressTimer);
        });
        li.addEventListener('mousedown', function(e) {
            pressTimer = setTimeout(() => {
                openHeadActionModal(head);
            }, 600);
        });
        li.addEventListener('mouseup', function(e) {
            clearTimeout(pressTimer);
        });
        li.addEventListener('mouseleave', function(e) {
            clearTimeout(pressTimer);
        });

        balancesList.appendChild(li);
        total += amount;
    });

    document.getElementById('totalBalance').textContent = `Total Balance: ₹${total}`;
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    let runningMoneyData = {};
    let runningTotal = 0;

    // Get all heads for initial zero
    let allHeads = Object.keys(moneyData);
    if (!allHeads.includes('Main')) allHeads.unshift('Main');
    allHeads.forEach(h => runningMoneyData[h] = 0);

    // Reconstruct balances for each history entry
    historyData.forEach((entry, idx) => {
        let prevHeadBalance = runningMoneyData[entry.head] || 0;
        let prevTotal = runningTotal;

        if (entry.type === 'add') {
            runningMoneyData[entry.head] = prevHeadBalance + entry.amount;
            runningTotal += entry.amount;
        } else {
            runningMoneyData[entry.head] = prevHeadBalance - entry.amount;
            runningTotal -= entry.amount;
        }

        let li = document.createElement('li');
        li.className = `history-type-${entry.type}`;

        let date = new Date(entry.timestamp);
        let dateStr = date.toLocaleDateString();
        let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let dateTimeStr = `${dateStr} ${timeStr}`;

        let dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = dateTimeStr;

        let details = document.createElement('span');
        details.className = 'history-details';
        details.innerHTML = `<b>₹${entry.amount}</b> (${entry.head})`;
        if (entry.note && entry.note.trim() !== "") {
            let noteSpan = document.createElement('span');
            noteSpan.className = 'history-note';
            noteSpan.textContent = entry.note;
            details.appendChild(noteSpan);
        }

        let variation = document.createElement('span');
        variation.className = 'history-variation';

        let headArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let headFinalClass = '';
        if (prevHeadBalance < runningMoneyData[entry.head]) {
            headFinalClass = 'variation-final-up';
        } else if (prevHeadBalance > runningMoneyData[entry.head]) {
            headFinalClass = 'variation-final-down';
        } else {
            headFinalClass = 'variation-final';
        }

        let totalArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let totalFinalClass = '';
        if (prevTotal < runningTotal) {
            totalFinalClass = 'variation-final-up';
        } else if (prevTotal > runningTotal) {
            totalFinalClass = 'variation-final-down';
        } else {
            totalFinalClass = 'variation-final';
        }

        variation.innerHTML =
            `Head: ${prevHeadBalance} ${headArrow} <span class="${headFinalClass}">${runningMoneyData[entry.head]}</span><br>` +
            `Total: ${prevTotal} ${totalArrow} <span class="${totalFinalClass}">${runningTotal}</span>`;

        let detailsWrapper = document.createElement('div');
        detailsWrapper.style.display = 'flex';
        detailsWrapper.style.flexDirection = 'column';
        detailsWrapper.appendChild(dateDiv);
        detailsWrapper.appendChild(details);

        li.appendChild(detailsWrapper);
        li.appendChild(variation);

        historyList.insertBefore(li, historyList.firstChild);
    });
}

// --- Modal Logic ---
const modal = document.getElementById('popupModal');
const modalTitle = document.getElementById('modalTitle');
const popupForm = document.getElementById('popupForm');
const popupHead = document.getElementById('popupHead');
const popupAmount = document.getElementById('popupAmount');
const popupNote = document.getElementById('popupNote');
const popupSubmitBtn = document.getElementById('popupSubmitBtn');
const headsDatalist = document.getElementById('headsDatalist');
let currentAction = null;

function updateHeadsDatalist() {
    headsDatalist.innerHTML = '';
    Object.keys(moneyData).forEach(head => {
        let opt = document.createElement('option');
        opt.value = head;
        headsDatalist.appendChild(opt);
    });
}

function openModal(action) {
    currentAction = action;
    modal.style.display = 'block';
    popupForm.reset();
    popupHead.value = '';
    popupAmount.value = '';
    popupNote.value = '';
    updateHeadsDatalist();
    if (action === 'add') {
        modalTitle.textContent = 'Add Money';
        popupSubmitBtn.textContent = 'Add';
        popupAmount.placeholder = 'Amount to Add';
    } else {
        modalTitle.textContent = 'Spend Money';
        popupSubmitBtn.textContent = 'Spend';
        popupAmount.placeholder = 'Amount to Spend';
    }
    popupHead.placeholder = "Head (leave blank for Main)";
    popupHead.focus();
}

function closeModal() {
    modal.style.display = 'none';
}

document.getElementById('addBtn').onclick = () => openModal('add');
document.getElementById('spendBtn').onclick = () => openModal('spend');
document.getElementById('closeModal').onclick = closeModal;
window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == headActionModal) closeHeadActionModal();
    if (event.target == headDetailsModal) closeHeadDetailsModal();
    if (event.target == profileModal) profileModal.style.display = 'none';
    if (event.target == analysisModal) analysisModal.style.display = 'none';
    if (event.target == exportModal) exportModal.style.display = 'none';
}

// --- Add/Spend Logic ---
popupForm.onsubmit = function(e) {
    e.preventDefault();
    let head = popupHead.value.trim() || 'Main';
    let amount = parseFloat(popupAmount.value);
    let note = popupNote.value.trim();

    if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount.');
        return;
    }

    if (!moneyData[head]) moneyData[head] = 0;

    if (currentAction === 'add') {
        moneyData[head] += amount;
        historyData.push({
            type: 'add',
            head: head,
            amount: amount,
            note: note,
            timestamp: Date.now()
        });
    } else if (currentAction === 'spend') {
        if (moneyData[head] < amount) {
            alert('Not enough money in this head!');
            return;
        }
        moneyData[head] -= amount;
        historyData.push({
            type: 'spend',
            head: head,
            amount: amount,
            note: note,
            timestamp: Date.now()
        });
    }

    saveData();
    updateBalances();
    updateHistory();
    closeModal();
};

// --- Head Action Modal ---
const headActionModal = document.getElementById('headActionModal');
const closeHeadActionModalBtn = document.getElementById('closeHeadActionModal');
const transferBtn = document.getElementById('transferBtn');
const deleteHeadBtn = document.getElementById('deleteHeadBtn');
const detailsHeadBtn = document.getElementById('detailsHeadBtn');
const transferForm = document.getElementById('transferForm');
const transferToHead = document.getElementById('transferToHead');
const transferAmount = document.getElementById('transferAmount');

let selectedHead = null;

function openHeadActionModal(head) {
    selectedHead = head;
    headActionModal.style.display = 'block';
    document.getElementById('headActionTitle').textContent = `Actions for "${head}"`;

    transferForm.style.display = 'none';
    document.getElementById('headActionOptions').style.display = 'flex';

    transferToHead.innerHTML = '';
    Object.keys(moneyData).forEach(h => {
        if (h !== head) {
            let opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            transferToHead.appendChild(opt);
        }
    });

    deleteHeadBtn.disabled = (head === 'Main');
}

function closeHeadActionModal() {
    headActionModal.style.display = 'none';
    transferForm.style.display = 'none';
    document.getElementById('headActionOptions').style.display = 'flex';
    transferAmount.value = '';
}

transferBtn.onclick = function() {
    transferForm.style.display = 'flex';
    document.getElementById('headActionOptions').style.display = 'none';
    transferAmount.value = '';
};

transferForm.onsubmit = function(e) {
    e.preventDefault();
    let fromHead = selectedHead;
    let toHead = transferToHead.value;
    let amount = parseFloat(transferAmount.value);

    if (fromHead === toHead) {
        alert("Cannot transfer to the same head.");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }
    if ((moneyData[fromHead] || 0) < amount) {
        alert("Not enough balance in this head.");
        return;
    }

    moneyData[fromHead] -= amount;
    if (!moneyData[toHead]) moneyData[toHead] = 0;
    moneyData[toHead] += amount;

    historyData.push({
        type: 'spend',
        head: fromHead,
        amount: amount,
        note: `Transferred to "${toHead}"`,
        timestamp: Date.now()
    });
    historyData.push({
        type: 'add',
        head: toHead,
        amount: amount,
        note: `Received from "${fromHead}"`,
        timestamp: Date.now()
    });

    saveData();
    updateBalances();
    updateHistory();
    closeHeadActionModal();
};

deleteHeadBtn.onclick = function() {
    if (selectedHead === 'Main') {
        alert('Cannot delete the "Main" head.');
        return;
    }
    let balance = moneyData[selectedHead] || 0;
    if (!confirm(`Are you sure you want to delete the head "${selectedHead}"?${balance !== 0 ? `\n\nThe balance ₹${balance} will be moved to "Main".` : ''}`)) {
        return;
    }
    if (balance !== 0) {
        moneyData['Main'] += balance;
        historyData.push({
            type: 'add',
            head: 'Main',
            amount: balance,
            note: `Balance moved from deleted head "${selectedHead}"`,
            timestamp: Date.now()
        });
        historyData.push({
            type: 'spend',
            head: selectedHead,
            amount: balance,
            note: `Balance moved to "Main" before deletion`,
            timestamp: Date.now()
        });
    }
    delete moneyData[selectedHead];
    saveData();
    updateBalances();
    updateHistory();
    closeHeadActionModal();
};

detailsHeadBtn.onclick = function() {
    openHeadDetailsModal(selectedHead);
    closeHeadActionModal();
};

function openHeadDetailsModal(head) {
    const headDetailsModal = document.getElementById('headDetailsModal');
    const headDetailsTitle = document.getElementById('headDetailsTitle');
    const headDetailsList = document.getElementById('headDetailsList');
    const headDetailsBalance = document.getElementById('headDetailsBalance');

    headDetailsModal.style.display = 'block';
    headDetailsTitle.textContent = `Transactions for "${head}"`;
    headDetailsList.innerHTML = '';

    const filtered = historyData.filter(entry => entry.head === head);
    if (filtered.length === 0) {
        headDetailsBalance.innerHTML = '';
        let emptyLi = document.createElement('li');
        emptyLi.className = 'head-details-empty';
        emptyLi.textContent = 'No transactions for this head.';
        headDetailsList.appendChild(emptyLi);
        return;
    }

    let runningMoneyData = {};
    let runningTotal = 0;
    let allHeads = Object.keys(moneyData);
    if (!allHeads.includes('Main')) allHeads.unshift('Main');
    allHeads.forEach(h => runningMoneyData[h] = 0);

    const allHistory = historyData.slice();
    const headEntries = [];
    allHistory.forEach(entry => {
        let prevHeadBalance = runningMoneyData[entry.head] || 0;
        let prevTotal = runningTotal;

        if (entry.type === 'add') {
            runningMoneyData[entry.head] = prevHeadBalance + entry.amount;
            runningTotal += entry.amount;
        } else {
            runningMoneyData[entry.head] = prevHeadBalance - entry.amount;
            runningTotal -= entry.amount;
        }

        if (entry.head === head) {
            headEntries.push({
                entry,
                prevHeadBalance,
                prevTotal,
                newHeadBalance: runningMoneyData[entry.head],
                newTotal: runningTotal
            });
        }
    });

    let finalBalance = runningMoneyData[head] || 0;
    headDetailsBalance.innerHTML = `Current Balance: ₹${finalBalance}`;

    headEntries.slice().reverse().forEach(obj => {
        const entry = obj.entry;
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateTimeStr = `${dateStr} ${timeStr}`;

        const li = document.createElement('li');
        li.className = `history-type-${entry.type}`;

        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = dateTimeStr;

        const details = document.createElement('span');
        details.className = 'history-details';
        details.innerHTML = `<b>₹${entry.amount}</b> (${entry.head})`;
        if (entry.note && entry.note.trim() !== "") {
            let noteSpan = document.createElement('span');
            noteSpan.className = 'history-note';
            noteSpan.textContent = entry.note;
            details.appendChild(noteSpan);
        }

        const variation = document.createElement('span');
        variation.className = 'history-variation';

        const headArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let headFinalClass = '';
        if (obj.prevHeadBalance < obj.newHeadBalance) {
            headFinalClass = 'variation-final-up';
        } else if (obj.prevHeadBalance > obj.newHeadBalance) {
            headFinalClass = 'variation-final-down';
        } else {
            headFinalClass = 'variation-final';
        }

        const totalArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let totalFinalClass = '';
        if (obj.prevTotal < obj.newTotal) {
            totalFinalClass = 'variation-final-up';
        } else if (obj.prevTotal > obj.newTotal) {
            totalFinalClass = 'variation-final-down';
        } else {
            totalFinalClass = 'variation-final';
        }

        variation.innerHTML =
            `Head: ${obj.prevHeadBalance} ${headArrow} <span class="${headFinalClass}">${obj.newHeadBalance}</span><br>` +
            `Total: ${obj.prevTotal} ${totalArrow} <span class="${totalFinalClass}">${obj.newTotal}</span>`;

        let detailsWrapper = document.createElement('div');
        detailsWrapper.style.display = 'flex';
        detailsWrapper.style.flexDirection = 'column';
        detailsWrapper.appendChild(dateDiv);
        detailsWrapper.appendChild(details);

        li.appendChild(detailsWrapper);
        li.appendChild(variation);

        headDetailsList.appendChild(li);
    });
}

const closeHeadDetailsModalBtn = document.getElementById('closeHeadDetailsModal');
closeHeadDetailsModalBtn.onclick = function() {
    document.getElementById('headDetailsModal').style.display = 'none';
};

// --- Initial Load ---
window.onload = function() {
    updateBalances();
    updateHistory();
};
