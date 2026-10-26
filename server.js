const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ---> PUT YOUR EXACT INFINITYFREE LINK HERE <---
const INFINITYFREE_URL = 'contact-application-form.42web.io';

app.get('*', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PT Grant Portal | Official Redirect</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div class="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-lg">
                <i class="fas fa-shield-alt text-2xl"></i>
            </div>
            
            <h1 class="text-2xl font-bold text-white mb-2">PT Grant Portal</h1>
            <p class="text-slate-400 text-sm mb-8 leading-relaxed">
                Click the button below to access the official application and record submission portal.
            </p>
            
            <a href="${INFINITYFREE_URL}" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition block transform hover:-translate-y-0.5">
                Access Application Portal <i class="fas fa-arrow-right ml-2"></i>
            </a>
        </div>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
