const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set your Admin Portal Password here or via Render Environment Variable (Key: ADMIN_PASSWORD)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ptgrant2026';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'entries.json');

// Helper to load entries safely
function getEntries() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        return [];
    }
}

// Handle Contact Form Submission
app.post('/submit', (req, res) => {
    const { firstName, lastName, phone, email, preference } = req.body;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    // Capture visitor IP address
    const clientIp = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress;

    const newEntry = {
        id: Date.now(),
        timestamp,
        clientIp: clientIp || 'Unknown',
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        email: email || '',
        preference: preference || ''
    };

    const entries = getEntries();
    entries.unshift(newEntry); // Put latest submissions first

    fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), (err) => {
        if (err) {
            console.error('Failed to write entry:', err);
            return res.status(500).json({ status: 'error' });
        }
        console.log(`New entry saved for ${firstName} ${lastName} (IP: ${clientIp})`);
        res.json({ status: 'success' });
    });
});

// Admin Authentication API
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Admin Password' });
    }
});

// Admin Data API
app.post('/api/admin/entries', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, entries: getEntries() });
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
});

// Serve Admin Portal Directly (No separate HTML file needed!)
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal | PT-Grant Submissions</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
        body { background: #0f172a; color: #f8fafc; min-height: 100vh; padding: 20px; }
        .container { max-width: 1100px; margin: 0 auto; }
        
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #334155; margin-bottom: 25px; }
        .header h1 { font-size: 24px; color: #ffffff; }
        .header p { font-size: 13px; color: #94a3b8; }

        .login-card { max-width: 400px; margin: 80px auto; background: #1e293b; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; }
        .login-card h2 { margin-bottom: 15px; }
        .login-card input { width: 100%; padding: 12px; border: 1px solid #334155; background: #0f172a; color: white; border-radius: 8px; margin-bottom: 15px; font-size: 14px; }
        .btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn:hover { opacity: 0.9; }

        #portalView { display: none; }
        .actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; }
        .search-box { padding: 10px 15px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 8px; width: 300px; font-size: 14px; }
        
        table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; }
        th, td { padding: 14px 18px; text-align: left; font-size: 13px; }
        th { background: #334155; color: #cbd5e1; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        tr { border-bottom: 1px solid #334155; }
        tr:last-child { border-bottom: none; }
        tr:hover { background: #24334a; }
        
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-email { background: rgba(79, 70, 229, 0.2); color: #818cf8; border: 1px solid #4f46e5; }
        .badge-phone { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid #06b6d4; }

        .btn-refresh { width: auto; padding: 10px 20px; font-size: 13px; }
        .error-msg { color: #ef4444; font-size: 13px; margin-top: 10px; display: none; }
    </style>
</head>
<body>

<div class="container">
    <div id="loginCard" class="login-card">
        <h2>PT-Grant Admin</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">Enter your admin password to view entries</p>
        <input type="password" id="adminPassword" placeholder="Enter Password">
        <button class="btn" onclick="login()">Access Portal</button>
        <div id="loginError" class="error-msg">Incorrect Password</div>
    </div>

    <div id="portalView">
        <div class="header">
            <div>
                <h1>PT-Grant Submissions Dashboard</h1>
                <p>Live entries captured from visitors</p>
            </div>
            <button class="btn btn-refresh" onclick="fetchEntries()">🔄 Refresh Data</button>
        </div>

        <div class="actions-bar">
            <input type="text" id="searchInput" class="search-box" placeholder="Search entries..." onkeyup="filterEntries()">
            <div style="font-size: 13px; color: #94a3b8;">Total Entries: <strong id="totalCount" style="color: #fff;">0</strong></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Date / Time</th>
                    <th>Visitor IP</th>
                    <th>Full Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Preference</th>
                </tr>
            </thead>
            <tbody id="entriesTable">
            </tbody>
        </table>
    </div>
</div>

<script>
    let currentPassword = '';
    let allEntries = [];

    function login() {
        const pass = document.getElementById('adminPassword').value;
        fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentPassword = pass;
                document.getElementById('loginCard').style.display = 'none';
                document.getElementById('portalView').style.display = 'block';
                fetchEntries();
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        });
    }

    function fetchEntries() {
        fetch('/api/admin/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allEntries = data.entries;
                renderTable(allEntries);
            }
        });
    }

    function renderTable(entries) {
        const tbody = document.getElementById('entriesTable');
        document.getElementById('totalCount').innerText = entries.length;

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: #64748b;">No contact entries found yet.</td></tr>';
            return;
        }

        tbody.innerHTML = entries.map(e => \`
            <tr>
                <td style="color: #94a3b8;">\${e.timestamp}</td>
                <td><code style="background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 11px;">\${e.clientIp}</code></td>
                <td><strong>\${e.firstName} \${e.lastName}</strong></td>
                <td><a href="tel:\${e.phone}" style="color: #38bdf8; text-decoration: none;">\${e.phone}</a></td>
                <td><a href="mailto:\${e.email}" style="color: #38bdf8; text-decoration: none;">\${e.email}</a></td>
                <td>
                    <span class="badge \${e.preference === 'Email' ? 'badge-email' : 'badge-phone'}">
                        \${e.preference}
                    </span>
                </td>
            </tr>
        \`).join('');
    }

    function filterEntries() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filtered = allEntries.filter(e => 
            e.firstName.toLowerCase().includes(query) ||
            e.lastName.toLowerCase().includes(query) ||
            e.email.toLowerCase().includes(query) ||
            e.phone.toLowerCase().includes(query) ||
            e.clientIp.toLowerCase().includes(query)
        );
        renderTable(filtered);
    }
</script>

</body>
</html>
    `);
});

// Serve Main Contact Form UI
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
