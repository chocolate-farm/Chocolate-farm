/* =========================
   Mazrae Shokolat - app.js
   Static catalog + order payload builder
   Rule: Ruby has no 10kg
   ========================= */

/** 1) CONFIG */
const GOOGLE_SCRIPT_WEBAPP_URL = ""; // بعداً لینک Web App گوگل اسکریپت را اینجا می‌گذاری

/** 2) DOM */
const orderForm = document.getElementById("orderForm");
const productSelect = document.getElementById("productSelect");
const weightSelect = document.getElementById("weightSelect");
const qtyInput = document.getElementById("qtyInput");
const formStatus = document.getElementById("formStatus");

/** 3) DATA (Products / Labels / SKU) */
const PRODUCTS = [
  { sku: "CB-DARK", name: "شکلات کلبوت تلخ" },
  { sku: "CB-MILK", name: "شکلات کلبوت شیری" },
  { sku: "CB-WHITE", name: "شکلات کلبوت سفید" },
  { sku: "CB-GOLD", name: "شکلات کلبوت گلد" },
  { sku: "CB-RUBY", name: "شکلات کلبوت روبی" },
  { sku: "CB-COCOABUTTER", name: "کره کاکائو بلژیکی" },
];

const PRODUCT_MAP = PRODUCTS.reduce((acc, p) => {
  acc[p.sku] = p.name;
  return acc;
}, {});

const WEIGHTS = [
  { value: "1kg", label: "۱ کیلوگرم" },
  { value: "2.5kg", label: "۲.۵ کیلوگرم" },
  { value: "10kg", label: "۱۰ کیلوگرم" },
];

/** Optional: normalize digits (Persian/Arabic -> English) */
function toEnglishDigits(str) {
  return String(str || "")
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

function setStatus(msg, type = "") {
  if (!formStatus) return;
  formStatus.textContent = msg || "";
  formStatus.className = "status" + (type ? ` ${type}` : "");
}

function safeTrim(v) {
  return String(v ?? "").trim();
}

function getNowISO() {
  return new Date().toISOString();
}

/** 4) UI helpers */
function applyWeightRules() {
  if (!productSelect || !weightSelect) return;

  const isRuby = productSelect.value === "CB-RUBY";

  // find 10kg option
  const opt10 = [...weightSelect.options].find(o => o.value === "10kg");
  if (opt10) {
    opt10.disabled = isRuby;
  }

  // if ruby selected and currently 10kg, clear selection
  if (isRuby && weightSelect.value === "10kg") {
    weightSelect.value = "";
  }
}

/** If your HTML already has options, we don't have to populate them.
    But in case it's empty, we populate nicely. */
function maybePopulateSelects() {
  if (productSelect && productSelect.options.length <= 1) {
    // keep first placeholder option if exists
    PRODUCTS.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.sku;
      opt.textContent = p.name;
      productSelect.appendChild(opt);
    });
  }

  if (weightSelect && weightSelect.options.length <= 1) {
    WEIGHTS.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.value;
      opt.textContent = w.label;
      weightSelect.appendChild(opt);
    });
  }
}

/** 5) VALIDATION */
function validateOrder(payload) {
  const product = safeTrim(payload.product);
  const weight = safeTrim(payload.weight);
  const qtyRaw = safeTrim(payload.qty);

  if (!product) return "لطفاً محصول را انتخاب کنید.";
  if (!weight) return "لطفاً وزن را انتخاب کنید.";

  // Ruby rule
  if (product === "CB-RUBY" && weight === "10kg") {
    return "برای شکلات روبی، وزن ۱۰ کیلوگرم موجود نیست.";
  }

  // qty
  const qty = parseInt(toEnglishDigits(qtyRaw || "1"), 10);
  if (!Number.isFinite(qty) || qty <= 0) return "تعداد معتبر نیست.";
  if (qty > 999) return "تعداد خیلی زیاد است.";

  return null;
}

/** 6) BUILD STANDARD ORDER DESCRIPTION (items) */
function buildStandardItems(payload) {
  const pName = PRODUCT_MAP[payload.product] || payload.product || "";
  const weight = payload.weight || "";
  const qty = payload.qty || "1";
  return `${pName} | وزن: ${weight} | تعداد: ${qty}`;
}

/** 7) SEND (optional) */
async function postToGoogleScript(payload) {
  if (!GOOGLE_SCRIPT_WEBAPP_URL) {
    // No backend configured yet
    return { ok: true, mode: "local", message: "GOOGLE_SCRIPT_WEBAPP_URL ست نشده؛ فقط تست لوکال انجام شد." };
  }

  const res = await fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || "ارسال ناموفق بود.");
  }
  return data;
}

/** 8) INIT */
maybePopulateSelects();
applyWeightRules();

if (productSelect) {
  productSelect.addEventListener("change", () => {
    applyWeightRules();
  });
}

/** 9) SUBMIT HANDLER */
if (orderForm) {
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    // Build payload from form
    const fd = new FormData(orderForm);
    const payload = Object.fromEntries(fd.entries());

    // Normalize a few fields
    payload.product = safeTrim(payload.product);
    payload.weight = safeTrim(payload.weight);
    payload.qty = toEnglishDigits(safeTrim(payload.qty || (qtyInput ? qtyInput.value : "1"))) || "1";
    payload.createdAt = getNowISO();

    // Validation
    const err = validateOrder(payload);
    if (err) {
      setStatus(err, "error");
      return;
    }

    // Standardized "items" string (THIS is the part you were stuck on)
    payload.items = buildStandardItems(payload);

    // Optional: add readable product name too
    payload.productName = PRODUCT_MAP[payload.product] || payload.product;

    // Lock UI
    const submitBtn = orderForm.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    setStatus("در حال ثبت سفارش...");

    try {
      // If you want a mode key for Apps Script routing:
      payload.action = "createOrder";

      const out = await postToGoogleScript(payload);

      // Success
      setStatus("سفارش ثبت شد. به‌زودی برای هماهنگی با شما تماس می‌گیریم.", "success");
      // You can reset the form if you want:
      // orderForm.reset();
      // applyWeightRules();

      // Debug (optional)
      console.log("Order sent:", payload);
      console.log("Server response:", out);
    } catch (ex) {
      setStatus(ex.message || "خطا در ثبت سفارش", "error");
      console.error(ex);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
} else {
  console.warn("orderForm not found. Check index.html ids.");
}
