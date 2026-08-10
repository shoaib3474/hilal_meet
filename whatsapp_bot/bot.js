const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const { getShopConfig, createOrderInWebsite } = require('./config');

// ── In-memory session store (tracks each customer's order progress) ──
const sessions = {};
let SHOP = null;

// ── Build the product menu text ──
function buildMenu() {
  const products = SHOP?.products || [];
  const categories = {};
  for (const p of products) {
    const categoryName = (p.category || p.name || '').toLowerCase();
    const cat = categoryName.includes('beef') ? '🥩 Beef'
              : categoryName.includes('mutton') || categoryName.includes('lamb') ? '🐑 Lamb & Mutton'
              : categoryName.includes('chicken') ? '🍗 Chicken'
              : '📦 Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  }
  let menu = `*${SHOP?.shopName || 'Shop'} — Price List*\n`;
  menu += '─────────────────────\n';
  for (const [cat, items] of Object.entries(categories)) {
    menu += `\n${cat}\n`;
    for (const item of items) {
      menu += `  *${item.id}.* ${item.name} — Rs.${item.price}/${item.unit || 'item'}\n`;
    }
  }
  menu += '\n─────────────────────';
  return menu;
}

// ── Build order confirmation text ──
function buildOrderSummary(session) {
  let text = `✅ *Order Summary*\n`;
  text += `─────────────────────\n`;
  text += `👤 Name: ${session.customerName}\n`;
  text += `📍 Address: ${session.address}\n\n`;
  text += `*Items:*\n`;
  let total = 0;
  for (const item of session.orderItems) {
    const subtotal = item.price * item.qty;
    total += subtotal;
    text += `  • ${item.name} x${item.qty}${item.unit} = Rs.${subtotal}\n`;
  }
  text += `─────────────────────\n`;
  text += `💰 *Total: Rs.${total}*\n`;
  text += `🚚 Delivery: Rs.100\n`;
  text += `💳 *Grand Total: Rs.${total + 100}*\n\n`;
  text += `*Payment:*\n${SHOP?.payment || ''}`;
  return text;
}

// ── Main message handler ──
async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;
  if (msg.key.fromMe) return;

  const text = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ''
  ).trim().toLowerCase();

  if (!text) return;

  // Get or create session
  if (!sessions[jid]) sessions[jid] = { step: 'idle' };
  const session = sessions[jid];

  const send = async (content) => {
    await sock.sendMessage(jid, { text: content });
  };

  // ── MAIN MENU trigger words ──
  const mainMenuTriggers = ['hi', 'hello', 'salam', 'السلام', 'start', 'menu', 'help', 'helo', 'hey'];
  const isMainMenu = mainMenuTriggers.some(t => text.includes(t));

  // ── FAQ triggers ──
  const isFaqPrice    = text.includes('price') || text.includes('rate') || text.includes('cost') || text.includes('قیمت');
  const isFaqHours    = text.includes('hour') || text.includes('time') || text.includes('open') || text.includes('close') || text.includes('وقت');
  const isFaqLocation = text.includes('location') || text.includes('address') || text.includes('where') || text.includes('پتہ');
  const isFaqDeliver  = text.includes('deliver') || text.includes('shipping') || text.includes('ڈیلیوری');
  const isFaqPayment  = text.includes('payment') || text.includes('pay') || text.includes('easypaisa') || text.includes('jazzcash');
  const isOrder       = text === '1' || text.includes('order') || text.includes('buy') || text.includes('آرڈر');
  const isCancel      = text === 'cancel' || text === 'stop' || text.includes('cancel');

  // ── CANCEL anytime ──
  if (isCancel && session.step !== 'idle') {
    sessions[jid] = { step: 'idle' };
    await send(`❌ Order cancelled.\n\nType *hi* to start again.`);
    return;
  }

  // ── ORDER FLOW (multi-step) ──
  if (session.step === 'awaiting_name') {
    session.customerName = text;
    session.step = 'awaiting_items';
    await send(
      `Thank you, *${session.customerName}*! 👋\n\n` +
      buildMenu() +
      `\n\nPlease type your order like this:\n` +
      `*1:2, 9:1.5, 5:1*\n` +
      `_(Item number : Quantity in kg)_\n\n` +
      `Type *cancel* to stop.`
    );
    return;
  }

  if (session.step === 'awaiting_items') {
    // Parse format like "1:2, 9:1.5"
    const parts = text.split(',').map(s => s.trim());
    const orderItems = [];
    let parseError = false;

    for (const part of parts) {
      const [idStr, qtyStr] = part.split(':');
      const id  = parseInt(idStr?.trim());
      const qty = parseFloat(qtyStr?.trim());
      const product = (SHOP?.products || []).find(p => p.id === id);

      if (!product || isNaN(qty) || qty <= 0) {
        parseError = true;
        break;
      }
      orderItems.push({ ...product, qty });
    }

    if (parseError || orderItems.length === 0) {
      await send(
        `⚠️ I couldn't understand that. Please use this format:\n\n` +
        `*1:2, 9:1.5*\n` +
        `_(Item number : Quantity in kg)_\n\n` +
        `Type *menu* to see the item list again, or *cancel* to stop.`
      );
      return;
    }

    session.orderItems = orderItems;
    session.step = 'awaiting_address';
    await send(`📍 Please send your *delivery address*:`);
    return;
  }

  if (session.step === 'awaiting_address') {
    session.address = text;
    session.step = 'awaiting_confirm';
    const summary = buildOrderSummary(session);
    await send(
      summary +
      `\n\n─────────────────────\n` +
      `Reply *YES* to confirm your order\nReply *NO* to cancel`
    );
    return;
  }

  if (session.step === 'awaiting_confirm') {
    if (text === 'yes' || text === 'y' || text === 'ok' || text === 'confirm') {
      session.step = 'idle';

      const total = session.orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      const orderPayload = {
        id: `WA-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        customer: {
          name: session.customerName,
          email: '',
          phone: jid.replace('@s.whatsapp.net', '')
        },
        items: session.orderItems.map((item) => ({
          productId: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        subtotal: total,
        delivery: 100,
        total: total + 100,
        address: session.address,
        paymentMethod: 'whatsapp',
        notes: `WhatsApp order from ${jid.replace('@s.whatsapp.net', '')}`
      };

      try {
        await createOrderInWebsite(orderPayload);
        console.log(`✅ Order synced to website: ${orderPayload.id}`);
      } catch (error) {
        console.error('⚠️ Could not sync order to website:', error.message);
      }

      // Notify owner on WhatsApp
      const ownerJid = `${SHOP?.ownerWhatsApp || '000000000000'}@s.whatsapp.net`;
      const ownerMsg =
        `🔔 *NEW ORDER RECEIVED!*\n` +
        `─────────────────────\n` +
        `From: ${jid.replace('@s.whatsapp.net','')}\n` +
        buildOrderSummary(session);
      await sock.sendMessage(ownerJid, { text: ownerMsg });

      await send(
        `🎉 *Order Confirmed!*\n\n` +
        `Thank you *${session.customerName}*! Your order has been placed.\n\n` +
        `We will contact you shortly to confirm delivery time.\n\n` +
        `📞 Questions? Call us: ${SHOP.phone}\n\n` +
        `Type *hi* to place another order.`
      );
      sessions[jid] = { step: 'idle' };
    } else {
      sessions[jid] = { step: 'idle' };
      await send(`❌ Order cancelled. Type *hi* to start again.`);
    }
    return;
  }

  // ── FAQ RESPONSES (work anytime) ──
  if (isFaqPrice || (isMainMenu && false)) {
    // handled below via menu
  }

  if (isFaqHours) {
    await send(`🕐 *Our Hours*\n\n${SHOP?.hours || ''}\n\n📞 ${SHOP?.phone || ''}`);
    return;
  }

  if (isFaqLocation) {
    await send(`📍 *Our Location*\n\n${SHOP?.location || ''}\n\nType *hi* to see the full menu.`);
    return;
  }

  if (isFaqDeliver) {
    await send(`🚚 *Delivery Info*\n\n${SHOP?.delivery || ''}`);
    return;
  }

  if (isFaqPayment) {
    await send(`💳 *Payment Methods*\n\n${SHOP?.payment || ''}`);
    return;
  }

  // ── MAIN WELCOME MENU ──
  if (isMainMenu) {
    sessions[jid] = { step: 'idle' };
    await send(
      `السلام علیکم! 👋\n\n` +
      `Welcome to *${SHOP?.shopName || 'Our Shop'}*\n\n` +
      `Please choose an option:\n\n` +
      `*1.* 📋 View Menu & Prices\n` +
      `*2.* 🛒 Place an Order\n` +
      `*3.* 🕐 Shop Hours\n` +
      `*4.* 📍 Our Location\n` +
      `*5.* 🚚 Delivery Info\n` +
      `*6.* 💳 Payment Methods\n\n` +
      `_Reply with a number (1–6)_`
    );
    return;
  }

  // ── NUMBERED MENU SELECTION ──
  if (session.step === 'idle') {
    if (text === '1') {
      await send(buildMenu() + `\n\nType *2* to place an order!`);
      return;
    }
    if (text === '2' || isOrder) {
      session.step = 'awaiting_name';
      await send(`🛒 Let's place your order!\n\nFirst, what is your *name*?`);
      return;
    }
    if (text === '3') {
      await send(`🕐 *Our Hours*\n\n${SHOP?.hours || ''}`);
      return;
    }
    if (text === '4') {
      await send(`📍 *Our Location*\n\n${SHOP?.location || ''}`);
      return;
    }
    if (text === '5') {
      await send(`🚚 *Delivery Info*\n\n${SHOP?.delivery || ''}`);
      return;
    }
    if (text === '6') {
      await send(`💳 *Payment Methods*\n\n${SHOP?.payment || ''}`);
      return;
    }
  }

  // ── DEFAULT fallback ──
  await send(`Sorry, I didn't understand that. 😊\n\nType *hi* to see the main menu.`);
}

// ── Start the bot ──
async function startBot() {
  SHOP = await getShopConfig();
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
  });

  // Save credentials whenever updated
  sock.ev.on('creds.update', saveCreds);

  // Handle connection
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nOpen WhatsApp → Three dots → Linked Devices → Link a Device\n');
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    }
    if (connection === 'open') {
      console.log(`\n✅ Bot is LIVE! Connected to WhatsApp.`);
      console.log(`📦 Shop: ${SHOP?.shopName || 'Unknown shop'}`);
      console.log(`🛒 Products loaded: ${SHOP?.products?.length || 0}`);
      console.log(`\nWaiting for customer messages...\n`);
    }
  });

  // Handle messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error('Error handling message:', err.message);
      }
    }
  });
}

startBot();
