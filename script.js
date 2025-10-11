/* script.js - shared logic for index + admin
   - products loaded from localStorage (lm_products) else products.json
   - admin can upload images => saved base64 in localStorage
   - order modal -> send to Google Sheets (GSA_URL)
   - NEW: assets, feedback, licenses managed via localStorage
*/

// ---- CONFIG ----
const GSA_URL = "https://script.google.com/macros/s/AKfycbx7pbatupJeBeOZWgO5cZlyRx3Z_3JeymRRq_OoyR45HNw9KvB2LxZg7B6sCk9C8wOMeA/exec"; // <= your Apps Script URL

// small helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const escapeHtml = s => s ? String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') : '';

// load products (prefer localStorage)
async function loadProductsSource() {
  const local = localStorage.getItem('lm_products');
  if (local) { try { return JSON.parse(local); } catch(e){}
  }
  // fallback to products.json
  try {
    const res = await fetch('products.json');
    if (!res.ok) return [];
    const arr = await res.json();
    // seed localStorage
    localStorage.setItem('lm_products', JSON.stringify(arr));
    return arr;
  } catch(e) { return []; }
}
//thêm hàm updateTotal() ở đầu (hoặc gần trên cùng trong file JS):
function updateTotal() {
  const quantityInput = document.getElementById('quantity');
  const priceInput = document.getElementById('orderPriceInput');
  const totalInput = document.getElementById('totalAmountInput');

  const totalAmountText = document.getElementById('totalAmount');

  if (!quantityInput || !priceInput || !totalInput || !totalAmountText) return;

  const quantity = parseInt(quantityInput.value) || 1;
  const price = parseFloat(priceInput.value) || 0;
  const total = quantity * price;

  totalInput.value = total;
  totalAmountText.innerText = total.toLocaleString('vi-VN') + ' ₫';
}

// load settings (banner, qr, NEW: logo, about_img, background_img)
function loadSettings() {
  const raw = localStorage.getItem('lm_settings');
  let s = { 
    banner: 'background.jpg', 
    qr: 'qr-sample.png',
    logo: 'data:image/svg+xml;base64,...', // default base64 or url
    about_img: 'about.jpg',
    background_img: 'background.jpg'
  };
  if (raw) { try { s = JSON.parse(raw); } catch(e){} }
  // apply if on index
  if ($('#heroBanner')) {
    $('#heroBanner').style.backgroundImage = `url('${s.background_img}')`;
  }
  const ab = $('#aboutImage'); if (ab) ab.src = s.about_img;
  const logoEl = $('#logoIcon'); if (logoEl) {
    logoEl.style.backgroundImage = `url('${s.logo}')`;
    logoEl.innerHTML = ''; // Clear text if logo img
  }
  // set qr in modal if exists
  if ($('#qrImage')) $('#qrImage').src = s.qr;
  return s;
}

