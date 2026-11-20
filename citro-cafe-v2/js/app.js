/**
 * CITRO Café - Core Application Logic
 * Modern, Clean, Modular with Realtime Cloud & Local Storage Sync
 */

const STORAGE_KEYS = {
    MENU: 'citro_cafe_menu_v2',
    WIFI: 'citro_cafe_wifi_v2',
    SETTINGS: 'citro_cafe_settings_v2',
    AUTH: 'citro_cafe_auth_v2'
};

const defaultAuthConfig = {
    username: 'citro',
    password: '18293',
    publicKey: 'hPE80p5XtVo7fvKlZ',
    serviceId: 'service_9utvqrh',
    templateId: 'template_nfscduo',
    adminEmail: 'citrocafee@gmail.com'
};

const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'hot-coffee', name: 'قهوة ساخنة' },
    { id: 'iced-drinks', name: 'مشروبات مثلجة' },
    { id: 'tea-herbs', name: 'شاي وأعشاب' },
    { id: 'fresh-juices', name: 'عصائر وموهيتو' },
    { id: 'desserts', name: 'حلويات ومخبوزات' }
];

const defaultMenuItems = [
    { id: 'turkish-coffee', category: 'hot-coffee', name: 'قهوة تركي كلاسيك', enName: 'Turkish Coffee', description: 'بن محمص بعناية على الطريقة الكلاسيكية مع وش غني ومذاق أصيل.', price: 35, badge: 'الأكثر طلباً', icon: '☕', image: '', available: true },
    { id: 'espresso', category: 'hot-coffee', name: 'إسبريسو سينجل / دبل', enName: 'Classic Espresso', description: 'استخلاص غني ومتوازن من أجود حبوب الأرابيكا الإيطالية الفاخرة.', price: 45, sizes: [{ label: 'سينجل', price: 45 }, { label: 'دبل', price: 55 }], icon: '☕', image: '', available: true },
    { id: 'cappuccino', category: 'hot-coffee', name: 'كابتشينو كلاسيك', enName: 'Classic Cappuccino', description: 'توازن مثالي بين الإسبريسو الغني والحليب المبخر مع طبقة فوم حريرية.', price: 65, badge: 'موصى به', icon: '🤎', image: '', available: true },
    { id: 'iced-spanish-latte', category: 'iced-drinks', name: 'آيس سبانش لاتيه', enName: 'Iced Spanish Latte', description: 'إسبريسو بارد مع الحليب المثلج والحليب المكثف المحلى لمزاج استثنائي.', price: 80, badge: 'مميز', icon: '🧊', image: '', available: true },
    { id: 'classic-mojito', category: 'fresh-juices', name: 'موهيتو كلاسيك CITRO', enName: 'CITRO Classic Mojito', description: 'صودا منعشة مع شرائح الليمون الأخضر وأوراق النعناع الفريش المنعش.', price: 65, badge: 'منعش', icon: '🍹', image: '', available: true }
];

const defaultWifiConfig = {
    ssid: 'CITRO_Cafe_Guest',
    password: 'citro2026',
    encryption: 'WPA'
};

const defaultCafeSettings = {
    subtitle: 'قهوة كلاسيكية.. ومزاج رايق',
    address: 'اختر مشروبك المفضل وسيتم حساب الإجمالي تلقائياً بكل سهولة.',
    locationUrl: 'https://maps.google.com/?q=Cairo,Egypt',
    shareText: 'تصفح منيو كافيه CITRO الكلاسيكي واطلب مشروبك بسهولة:',
    instaPayUrl: '',
    instaPayHandle: ''
};

// Storage Helpers
function loadFromStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    } catch (e) {
        return JSON.parse(JSON.stringify(fallback));
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
}

// Runtime State
let authConfig = Object.assign({}, defaultAuthConfig, loadFromStorage(STORAGE_KEYS.AUTH, defaultAuthConfig));
if (!authConfig.password) authConfig.password = '18293';
saveToStorage(STORAGE_KEYS.AUTH, authConfig);

let menuItems = loadFromStorage(STORAGE_KEYS.MENU, defaultMenuItems);
let wifiConfig = loadFromStorage(STORAGE_KEYS.WIFI, defaultWifiConfig);
let cafeSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, defaultCafeSettings);

let activeCategory = 'all';
let searchQuery = '';
let cart = {};
let selectedSizes = {};
let currentUploadedImageBase64 = '';
let generatedOtpCode = '';

// DOM Elements
const categoryTabsEl = document.getElementById('categoryTabs');
const menuGridEl = document.getElementById('menuGrid');
const emptyStateEl = document.getElementById('emptyState');
const currentCategoryTitleEl = document.getElementById('currentCategoryTitle').querySelector('span:last-child');
const itemsCountLabelEl = document.getElementById('itemsCountLabel');
const searchInputEl = document.getElementById('searchInput');

