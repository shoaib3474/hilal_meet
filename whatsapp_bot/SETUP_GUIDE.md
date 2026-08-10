# WhatsApp Meat Shop Bot — Complete Setup Guide

---

## PART 1 — Test on Your Own PC First (Windows)

### Step 1: Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (big green button)
3. Install it — click Next, Next, Finish
4. Open **Command Prompt** (press Win+R, type `cmd`, press Enter)
5. Type this to confirm it installed:
   ```
   node --version
   ```
   You should see something like `v20.11.0`

---

### Step 2: Put the bot files on your PC
1. Create a folder on your Desktop called `meat-bot`
2. Copy these 3 files into it:
   - `bot.js`
   - `config.js`
   - `package.json`
   - `ecosystem.config.js`

---

### Step 3: Edit config.js with your shop details
Open `config.js` in Notepad and change:
- `shopName` → Your real shop name
- `ownerWhatsApp` → Your WhatsApp number (with country code, no + sign)
  - Example: Pakistan number 0300-1234567 becomes `"923001234567"`
- `phone`, `location`, `hours`, `payment`, `delivery` → your real info
- Edit the `products` list — change names and prices

---

### Step 4: Install and run the bot
1. Open Command Prompt
2. Navigate to your folder:
   ```
   cd Desktop\meat-bot
   ```
3. Install packages (only once):
   ```
   npm install
   ```
4. Start the bot:
   ```
   node bot.js
   ```
5. A QR code will appear in the terminal
6. On your phone: open WhatsApp → 3 dots (top right) → Linked Devices → Link a Device
7. Scan the QR code
8. You will see: ✅ Bot is LIVE!

---

### Step 5: Test it
- From another phone, send "hi" to your business WhatsApp number
- The bot should reply with the welcome menu
- Try ordering: reply 2, then enter your name, then order items

---

---

## PART 2 — Deploy FREE on Oracle Cloud (Runs 24/7 Forever)

### Step 1: Create Oracle Cloud Free Account
1. Go to: https://cloud.oracle.com/free
2. Click **Start for free**
3. Fill in your details:
   - Country: Pakistan
   - Email address
   - Password
4. You will need a credit/debit card for verification — **they will NOT charge you**
   - A Visa/Mastercard debit card works (HBL, UBL, Meezan etc.)
   - Oracle puts a $1 hold temporarily, then releases it
5. Verify your email, then verify your phone
6. Wait 5–10 minutes for account activation email

---

### Step 2: Create a Free Virtual Server (VM)
1. Log into Oracle Cloud at https://cloud.oracle.com
2. Click the **hamburger menu** (≡) top left
3. Go to: **Compute → Instances**
4. Click **Create Instance**
5. Fill in:
   - Name: `whatsapp-bot`
   - **Image**: Click "Change Image" → Select **Ubuntu 22.04**
   - **Shape**: Make sure it says **VM.Standard.E2.1.Micro** (this is the FREE one)
6. Under **Add SSH keys**:
   - Select **Generate a key pair for me**
   - Click **Save Private Key** — this downloads a `.key` file to your PC. KEEP IT SAFE.
7. Click **Create**
8. Wait 2 minutes — the instance will show as **Running** (green dot)
9. Note down the **Public IP address** shown on the instance page

---

### Step 3: Open the firewall port (very important)
By default Oracle blocks all traffic. You need to allow SSH:
1. On the instance page, scroll down to **Primary VNIC**
2. Click the subnet link
3. Click **Default Security List**
4. Click **Add Ingress Rules**
5. Set:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port: `22`
6. Click **Add Ingress Rules**

---

### Step 4: Connect to your server from Windows
1. Download **PuTTY** from https://putty.org (free SSH client)
2. Also download **PuTTYgen** (comes with PuTTY installer)
3. Convert your Oracle key file:
   - Open PuTTYgen
   - Click **Load** → select your downloaded `.key` file
   - Click **Save private key** → save as `oracle-bot.ppk`
4. Open PuTTY:
   - Host Name: paste your Oracle server's **Public IP**
   - Port: 22
   - Go to Connection → SSH → Auth → Credentials
   - Browse and select `oracle-bot.ppk`
   - Click **Open**
5. When asked username, type: `ubuntu` and press Enter
6. You are now inside your free server!

---

### Step 5: Install Node.js on the server
Type these commands one by one (press Enter after each):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

You should see the Node.js version.

---

### Step 6: Upload your bot files to the server
On your Windows PC:
1. Download **WinSCP** from https://winscp.net (free, safe)
2. Open WinSCP
3. New Site:
   - Protocol: SFTP
   - Host: your Oracle Public IP
   - Username: ubuntu
   - Click **Advanced** → SSH → Authentication → select your `oracle-bot.ppk`
4. Click **Login**
5. On the right panel (server), create a folder called `meat-bot`
6. Drag and drop your 4 files from your PC into that folder:
   - `bot.js`
   - `config.js`
   - `package.json`
   - `ecosystem.config.js`

---

### Step 7: Install bot packages on the server
Back in PuTTY, type:

```bash
cd meat-bot
npm install
```

Wait for it to finish.

---

### Step 8: Install PM2 (keeps bot running 24/7)
PM2 is a free tool that restarts your bot automatically if it crashes:

```bash
sudo npm install -g pm2
```

---

### Step 9: Start the bot and scan QR code
```bash
node bot.js
```

A QR code will appear in your PuTTY terminal.

On your phone: WhatsApp → 3 dots → Linked Devices → Link a Device → Scan the QR code

After scanning you will see: ✅ Bot is LIVE!

Press **Ctrl+C** to stop it, then start it properly with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy the command that `pm2 startup` gives you and run it. This makes the bot start automatically even if the server restarts.

---

### Step 10: Verify it is running
```bash
pm2 status
```

You should see `meat-shop-bot` with status **online**.

---

### Step 11: Check logs anytime
```bash
pm2 logs meat-shop-bot
```

Press Ctrl+C to exit logs.

---

## PART 3 — How to update config or products later

1. Edit `config.js` on your PC
2. Upload it again with WinSCP (overwrite the old one)
3. In PuTTY type:
   ```bash
   pm2 restart meat-shop-bot
   ```

---

## Useful Commands Summary

| Command | What it does |
|---|---|
| `pm2 status` | Check if bot is running |
| `pm2 logs meat-shop-bot` | See live messages/errors |
| `pm2 restart meat-shop-bot` | Restart after config change |
| `pm2 stop meat-shop-bot` | Stop the bot |
| `pm2 start ecosystem.config.js` | Start the bot |

---

## Cost Summary

| Item | Cost |
|---|---|
| Oracle Cloud VM | FREE forever |
| Node.js | FREE |
| Baileys library | FREE |
| PM2 | FREE |
| Bot itself | FREE |
| **TOTAL** | **Rs. 0 / month** |

---

## If something goes wrong

- **QR code expired?** → Run `node bot.js` again, scan fresh QR
- **Bot stopped?** → Run `pm2 start ecosystem.config.js`
- **Session expired?** → Delete the `auth_info` folder and scan QR again:
  ```bash
  rm -rf auth_info
  node bot.js
  ```
- **Number banned?** → Use a different SIM/number. Always use a dedicated business number.
