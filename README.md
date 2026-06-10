<div align="center">

# 🛒 ManoMano — Multi-Vendor E-Commerce Marketplace

**A full-featured, three-sided marketplace where customers shop, sellers manage storefronts, and admins oversee the entire platform — complete with real-time chat, order management, and seller payouts.**

![Status](https://img.shields.io/badge/status-production-success)
![Lines of Code](https://img.shields.io/badge/codebase-30K%2B%20lines-blueviolet)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Material UI](https://img.shields.io/badge/MUI-5-007FFF?logo=mui&logoColor=white)](https://mui.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com)

</div>

---

## Overview

**ManoMano** is a production multi-vendor marketplace built in React — a complete platform with three distinct user roles, each with its own dashboard, authentication flow, and feature set. Customers browse and buy, independent sellers manage their own stores and orders, and admins control the entire ecosystem.

At over **30,000 lines of code**, this is a large-scale application with real-time messaging between buyers and sellers, live presence indicators, image-optimized product catalogs, a full cart-and-checkout flow, and a seller payout/withdrawal system.

> Built by **[DG Technology](https://dgtechnology.com)** — engineered by Faiz Ullah.

---

## The Three Sides of the Marketplace

### 🛍️ Customer
- Browse products by category with search and filtering
- Product detail pages with image galleries
- Shopping cart and checkout flow
- Order tracking and history
- Real-time chat with sellers
- Account registration and dashboard

### 🏪 Seller
- Self-service registration and store setup
- Product listing management (create, edit, inventory)
- Order management with detailed order pages and status updates
- Real-time chat with customers and admin
- Earnings tracking and **withdrawal requests**
- Live online/offline presence indicators

### 🛡️ Admin
- Full platform oversight dashboard
- Seller and customer management
- Order monitoring across all vendors
- **Withdrawal request approval system**
- Real-time chat with all sellers
- Platform-wide analytics

---

## Key Features

- 💬 **Real-time chat system** — Firestore-powered messaging between customers, sellers, and admin with unread counts, typing presence, and live online/offline status via heartbeat
- 🖼️ **Optimized media pipeline** — Cloudinary integration with automatic format/quality optimization (`q_auto,f_auto`) using secure unsigned upload presets
- 🔐 **Three-role authentication** — separate, protected auth flows for customers, sellers, and admins with route guards and session persistence
- 💸 **Seller payout system** — sellers request withdrawals, admins review and approve through a dedicated manager
- 📦 **Complete order lifecycle** — from cart → checkout → seller fulfillment → status updates → customer tracking
- 🔔 **Notification sounds** — audio alerts for new messages and orders
- 📱 **Fully responsive** — mobile bottom navigation, adaptive layouts via MUI breakpoints

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router |
| **UI Framework** | Material UI (MUI 5) with custom theming |
| **Database** | Firebase Firestore (real-time) |
| **Auth** | Firebase Authentication |
| **Realtime DB** | Firebase Realtime Database (presence) |
| **Storage** | Firebase Storage + Cloudinary (media) |
| **State** | React hooks + Context (NotificationSound) |

---

## Project Structure

```
src/
├── App.js                          # Root: routing + 3 protected route guards
├── firebase.js                     # Firebase init (Auth, Firestore, RTDB, Storage)
├── components/
│   ├── HomePage.js                 # Customer storefront (7,300+ lines)
│   ├── AdminDashboard.js           # Admin control panel (6,900+ lines)
│   ├── SellerDashboard.js          # Seller storefront manager (5,900+ lines)
│   ├── CustomerDashboard.js        # Customer account area (2,200+ lines)
│   ├── SellerOrderDetailsPage.js   # Per-order fulfillment view
│   ├── WithdrawalRequestsManager.js# Payout approval system
│   ├── Cart.js / ProductDetail.js  # Shopping flow
│   ├── ChatComponents/             # Chat, ChatList, ChatWindow, Message, ChatInput
│   └── [Customer/Seller/Admin]Login & Register
└── utils/
    ├── cloudinaryConfig.js         # Media optimization
    ├── sellerPresence.js           # Online/offline heartbeat
    ├── notificationSound.js        # Audio alert provider
    └── chatCleanup.js
```

---

## Engineering Highlights

**Real-time everywhere.** The chat system uses Firestore `onSnapshot` listeners so messages, unread counts, and presence update instantly across all three roles without polling. Seller presence is tracked via a heartbeat that writes `isOnline` and `lastSeen` and cleans up on tab close or visibility change.

**Security-conscious media handling.** Cloudinary uploads use unsigned presets — no API secret ever ships in client code. Image URLs are generated with automatic quality and format optimization to keep the catalog fast.

**Role isolation done right.** Three independent authentication systems with dedicated route guards (`ProtectedAdminRoute`, `ProtectedSellerRoute`, `ProtectedCustomerRoute`), each persisting sessions appropriately so the wrong role can never reach the wrong dashboard.

---

## Setup

```bash
npm install

# Create .env with your own credentials:
# REACT_APP_FIREBASE_API_KEY=...
# REACT_APP_FIREBASE_AUTH_DOMAIN=...
# REACT_APP_FIREBASE_PROJECT_ID=...
# REACT_APP_CLOUDINARY_CLOUD_NAME=...
# REACT_APP_CLOUDINARY_UPLOAD_PRESET=...

npm start    # → http://localhost:3000
```

> **Note:** all credentials load from environment variables. No secrets are committed to the repository.

---

<div align="center">

**Designed & engineered by Faiz Ullah**
Full-Stack Developer · React Specialist · Founder of [DG Technology](https://dgtechnology.com)

📧 contact@faizullah.pk · 🌐 [faizullah.pk](https://faizullah.pk)

*Built with precision by DG Technology* 💙

</div>