// UPDATED: Render feedback as infinite image carousel
// UPDATED: Render feedback as grid 3x2 desktop, horizontal scroll mobile (no animation)
// ====== FEEDBACK & LICENSES ====== thêm mới1
function renderFeedback() {
  const track = $('#feedbackTrack');
  if (!track) return;
  const items = JSON.parse(localStorage.getItem('lm_feedback')||'[]');
  track.innerHTML = '';
  items.forEach(i => {
    const div = document.createElement('div');
    div.className = 'feedback-item';
    div.style.backgroundImage = `url('${i.img}')`;
    track.appendChild(div);
  });
}
//
function renderFeedback() {
  const raw = localStorage.getItem('lm_feedback');
  let feedbacks = []; // {img: base64/url}
  if (raw) { try { feedbacks = JSON.parse(raw); } catch(e){} }
  const container = document.querySelector('#feedback .feedback-grid') || document.createElement('div');
  container.className = 'feedback-grid';
  if (!document.querySelector('#feedback .feedback-grid')) {
    const section = $('#feedback');
    if (section) section.appendChild(container);
  }
  container.innerHTML = '';
  if (feedbacks.length === 0) {
    // Fallback: 2 icons cho grid đẹp
    for (let i = 0; i < 2; i++) {
      container.insertAdjacentHTML('beforeend', '<div class="feedback-item bg-gray-100 fallback-icon">💬</div>');
    }
    return;
  }
  // Render items (giới hạn 6 cho 3x2, nếu nhiều hơn thì thêm class overflow)
  feedbacks.slice(0, 6).forEach(fb => {
    const html = `<div class="feedback-item" style="background-image: url('${fb.img || ''}');"></div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
  if (feedbacks.length > 6) container.classList.add('overflow-x-auto'); // Scroll nếu nhiều
}

// UPDATED: Render licenses (similar, grid 3x2 desktop, horizontal mobile)
// thêm mới1

function renderLicenses() {
  const track = $('#licensesTrack');
  if (!track) return;
  const items = JSON.parse(localStorage.getItem('lm_licenses')||'[]');
  track.innerHTML = '';
  items.forEach(i => {
    const div = document.createElement('div');
    div.className = 'licenses-item';
    div.style.backgroundImage = `url('${i.img}')`;
    track.appendChild(div);
  });
}
//

function renderLicenses() {
  const raw = localStorage.getItem('lm_licenses');
  let licenses = []; // {img: base64/url}
  if (raw) { try { licenses = JSON.parse(raw); } catch(e){} }
  const container = document.querySelector('#licenses .licenses-grid') || document.createElement('div');
  container.className = 'licenses-grid';
  if (!document.querySelector('#licenses .licenses-grid')) {
    const section = $('#licenses');
    if (section) section.appendChild(container);
  }
  container.innerHTML = '';
  if (licenses.length === 0) {
    for (let i = 0; i < 2; i++) {
      container.insertAdjacentHTML('beforeend', '<div class="licenses-item bg-gray-100 fallback-icon">📜</div>');
    }
    return;
  }
  licenses.slice(0, 6).forEach(lc => {
    const html = `<div class="licenses-item" style="background-image: url('${lc.img || ''}');"></div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
  if (licenses.length > 6) container.classList.add('overflow-x-auto');
}

// render product card (giữ nguyên, không thay đổi)
function productCardHTML(p) {
  const price = (p.price) ? new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(p.price)) : '';
  return `
    <div class="bg-white rounded-xl overflow-hidden product-card card-hover reveal flex">
      <div class="w-1/2 min-h-[220px] relative">
        <img class="img-front absolute inset-0 w-full h-full object-cover" src="${p.img1||''}" alt="${escapeHtml(p.title)}">
        <img class="img-back absolute inset-0 w-full h-full object-cover" src="${p.img2||p.img1||''}" alt="${escapeHtml(p.title)}">
      </div>
      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 class="text-lg font-semibold">${escapeHtml(p.title)}</h4>
          <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(p.desc||'')}</p>
        </div>
        <div class="flex items-center justify-between mt-4">
          <div class="text-amber-500 font-bold">${price}</div>
          <div class="flex gap-2">
            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md font-semibold"
              onclick="window.location.href='product.html?id=${p.id}'">
              Xem thêm
            </button>
            <button class="bg-amber-300 hover:bg-amber-400 px-3 py-2 rounded-md font-semibold order-btn"
              data-title="${escapeHtml(p.title)}" data-img="${p.img1||''}" data-price="${escapeHtml(p.price)}">
              Đặt mua
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}


// mobile card (giữ nguyên)
function productCardMobileHTML(p) {
  const price = (p.price) ? new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(p.price)) : '';
  return `
    <div class="snap-item bg-white rounded-xl overflow-hidden product-card card-hover min-w-[86%]">
      <div class="relative h-56">
        <img class="img-front absolute inset-0 w-full h-full object-cover" src="${p.img1||''}" alt="${escapeHtml(p.title)}">
        <img class="img-back absolute inset-0 w-full h-full object-cover" src="${p.img2||p.img1||''}" alt="${escapeHtml(p.title)}">
      </div>
      <div class="p-4">
        <h4 class="text-lg font-semibold">${escapeHtml(p.title)}</h4>
        <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(p.desc||'')}</p>
        <div class="mt-4 flex items-center justify-between gap-2">
  <div class="text-amber-500 font-bold">${price}</div>
  <div class="flex gap-2">
    <button 
      onclick="window.location.href='product.html?id=${p.id}'"
      class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md font-semibold text-sm">
      Xem thêm
    </button>
    <button 
      class="bg-amber-300 hover:bg-amber-400 px-3 py-2 rounded-md font-semibold order-btn text-sm" 
      data-title="${escapeHtml(p.title)}" 
      data-img="${p.img1||''}" 
      data-price="${escapeHtml(p.price)}">
      Đặt mua
    </button>
  </div>
</div>

      </div>
    </div>
  `;
}
//thêm mới1

async function renderProducts() {
  const products = await loadProductsSource();
  const desktop = $('#productsGridDesktop');
  const mobile = $('#productsCarouselMobile');
  if (desktop) desktop.innerHTML = '';
  if (mobile) mobile.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card-hover bg-white rounded-2xl shadow-md overflow-hidden';
    card.innerHTML = `
      <img src="${p.img}" class="img-front w-full h-64 object-cover">
      <img src="${p.img_back||p.img}" class="img-back w-full h-64 object-cover absolute inset-0">
      <div class="p-4">
        <h4 class="font-semibold">${escapeHtml(p.name)}</h4>
        <p class="text-amber-500 font-bold mt-1">${p.price.toLocaleString('vi-VN')} ₫</p>
        <button onclick="openOrderModal('${escapeHtml(p.name)}', ${p.price}, '${escapeHtml(p.desc)}')" class="mt-2 w-full bg-amber-300 rounded-lg py-2 font-semibold">Mua ngay</button>
      </div>
    `;
    if (desktop) desktop.appendChild(card);
    if (mobile) {
      const mob = card.cloneNode(true);
      mob.classList.add('snap-item');
      mobile.appendChild(mob);
    }
  });
}
// render all products (giữ nguyên)
async function renderProducts() {
  const list = await loadProductsSource();
  // desktop grid
  const grid = $('#productsGridDesktop');
  if (grid) {
    grid.innerHTML = '';
    list.forEach(p => grid.insertAdjacentHTML('beforeend', productCardHTML(p)));
  }
  // mobile carousel
  const carousel = $('#productsCarouselMobile');
  if (carousel) {
    carousel.innerHTML = '';
    list.forEach(p => carousel.insertAdjacentHTML('beforeend', productCardMobileHTML(p)));
  }

  // attach event to order buttons
  $$('.order-btn').forEach(btn => btn.addEventListener('click', (e) => {
    const name = btn.dataset.title;
    const img = btn.dataset.img;
    const price = btn.dataset.price;
    showOrderModal({name,img,price});
  }));

  // reveal observer
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, {threshold:0.12});
  $$('.reveal').forEach(el => observer.observe(el));

  // setup mobile auto-swap
  setupMobileSwap();
}

// Mobile swap (giữ nguyên)
let mobileIntervals = new Map();
function setupMobileSwap() {
  // only on narrow screens
  if (window.innerWidth > 900) return;
  const cards = $$('#productsCarouselMobile .product-card');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const card = entry.target;
      const front = card.querySelector('.img-front');
      const back = card.querySelector('.img-back');
      if (entry.isIntersecting) {
        if (mobileIntervals.has(card)) return;
        let showBack = false;
        const interval = setInterval(()=> {
          if (showBack) { if (back) { back.style.opacity='0'; front.style.opacity='1'; } }
          else { if (back) { back.style.opacity='1'; front.style.opacity='0'; } }
          showBack = !showBack;
        }, 2500);
        mobileIntervals.set(card, interval);
      } else {
        if (mobileIntervals.has(card)) {
          clearInterval(mobileIntervals.get(card));
          mobileIntervals.delete(card);
        }
        if (front && back) { front.style.opacity='1'; back.style.opacity='0'; }
      }
    });
  }, {threshold: 0.6});
  cards.forEach(c => obs.observe(c));
}

// ---- ORDER modal logic (giữ nguyên) ----
function showOrderModal({ name, img, price, desc }) {
  const modal = document.getElementById('orderModal');
  if (!modal) return;

  const nameEl = document.getElementById('modalProductName');
  const imgEl = document.getElementById('modalProductImg');
  const priceEl = document.getElementById('modalProductPrice');
  const descEl = document.getElementById('modalProductDesc');
  const productInput = document.getElementById('orderProductInput');
  const priceInput = document.getElementById('orderPriceInput');
  const statusEl = document.getElementById('orderStatus');

  // Cập nhật thông tin trong modal

  if (nameEl) nameEl.innerText = name || '';
  if (imgEl) imgEl.src = img || '';
  if (priceEl) priceEl.innerText = price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price)) : '';
  if (descEl) descEl.innerText = desc || '';
  if (productInput) productInput.value = name || '';
  if (priceInput) priceInput.value = price || '';
  if (statusEl) statusEl.innerText = '';
  
  // Hiển thị modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');


  // set QR image from settings
  const settings = JSON.parse(localStorage.getItem('lm_settings')||'{}');
  if (settings && settings.qr && $('#qrImage')) $('#qrImage').src = settings.qr;
  modal.classList.remove('hidden');
  modal.querySelector('.modal-open')?.classList.add('modal-open');
  // focus vào trường họ tên khi modal mở
  setTimeout(()=> { const f = modal.querySelector('input[name="fullname"]'); if(f) f.focus(); }, 260);
 
}
function closeOrderModal(){ const modal = $('#orderModal'); if(!modal) return; modal.classList.add('hidden'); }

// close handlers
document.addEventListener('click', (e)=> {
  if (e.target && e.target.id === 'closeOrder') closeOrderModal();
});

// handle QR radio toggle
document.addEventListener('change', (e) => {
  if (e.target.name === 'paymethod') {
    if (e.target.value === 'qr') {
      $('#qrSection').classList.remove('hidden');
    } else {
      $('#qrSection').classList.add('hidden');
    }
  }
});


// paid button handling (marks a hidden field note)
if ($('#paidBtn')) $('#paidBtn').addEventListener('click', ()=> {
  const note = $('#orderForm textarea[name="note"]');
  if (note) note.value = (note.value||'') + ' [Đã thanh toán QR]';
  $('#orderStatus').innerText = 'Bạn đã đánh dấu là đã thanh toán. Vui lòng nhấn Gửi để hoàn tất.';
});

// QR cancel hides QR area
if ($('#qrCancel')) $('#qrCancel').addEventListener('click', ()=> { $('#qrBox').classList.add('hidden'); $('input[name=paymethod][value=cod]').checked = true; });

// order submit -> send to Google Sheets (giữ nguyên, với debug nếu cần)
document.addEventListener('submit', async (e)=> {
  if (!e.target || e.target.id !== 'orderForm') return;
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
    // *** Thêm dòng này để log data gửi lên ***
  console.log('Form data gửi lên:', data);
  // Validation
  if (!data.fullname || !data.phone || !data.address) {
    $('#orderStatus').style.color = 'crimson';
    $('#orderStatus').innerText = 'Vui lòng điền họ tên, số điện thoại và địa chỉ.';
    return;
  }

  $('#orderStatus').style.color = '#6b7280';
  $('#orderStatus').innerText = 'Đang gửi...';

  // pixel events
  try { if (window.fbq) fbq('track','Lead',{content_name: data.product}); } catch(e){}
  try { if (window.ttq) ttq.track('CompleteRegistration'); } catch(e){}

  try {
    // Gửi dạng URLSearchParams để tránh preflight CORS
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      params.append(key, value);
    }
    const res = await fetch(GSA_URL, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const respText = await res.text();
    let resp;
    try {
      resp = JSON.parse(respText);
    } catch {
      throw new Error('Invalid JSON response: ' + respText);
    }

    if (resp.status === 'success') {
      $('#orderStatus').style.color = 'green';
      $('#orderStatus').innerText = 'Đặt hàng thành công! Cảm ơn bạn đã mua sản phẩm.';
      form.reset();
      setTimeout(() => {
        closeOrderModal();
        showThank();
      }, 800);
    } else {
      throw new Error(resp.message || 'Unknown error from GAS');
    }
  } catch(err) {
    console.warn(err);
    $('#orderStatus').style.color = 'orange';
    $('#orderStatus').innerText = 'Lỗi gửi. Vui lòng thử lại hoặc liên hệ.';
  }
});

// thank modal (giữ nguyên)
function showThank(){ const t = $('#thankModal'); if(!t) return; t.classList.remove('hidden'); }
if ($('#thankOk')) $('#thankOk').addEventListener('click', ()=> { const t = $('#thankModal'); if(!t) return; t.classList.add('hidden'); document.querySelector('#products')?.scrollIntoView({behavior:'smooth'}); });

// age gate (giữ nguyên)
(function(){ const overlay = document.getElementById('ageOverlay'); const confirm = document.getElementById('confirmAge'); const leave = document.getElementById('leaveBtn');
  if (!overlay) return; const confirmed = localStorage.getItem('lm_age_confirmed') === '1'; if (!confirmed) { overlay.classList.remove('hidden'); setTimeout(()=> overlay.firstElementChild.classList.remove('opacity-0'), 20); }
  confirm && confirm.addEventListener('click', ()=> { localStorage.setItem('lm_age_confirmed','1'); overlay.classList.add('hidden'); try{ if (window.fbq) fbq('track','ViewContent',{content_name:'AgeConfirmed'}) }catch(e){} try{ if (window.ttq) ttq.track('AgeConfirmed') }catch(e){} });
  leave && leave.addEventListener('click', ()=> window.location.href='https://google.com');
})();

// admin helpers (NEW: thêm functions cho feedback/licenses/assets)
window.loadProductsToAdmin = async function(){
  const container = document.getElementById('productList');
  if (!container) return;
  const arr = await loadProductsSource();
  container.innerHTML = '';
  arr.forEach(p => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 border rounded-md';
    div.innerHTML = `
      <div class="w-20 h-20 bg-gray-100 rounded-md overflow-hidden"><img src="${p.img1||''}" class="w-full h-full object-cover"></div>
      <div class="flex-1">
        <div class="font-semibold">${escapeHtml(p.title)}</div>
        <div class="text-sm text-gray-600">${new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(p.price))}</div>
      </div>
      <div>
        <button class="px-3 py-2 border rounded-md mr-2" onclick="editProduct(${p.id})">Sửa</button>
        <button class="px-3 py-2 border rounded-md" onclick="deleteProductById(${p.id})">Xóa</button>
      </div>
    `;
    container.appendChild(div);
  });
};

window.deleteProductById = function(id){
  if (!confirm('Xóa sản phẩm này?')) return;
  const arr = JSON.parse(localStorage.getItem('lm_products')||'[]');
  const filtered = arr.filter(p=>p.id !== id);
  localStorage.setItem('lm_products', JSON.stringify(filtered));
  alert('Đã xóa.');
  loadProductsToAdmin && loadProductsToAdmin();
};

window.editProduct = function(id){
  const arr = JSON.parse(localStorage.getItem('lm_products')||'[]');
  const p = arr.find(x=>x.id===id); if(!p) return alert('Không tìm thấy');
  const newTitle = prompt('Tên sản phẩm', p.title) || p.title;
  const newPrice = prompt('Giá (vd: 499000)', p.price) || p.price;
  const newDesc = prompt('Mô tả', p.desc || '') || p.desc;
  p.title = newTitle; p.price = newPrice; p.desc = newDesc;
  localStorage.setItem('lm_products', JSON.stringify(arr));
  alert('Đã cập nhật.');
  loadProductsToAdmin && loadProductsToAdmin();
};

// NEW: Admin functions for assets
window.saveAsset = function(key, value) {
  const settings = JSON.parse(localStorage.getItem('lm_settings') || '{}');
  settings[key] = value;
  localStorage.setItem('lm_settings', JSON.stringify(settings));
  alert('Đã cập nhật ' + key + '.');
  loadAdminSettings(); // Reload preview
};

// NEW: Admin functions for feedback (add/edit/delete)
window.addFeedback = function() {
  // Không dùng nữa, chỉ upload multiple ảnh
};

window.editFeedback = function(index) {
  const feedbacks = JSON.parse(localStorage.getItem('lm_feedback') || '[]');
  const fb = feedbacks[index];
  if (!fb) return alert('Không tìm thấy');
  const newName = prompt('Tên:', fb.name) || fb.name;
  const newText = prompt('Phản hồi:', fb.text) || fb.text;
  fb.name = newName; fb.text = newText;
  localStorage.setItem('lm_feedback', JSON.stringify(feedbacks));
  alert('Đã cập nhật.');
  loadFeedbackToAdmin();
};

window.deleteFeedback = function(index) {
  if (!confirm('Xóa ảnh phản hồi này?')) return;
  let feedbacks = JSON.parse(localStorage.getItem('lm_feedback') || '[]');
  feedbacks.splice(index, 1);
  localStorage.setItem('lm_feedback', JSON.stringify(feedbacks));
  alert('Đã xóa.');
  loadFeedbackToAdmin();
};

window.loadFeedbackToAdmin = function() {
  const container = document.getElementById('feedbackList');
  if (!container) return;
  let feedbacks = JSON.parse(localStorage.getItem('lm_feedback') || '[]');
  container.innerHTML = '';
  feedbacks.forEach((fb, index) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 border rounded-md';
    div.innerHTML = `
      <img src="${fb.img}" class="w-16 h-24 object-contain rounded">
      <div class="flex-1">Ảnh phản hồi #${index + 1}</div>
      <div>
        <button class="px-3 py-2 border rounded-md mr-2" onclick="deleteFeedback(${index})">Xóa</button>
      </div>
    `;
    container.appendChild(div);
  });
};

// NEW: Admin functions for licenses (similar to feedback)
window.addLicense = function() {
  const title = prompt('Tiêu đề giấy phép:');
  if (!title) return;
  const desc = prompt('Mô tả:');
  let licenses = JSON.parse(localStorage.getItem('lm_licenses') || '[]');
  const newLc = { title, desc, img: '' }; // img optional
  licenses.push(newLc);
  localStorage.setItem('lm_licenses', JSON.stringify(licenses));
  alert('Đã thêm giấy phép.');
  loadLicensesToAdmin();
};

window.editLicense = function(index) {
  const licenses = JSON.parse(localStorage.getItem('lm_licenses') || '[]');
  const lc = licenses[index];
  if (!lc) return alert('Không tìm thấy');
  const newTitle = prompt('Tiêu đề:', lc.title) || lc.title;
  const newDesc = prompt('Mô tả:', lc.desc) || lc.desc;
  lc.title = newTitle; lc.desc = newDesc;
  localStorage.setItem('lm_licenses', JSON.stringify(licenses));
  alert('Đã cập nhật.');
  loadLicensesToAdmin();
};

window.deleteLicense = function(index) {
  if (!confirm('Xóa ảnh giấy phép này?')) return;
  let licenses = JSON.parse(localStorage.getItem('lm_licenses') || '[]');
  licenses.splice(index, 1);
  localStorage.setItem('lm_licenses', JSON.stringify(licenses));
  alert('Đã xóa.');
  loadLicensesToAdmin();
};

window.loadLicensesToAdmin = function() {
  const container = document.getElementById('licensesList');
  if (!container) return;
  let licenses = JSON.parse(localStorage.getItem('lm_licenses') || '[]');
  container.innerHTML = '';
  licenses.forEach((lc, index) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 border rounded-md';
    div.innerHTML = `
      <div class="flex-1">
        <div class="font-semibold">${escapeHtml(lc.title)}</div>
        <div class="text-sm text-gray-600">${escapeHtml(lc.desc).substring(0, 50)}...</div>
      </div>
      <div>
        <button class="px-3 py-2 border rounded-md mr-2" onclick="editLicense(${index})">Sửa</button>
        <button class="px-3 py-2 border rounded-md" onclick="deleteLicense(${index})">Xóa</button>
      </div>
    `;
    container.appendChild(div);
  });
};

// load admin settings (banner, qr preview, NEW: logo, about, background preview)
window.loadAdminSettings = function(){
  const raw = localStorage.getItem('lm_settings');
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (s.banner) { const el = document.getElementById('bannerPreview'); if (el) el.src = s.banner; }
    if (s.qr) { const el2 = document.getElementById('qrPreview'); if (el2) el2.src = s.qr; }
    if (s.logo) { const el3 = document.getElementById('logoPreview'); if (el3) el3.src = s.logo; }
    if (s.about_img) { const el4 = document.getElementById('aboutPreview'); if (el4) el4.src = s.about_img; }
    if (s.background_img) { const el5 = document.getElementById('backgroundPreview'); if (el5) el5.src = s.background_img; }
  } catch(e){}
};

// NEW: Handle file upload to base64 for admin
window.handleUpload = function(inputId, storageKey) {
  const input = document.getElementById(inputId);
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    if (storageKey.startsWith('lm_')) {
      let arr = JSON.parse(localStorage.getItem(storageKey) || '[]');
      arr.push({ img: base64 }); // For feedback/licenses, but adjust if needed
      localStorage.setItem(storageKey, JSON.stringify(arr));
    } else {
      window.saveAsset(storageKey, base64);
    }
    alert('Đã upload ảnh.');
    // Reload relevant list
    if (storageKey === 'lm_feedback') loadFeedbackToAdmin();
    if (storageKey === 'lm_licenses') loadLicensesToAdmin();
  };
  reader.readAsDataURL(input.files[0]);
};

// init on DOMContentLoaded (NEW: call renderFeedback & renderLicenses)
document.addEventListener('DOMContentLoaded', async ()=>{
  loadSettings();
  // thêm mới1
    try {
    const res = await fetch(GSA_URL + '?action=load');
    const data = await res.json();
    if (data.settings) {
      localStorage.setItem('lm_settings', data.settings);
      loadSettings();
    }
    if (data.products) localStorage.setItem('lm_products', JSON.stringify(data.products));
    if (data.feedback) localStorage.setItem('lm_feedback', JSON.stringify(data.feedback));
    if (data.licenses) localStorage.setItem('lm_licenses', JSON.stringify(data.licenses));
  } catch(e){ console.error(e); }
  //
  await renderProducts();
  renderFeedback(); // NEW
  renderLicenses(); // NEW
  // ensure about image fallback
  // cũ const about = document.getElementById('aboutImage'); if (about && !about.src) about.src = 'about.jpg';
  const about = $('#aboutImage'); if (about && !about.src) about.src = 'about.jpg';
  const quantityInput = $('#quantity');
if (quantityInput) {
  quantityInput.addEventListener('input', updateTotal);
  quantityInput.addEventListener('change', updateTotal);
}

});
// ====== MỞ FORM ĐẶT HÀNG KHI ẤN "MUA NGAY" ======
/*function openOrderModal(name, price, desc) {
  // Hiện modal
  const modal = document.getElementById('orderModal');
  modal.classList.remove('hidden');

  // Gán dữ liệu vào form
  document.getElementById('modalProductName').innerText = name;
  document.getElementById('modalProductPrice').innerText = price + "đ";
  document.getElementById('modalProductDesc').innerText = desc;

  document.getElementById('orderProductInput').value = name;
  document.getElementById('orderPriceInput').value = price;

  // Ẩn khung QR nếu đang mở
  const qrBox = document.getElementById('qrBox');
  if (qrBox) qrBox.classList.add('hidden');
}*/
// thêm mới1
function openOrderModal(name, price, desc) {
  const modal = $('#orderModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  $('#modalProductName').innerText = name;
  $('#modalProductPrice').innerText = price;
  $('#modalProductDesc').innerText = desc;
  $('#orderProductInput').value = name;
  $('#orderPriceInput').value = price;
  updateTotal();
}

// ====== NÚT ĐÓNG FORM ======
document.getElementById('closeOrder')?.addEventListener('click', () => {
   $('orderModal').classList.add('hidden');
});
