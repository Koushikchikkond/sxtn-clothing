# 6XTN — System Architecture & Reactive Technical Design

**Version:** 2.0 (Production Verified)  
**Last Updated:** October 2026  
**Status:** Live & Production Ready  
**Repository:** `Koushikchikkond/sxtn-clothing`  

---

## 1. High-Level System Context

6XTN is an automated, event-driven luxury streetwear e-commerce platform built for high concurrency, zero overselling, automated logistics, and sub-second page performance.

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client Layer (Browser)"]
        UI["Next.js 16 Storefront & Admin UI<br/>(React 19 + Tailwind v4 + Framer Motion)"]
        ZCart["Zustand Cart Store<br/>(Local Storage + Stock Guards)"]
        ZWish["Zustand Wishlist Store<br/>(Guest Mode + Account Sync)"]
        RModal["Razorpay Standard Checkout SDK<br/>(checkout.js)"]
    end

    subgraph EdgeLayer["Edge / Routing Layer (Next.js & Vercel)"]
        MW["Next.js Middleware<br/>(Route Protection & Token Check)"]
        RL["Upstash Redis Rate Limiter<br/>(Sliding Window Token Bucket)"]
    end

    subgraph ServerLayer["Backend API & Server Actions (Node.js)"]
        API_Checkout["/api/create-order<br/>& /api/verify-payment"]
        API_Shiprocket["/api/admin/orders/:id/fulfill<br/>(Shiprocket Dispatcher)"]
        API_Upload["/api/upload<br/>(Cloudflare R2 S3 Upload)"]
        WH_Razorpay["/api/webhooks/razorpay<br/>(Payment Fallback Capture)"]
        WH_Shiprocket["/api/webhooks/shiprocket<br/>(Realtime Courier Tracking)"]
    end

    subgraph CloudServices["External Third-Party Ecosystem"]
        RP["Razorpay Live Gateway<br/>(UPI / Cards / Netbanking)"]
        SR["Shiprocket Logistics Core<br/>(Delhivery / Bluedart / DTDC)"]
        RS["Resend Transactional Email<br/>(orders@6xtn.in / shipping@6xtn.in)"]
        R2["Cloudflare R2 Bucket<br/>(High-Speed CDN Asset Delivery)"]
    end

    subgraph DatabaseLayer["Data & Persistence Layer (Supabase Postgres)"]
        DB[(PostgreSQL 15+ Engine)]
        RLS["Row Level Security Policies"]
        RPC["Atomic Stored Procedures<br/>(decrement_variant_stock)"]
        Auth["Supabase GoTrue Auth<br/>(JWT + Session Cookie)"]
    end

    %% Flow connections
    UI --> MW
    MW --> RL
    RL --> ServerLayer

    ZCart --> UI
    ZWish --> UI
    UI --> RModal

    API_Checkout --> DB
    API_Checkout --> RP
    API_Checkout --> RPC
    API_Checkout --> RS

    RModal --> RP
    RP -.->|Async Webhook| WH_Razorpay
    WH_Razorpay --> DB

    API_Shiprocket --> SR
    SR -.->|Status Webhooks| WH_Shiprocket
    WH_Shiprocket --> DB
    WH_Shiprocket --> RS

    API_Upload --> R2

    ServerLayer --> Auth
    ServerLayer --> RLS
    RLS --> DB