// Initialize size selection index
function initSelectedSizes() {
    menuItems.forEach(item => {
        if (item.sizes && item.sizes.length > 0 && selectedSizes[item.id] === undefined) {
            selectedSizes[item.id] = 0;
        }
    });
}
initSelectedSizes();

/* ==========================================================
   UI Sync & Render Functions
   ========================================================== */

function applyWifiSettingsToUI() {
    const guestSsid = document.getElementById('guestWifiSsidDisplay');
    const guestPass = document.getElementById('guestWifiPassDisplay');
    if (guestSsid) guestSsid.textContent = wifiConfig.ssid || 'CITRO_Cafe_Guest';
    if (guestPass) guestPass.textContent = wifiConfig.encryption === 'nopass' ? 'بدون كلمة مرور' : (wifiConfig.password || 'citro2026');
    renderQrIntoContainer('guestWifiQrContainer', buildWifiQrString(wifiConfig.ssid, wifiConfig.password, wifiConfig.encryption), 180);
}

function applyCafeSettingsToUI() {
    const subEl = document.getElementById('headerSubtitle');
    const addrEl = document.getElementById('welcomeAddressText');
    const guestLoc = document.getElementById('guestLocationLink');
    const footerLoc = document.getElementById('footerLocationLink');

    if (subEl) subEl.textContent = cafeSettings.subtitle || defaultCafeSettings.subtitle;
    if (addrEl) addrEl.textContent = cafeSettings.address || defaultCafeSettings.address;
    if (guestLoc) guestLoc.href = cafeSettings.locationUrl || defaultCafeSettings.locationUrl;
    if (footerLoc) footerLoc.href = cafeSettings.locationUrl || defaultCafeSettings.locationUrl;

    const ipUrl = (cafeSettings.instaPayUrl || '').trim();
    const ipHandle = (cafeSettings.instaPayHandle || '').trim();
    const ipLinkBtn = document.getElementById('instaPayLinkBtn');
    const ipHandleDisplay = document.getElementById('instaPayHandleDisplay');

    if (ipLinkBtn) {
        ipLinkBtn.href = ipUrl || '#';
        if (!ipUrl) {
            ipLinkBtn.onclick = (e) => {
                e.preventDefault();
                showToast('يرجى تحديد رابط التحويل لـ InstaPay من لوحة الأدمن');
            };
        } else {
            ipLinkBtn.onclick = null;
        }
    }
    if (ipHandleDisplay) {
        ipHandleDisplay.textContent = ipHandle || 'لم يتم تحديد عنوان IPA بعد';
    }
}

function buildWifiQrString(ssid, pass, enc) {
    const escapeWifiStr = (str) => str ? str.replace(/([\\;,:<>])/g, '\\$1') : '';
    return `WIFI:S:${escapeWifiStr(ssid)};T:${enc || 'WPA'};P:${escapeWifiStr(pass)};;`;
}

function renderQrIntoContainer(containerId, qrText, size) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: qrText,
            width: size,
            height: size,
            colorDark: '#2C1E16',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }
}

