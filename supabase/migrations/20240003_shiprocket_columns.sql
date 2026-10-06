-- ============================================================
-- SXTN — Shiprocket Columns Migration
-- Adds shipping-specific columns to the orders table so we can
-- store Shiprocket order IDs, shipment IDs, AWB tracking numbers,
-- courier names, and tracking URLs returned after creating a shipment.
--
-- Run via: paste into Supabase SQL Editor → Run
-- ============================================================

alter table public.orders
  add column if not exists shiprocket_order_id    text,
  add column if not exists shiprocket_shipment_id text,
  add column if not exists awb_number             text,
  add column if not exists courier_name           text,
  add column if not exists tracking_url           text;

-- Index for fast webhook lookups by Shiprocket order ID
create index if not exists orders_shiprocket_order_id_idx
  on public.orders(shiprocket_order_id)
  where shiprocket_order_id is not null;

-- Index for AWB (tracking number) lookups
create index if not exists orders_awb_number_idx
  on public.orders(awb_number)
  where awb_number is not null;
