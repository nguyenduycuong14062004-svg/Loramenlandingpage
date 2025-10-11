// admin.js
const GSA_URL = "https://script.google.com/macros/s/AKfycbx7pbatupJeBeOZWgO5cZlyRx3Z_3JeymRRq_OoyR45HNw9KvB2LxZg7B6sCk9C8wOMeA/exec"; // your Apps Script URL

// --- DOM ---
const productList = document.getElementById('productList');
const feedbackList = document.getElementById('feedbackList');
const licensesList = document.getElementById('licensesList');

// --- Load data from localStorage ---
function getLocal(key){ return JSON.parse(localStorage.getItem(key)||'[]'); }
function setLocal(key,data){ localStorage.setItem(key, JSON.stringify(data)); }

// --- Render functions ---
function loadProductsToAdmin(){
  const arr = getLocal('lm_products');
  if(!productList) return;
  productList.innerHTML = '';
  arr.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'border p-2 rounded-md flex gap-2 items-center';
    div.innerHTML = `
      <img src="${p.img1||''}" class="w-16 h-16 object-cover rounded"/>
      <div class="flex-1">
        <div class="font-semibold">${p.title}</div>
        <div class="text-sm">${p.desc}</div>
        <div class="text-sm text-gray-600">${p.price} đ</div>
      </div>
    `;
    productList.appendChild(div);
  });
}

function loadFeedbackToAdmin(){
  const arr = getLocal('lm_feedback');
  if(!feedbackList) return;
  feedbackList.innerHTML = '';
  arr.forEach((f,i)=>{
    const div = document.createElement('div');
    div.className='inline-block m-1 border rounded';
    div.innerHTML=`<img src="${f.img}" class="w-24 h-42 object-cover"/>`;
    feedbackList.appendChild(div);
  });
}

function loadLicensesToAdmin(){
  const arr = getLocal('lm_licenses');
  if(!licensesList) return;
  licensesList.innerHTML = '';
  arr.forEach((l,i)=>{
    const div = document.createElement('div');
    div.className='inline-block m-1 border rounded';
    div.innerHTML=`<img src="${l.img}" class="w-24 h-42 object-cover"/>`;
    licensesList.appendChild(div);
  });
}

// --- Admin Settings ---
function loadAdminSettings(){
  const s = JSON.parse(localStorage.getItem('lm_settings')||'{}');
  if(s.logo) document.getElementById('logoPreview').src=s.logo;
  if(s.about_img) document.getElementById('aboutPreview').src=s.about_img;
  if(s.background_img) document.getElementById('backgroundPreview').src=s.background_img;
  if(s.qr) document.getElementById('qrPreview').src=s.qr;
}

// --- Save assets ---
function saveAsset(key,val){
  const s = JSON.parse(localStorage.getItem('lm_settings')||'{}');
  s[key]=val;
  localStorage.setItem('lm_settings', JSON.stringify(s));
}

// --- Optional: Sync with Google Sheets (GSA_URL) ---
async function syncDataToSheets(){
  const products = getLocal('lm_products');
  const feedback = getLocal('lm_feedback');
  const licenses = getLocal('lm_licenses');
  const settings = JSON.parse(localStorage.getItem('lm_settings')||'{}');
  try{
    await fetch(GSA_URL,{
      method:'POST',
      body:JSON.stringify({products,feedback,licenses,settings}),
      headers:{'Content-Type':'application/json'}
    });
    console.log('✅ Admin data synced to Sheets');
  }catch(e){ console.error('❌ Sync error:',e);}
}

// --- Auto-sync every 10s ---
setInterval(syncDataToSheets,10000);