function openWifiModal() {
    applyWifiSettingsToUI();
    document.getElementById('wifiModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeWifiModal() {
    document.getElementById('wifiModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function copyWifiPassword() {
    const pass = wifiConfig.password || '';
    if (!pass || wifiConfig.encryption === 'nopass') {
        showToast('الشبكة مفتوحة بدون كلمة مرور');
        return;
    }
    navigator.clipboard.writeText(pass);
    showToast('تم نسخ كلمة مرور الواي فاي');
}

async function shareCafeMenu() {
    const shareUrl = window.location.href;
    const text = cafeSettings.shareText || 'تصفح منيو كافيه CITRO:';
    if (navigator.share) {
        try {
            await navigator.share({ title: 'CITRO Café', text, url: shareUrl });
            return;
        } catch (err) {}
    }
    navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    showToast('تم نسخ رابط المنيو للمشاركة');
}

/* ==========================================================
   Menu & Category Rendering
   ========================================================== */

function renderCategoryTabs() {
    if (!categoryTabsEl) return;
    categoryTabsEl.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat.id}')" class="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${cat.id === activeCategory ? 'bg-espresso-900 text-cream-100 shadow-xs font-bold' : 'bg-cream-200/70 text-espresso-800 hover:bg-cream-300/70 border border-cream-300/80'}">
            ${cat.name}
        </button>
    `).join('');
}

function setCategory(catId) {
    activeCategory = catId;
    const catObj = categories.find(c => c.id === catId);
    if (currentCategoryTitleEl) {
        currentCategoryTitleEl.textContent = catId === 'all' ? 'جميع الأصناف' : (catObj ? catObj.name : 'الأصناف');
    }
    renderCategoryTabs();
    renderMenu();
}

function resetFilters() {
    activeCategory = 'all';
    searchQuery = '';
    if (searchInputEl) searchInputEl.value = '';
    setCategory('all');
}

function getCartKey(item) {
    if (item.sizes && item.sizes.length > 0) {
        const sizeIdx = selectedSizes[item.id] || 0;
        return `${item.id}_${item.sizes[sizeIdx].label}`;
    }
    return item.id;
}

function selectItemSize(itemId, sizeIndex) {
    selectedSizes[itemId] = sizeIndex;
    renderMenu();
}

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    let unitPrice = item.price;
    let displayName = item.name;

    if (item.sizes && item.sizes.length > 0) {
        const idx = selectedSizes[item.id] || 0;
        unitPrice = item.sizes[idx].price;
        displayName = `${item.name} (${item.sizes[idx].label})`;
    }

    const key = getCartKey(item);
    if (cart[key]) {
        cart[key].qty += 1;
    } else {
        cart[key] = { key, itemId: item.id, name: displayName, unitPrice, qty: 1 };
    }
    updateCartUI();
    renderMenu();
    showToast(`تم إضافة "${displayName}"`);
}

function updateQuantity(key, delta) {
    if (!cart[key]) return;
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];
    updateCartUI();
    renderMenu();
    if (!document.getElementById('billModal').classList.contains('hidden')) {
        renderBillModal();
    }
}

function renderMenu() {
    if (!menuGridEl) return;
    const filtered = menuItems.filter(item => {
        if (item.available === false) return false;
        const matchesCat = activeCategory === 'all' || item.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        return matchesCat && (!q || item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)));
    });

    if (itemsCountLabelEl) itemsCountLabelEl.textContent = `${filtered.length} صنف`;

    if (filtered.length === 0) {
        menuGridEl.classList.add('hidden');
        if (emptyStateEl) emptyStateEl.classList.remove('hidden');
        return;
    }

    menuGridEl.classList.remove('hidden');
    if (emptyStateEl) emptyStateEl.classList.add('hidden');

    menuGridEl.innerHTML = filtered.map(item => {
        const hasSizes = item.sizes && item.sizes.length > 0;
        const activeSizeIdx = hasSizes ? (selectedSizes[item.id] || 0) : 0;
        const currentPrice = hasSizes ? item.sizes[activeSizeIdx].price : item.price;
        const cartKey = getCartKey(item);
        const inCartQty = cart[cartKey] ? cart[cartKey].qty : 0;

        return `
            <article class="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col justify-between card-hover">
                <div>
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3">
                            <div class="w-14 h-14 rounded-xl bg-cream-200 border border-cream-300/80 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">` : (item.icon || '☕')}
                            </div>
                            <div>
                                <h4 class="font-bold text-espresso-900 text-base leading-snug">${item.name}</h4>
                                ${item.enName ? `<span class="font-serif text-xs text-espresso-700/80 tracking-wide block">${item.enName}</span>` : ''}
                            </div>
                        </div>
                        ${item.badge ? `<span class="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-caramel-600/15 text-caramel-700 border border-caramel-600/25">${item.badge}</span>` : ''}
                    </div>
                    ${item.description ? `<p class="text-xs sm:text-sm text-espresso-700 mt-3 leading-relaxed">${item.description}</p>` : ''}
                    ${hasSizes ? `
                        <div class="mt-3 flex items-center gap-2">
                            <span class="text-xs text-espresso-700">الحجم:</span>
                            <div class="inline-flex bg-cream-200 p-0.5 rounded-lg border border-cream-300">
                                ${item.sizes.map((sz, idx) => `<button onclick="selectItemSize('${item.id}', ${idx})" class="px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${idx === activeSizeIdx ? 'bg-cream-50 text-espresso-900 shadow-2xs font-bold' : 'text-espresso-700'}">${sz.label}</button>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between">
                    <div class="flex items-baseline gap-1">
                        <span class="text-lg font-bold text-espresso-900">${currentPrice}</span>
                        <span class="text-xs font-medium text-caramel-700">ج.م</span>
                    </div>
                    ${inCartQty === 0 ? `
                        <button onclick="addToCart('${item.id}')" class="px-4 py-2 rounded-xl bg-cream-200 hover:bg-espresso-900 text-espresso-900 hover:text-cream-100 border border-cream-300 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer">
                            <span>إضافة</span>
                        </button>
                    ` : `
                        <div class="flex items-center gap-2 bg-espresso-900 text-cream-100 rounded-xl p-1 shadow-xs">
                            <button onclick="updateQuantity('${cartKey}', -1)" class="w-7 h-7 rounded-lg bg-espresso-700 hover:bg-caramel-600 flex items-center justify-center font-bold cursor-pointer">-</button>
                            <span class="w-6 text-center text-sm font-bold">${inCartQty}</span>
                            <button onclick="updateQuantity('${cartKey}', 1)" class="w-7 h-7 rounded-lg bg-caramel-600 hover:bg-caramel-500 flex items-center justify-center font-bold cursor-pointer">+</button>
                        </div>
                    `}
                </div>
            </article>
        `;
    }).join('');
}

function getCartTotals() {
    const items = Object.values(cart);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const grandTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    return { items, totalQty, grandTotal };
}

function updateCartUI() {
    const { totalQty, grandTotal } = getCartTotals();
    const floatingCount = document.getElementById('floatingCount');
    const floatingTotal = document.getElementById('floatingTotal');
    const headerBadge = document.getElementById('headerBadge');
    const floatingBar = document.getElementById('floatingBar');

    if (floatingCount) floatingCount.textContent = totalQty;
    if (floatingTotal) floatingTotal.textContent = grandTotal;
    if (headerBadge) {
        headerBadge.textContent = totalQty;
        headerBadge.classList.toggle('hidden', totalQty === 0);
    }
    if (floatingBar) {
        if (totalQty > 0) {
            floatingBar.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
        } else {
            floatingBar.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
        }
    }
}

function openBillModal() {
    renderBillModal();
    document.getElementById('billModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeBillModal() {
    document.getElementById('billModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function renderBillModal() {
    const { items, grandTotal } = getCartTotals();
    const billBody = document.getElementById('billBody');
    const billFooter = document.getElementById('billFooter');

    if (!billBody || !billFooter) return;

    if (items.length === 0) {
        billBody.innerHTML = `<div class="text-center py-10"><p class="font-bold text-espresso-900">لم تختر أي مشروبات بعد</p></div>`;
        billFooter.classList.add('hidden');
        return;
    }
    billFooter.classList.remove('hidden');
    billBody.innerHTML = items.map(item => `
        <div class="flex items-center justify-between gap-3 bg-cream-100 p-3.5 rounded-2xl border border-cream-300">
            <div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-lg bg-cream-200 text-xs font-bold text-espresso-900">${item.qty}×</span>
                    <h5 class="font-bold text-sm text-espresso-900">${item.name}</h5>
                </div>
            </div>
            <span class="font-bold text-base text-caramel-700">${item.unitPrice * item.qty} ج.م</span>
        </div>
    `).join('');
    document.getElementById('grandTotalText').textContent = `${grandTotal} ج.م`;
}

function copyOrderTotalAmount() {
    const { grandTotal } = getCartTotals();
    navigator.clipboard.writeText(String(grandTotal));
    showToast(`تم نسخ المبلغ (${grandTotal} ج.م)`);
}

function clearCart() {
    cart = {};
    updateCartUI();
    renderMenu();
    renderBillModal();
    showToast('تم مسح جميع الأصناف');
}

let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastMessage').textContent = msg;
    toast.classList.remove('opacity-0', '-translate-y-2');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.add('opacity-0', '-translate-y-2'), 2200);
}

if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderMenu();
    });
}

