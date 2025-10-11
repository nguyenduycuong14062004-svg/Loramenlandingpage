// app.js - shared logic for index + admin
// GSA (Google Apps Script) endpoint (your link)
const GSA_URL = "https://script.google.com/macros/s/AKfycbxOCGQtAeha4mVSQbn2z2sNo9pqYd2t_zDr10dSeMWNqeVBrjBMBcOXRev6GiSmLju8/exec";

// Utility
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Load products: prefer localStorage -> fallback to products.json
async function loadProductsSource() {
  const local = localStorage.getItem('lm_products');
  if (local) {
    try { return JSON.parse(local); } catch(e){}
  }
  // fallback fetch products.json
  try {
    const res = await fetch('products.json');
    if (!res.ok) return [];
    const arr = await res.json();
    // store to localStorage so admin edits persist
    localStorage.setItem('lm_products', JSON.stringify(arr));
    return arr;
  } catch(e) { return []; }
}

// Render products on index.html
async function renderProducts() {
  const grid = $('#productsGrid');
  if (!grid) return;
  const products = await loadProductsSource();
  grid.innerHTML = '';
  products.forEach(prod => {
    const card = document.createElement('article');
    card.className = 'bg-white rounded-2xl overflow-hidden product-card card-hover reveal';
    card.dataset.id = prod.id;
    card.innerHTML = `
      <div class="relative">
        <div class="product-media aspect-[1/1]">
          <img class="img-front w-full h-full object-cover" src="${prod.img1||'https://via.placeholder.com/420x420'}" alt="${escapeHtml(prod.title)}">
          <img class="img-back w-full h-full object-cover" src="${prod.img2||prod.img1||'https://via.placeholder.com/420x420'}" alt="${escapeHtml(prod.title)}">
        </div>
        <div class="p-5">
          <h4 class="text-lg font-semibold">${escapeHtml(prod.title)}</h4>
          <p class="text-sm text-gray-600 mt-2">${escapeHtml(prod.desc||'')}</p>
          <div class="mt-4 flex items-center justify-between">
            <div class="text-amber-500 font-bold">${formatVND(prod.price)}</div>
            <button class="bg-amber-300 px-3 py-2 rounded-md font-semibold" data-product="${escapeHtml(prod.title)}" data-img="${prod.img1||''}" data-price="${escapeHtml(prod.price)}">Đặt mua</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // reveal observer
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {threshold: 0.12});
  $$('.reveal').forEach(el=>observer.observe(el));

  // attach order buttons
  $$('#productsGrid button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const name = btn.dataset.product;
      const img = btn.dataset.img;
      const price = btn.dataset.price;
      showOrderModal({ name, img, price });
    });
  });

  // mobile auto-swap behavior
  setupMobileSwap();
}

// escapeHtml
function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

// format VND
function formatVND(v) {
  if (!v) return '';
  const n = Number(v);
  if (isNaN(n)) return v;
  return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(n);
}

// ---- Order modal logic ----
function showOrderModal({name, img, price}) {
  const modal = $('#orderModal');
  if (!modal) return;
  $('#modalProductName').innerText = name || '';
  $('#modalProductImg').src = img || 'https://via.placeholder.com/300x300';
  $('#modalProductPrice').innerText = price ? formatVND(price) : '';
  $('#modalProductDesc').innerText = ''; // optional
  $('#orderProductInput').value = name || '';
  $('#orderStatus').innerText = '';
  modal.classList.remove('hidden');
  setTimeout(()=> {
    modal.querySelector('.transform')?.classList.remove('scale-95');
  }, 8);

  // focus first field after animation
  setTimeout(()=> {
    const f = modal.querySelector('input[name="fullname"]');
    if (f) f.focus();
  }, 300);
}
function closeOrderModal() {
  const modal = $('#orderModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

// close button
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'closeOrder') closeOrderModal();
});
// close on backdrop click
document.addEventListener('click', (e)=>{
  const modal = $('#orderModal');
  if (!modal) return;
  if (!modal.classList.contains('hidden')) {
    const box = modal.querySelector('div[role="dialog"], .rounded-xl') || modal.firstElementChild;
    if (!box) return;
    if (!box.contains(e.target) && !e.target.closest('#orderModal')) {
      // click outside -> close
      // closeOrderModal();
    }
  }
});

// form submit -> Google Sheets
document.addEventListener('submit', async (e) => {
  if (!e.target || e.target.id !== 'orderForm') return;
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  // validation minimal
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

  // send to GSA
  try {
    const res = await fetch(GSA_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const txt = await res.text();
    // success path
    $('#orderStatus').style.color = 'green';
    $('#orderStatus').innerText = 'Đã gửi. Cảm ơn!';

    // close modal, show thank you modal
    setTimeout(()=> {
      closeOrderModal();
      showThankModal();
    }, 700);

    form.reset();
  } catch(err) {
    console.warn('submit error', err);
    $('#orderStatus').style.color = 'orange';
    $('#orderStatus').innerText = 'Không gửi được, thử lại sau. (Đã lưu tạm)';
  }
});

// Thank you modal
function showThankModal() {
  const t = $('#thankModal');
  if (!t) return;
  t.classList.remove('hidden');
}
$('#thankOk') && $('#thankOk').addEventListener('click', ()=>{
  const t = $('#thankModal');
  if (!t) return;
  t.classList.add('hidden');
  // scroll back to products
  document.querySelector('#products')?.scrollIntoView({behavior:'smooth', block:'start'});
});

// ---- Age gate ----


// ---- mobile auto-swap images when product in view ----
let mobileSwapIntervals = new Map();
function setupMobileSwap() {
  // only enable on narrow screens
  if (window.innerWidth > 900) return;
  // observe when each product is in viewport
  const cards = $$('#productsGrid .product-card');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const card = entry.target;
      const front = card.querySelector('.img-front');
      const back = card.querySelector('.img-back');
      const id = card.dataset.id;
      if (entry.isIntersecting) {
        // start swap interval for this card
        if (mobileSwapIntervals.has(id)) return;
        let showingBack = false;
        const interval = setInterval(()=>{
          if (!front || !back) return;
          if (showingBack) {
            back.style.opacity = '0';
            front.style.opacity = '1';
          } else {
            back.style.opacity = '1';
            front.style.opacity = '0';
          }
          showingBack = !showingBack;
        }, 2500); // change every 2.5s
        mobileSwapIntervals.set(id, interval);
      } else {
        // stop interval and reset image
        if (mobileSwapIntervals.has(id)) {
          clearInterval(mobileSwapIntervals.get(id));
          mobileSwapIntervals.delete(id);
        }
        if (front && back) { front.style.opacity = '1'; back.style.opacity = '0'; }
      }
    });
  }, {threshold: 0.55});
  cards.forEach(c => obs.observe(c));
}

// ---- admin helper: load products into Admin list view ----
window.loadProductsToAdmin = async function() {
  const list = document.getElementById('productList');
  if (!list) return;
  const products = await loadProductsSource();
  list.innerHTML = '';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 border rounded-md';
    div.innerHTML = `
      <div class="w-20 h-20 bg-gray-100 rounded-md overflow-hidden"><img src="${p.img1||''}" class="w-full h-full object-cover"></div>
      <div class="flex-1">
        <div class="font-semibold">${escapeHtml(p.title)}</div>
        <div class="text-sm text-gray-600">${formatVND(p.price)}</div>
      </div>
      <div>
        <button class="px-3 py-2 border rounded-md mr-2" onclick="deleteProductById(${p.id})">Xóa</button>
      </div>
    `;
    list.appendChild(div);
  });
};

// On load: render products on index
document.addEventListener('DOMContentLoaded', ()=>{
  renderProducts();
});