```

---

## 2. Core Reactive State Flow (Client-Side)

The client uses **Zustand** stores with custom persistence middleware and reactive sync mechanisms.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant UI as Product Details / Catalog
    participant CartStore as Zustand Cart Store (cart.store.ts)
    participant WishStore as Zustand Wishlist Store (wishlist.store.ts)
    participant LocalStorage as Local Storage Cache
    participant Supabase as Supabase API

    %% Cart interaction
    User->>UI: Selects Size (e.g. M) & Clicks "Add to Bag"
    UI->>CartStore: addItem(product, variant, requestedQty, dbStock)
    Note over CartStore: Validates: currentQty + requestedQty <= dbStock
    alt Exceeds Available Stock
        CartStore-->>UI: Caps quantity at max stock, returns { added: false, capped: true }
        UI-->>User: Visual warning: "Only X pieces available"
    else Stock Available
        CartStore->>LocalStorage: Persists updated items array
        CartStore-->>UI: Triggers reactive re-render (Bag counter + Drawer open)
    end

    %% Wishlist interaction
    User->>UI: Clicks Bookmark / Wishlist Icon
    UI->>WishStore: toggle(productId)
    alt User is Guest
        WishStore->>LocalStorage: Persists wishlist item IDs
        WishStore-->>UI: Floating toast: "Saved to Wishlist • Sign in to sync"
    else User is Logged In
        WishStore->>Supabase: INSERT / DELETE on public.wishlists
        WishStore->>LocalStorage: Persists synced cache
        WishStore-->>UI: Floating toast: "Saved to Wishlist"
    end
```

---

## 3. End-to-End Order & Payment Reactive Pipeline

This pipeline guarantees financial accuracy and prevents tampering with prices, stock levels, or amounts.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Browser
    participant Checkout as /checkout Page
    participant CreateOrder as /api/create-order
    participant Razorpay as Razorpay Live Gateway
    participant VerifyPayment as /api/verify-payment
    participant Postgres as Supabase PostgreSQL
    participant StockRPC as RPC: decrement_variant_stock
    participant Resend as Resend Email Service

    Customer->>Checkout: Clicks "Pay & Place Order"
    Checkout->>CreateOrder: POST { items, address, guestEmail }
    
    rect rgb(20, 20, 20)
        Note over CreateOrder,Postgres: Server-Side Price & Stock Verification
        CreateOrder->>Postgres: Query product_variants & products (Real-time DB query)
        Postgres-->>CreateOrder: Returns active price & available stock
        Note over CreateOrder: Recalculates subtotal + shippingFee (Never trusts client total)
        Note over CreateOrder: Checks: item.quantity <= variant.stock
    end

    CreateOrder->>Razorpay: orders.create({ amount: verifiedTotalInPaise, currency: "INR" })
    Razorpay-->>CreateOrder: Returns { razorpay_order_id, amount }
    CreateOrder-->>Checkout: Returns { orderId, amount, currency }

    Checkout->>Razorpay: Opens Razorpay Standard Modal (checkout.js)
    Customer->>Razorpay: Authorizes Payment via UPI / Card / Netbanking
    Razorpay-->>Checkout: Returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }

    Checkout->>VerifyPayment: POST { order_id, payment_id, signature, items, address, total }

    rect rgb(20, 20, 20)
        Note over VerifyPayment: Cryptographic HMAC Signature Verification
        VerifyPayment->>VerifyPayment: HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
        Note over VerifyPayment: Compares generated digest === received signature
    end

    alt Signature Matches
        VerifyPayment->>Postgres: INSERT into public.orders (status: 'paid')
        VerifyPayment->>Postgres: INSERT into public.order_items (line items)
        
        loop For Each Purchased Variant
            VerifyPayment->>StockRPC: SELECT decrement_variant_stock(variantId, quantity)
            StockRPC->>Postgres: UPDATE product_variants SET stock = GREATEST(0, stock - qty)
        end

        VerifyPayment->>Resend: sendOrderConfirmationEmail(customerEmail, orderDetails)
        VerifyPayment-->>Checkout: Returns { success: true, orderId }
        Checkout-->>Customer: Redirects to /order-success?order_id=XXX
    else Signature Invalid
        VerifyPayment-->>Checkout: Returns 400 Bad Signature (Order rejected)
    end