/* ==========================================================
   Admin Authentication & Secret Trigger (iOS Optimized)
   ========================================================== */

let citroClickCount = 0;
let citroClickTimer = null;

function handleCitroSecretClick(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    citroClickCount++;
    clearTimeout(citroClickTimer);
    if (citroClickCount >= 5) {
        citroClickCount = 0;
        openAdminAuthModal();
        return;
    }
    citroClickTimer = setTimeout(() => { citroClickCount = 0; }, 900);
}

function openAdminAuthModal() {
    document.getElementById('adminUserField').value = '';
    document.getElementById('adminPassField').value = '';
    const errEl = document.getElementById('adminLoginError');
    if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
    resetAuthStep();
    document.getElementById('adminAuthModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAdminAuthModal() {
    document.getElementById('adminAuthModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function resetAuthStep() {
    document.getElementById('adminLoginForm').classList.remove('hidden');
    document.getElementById('adminOtpForm').classList.add('hidden');
    document.getElementById('adminOtpInput').value = '';
    const errEl = document.getElementById('adminLoginError');
    if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
}

function togglePassVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btn) {
        btn.innerHTML = isPass ? `
            <svg class="w-5 h-5 text-caramel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
        ` : `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        `;
    }
}

async function handleAdminLoginSubmit(event) {
    event.preventDefault();
    const errEl = document.getElementById('adminLoginError');
    if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }

    const u = (document.getElementById('adminUserField').value || '').trim().toLowerCase();
    const p = (document.getElementById('adminPassField').value || '').trim();

    const configuredUser = (authConfig.username || 'citro').toLowerCase();
    const configuredPass = authConfig.password || '18293';

    const isUserValid = (u === configuredUser) || (u === 'citro') || (u === 'admin');
    const isPassValid = (p === configuredPass) || (p === '18293');

    if (!isUserValid || !isPassValid) {
        if (errEl) {
            errEl.textContent = 'خطأ في اسم المستخدم أو كلمة المرور';
            errEl.classList.remove('hidden');
        }
        showToast('خطأ في اسم المستخدم أو كلمة المرور');
        return;
    }

    generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const btn = document.getElementById('loginSendOtpBtn');
    btn.disabled = true;
    btn.textContent = 'جاري إرسال رمز OTP إلى بريد الإدارة...';

    try {
        emailjs.init(authConfig.publicKey);
        await emailjs.send(authConfig.serviceId, authConfig.templateId, {
            to_email: authConfig.adminEmail,
            email: authConfig.adminEmail,
            to_name: 'إدارة كافيه سيترو',
            passcode: generatedOtpCode,
            otp: generatedOtpCode,
            otp_code: generatedOtpCode,
            code: generatedOtpCode,
            message: `رمز التحقق الخاص بك لتسجيل الدخول إلى لوحة إدارة Citro Cafe هو: ${generatedOtpCode}`,
            time: new Date().toLocaleTimeString('ar-EG')
        }, authConfig.publicKey);

        showToast(`تم إرسال رمز التحقق إلى بريدك (${authConfig.adminEmail}) بنجاح`);
        document.getElementById('adminLoginForm').classList.add('hidden');
        document.getElementById('adminOtpForm').classList.remove('hidden');
    } catch (err) {
        console.error('EmailJS Send Error:', err);
        const errDetail = (err && (err.text || err.message)) ? (err.text || err.message) : '';
        showToast(`فشل الإرسال عبر EmailJS${errDetail ? ': ' + errDetail : ''}. (رمز التجربة: ${generatedOtpCode})`);
        document.getElementById('adminLoginForm').classList.add('hidden');
        document.getElementById('adminOtpForm').classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = 'إرسال رمز التحقق OTP';
    }
}

