document.addEventListener("DOMContentLoaded", () => {
  const todayFa = document.getElementById("today-fa");
  const orderForm = document.getElementById("orderForm");
  const productSelect = document.getElementById("productSelect");
  const weightSelect = document.getElementById("weightSelect");
  const qtyInput = document.getElementById("qtyInput");
  const cancelBtn = document.getElementById("cancelBtn");
  const formStatus = document.getElementById("formStatus");

  if (todayFa) {
    const today = new Date().toLocaleDateString("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    todayFa.textContent = today;
  }

  function updateWeightOptions() {
    if (!productSelect || !weightSelect) return;

    const options = weightSelect.querySelectorAll("option");
    options.forEach(option => {
      if (option.value === "10kg") {
        if (productSelect.value === "CB-RUBY") {
          option.disabled = true;
          option.textContent = "۱۰ کیلویی (برای روبی موجود نیست)";
          if (weightSelect.value === "10kg") {
            weightSelect.value = "";
          }
        } else {
          option.disabled = false;
          option.textContent = "۱۰ کیلویی";
        }
      }
    });
  }

  if (productSelect) {
    productSelect.addEventListener("change", updateWeightOptions);
    updateWeightOptions();
  }

  function validateMobile(mobile) {
    const cleaned = mobile.replace(/\s+/g, "");
    return /^(\+98|0)?9\d{9}$/.test(cleaned);
  }

  function setStatus(message, type = "") {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = "status";
    if (type) {
      formStatus.classList.add(`status--${type}`);
    }
  }

  if (cancelBtn && orderForm) {
    cancelBtn.addEventListener("click", () => {
      orderForm.reset();
      updateWeightOptions();
      qtyInput.value = 1;
      setStatus("فرم پاک شد. می‌توانی دوباره اطلاعات را وارد کنی.", "info");
    });
  }

  if (orderForm) {
    orderForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(orderForm);

      const name = (formData.get("name") || "").toString().trim();
      const mobile = (formData.get("mobile") || "").toString().trim();
      const orderType = (formData.get("orderType") || "").toString().trim();
      const product = (formData.get("product") || "").toString().trim();
      const weight = (formData.get("weight") || "").toString().trim();
      const qty = (formData.get("qty") || "").toString().trim();
      const notes = (formData.get("notes") || "").toString().trim();

      if (!name || !mobile || !orderType || !product || !weight || !qty) {
        setStatus("لطفاً همه فیلدهای ضروری را کامل کن.", "error");
        return;
      }

      if (!validateMobile(mobile)) {
        setStatus("شماره موبایل معتبر نیست.", "error");
        return;
      }

      if (product === "CB-RUBY" && weight === "10kg") {
        setStatus("برای شکلات روبی، وزن ۱۰ کیلویی قابل انتخاب نیست.", "error");
        return;
      }

      const qtyNumber = Number(qty);
      if (Number.isNaN(qtyNumber) || qtyNumber < 1) {
        setStatus("تعداد باید حداقل ۱ باشد.", "error");
        return;
      }

      const productLabels = {
        "CB-DARK": "شکلات کلبوت تلخ",
        "CB-MILK": "شکلات کلبوت شیری",
        "CB-WHITE": "شکلات کلبوت سفید",
        "CB-GOLD": "شکلات کلبوت گلد",
        "CB-RUBY": "شکلات کلبوت روبی",
        "CB-COCOABUTTER": "کره کاکائو بلژیکی"
      };

      const orderDescription = `${productLabels[product] || product} | ${weight} | ${qtyNumber} عدد`;

      console.log("New Order:", {
        name,
        mobile,
        orderType,
        product,
        weight,
        qty: qtyNumber,
        notes,
        orderDescription
      });

      setStatus(`سفارش ثبت شد: ${orderDescription}`, "success");

      orderForm.reset();
      updateWeightOptions();
      qtyInput.value = 1;
    });
  }
});