```

---

## 4. Atomic Inventory Concurrency Guard

To prevent race conditions during flash drops (e.g., 100 users trying to buy the last 2 pieces simultaneously), stock management is guarded at both the application level and the database engine level.

```mermaid
flowchart TD
    subgraph Layer1["Layer 1: Frontend Guard"]
        A[Customer selects quantity] --> B{Qty <= Available Stock?}
        B -- Yes --> C[Added to Bag Store]
        B -- No --> D[Capped at max available stock]
    end

    subgraph Layer2["Layer 2: Server Verification Guard"]
        E[Customer clicks Checkout] --> F[calculateVerifiedCartTotal]
        F --> G[(Query DB Variants Stock)]
        G --> H{Requested Qty <= DB Stock?}
        H -- No --> I[Abort: 400 Out of Stock Error]
        H -- Yes --> J[Generate Razorpay Order]
    end

    subgraph Layer3["Layer 3: Atomic Stored Procedure Guard"]
        K[Payment Verified Successfully] --> L[Call RPC: decrement_variant_stock]
        L --> M["BEGIN TRANSACTION<br/>SELECT stock FROM product_variants WHERE id = p_variant_id FOR UPDATE"]
        M --> N["UPDATE product_variants<br/>SET stock = GREATEST(0, stock - p_quantity)<br/>WHERE id = p_variant_id"]
        N --> O[(CHECK constraint: stock >= 0)]
        O -- Passed --> P[COMMIT TRANSACTION: Stock Safely Deducted]
        O -- Failed --> Q[ROLLBACK: Transaction Aborted]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
```

---

## 5. Automated Logistics & Shipping Engine (Shiprocket)

Order fulfillment integrates directly with Shiprocket's REST APIs and automated webhooks.

```mermaid
flowchart LR
    subgraph AdminActions["Admin Dashboard (1-Click Fulfillment)"]
        AdminOrder["Admin views Order #ID (status: paid)"]
        BtnFulfill["Click 'Ship with Shiprocket'"]
    end

    subgraph FulfillmentFlow["/api/admin/orders/:id/fulfill"]
        API1["1. Authenticate with Shiprocket API<br/>(9-day cached JWT token)"]
        API2["2. POST /orders/create/adhoc<br/>(Customer Address + SKUs + Parcel Dimensions)"]
        API3["3. POST /courier/assign/awb<br/>(Auto-assigns best rated courier)"]
        API4["4. POST /courier/generate/pickup<br/>(Schedules pickup at warehouse)"]
        API5["5. Update Supabase Orders Table<br/>(status: confirmed, awb_number, tracking_url)"]
        API6["6. Send Resend Confirmation Email<br/>(Includes Live AWB Tracking link)"]
    end

    subgraph CourierLifecycle["Shiprocket Webhook Lifecycle (/api/webhooks/shiprocket)"]
        WH1["Event: Picked Up (Status 7)"] --> WH_Log["Update order notes"]
        WH2["Event: Out for Delivery (Status 17)"] --> WH_Ship["Status -> 'shipped'<br/>Send Out for Delivery Email"]
        WH3["Event: Delivered (Status 9)"] --> WH_Del["Status -> 'delivered'<br/>Send Delivery Success Email"]
        WH4["Event: RTO / Undelivered (Status 14/10)"] --> WH_Alert["Log alert in notes for Admin"]
    end

    AdminOrder --> BtnFulfill
    BtnFulfill --> API1
    API1 --> API2 --> API3 --> API4 --> API5 --> API6
    API4 -.-> CourierLifecycle
```

---

## 6. Security, Rate Limiting & Access Control (RBAC)

```mermaid
flowchart TD
    subgraph Ingress["Incoming HTTP Request"]
        Req["Request to /api/* or /admin/*"]
    end

    subgraph RateLimiting["Upstash Redis Sliding Window Limiter"]
        RL_Check{Rate limit exceeded?}
        RL_Check -- Yes --> HTTP_429["Return 429 Too Many Requests"]
        RL_Check -- No --> Pass_RL["Pass to Route Handler"]
    end

    subgraph AuthRBAC["Role-Based Access Control"]
        Auth_Check{Is Authenticated?}
        Auth_Check -- No --> Redir_Login["Redirect /login or 401 Unauthorized"]
        Auth_Check -- Yes --> Role_Check{profiles.role == 'admin'?}
        Role_Check -- No --> Forbidden["403 Forbidden / Redirect to Homepage"]
        Role_Check -- Yes --> Admin_Access["Full Access to Admin Operations"]
    end

    subgraph PostgresRLS["PostgreSQL Row Level Security (RLS)"]
        RLS_Public["Public: Read-only active products & categories"]
        RLS_Customer["Customer: Read/write own cart, addresses, wishlist, and orders"]
        RLS_Admin["Admin: Full CRUD on all tables via public.is_admin() or service_role"]
    end

    Req --> RL_Check
    Pass_RL --> Auth_Check
    Admin_Access --> PostgresRLS