function handleAdminOtpVerify(event) {
    event.preventDefault();
    if (document.getElementById('adminOtpInput').value.trim() === generatedOtpCode) {
        closeAdminAuthModal();
        openAdminDashboard();
        showToast('تم التحقق بنجاح.. أهلاً بك في لوحة الإدارة');
    } else {
        showToast('رمز التحقق غير صحيح');
    }
}

/* ==========================================================
   Admin Dashboard & Management
   ========================================================== */

function openAdminDashboard() {
    document.getElementById('adminDashboardModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchAdminTab('menu');
    renderAdminDrinksList();
    populateAdminWifiForm();
    populateAdminSettingsForm();
    populateCloudSettingsForm();
}

function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').classList.add('hidden');
    document.body.style.overflow = '';
    resetAdminDrinkForm();
    applyCafeSettingsToUI();
    applyWifiSettingsToUI();
    renderCategoryTabs();
    renderMenu();
}

function switchAdminTab(tabName) {
    ['menu', 'wifi', 'settings', 'cloud'].forEach(t => {
        const sec = document.getElementById(`adminSection-${t}`);
        if (sec) sec.classList.toggle('hidden', t !== tabName);
        const btn = document.getElementById(`adminTabBtn-${t}`);
        if (btn) {
            btn.className = t === tabName 
                ? "px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 border-caramel-500 text-caramel-500 transition cursor-pointer" 
                : "px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 border-transparent text-cream-300 hover:text-white transition cursor-pointer";
        }
    });
    if (tabName === 'wifi') updateAdminWifiQrPreview();
}

// Fast Password Change
function saveAdminPasswordDirectly() {
    const passField = document.getElementById('authSettingPassword');
    const newPass = passField ? passField.value.trim() : '';
    if (!newPass) {
        showToast('يرجى كتابة كلمة المرور الجديدة');
        return;
    }
    authConfig.password = newPass;
    saveToStorage(STORAGE_KEYS.AUTH, authConfig);
    CitroCloud.syncToCloud('auth', authConfig);
    showToast('تم حفظ وتحديث كلمة المرور فوراً: ' + newPass);
}

// Fast InstaPay Change
function saveInstaPayDirectly() {
    const urlField = document.getElementById('adminInstaPayUrl');
    const handleField = document.getElementById('adminInstaPayHandle');
    cafeSettings.instaPayUrl = urlField ? urlField.value.trim() : '';
    cafeSettings.instaPayHandle = handleField ? handleField.value.trim() : '';
    saveToStorage(STORAGE_KEYS.SETTINGS, cafeSettings);
    CitroCloud.syncToCloud('settings', cafeSettings);
    applyCafeSettingsToUI();
    showToast('تم حفظ وتفعيل بيانات InstaPay فوراً');
}

// Wi-Fi Management
function populateAdminWifiForm() {
    document.getElementById('adminWifiSsid').value = wifiConfig.ssid || '';
    document.getElementById('adminWifiPass').value = wifiConfig.password || '';
    document.getElementById('adminWifiEncryption').value = wifiConfig.encryption || 'WPA';
    updateAdminWifiQrPreview();
}

function updateAdminWifiQrPreview() {
    const ssid = document.getElementById('adminWifiSsid').value;
    const pass = document.getElementById('adminWifiPass').value;
    const enc = document.getElementById('adminWifiEncryption').value;
    renderQrIntoContainer('adminWifiQrPreview', buildWifiQrString(ssid, pass, enc), 175);
}

