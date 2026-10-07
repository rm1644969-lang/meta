/* Add Product — Fast, Frictionless Seller Onboarding for Meta AI */
(function () {
  const priceInput = document.getElementById("priceInput");
  const warrantyInput = document.getElementById("warrantyInput");
  const titleInput = document.getElementById("titleInput");
  const descArea = document.getElementById("descArea");
  const sellerNameInput = document.getElementById("sellerNameInput");
  const sellerWhatsappInput = document.getElementById("sellerWhatsappInput");
  const rawLogsArea = document.getElementById("rawLogsArea");
  const liveStockBadge = document.getElementById("liveStockBadge");
  const stockInput = document.getElementById("stockInput");
  const fileInput = document.getElementById("fileInput");
  const uploadFileBtn = document.getElementById("uploadFileBtn");
  const fileNameLabel = document.getElementById("fileNameLabel");
  const clearBtn = document.getElementById("clearBtn");
  const form = document.getElementById("productForm");
  const submitBtn = document.getElementById("submitBtn");

  const adminPassBox = document.getElementById("adminPassBox");
  const adminPasswordInput = document.getElementById("adminPasswordInput");
  const adminAuthStatus = document.getElementById("adminAuthStatus");

  // Load remembered seller info from localStorage
  const savedSellerName = localStorage.getItem("meta_ai_seller_name");
  const savedSellerWhatsapp = localStorage.getItem("meta_ai_seller_whatsapp");
  if (savedSellerName && sellerNameInput) {
    sellerNameInput.value = savedSellerName;
  }
  if (savedSellerWhatsapp && sellerWhatsappInput) {
    sellerWhatsappInput.value = savedSellerWhatsapp;
  }

  // ---------- Tier Selection Logic ----------
  const tierCards = document.querySelectorAll(".tier-card");

  const sellerPayoutInput = document.getElementById("sellerPayoutInput");

  function updateTierDetails() {
    if (!priceInput || !warrantyInput) return;
    const curTier = warrantyInput.value;
    const sellerName = (sellerNameInput && sellerNameInput.value.trim()) || "Seller";

    if (adminPassBox) {
      adminPassBox.style.display = (curTier === "admin055" || curTier === "admin045") ? "block" : "none";
    }

    if (curTier === "noreplace") {
      if (titleInput) titleInput.value = `Meta AI Account 0.40 (No Replace / নো রিপ্লেস)`;
      if (descArea) {
        descArea.value = `100% Active Meta AI accounts with session cookies. সতর্কতা / WARNING: কেনার পর কোনো অ্যাকাউন্টে সমস্যা হলে বা ব্যান দিলে নো রিপ্লেস (Strictly No Replace)। নিজের দায়িত্বে কিনবেন। বায়ার রেট: ৳০.৪০, সেলার পাবেন: ৳০.৩০।`;
      }
    } else if (curTier === "admin055" || curTier === "admin045") {
      if (titleInput) titleInput.value = `⭐ Admin Meta 0.55 (অ্যাডমিন স্পেশাল — শুধু অ্যাডমিন স্টক যোগ করতে পারবেন)`;
      if (descArea) {
        descArea.value = `👑 Admin Meta 0.55 Official Exclusive Pool: এই প্রোডাক্টে শুধুমাত্র অ্যাডমিন সরাসরি স্টক যোগ করতে পারবেন। ১০০% ফ্রেশ সেশন কুকিজ, প্রিমিয়াম আবাসিক আইপি এবং ইনস্ট্যান্ট অটো ডেলিভারি। সম্পূর্ণ ৳০.৫৫ অ্যাডমিনের।`;
      }
      if (sellerNameInput && !sellerNameInput.value.trim()) {
        sellerNameInput.value = "Ratan Majumder (Admin)";
      }
    } else if (curTier === "horjin") {
      if (titleInput) titleInput.value = `Meta AI Horjin 0.50 (100% Original Residential IP — 24h Replacement Guarantee)`;
      if (descArea) {
        descArea.value = `100% Original / Horjin Meta AI accounts on clean residential IP. সর্বোচ্চ স্থায়িত্ব, জিরো চেকপয়েন্ট ও পারফেক্ট সেশন কুকিজ। বায়ার রেট: ৳০.৫০, সেলার পাবেন: ৳০.৪০ (অ্যাডমিন প্রফিট: ৳০.১০)।`;
      }
    } else {
      if (titleInput) titleInput.value = `Meta AI Account 0.50 (With Replace / ২৪ ঘণ্টা ফুল রিপ্লেস)`;
      if (descArea) {
        descArea.value = `100% Active Meta AI accounts with session cookies. ২৪ ঘণ্টা সম্পূর্ণ রিপ্লেসমেন্ট গ্যারান্টি (24-Hour Full Replacement Guarantee)। কোনো অ্যাকাউন্টে সমস্যা হলে সাথে সাথে নতুন আইডি রিপ্লেসমেন্ট দেওয়া হবে। বায়ার রেট: ৳০.৫০, সেলার পাবেন: ৳০.৪০ (অ্যাডমিন প্রফিট: ৳০.১০)।`;
      }
    }
  }

  if (adminPasswordInput && adminAuthStatus) {
    adminPasswordInput.addEventListener("input", () => {
      const curAdminPass = (typeof API !== "undefined" && API.getAdminPassword) ? API.getAdminPassword() : (localStorage.getItem("rtn_admin_password") || "ratan2030");
      if (adminPasswordInput.value.trim() === curAdminPass) {
        adminAuthStatus.style.display = "inline-flex";
        adminAuthStatus.textContent = "✓ Admin Verified";
        adminAuthStatus.className = "badge green no-dot";
      } else if (adminPasswordInput.value.trim()) {
        adminAuthStatus.style.display = "inline-flex";
        adminAuthStatus.textContent = "✕ Wrong Password";
        adminAuthStatus.className = "badge red no-dot";
      } else {
        adminAuthStatus.style.display = "none";
      }
    });
  }

  tierCards.forEach((c) => {
    c.addEventListener("click", () => {
      tierCards.forEach((x) => {
        x.classList.remove("on");
        x.style.border = "1px solid var(--border)";
      });
      c.classList.add("on");
      c.style.border = "2px solid var(--meta-pink)";
      if (priceInput) priceInput.value = c.dataset.price;
      if (sellerPayoutInput) sellerPayoutInput.value = c.dataset.payout || "0.40";
      if (warrantyInput) warrantyInput.value = c.dataset.tier;
      updateTierDetails();
    });
  });

  // ---------- Live Accounts Counter ----------
  function countAccounts() {
    if (!rawLogsArea) return 0;
    const lines = rawLogsArea.value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    const count = lines.length;
    if (stockInput) stockInput.value = count;
    if (liveStockBadge) {
      if (count > 0) {
        liveStockBadge.innerHTML = `🟢 ${count} টি অ্যাকাউন্ট প্রস্তুত (Stock: ${count})`;
        liveStockBadge.className = "badge green no-dot";
      } else {
        liveStockBadge.innerHTML = `⚪ ০ টি অ্যাকাউন্ট প্রস্তুত (Stock: 0)`;
        liveStockBadge.className = "badge dim no-dot";
      }
    }
    return count;
  }

  if (rawLogsArea) {
    rawLogsArea.addEventListener("input", countAccounts);
  }

  // ---------- File Upload (.txt / .xlsx / .csv) ----------
  if (uploadFileBtn && fileInput) {
    uploadFileBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (fileNameLabel) {
        fileNameLabel.innerHTML = `⏳ <b>${UI.esc(file.name)}</b> লোড হচ্ছে...`;
      }

      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      const reader = new FileReader();

      if (isExcel && window.XLSX) {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.SheetNames[0];
            const sheet = workbook.Sheets[firstSheet];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const lines = rows
              .map((r) =>
                Array.isArray(r)
                  ? r
                      .filter((val) => val !== null && val !== undefined && String(val).trim() !== "")
                      .join(" : ")
                      .trim()
                  : String(r).trim()
              )
              .filter((l) => l && l.length > 2);

            if (lines.length > 0) {
              const existing = rawLogsArea.value.trim();
              rawLogsArea.value = existing ? existing + "\n" + lines.join("\n") : lines.join("\n");
              const total = countAccounts();
              if (fileNameLabel) {
                fileNameLabel.innerHTML = `<span style="color:var(--green)">✓ ${file.name} (${lines.length} টি অ্যাকাউন্ট যুক্ত হয়েছে)</span>`;
              }
              UI.toast(`Excel import: ${lines.length} টি অ্যাকাউন্ট যুক্ত হয়েছে!`, "success");
            } else {
              UI.toast(`No valid account rows in ${file.name}`, "err");
            }
          } catch (err) {
            console.error("XLSX error:", err);
            UI.toast("এক্সেল ফাইল রিড করতে সমস্যা হয়েছে। দয়া করে .txt ফাইল ব্যবহার করুন।", "err");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          const text = e.target.result || "";
          const lines = text
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => s.length > 2);
          if (lines.length > 0) {
            const existing = rawLogsArea.value.trim();
            rawLogsArea.value = existing ? existing + "\n" + lines.join("\n") : lines.join("\n");
            const total = countAccounts();
            if (fileNameLabel) {
              fileNameLabel.innerHTML = `<span style="color:var(--green)">✓ ${file.name} (${lines.length} টি অ্যাকাউন্ট যুক্ত হয়েছে)</span>`;
            }
            UI.toast(`${lines.length} টি অ্যাকাউন্ট ফাইল থেকে লোড হয়েছে!`, "success");
          } else {
            UI.toast(`ফাইলে কোনো বৈধ অ্যাকাউন্ট পাওয়া যায়নি।`, "err");
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // ---------- Clear Button ----------
  if (clearBtn && form) {
    clearBtn.addEventListener("click", () => {
      form.reset();
      countAccounts();
      if (fileNameLabel) fileNameLabel.textContent = "কোনো ফাইল সিলেক্ট করা নেই";
    });
  }

  // ---------- Instant Live Form Submission ----------
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      const sellerName = (data.sellerName || "").trim();
      const sellerWhatsapp = (data.sellerWhatsapp || "").trim();

      if (!sellerName) {
        return UI.toast("দয়া করে আপনার সেলার বা শপের নাম লিখুন।", "err");
      }
      if (!sellerWhatsapp) {
        return UI.toast("দয়া করে আপনার হোয়াটসঅ্যাপ নাম্বার লিখুন।", "err");
      }

      // Save seller details for future 1-click publishing
      localStorage.setItem("meta_ai_seller_name", sellerName);
      localStorage.setItem("meta_ai_seller_whatsapp", sellerWhatsapp);

      const accountsCount = countAccounts();
      if (accountsCount === 0 && !data.stock) {
        return UI.toast("কমপক্ষে ১টি অ্যাকাউন্ট বা লগ পেস্ট করুন।", "err");
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `⏳ অনুমোদনের জন্য পাঠানো হচ্ছে...`;
      }

      // Create product (submits as pending for admin approval)
      API.createProduct(data)
        .then((p) => {
          form.reset();
          countAccounts();
          if (fileNameLabel) fileNameLabel.textContent = "কোনো ফাইল সিলেক্ট করা নেই";

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `📩 অ্যাডমিন অনুমোদনের জন্য পাঠান (Submit for Approval)`;
          }

          // Show Rich Approval Pending Modal
          UI.openModal(
            "⏳ পণ্য অনুমোদনের জন্য জমা হয়েছে!",
            `<div style="display:grid; gap:14px; text-align:left;">
              <div style="background:rgba(255,183,3,0.08); border:1px solid rgba(255,183,3,0.3); border-radius:12px; padding:16px;">
                <div class="flex ac gap10 mb10">
                  <span class="badge amber no-dot">⏳ PENDING ADMIN REVIEW</span>
                  <span class="badge green no-dot">✓ সফলভাবে জমা হয়েছে</span>
                </div>
                <h3 style="color:#fff; font-size:18px; margin:0 0 6px;">${UI.esc(p.title)}</h3>
                <p class="fs13 dim" style="margin:0;">আপনার দেওয়া অ্যাকাউন্ট/লগ অ্যাডমিন যাচাই করছেন। অ্যাডমিন অনুমোদন (Approve) করার সাথে সাথেই এটি মার্কেটপ্লেসে লাইভ হবে এবং ক্রেতারা কিনতে পারবে।</p>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:var(--surface-2); padding:14px; border-radius:10px; border:1px solid var(--border);">
                <div>
                  <div class="fs11 dim">সেলার নাম (Seller)</div>
                  <b style="color:var(--cyan); font-size:14px;">👤 ${UI.esc(p.seller?.name || sellerName)}</b>
                </div>
                <div>
                  <div class="fs11 dim">হোয়াটসঅ্যাপ (WhatsApp)</div>
                  <b style="color:#fff; font-size:14px;">💬 ${UI.esc(p.seller?.whatsapp || sellerWhatsapp)}</b>
                </div>
                <div class="mt6">
                  <div class="fs11 dim">অনুরোধকৃত রেট (Requested Price)</div>
                  <b style="color:var(--meta-pink); font-size:16px;">৳${p.price.toFixed(2)}</b>
                </div>
                <div class="mt6">
                  <div class="fs11 dim">জমা দেওয়া স্টক (Submitted Stock)</div>
                  <b style="color:var(--green); font-size:16px;">${p.stock} টি অ্যাকাউন্ট</b>
                </div>
              </div>

              <div class="fs12 dim" style="line-height:1.5;">
                💡 <b>পরামর্শ:</b> আপনার পণ্যের স্ট্যাটাস (Pending / Live / Rejected) দেখতে নিচে <b>"আমার পণ্যসমূহ দেখুন"</b> বাটনে যান।
              </div>
            </div>`,
            `<div class="flex gap10 w100" style="justify-content:flex-end;">
              <button class="btn btn-outline" onclick="UI.closeModal();">➕ আরও যোগ করুন</button>
              <a href="my-products.html" class="btn btn-primary" style="font-weight:700;">📦 আমার পণ্যসমূহ দেখুন (My Products)</a>
            </div>`
          );

          UI.toast("আপনার পণ্য সফলভাবে অ্যাডমিন অনুমোদনের জন্য জমা হয়েছে!", "info");
          document.dispatchEvent(new CustomEvent("products:updated"));
        })
        .catch((err) => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `📩 অ্যাডমিন অনুমোদনের জন্য পাঠান (Submit for Approval)`;
          }
          UI.toast(err.message || "পণ্য যোগ করতে সমস্যা হয়েছে।", "err");
        });
    });
  }

  // Initialize
  updateTierDetails();
  countAccounts();
})();
