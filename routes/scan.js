const express = require('express');
const router = express.Router();
const db = require('../db/setup');
const auth = require('../middleware/auth');

function calcEntropy(str) {
  if (!str.length) return 0;
  const freq = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return parseFloat(Object.values(freq).reduce((acc, n) => { const p = n / str.length; return acc - p * Math.log2(p); }, 0).toFixed(2));
}

function runHeuristic(url) {
  const anomalies = [], warnings = [];
  let riskScore = 0;
  if (!url.startsWith('https')) { anomalies.push('Non-Secure Protocol (HTTP)'); riskScore += 35; }
  if (/bit\.ly|tinyurl|t\.co|goo\.gl/.test(url)) { anomalies.push('URL Shortener Detected'); riskScore += 20; }
  if (url.length > 80) { warnings.push('Excessive URL Length (' + url.length + ' chars)'); riskScore += 10; }
  if (/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(url)) { anomalies.push('Raw IP Address in URL'); riskScore += 40; }
  if (url.split('.').length > 4) { anomalies.push('Suspicious Subdomain Depth'); riskScore += 20; }
  if (/[а-яА-Я]/.test(url)) { anomalies.push('Punycode / Cyrillic Characters'); riskScore += 45; }
  if (/%[0-9a-fA-F]{2}/.test(url)) { anomalies.push('URL Encoding Obfuscation'); riskScore += 15; }
  if (url.includes('@')) { anomalies.push('@ Symbol (Auth Bypass Attempt)'); riskScore += 40; }
  if (/login|verify|secure|account/.test(url)) { warnings.push('Sensitive Keywords in Path'); riskScore += 10; }
  if (/\-{2,}/.test(url)) { warnings.push('Multiple Hyphens (Brand Impersonation Risk)'); riskScore += 10; }
  if (/paypal|google|microsoft|apple|amazon/.test(url)) { warnings.push('Brand Name in URL (Possible Spoofing)'); riskScore += 15; }
  riskScore = Math.min(riskScore, 100);
  let risk_level = 'Low';
  if (riskScore >= 60) risk_level = 'High';
  else if (riskScore >= 25) risk_level = 'Medium';
  return { risk_level, risk_score: riskScore, entropy: calcEntropy(url), anomalies, warnings };
}

// POST /api/scan
router.post('/', auth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });
    const result = runHeuristic(url.trim());
    await db.runAsync(
      'INSERT INTO scans (user_id, url, risk_level, risk_score, anomalies, warnings, entropy) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, url.trim(), result.risk_level, result.risk_score, JSON.stringify(result.anomalies), JSON.stringify(result.warnings), result.entropy]
    );
    await db.runAsync(
      "INSERT INTO vault_records (user_id, category, record_type, url, score, raw_data) VALUES (?, 'scan', 'URL Scan', ?, ?, ?)",
      [req.user.id, url.trim().substring(0, 200), result.risk_score + ' / ' + result.risk_level, JSON.stringify(result)]
    );
    res.json({ ...result, message: 'Scan complete.' });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ message: 'Server error during scan.' });
  }
});

// GET /api/scan/history
router.get('/history', auth, async (req, res) => {
  try {
    const scans = await db.allAsync('SELECT id, url, risk_level, risk_score, entropy, created_at FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json({ scans });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