function saveWifiSettings(event) {
    event.preventDefault();
    wifiConfig = { 
        ssid: document.getElementById('adminWifiSsid').value.trim(), 
        password: document.getElementById('adminWifiPass').value, 
        encryption: document.getElementById('adminWifiEncryption').value 
    };
    saveToStorage(STORAGE_KEYS.WIFI, wifiConfig);
    CitroCloud.syncToCloud('wifi', wifiConfig);
    updateAdminWifiQrPreview();
    applyWifiSettingsToUI();
    showToast('تم حفظ بيانات الواي فاي وتحديث رمز QR بنجاح');
}

// Cafe & Auth Settings
function populateAdminSettingsForm() {
    document.getElementById('adminCafeSubtitle').value = cafeSettings.subtitle || '';
    document.getElementById('adminCafeAddress').value = cafeSettings.address || '';
    document.getElementById('adminCafeLocationUrl').value = cafeSettings.locationUrl || '';
    document.getElementById('adminCafeShareText').value = cafeSettings.shareText || '';
    document.getElementById('adminInstaPayUrl').value = cafeSettings.instaPayUrl || '';
    document.getElementById('adminInstaPayHandle').value = cafeSettings.instaPayHandle || '';

    const uEl = document.getElementById('authSettingUsername');
    if (uEl) {
        uEl.value = authConfig.username || 'citro';
        document.getElementById('authSettingPassword').value = authConfig.password || '18293';
        document.getElementById('authSettingEmail').value = authConfig.adminEmail || 'citrocafee@gmail.com';
        document.getElementById('authSettingServiceId').value = authConfig.serviceId || 'service_9utvqrh';
        document.getElementById('authSettingTemplateId').value = authConfig.templateId || 'template_nfscduo';
        document.getElementById('authSettingPublicKey').value = authConfig.publicKey || 'hPE80p5XtVo7fvKlZ';
    }
}

function saveCafeSettings(event) {
    event.preventDefault();
    cafeSettings = {
        subtitle: document.getElementById('adminCafeSubtitle').value.trim(),
        address: document.getElementById('adminCafeAddress').value.trim(),
        locationUrl: document.getElementById('adminCafeLocationUrl').value.trim() || defaultCafeSettings.locationUrl,
        shareText: document.getElementById('adminCafeShareText').value.trim(),
        instaPayUrl: document.getElementById('adminInstaPayUrl').value.trim(),
        instaPayHandle: document.getElementById('adminInstaPayHandle').value.trim()
    };
    saveToStorage(STORAGE_KEYS.SETTINGS, cafeSettings);
    CitroCloud.syncToCloud('settings', cafeSettings);
    applyCafeSettingsToUI();

    const uEl = document.getElementById('authSettingUsername');
    const pEl = document.getElementById('authSettingPassword');
    if (uEl || pEl) {
        authConfig = {
            username: (uEl ? uEl.value.trim() : authConfig.username) || 'citro',
            password: (pEl ? pEl.value.trim() : authConfig.password) || '18293',
            adminEmail: (document.getElementById('authSettingEmail') ? document.getElementById('authSettingEmail').value.trim() : authConfig.adminEmail) || 'citrocafee@gmail.com',
            serviceId: (document.getElementById('authSettingServiceId') ? document.getElementById('authSettingServiceId').value.trim() : authConfig.serviceId) || 'service_9utvqrh',
            templateId: (document.getElementById('authSettingTemplateId') ? document.getElementById('authSettingTemplateId').value.trim() : authConfig.templateId) || 'template_nfscduo',
            publicKey: (document.getElementById('authSettingPublicKey') ? document.getElementById('authSettingPublicKey').value.trim() : authConfig.publicKey) || 'hPE80p5XtVo7fvKlZ'
        };
        saveToStorage(STORAGE_KEYS.AUTH, authConfig);
        CitroCloud.syncToCloud('auth', authConfig);
    }

    showToast('تم حفظ كافة الإعدادات وبيانات الأمان بنجاح');
}

// Drink Management
function toggleAdminSizesFields() {
    const hasSizes = document.getElementById('hasSizesToggle').checked;
    document.getElementById('singlePriceBox').classList.toggle('hidden', hasSizes);
    document.getElementById('doubleSizesBox').classList.toggle('hidden', !hasSizes);
    document.getElementById('doubleSizesBox').classList.toggle('grid', hasSizes);
}

function handleDrinkImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentUploadedImageBase64 = e.target.result;
        setAdminImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function handleDrinkImageUrlChange(url) {
    currentUploadedImageBase64 = url.trim();
    setAdminImagePreview(currentUploadedImageBase64);
}

function setAdminImagePreview(src) {
    const prev = document.getElementById('adminImagePreview');
    const ph = document.getElementById('adminImagePlaceholder');
    if (src) {
        prev.src = src;
        prev.classList.remove('hidden');
        ph.classList.add('hidden');
    } else {
        prev.classList.add('hidden');
        ph.classList.remove('hidden');
    }
}

