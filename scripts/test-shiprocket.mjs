import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found at project root!");
  process.exitCode = 1;
}

const envContent = fs.readFileSync(envPath, "utf8");

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) return "";
  let val = match[1].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  return val;
}

async function run() {
  const email = getEnv("SHIPROCKET_EMAIL");
  const password = getEnv("SHIPROCKET_PASSWORD");
  const pickupLoc = getEnv("SHIPROCKET_PICKUP_LOCATION") || "Primary";
  const channelId = getEnv("SHIPROCKET_CHANNEL_ID");

  console.log("\n==================================================");
  console.log("🚀 SXTN Shiprocket Configuration Test");
  console.log("==================================================");
  console.log(`Email:            ${email || "(not set)"}`);
  console.log(`Password:         ${password ? "••••••••••••" : "(not set)"}`);
  console.log(`Pickup Location:  ${pickupLoc}`);
  console.log(`Channel ID:       ${channelId || "(none / default)"}`);
  console.log("--------------------------------------------------\n");

  if (!email || !password) {
    console.error("❌ Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in .env.local");
    process.exitCode = 1;
    return;
  }

  console.log("1️⃣ Testing Shiprocket API Authentication...");

  try {
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authRes.json();

    if (!authRes.ok || !authData.token) {
      console.error(`❌ Authentication Failed (HTTP ${authRes.status}):`);
      console.error(JSON.stringify(authData, null, 2));
      console.log("\n💡 Why did this happen?");
      console.log("In Shiprocket, your normal dashboard login does NOT work for the API.");
      console.log("You MUST create a dedicated 'API User':");
      console.log("  1. Open https://app.shiprocket.in/api-user");
      console.log("  2. Click 'Add New API User'");
      console.log("  3. Set an Email & Password for the API user");
      console.log("  4. Paste those exact credentials into .env.local");
      process.exitCode = 1;
      return;
    }

    const token = authData.token;
    console.log("✅ Authentication Successful! JWT Token acquired.\n");

    console.log("2️⃣ Checking Registered Pickup Addresses...");
    const pickupRes = await fetch("https://apiv2.shiprocket.in/v1/external/settings/company/pickup", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (pickupRes.ok) {
      const pickupData = await pickupRes.json();
      const addresses = pickupData?.data?.shipping_address || [];
      console.log(`Found ${addresses.length} registered pickup address(es):`);
      
      let foundMatch = false;
      for (const addr of addresses) {
        const isMatch = addr.pickup_location?.toLowerCase() === pickupLoc.toLowerCase();
        if (isMatch) foundMatch = true;
        console.log(`  • "${addr.pickup_location}" (City: ${addr.city}, Pin: ${addr.pin_code}, Verified: ${addr.status === 1 ? "Yes" : "No"})${isMatch ? " 👈 MATCHES SHIPROCKET_PICKUP_LOCATION" : ""}`);
      }

      if (!foundMatch && addresses.length > 0) {
        console.warn(`\n⚠️ Warning: SHIPROCKET_PICKUP_LOCATION is set to "${pickupLoc}", but no address with that name was found.`);
        console.warn(`Please set SHIPROCKET_PICKUP_LOCATION in .env.local to one of the exact names above (e.g. "${addresses[0].pickup_location}").`);
      } else if (foundMatch) {
        console.log(`\n✅ Pickup location "${pickupLoc}" verified and ready for courier dispatch!`);
      }
    } else {
      console.log("⚠️ Could not list pickup addresses (HTTP " + pickupRes.status + ")");
    }

    console.log("\n==================================================");
    console.log("🎉 All Shiprocket credentials are valid & working!");
    console.log("==================================================\n");

  } catch (err) {
    console.error("❌ Network or script error:", err);
    process.exitCode = 1;
  }
}

run();
