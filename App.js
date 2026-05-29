// app.js

// 1) تاریخ امروز به فارسی (بدون کتابخانه)
(function showTodayFa(){
  try{
    const el = document.getElementById("today-fa");
    if(!el) return;
    const fmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year:"numeric", month:"2-digit", day:"2-digit"
    });
    el.textContent = fmt.format(new Date());
  } catch(e) {
    // اگر مرورگر قدیمی بود
    const el = document.getElementById("today-fa");
    if(el) el.textContent = "امروز";
  }
})();

// 2) تنظیمات شما: این را بعداً با URL وب‌اپ گوگل اسکریپت پر می‌کنیم
const GOOGLE_SCRIPT_WEBAPP_URL = ""; // مرحله بعد پر می‌شود

function makeOrderId(){
  // مثال: MF-14050307-8K2P
  const d = new Date();
  const stamp = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year:"2-digit", month:"2-digit", day:"2-digit"
  }).format(d).replaceAll("/", "");
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `MF-${stamp}-${rand}`;
}

const form = document.getElementById("orderForm");
const statusEl = document.getElementById("formStatus");
const cancelBtn = document.getElementById("cancelBtn");

function setStatus(msg, type="info"){
  statusEl.className = `status status--${type}`;
  statusEl.textContent = msg;
}

if(cancelBtn){
  cancelBtn.addEventListener("click", ()=>{
    const last = localStorage.getItem("mf_last_order");
    if(!last){
      alert("هنوز سفارشی ثبت نشده. اگر می‌خواهی ویرایش/لغو کنی، ابتدا سفارش را ثبت کن.");
      return;
    }
    const data = JSON.parse(last);
    alert(
      `برای لغو/ویرایش:\nکد سفارش: ${data.orderId}\nموبایل: ${data.mobile}\n\n(در فاز بعد، لغو خودکار و لینک امن اضافه می‌کنیم.)`
    );
  });
}

if(form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // اعتبارسنجی ساده موبایل
    const mobile = (payload.mobile || "").trim();
    if(!/^09\d{9}$/.test(mobile)){
      setStatus("شماره موبایل معتبر نیست (مثلاً 09123456789).", "error");
      return;
    }

    const orderId = makeOrderId();
    payload.orderId = orderId;
    payload.createdAtIso = new Date().toISOString();
    payload.createdAtFa = (() => {
      try{
        return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
          year:"numeric", month:"2-digit", day:"2-digit",
          hour:"2-digit", minute:"2-digit"
        }).format(new Date());
      }catch(e){ return ""; }
    })();

    // ذخیره برای لغو/ویرایش دستی (فاز ۱)
    localStorage.setItem("mf_last_order", JSON.stringify({orderId, mobile}));

    // اگر هنوز وب‌اپ را ست نکرده‌ای، فقط پیام بده
    if(!GOOGLE_SCRIPT_WEBAPP_URL){
      setStatus(`سفارش ثبت شد (محلی). کد سفارش شما: ${orderId}\n\nمرحله بعد: اتصال به Google Sheets برای ثبت واقعی.`, "ok");
      form.reset();
      return;
    }

    try{
      setStatus("در حال ارسال سفارش...", "info");

      const res = await fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
        method: "POST",
        mode: "cors",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });

      if(!res.ok){
        throw new Error("NETWORK_OR_SERVER_ERROR");
      }

      const out = await res.json().catch(()=>({ok:true}));
      if(out && out.ok === false){
        throw new Error(out.error || "SERVER_ERROR");
      }

      setStatus(`سفارش با موفقیت ثبت شد. کد سفارش: ${orderId}`, "ok");
      form.reset();
    } catch(err){
      setStatus(`مشکل در ثبت سفارش. کد سفارش شما: ${orderId}\nلطفاً دوباره تلاش کنید یا با واتساپ تماس بگیرید.`, "error");
    }
  });
}