```

---

## 7. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ ADDRESSES : owns
    PROFILES ||--o{ WISHLISTS : saves
    CATEGORIES ||--o{ PRODUCTS : categorizes
    PRODUCTS ||--|{ PRODUCT_IMAGES : displays
    PRODUCTS ||--|{ PRODUCT_VARIANTS : stocks
    PRODUCTS ||--o{ WISHLISTS : referenced_in
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : fulfills

    PROFILES {
        uuid id PK
        text full_name
        text phone
        text avatar_url
        text role "customer | admin"
        timestamptz created_at
        timestamptz updated_at
    }

    CATEGORIES {
        uuid id PK
        text name
        text slug UK
        text image_url
        int position
        timestamptz created_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text name
        text slug UK
        text description
        numeric price
        numeric compare_at_price
        boolean is_active
        text_array tags
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        text url
        text alt_text
        int position
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        text size "S | M | L | XL | XXL"
        text color
        text sku UK
        int stock "check (stock >= 0)"
        numeric price_override
        timestamptz created_at
    }

    ORDERS {
        uuid id PK
        uuid user_id FK "nullable for guests"
        text guest_email
        text status "pending | paid | confirmed | shipped | delivered | cancelled"
        numeric subtotal
        numeric shipping_fee
        numeric total
        text currency "INR"
        jsonb shipping_address
        text razorpay_order_id
        text razorpay_payment_id
        text razorpay_signature
        text shiprocket_order_id
        text shiprocket_shipment_id
        text awb_number
        text courier_name
        text tracking_url
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid variant_id FK
        text product_name
        text size
        text color
        numeric unit_price
        int quantity
        timestamptz created_at
    }

    ADDRESSES {
        uuid id PK
        uuid user_id FK
        text full_name
        text phone
        text line1
        text line2
        text city
        text state
        text pincode
        text country
        boolean is_default
        timestamptz created_at
        timestamptz updated_at
    }

    WISHLISTS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamptz created_at
    }
```

---

## 8. System Sync Protocol (How to keep this document updated)

Whenever new features, migrations, or third-party integrations are made, update this document according to this table:

| If you modify... | Update this section in `SYSTEM_DESIGN.md` | Specific Diagram / Table to edit |
| :--- | :--- | :--- |
| **New Database Migration** (`supabase/migrations/`) | Section 7 (ERD) & Section 4 (Inventory) | Update Mermaid `erDiagram` with new columns/tables and RPCs |
| **New API Route** (`app/api/`) | Section 1 (Context) & Section 6 (RBAC) | Add route to `ServerLayer` and map permission rules |
| **New Frontend Store / State** (`lib/stores/`) | Section 2 (Client Reactive State) | Update Mermaid `sequenceDiagram` for client state hydration |
| **Payment Gateway or Checkout rules** | Section 3 (Payment Pipeline) | Update HMAC validation, amount rules, or checkout steps |
| **Courier / Logistics updates** | Section 5 (Shipping Engine) | Update Shiprocket endpoints or webhook event status codes |
| **New Auth Roles or Permissions** | Section 6 (Security & RBAC) | Update role hierarchy (`customer`, `admin`, etc.) |

---

*This document is version-controlled directly in the repository and serves as the single source of architectural truth for 6XTN.*