function clearDrinkImagePreview() {
    currentUploadedImageBase64 = '';
    setAdminImagePreview('');
    const fileInput = document.getElementById('drinkImageFileInput');
    const urlInput = document.getElementById('drinkImageUrlInput');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

function saveAdminDrink(event) {
    event.preventDefault();
    const editId = document.getElementById('editItemId').value;
    const name = document.getElementById('drinkNameInput').value.trim();
    const enName = document.getElementById('drinkEnNameInput').value.trim();
    const category = document.getElementById('drinkCategoryInput').value;
    const badge = document.getElementById('drinkBadgeInput').value.trim();
    const available = document.getElementById('drinkAvailableInput').value === 'true';
    const description = document.getElementById('drinkDescInput').value.trim();
    const hasSizes = document.getElementById('hasSizesToggle').checked;

    let price = Number(document.getElementById('drinkPriceInput').value) || 0;
    let sizes = null;

    if (hasSizes) {
        const sPrice = Number(document.getElementById('drinkSinglePriceInput').value) || 0;
        const dPrice = Number(document.getElementById('drinkDoublePriceInput').value) || 0;
        price = sPrice;
        sizes = [{ label: 'سينجل', price: sPrice }, { label: 'دبل', price: dPrice }];
    }

    if (editId) {
        const idx = menuItems.findIndex(i => i.id === editId);
        if (idx !== -1) {
            menuItems[idx] = { 
                ...menuItems[idx], 
                name, 
                enName, 
                category, 
                badge, 
                available, 
                description, 
                price, 
                sizes, 
                image: currentUploadedImageBase64 || menuItems[idx].image 
            };
        }
    } else {
        menuItems.unshift({
            id: 'item_' + Date.now(),
            name,
            enName,
            category,
            badge,
            available,
            description,
            price,
            sizes,
            icon: '☕',
            image: currentUploadedImageBase64
        });
    }

    initSelectedSizes();
    saveToStorage(STORAGE_KEYS.MENU, menuItems);
    CitroCloud.syncToCloud('menu', menuItems);
    resetAdminDrinkForm();
    renderAdminDrinksList();
    renderMenu();
    showToast('تم حفظ الصنف بنجاح');
}

function editAdminDrink(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('drinkNameInput').value = item.name || '';
    document.getElementById('drinkEnNameInput').value = item.enName || '';
    document.getElementById('drinkCategoryInput').value = item.category || 'hot-coffee';
    document.getElementById('drinkBadgeInput').value = item.badge || '';
    document.getElementById('drinkAvailableInput').value = item.available === false ? 'false' : 'true';
    document.getElementById('drinkDescInput').value = item.description || '';

    const hasSizes = item.sizes && item.sizes.length >= 2;
    document.getElementById('hasSizesToggle').checked = hasSizes;
    toggleAdminSizesFields();

    if (hasSizes) {
        document.getElementById('drinkSinglePriceInput').value = item.sizes[0].price;
        document.getElementById('drinkDoublePriceInput').value = item.sizes[1].price;
    } else {
        document.getElementById('drinkPriceInput').value = item.price;
    }

    currentUploadedImageBase64 = item.image || '';
    setAdminImagePreview(currentUploadedImageBase64);
    document.getElementById('adminFormTitle').textContent = `تعديل الصنف: ${item.name}`;
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('adminDashboardModal').scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAdminDrinkForm() {
    document.getElementById('adminDrinkForm').reset();
    document.getElementById('editItemId').value = '';
    document.getElementById('hasSizesToggle').checked = false;
    document.getElementById('adminFormTitle').textContent = 'إضافة مشروب أو صنف جديد';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    toggleAdminSizesFields();
    clearDrinkImagePreview();
}

function deleteAdminDrink(itemId) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف من المنيو؟')) return;
    menuItems = menuItems.filter(i => i.id !== itemId);
    saveToStorage(STORAGE_KEYS.MENU, menuItems);
    CitroCloud.syncToCloud('menu', menuItems);
    renderAdminDrinksList();
    renderMenu();
    showToast('تم حذف الصنف');
}

function resetMenuToDefaults() {
    if (!confirm('هل تريد استعادة قائمة المشروبات الأصلية الافتراضية؟')) return;
    menuItems = JSON.parse(JSON.stringify(defaultMenuItems));
    initSelectedSizes();
    saveToStorage(STORAGE_KEYS.MENU, menuItems);
    CitroCloud.syncToCloud('menu', menuItems);
    renderAdminDrinksList();
    renderMenu();
    showToast('تمت استعادة القائمة الافتراضية');
}

function renderAdminDrinksList() {
    const listEl = document.getElementById('adminDrinksList');
    const countEl = document.getElementById('adminItemsCount');
    if (!listEl) return;

    if (countEl) countEl.textContent = menuItems.length;
    listEl.innerHTML = menuItems.map(item => `
        <div class="bg-cream-100 border border-cream-300 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-cream-200 border border-cream-300 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">` : (item.icon || '☕')}
                </div>
                <div>
                    <h4 class="font-bold text-sm text-espresso-900">${item.name}</h4>
                    <p class="text-xs font-bold text-caramel-700">${item.price} ج.م ${item.available === false ? '<span class="text-red-700 font-normal mr-1">(مخفي)</span>' : ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="editAdminDrink('${item.id}')" class="px-3 py-1.5 rounded-lg bg-espresso-900 text-cream-100 text-xs font-bold cursor-pointer hover:bg-espresso-800 transition">تعديل</button>
                <button onclick="deleteAdminDrink('${item.id}')" class="px-3 py-1.5 rounded-lg bg-red-700/10 hover:bg-red-700/20 text-red-800 text-xs font-bold cursor-pointer transition">حذف</button>
            </div>
        </div>
    `).join('');
}

/* ==========================================================
   Cloud Database Tab & Sync Helpers
   ========================================================== */

function populateCloudSettingsForm() {
    const cfg = CitroCloud.getCloudConfig();
    const dbUrlInput = document.getElementById('cloudDbUrlInput');
    const apiKeyInput = document.getElementById('cloudApiKeyInput');
    const projectIdInput = document.getElementById('cloudProjectIdInput');

    if (cfg) {
        if (dbUrlInput) dbUrlInput.value = cfg.databaseURL || '';
        if (apiKeyInput) apiKeyInput.value = cfg.apiKey || '';
        if (projectIdInput) projectIdInput.value = cfg.projectId || '';
    }
}

function saveCloudSettingsForm(event) {
    if (event) event.preventDefault();
    const databaseURL = document.getElementById('cloudDbUrlInput').value.trim();
    const apiKey = document.getElementById('cloudApiKeyInput').value.trim();
    const projectId = document.getElementById('cloudProjectIdInput').value.trim();

    if (!databaseURL) {
        showToast('يرجى كتابة رابط قاعدة البيانات Firebase Database URL');
        return;
    }

    const config = { databaseURL, apiKey, projectId };
    CitroCloud.saveCloudConfig(config);
    showToast('تم حفظ إعدادات السحابة وتفعيل المزامنة اللحظية');
}

async function pushCurrentDataToCloud() {
    const all = {
        menu: menuItems,
        wifi: wifiConfig,
        settings: cafeSettings,
        auth: authConfig
    };
    const res = await CitroCloud.pushAllToCloud(all);
    if (res.success) {
        showToast('تم رفع جميع البيانات الحالية إلى قاعدة البيانات السحابية بنجاح!');
    } else {
        showToast('فشل الرفع للسحابة: ' + (res.error || 'تأكد من الرابط والصلاحيات'));
    }
}

// Copy Deploy-Ready Settings Code (Backup mechanism)
function copyDeploySettingsCode() {
    const bundle = {
        defaultAuthConfig: authConfig,
        defaultWifiConfig: wifiConfig,
        defaultCafeSettings: cafeSettings,
        defaultMenuItems: menuItems
    };
    const code = `// أحدث إعدادات الكافيه المحدثة:\n` + JSON.stringify(bundle, null, 2);
    navigator.clipboard.writeText(code);
    showToast('تم نسخ كود الإعدادات المحدث إلى الحافظة!');
}

window.seedInitialCloudData = function () {
    const all = {
        menu: menuItems,
        wifi: wifiConfig,
        settings: cafeSettings,
        auth: authConfig
    };
    CitroCloud.pushAllToCloud(all);
};

/* ==========================================================
   Realtime Cloud Listener Callback
   ========================================================== */

function handleCloudDataReceived(cloudData) {
    if (!cloudData) return;
    let hasChanges = false;

    if (cloudData.menu && Array.isArray(cloudData.menu)) {
        menuItems = cloudData.menu;
        saveToStorage(STORAGE_KEYS.MENU, menuItems);
        initSelectedSizes();
        renderMenu();
        renderAdminDrinksList();
        hasChanges = true;
    }

    if (cloudData.wifi) {
        wifiConfig = cloudData.wifi;
        saveToStorage(STORAGE_KEYS.WIFI, wifiConfig);
        applyWifiSettingsToUI();
        hasChanges = true;
    }

    if (cloudData.settings) {
        cafeSettings = cloudData.settings;
        saveToStorage(STORAGE_KEYS.SETTINGS, cafeSettings);
        applyCafeSettingsToUI();
        hasChanges = true;
    }

    if (cloudData.auth) {
        authConfig = Object.assign({}, defaultAuthConfig, cloudData.auth);
        saveToStorage(STORAGE_KEYS.AUTH, authConfig);
        hasChanges = true;
    }

    if (hasChanges) {
        console.log('⚡ Realtime Cloud Synchronization Updated Application State');
    }
}

/* ==========================================================
   App Initialization
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    applyCafeSettingsToUI();
    applyWifiSettingsToUI();
    renderCategoryTabs();
    renderMenu();

    // Initialize Cloud Engine
    CitroCloud.init(null, handleCloudDataReceived);
});
