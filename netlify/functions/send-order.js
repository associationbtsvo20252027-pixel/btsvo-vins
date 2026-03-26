// netlify/functions/send-order.js
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.ASSO_EMAIL || 'associationbtsvo2025.2027@gmail.com';
  if (!RESEND_API_KEY) return { statusCode: 500, body: 'RESEND_API_KEY non configuré' };

  let order;
  try { order = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'JSON invalide' }; }

  const { prenom, nom, email, tel, ville, paiement, message, items, total, date } = order;
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

  const itemsHtml = (items||[]).map(i => {
    const details = [i.appellation, i.exploitation, i.couleur, i.millesime ? 'Millésime '+i.millesime : ''].filter(Boolean).join(' · ');
    return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8df">
        <span style="font-weight:600;color:#1A1008">${i.nom||'—'}</span>
        ${details ? `<br><span style="font-size:12px;color:#6B5B4E">${details}</span>` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8df;text-align:center">${i.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8df;text-align:right;color:#2E5FBF;font-weight:600">${(parseFloat(i.prix)*i.qty).toFixed(2).replace('.',',')} €</td>
    </tr>`;
  }).join('');

  // ── MAIL ADMIN ─────────────────────────────────────────────────
  const htmlAdmin = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8F4EE;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:20px">
  <div style="background:#1B3A6B;border-radius:12px 12px 0 0;padding:24px 32px;border-bottom:3px solid #4A7FE8;text-align:center">
    <p style="color:#7B9FF8;font-size:11px;letter-spacing:.15em;text-transform:uppercase;margin:0 0 6px">Association BTS VO</p>
    <h1 style="color:#fff;font-size:22px;font-weight:300;margin:0;font-style:italic">🍷 Nouvelle commande reçue</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #EDE6D9;border-top:none">
    <div style="background:#F8F4EE;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:.1em;text-transform:uppercase;margin:0 0 10px">Informations client</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#6B5B4E;width:130px">Nom</td><td style="padding:4px 0;font-weight:600;color:#1A1008">${prenom} ${nom}</td></tr>
        <tr><td style="padding:4px 0;color:#6B5B4E">Email</td><td style="padding:4px 0;color:#2E5FBF">${email}</td></tr>
        <tr><td style="padding:4px 0;color:#6B5B4E">Téléphone</td><td style="padding:4px 0;color:#1A1008">${tel||'—'}</td></tr>
        <tr><td style="padding:4px 0;color:#6B5B4E">Retrait</td><td style="padding:4px 0;font-weight:600;color:#1A1008">${ville||'—'}</td></tr>
        <tr><td style="padding:4px 0;color:#6B5B4E">Paiement</td><td style="padding:4px 0;color:#1A1008">${paiement||'Non précisé'}</td></tr>
        <tr><td style="padding:4px 0;color:#6B5B4E">Date</td><td style="padding:4px 0;color:#1A1008">${dateStr} à ${timeStr}</td></tr>
        ${message?`<tr><td style="padding:4px 0;color:#6B5B4E;vertical-align:top">Message</td><td style="padding:4px 0;color:#1A1008;font-style:italic">${message}</td></tr>`:''}
      </table>
    </div>
    <p style="font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:.1em;text-transform:uppercase;margin:0 0 10px">Détail de la commande</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px">
      <thead><tr style="background:#F8F4EE">
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6B5B4E;font-weight:500;text-transform:uppercase">Vin</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6B5B4E;font-weight:500;text-transform:uppercase">Qté</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6B5B4E;font-weight:500;text-transform:uppercase">Prix</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;align-items:center;background:#1B3A6B;border-radius:8px;padding:12px 20px;margin-bottom:16px">
      <span style="color:rgba(255,255,255,.8);font-size:14px">Total commande</span>
      <span style="color:#7B9FF8;font-size:22px;font-weight:600">${(total||0).toFixed(2).replace('.',',')} €</span>
    </div>
    <p style="font-size:12px;color:#6B5B4E;line-height:1.6;border-left:3px solid #4A7FE8;padding-left:12px">
      Pensez à recontacter le client pour confirmer la commande et organiser le retrait.<br>
      <strong>Email client :</strong> <a href="mailto:${email}" style="color:#2E5FBF">${email}</a> — <strong>Tél :</strong> ${tel||'—'}
    </p>
  </div>
  <div style="text-align:center;padding:16px;border-radius:0 0 12px 12px;background:#EDE6D9">
    <p style="color:#6B5B4E;font-size:11px;margin:0">Association BTS VO — Millésime 2025-2027</p>
  </div>
</div></body></html>`;

  // ── MAIL CLIENT ─────────────────────────────────────────────────
  const htmlClient = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8F4EE;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:20px">
  <div style="background:#1B3A6B;border-radius:12px 12px 0 0;padding:24px 32px;border-bottom:3px solid #4A7FE8;text-align:center">
    <p style="color:#7B9FF8;font-size:11px;letter-spacing:.15em;text-transform:uppercase;margin:0 0 6px">Association BTS VO</p>
    <h1 style="color:#fff;font-size:22px;font-weight:300;margin:0;font-style:italic">✓ Commande bien reçue !</h1>
  </div>
  <div style="background:#fff;padding:28px 32px;border:1px solid #EDE6D9;border-top:none">
    <p style="font-size:15px;color:#1A1008;line-height:1.7">Bonjour <strong>${prenom}</strong>,</p>
    <p style="font-size:14px;color:#6B5B4E;line-height:1.8;margin-bottom:20px">
      Nous avons bien reçu votre commande et nous vous en remercions chaleureusement.<br>
      Notre équipe prendra contact avec vous prochainement à cette adresse ou au <strong>${tel||'numéro indiqué'}</strong> pour confirmer les modalités de retrait.<br><br>
      <strong>Délai habituel :</strong> 2 à 3 semaines entre la commande et la remise des bouteilles.
    </p>
    <div style="background:#F8F4EE;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:.1em;text-transform:uppercase;margin:0 0 10px">Récapitulatif</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:3px 0;color:#6B5B4E">Point de retrait</td><td style="padding:3px 0;font-weight:600;color:#1A1008;text-align:right">${ville||'—'}</td></tr>
        <tr><td style="padding:3px 0;color:#6B5B4E">Paiement envisagé</td><td style="padding:3px 0;color:#1A1008;text-align:right">${paiement||'Non précisé'}</td></tr>
      </table>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px">
      <thead><tr style="background:#F8F4EE">
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6B5B4E;font-weight:500;text-transform:uppercase">Vin</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6B5B4E;font-weight:500;text-transform:uppercase">Qté</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6B5B4E;font-weight:500;text-transform:uppercase">Prix</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;align-items:center;background:#1B3A6B;border-radius:8px;padding:12px 20px;margin-bottom:20px">
      <span style="color:rgba(255,255,255,.8);font-size:14px">Total</span>
      <span style="color:#7B9FF8;font-size:22px;font-weight:600">${(total||0).toFixed(2).replace('.',',')} €</span>
    </div>
    <p style="font-size:13px;color:#6B5B4E;line-height:1.7;border-left:3px solid #4A7FE8;padding-left:12px;font-style:italic">
      Pour toute question, contactez-nous à <a href="mailto:${TO_EMAIL}" style="color:#2E5FBF">${TO_EMAIL}</a>
    </p>
  </div>
  <div style="text-align:center;padding:16px;border-radius:0 0 12px 12px;background:#EDE6D9">
    <p style="color:#6B5B4E;font-size:11px;margin:0">Association BTS VO — Millésime 2025-2027</p>
    <p style="color:#6B5B4E;font-size:10px;margin:4px 0 0">L'abus d'alcool est dangereux pour la santé</p>
  </div>
</div></body></html>`;

  try {
    // Mail admin uniquement
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Association BTS VO <onboarding@resend.dev>',
        to: [TO_EMAIL],
        reply_to: email,
        subject: `🍷 Nouvelle commande — ${prenom} ${nom} (${(total||0).toFixed(2).replace('.',',')} €)`,
        html: htmlAdmin
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return { statusCode: 500, body: `Resend error: ${err}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
