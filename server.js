const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ---> PUT YOUR EXACT INFINITYFREE HTTP URL HERE <---
const INFINITYFREE_URL = 'contact-application-form.42web.io';

// Server-level 302 Redirect (Bypasses HTTPS -> HTTP script blocks)
app.get('*', (req, res) => {
    res.redirect(302, INFINITYFREE_URL);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
