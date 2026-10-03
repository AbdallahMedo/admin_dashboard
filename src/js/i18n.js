// i18n.js - Enterprise Internationalization & Dual Language Engine (Arabic & English)

const translations = {
  en: {
    messages: 'Contact Messages',
    delivery_fees: 'Delivery Fees',
    // Brand & Header
    brand_name: 'Design & more',
    brand_tag: 'Dashboard',
    search_placeholder: 'Search resources, orders, catalog...',
    quick_admin: '+ New Admin',
    lang_name: 'العربية',
    lang_code: 'AR',
    live_db_connected: 'Live Database Connected',
    demo_mode_active: 'Demo Simulated Mode',
    admin_session: 'Admin Session Active',
    logout: 'Logout',

    // Nav Sections & Links
    core_management: 'Core Management',
    overview: 'Overview',
    orders: 'Orders',
    custom_orders: 'Custom Orders',
    catalog_store: 'Catalog & Store',
    products_stock: 'Products & Stock',
    categories: 'Categories',
    reviews_mod: 'Reviews Moderation',
    advertisements: 'Advertisements',
    access_system: 'Access & System',
    users_admins: 'Users & Admins',
    api_explorer: 'API Endpoints Hub',

    // Common Actions & Badges
    refresh: 'Refresh',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    price: 'Price',
    quantity: 'Quantity',
    edit: 'Edit',
    delete: 'Delete',
    view_details: 'View Details',
    save: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    update: 'Update',
    loading: 'Loading from database...',
    no_data: 'No records found in database.',
    success: 'Success',
    error: 'Error',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',

    // Orders Management
    orders_title: 'Orders Management',
    orders_subtitle: 'Real database transactions from MechanicalDesigns backend.',
    order_ref: 'Order Ref',
    customer: 'Customer',
    customer_info: 'Customer Information',
    client_name: 'Client Name',
    phone_number: 'Phone Number',
    whatsapp_number: 'WhatsApp Number',
    shipping_destination: 'Shipping Destination',
    address: 'Street Address',
    city: 'City',
    governorate: 'Governorate',
    customer_notes: 'Customer Notes',
    no_notes: 'No special notes provided',
    order_items: 'Order Items',
    items_count: 'Items',
    payment_status: 'Payment Status',
    fulfillment_status: 'Fulfillment Status',
    all_orders: 'All Orders',
    pending_confirmation: 'Pending Confirmation',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    paid: 'Paid',
    unpaid: 'Unpaid',
    refunded: 'Refunded',
    admin_actions: 'Admin Status Actions',
    update_order_status: 'Update Order Status',
    update_payment_status: 'Update Payment Status',
    internal_admin_notes: 'Internal Administrative Notes',
    save_status: 'Update Status',
    save_payment: 'Update Payment',
    unit_price: 'Unit Price',
    qty: 'Qty',
    total_amount: 'Total Amount',
    date_placed: 'Date Placed',
    manage_order: 'Manage Order',
    call_customer: 'Call Client',
    whatsapp_customer: 'WhatsApp Client',

    // Products & Stock
    products_title: 'Products & Inventory',
    products_subtitle: 'Catalog management, bilingual titles, and inventory stock.',
    add_product: '+ Add Product',
    refresh_products: 'Refresh Products',
    search_products: 'Search product name, slug, or category...',
    product_title: 'Product Title',
    category_column: 'Category Name',
    slug: 'Slug',
    stock_quantity: 'Stock Inventory',
    gallery: 'Gallery',
    units: 'units',
    out_of_stock: 'Out of Stock',
    in_stock: 'In Stock',
    quick_stock_edit: 'Quick Stock Edit',
    unassigned_category: 'Unassigned Category',
    create_product_title: 'Add New Product to Database',
    edit_product_title: 'Edit Product',
    title_en: 'Title (English)',
    title_ar: 'Title (Arabic)',
    subtitle_en: 'Subtitle (English)',
    subtitle_ar: 'Subtitle (Arabic)',
    desc_en: 'Description (English)',
    desc_ar: 'Description (Arabic)',
    select_category: 'Select Category',

    // Categories
    categories_title: 'Categories & Departments',
    categories_subtitle: 'Department hierarchy, dual-language names, and product association.',
    add_category: '+ Add Category',
    refresh_categories: 'Refresh Categories',
    name_ar: 'Arabic Name',
    name_en: 'English Name',
    category_desc: 'Description',
    products_linked: 'Linked Products',
    public_status: 'Storefront Visibility',
    create_category_title: 'Create Store Category',
    edit_category_title: 'Edit Category',

    // Users & Admins
    users_title: 'Users & Admins Directory',
    users_subtitle: 'Manage client accounts, contact details, and provision admin team.',
    add_admin: '+ Provision Admin',
    refresh_users: 'Refresh Users',
    search_users: 'Search by name, email, or phone...',
    user_name: 'Full Name',
    user_email: 'Email Address',
    user_phone: 'Phone & WhatsApp',
    user_role: 'Account Role',
    user_status: 'Account Status',
    joined_date: 'Joined Date',
    client_role: 'Client',
    admin_role: 'Administrator',
    block_account: 'Block Account',
    unblock_account: 'Unblock Account',
    verified: 'Verified',
    unverified: 'Unverified',
    view_user_orders: 'View User Orders',

    // Overview KPIs
    kpi_orders: 'Total Orders',
    kpi_revenue: 'Total Revenue',
    kpi_customers: 'Registered Clients',
    kpi_products: 'Catalog Products',
    kpi_custom_orders: 'Custom Requests',
    kpi_avg_rating: 'Average Rating',
    recent_orders_title: 'Latest Customer Orders',
    best_sellers_title: 'Best Selling Mechanical Items',
    view_all_orders: 'View All Orders &rarr;',
    sold: 'sold',

    // Custom Orders
    custom_orders_title: 'Custom Design Enquiries',
    custom_orders_subtitle: 'Bespoke mechanical commissions and custom fabrication requests.',

    // Advertisements
    ads_title: 'Advertisements & Banners',
    ads_subtitle: 'Promotional carousels and marketing campaigns.',
    add_ad: '+ Add Advertisement',

    // Reviews
    reviews_title: 'Product Reviews Moderation',
    reviews_subtitle: 'Approve, reject, or remove customer product ratings and reviews.',
    approve: 'Approve',
    reject: 'Reject'
  },

  ar: {
    messages: 'رسائل التواصل',
    delivery_fees: 'رسوم التوصيل',
    // Brand & Header
    brand_name: 'إيثير أدمن',
    brand_tag: 'لوحة التحكم للمؤسسات',
    search_placeholder: 'بحث في البيانات، الطلبات، الكتالوج...',
    quick_admin: '+ مسؤول جديد',
    lang_name: 'English',
    lang_code: 'EN',
    live_db_connected: 'متصل بقاعدة البيانات المباشرة',
    demo_mode_active: 'الوضع التجريبي الافتراضي',
    admin_session: 'جلسة المسؤول نشطة',
    logout: 'تسجيل الخروج',

    // Nav Sections & Links
    core_management: 'الإدارة الرئيسية',
    overview: 'نظرة عامة ومؤشرات',
    orders: 'إدارة الطلبات',
    custom_orders: 'الطلبات المخصصة',
    catalog_store: 'المتجر والكتالوج',
    products_stock: 'المنتجات والمخزون',
    categories: 'الأقسام والتصنيفات',
    reviews_mod: 'مراجعة التقييمات',
    advertisements: 'الإعلانات والبنرات',
    access_system: 'الصلاحيات والمستخدمين',
    users_admins: 'المستخدمين والمسؤولين',
    api_explorer: 'مستكشف واجهات API',

    // Common Actions & Badges
    refresh: 'تحديث',
    actions: 'الإجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    shipping: 'تكلفة الشحن',
    price: 'السعر',
    quantity: 'الكمية',
    edit: 'تعديل',
    delete: 'حذف',
    view_details: 'عرض التفاصيل',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    close: 'إغلاق',
    update: 'تحديث',
    loading: 'جاري تحميل البيانات من السيرفر...',
    no_data: 'لا توجد بيانات مسجلة في قاعدة البيانات.',
    success: 'تم بنجاح',
    error: 'خطأ',
    active: 'نشط',
    inactive: 'غير نشط',
    all: 'الكل',

    // Orders Management
    orders_title: 'إدارة الطلبات والمبيعات',
    orders_subtitle: 'بيانات حقيقية مباشرة من قاعدة بيانات MechanicalDesigns.',
    order_ref: 'رقم الطلب',
    customer: 'العميل',
    customer_info: 'بيانات العميل ومعلومات التواصل',
    client_name: 'اسم العميل',
    phone_number: 'رقم الهاتف',
    whatsapp_number: 'رقم الواتساب',
    shipping_destination: 'عنوان وتفاصيل التوصيل',
    address: 'العنوان بالتفصيل',
    city: 'المدينة',
    governorate: 'المحافظة',
    customer_notes: 'ملاحظات العميل',
    no_notes: 'لا توجد ملاحظات خاصة من العميل',
    order_items: 'عناصر ومحتويات الطلب',
    items_count: 'العناصر',
    payment_status: 'حالة الدفع',
    fulfillment_status: 'حالة تنفيذ الطلب',
    all_orders: 'جميع الطلبات',
    pending_confirmation: 'بانتظار التأكيد',
    confirmed: 'تم التأكيد',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    refunded: 'مسترجع',
    admin_actions: 'إجراءات الإدارة على الطلب',
    update_order_status: 'تعديل حالة الطلب',
    update_payment_status: 'تعديل حالة الدفع',
    internal_admin_notes: 'ملاحظات إدارية داخلية',
    save_status: 'تحديث الحالة',
    save_payment: 'تحديث الدفع',
    unit_price: 'سعر الوحدة',
    qty: 'الكمية',
    total_amount: 'المبلغ الإجمالي',
    date_placed: 'تاريخ الإنشاء',
    manage_order: 'إدارة الطلب',
    call_customer: 'اتصال بالعميل',
    whatsapp_customer: 'مراسلة واتساب',

    // Products & Stock
    products_title: 'المنتجات وإدارة المخزون',
    products_subtitle: 'إدارة الكتالوج، الأسماء باللغتين العربية والإنجليزية، وتتبع المستودع.',
    add_product: '+ إضافة منتج جديد',
    refresh_products: 'تحديث المنتجات',
    search_products: 'بحث بالاسم، الرابط، أو القسم...',
    product_title: 'اسم المنتج',
    category_column: 'اسم القسم',
    slug: 'المعرّف (Slug)',
    stock_quantity: 'المخزون المتاح',
    gallery: 'الصور',
    units: 'قطعة',
    out_of_stock: 'نفذ من المخزون',
    in_stock: 'متوفر',
    quick_stock_edit: 'تعديل سريع للمخزون',
    unassigned_category: 'قسم غير محدد',
    create_product_title: 'إضافة منتج جديد لقاعدة البيانات',
    edit_product_title: 'تعديل بيانات المنتج',
    title_en: 'الاسم (بالإنجليزية)',
    title_ar: 'الاسم (بالعربية)',
    subtitle_en: 'العنوان الفرعي (بالإنجليزية)',
    subtitle_ar: 'العنوان الفرعي (بالعربية)',
    desc_en: 'الوصف (بالإنجليزية)',
    desc_ar: 'الوصف (بالعربية)',
    select_category: 'اختر القسم',

    // Categories
    categories_title: 'الأقسام والتصنيفات',
    categories_subtitle: 'هيكل التصنيفات للمتجر مع الأسماء باللغتين والبنرات.',
    add_category: '+ إضافة قسم جديد',
    refresh_categories: 'تحديث الأقسام',
    name_ar: 'الاسم بالعربية',
    name_en: 'الاسم بالإنجليزية',
    category_desc: 'الوصف',
    products_linked: 'المنتجات المرتبطة',
    public_status: 'الظهور في المتجر',
    create_category_title: 'إضافة قسم جديد',
    edit_category_title: 'تعديل بيانات القسم',

    // Users & Admins
    users_title: 'دليل المستخدمين والمسؤولين',
    users_subtitle: 'إدارة حسابات العملاء، بيانات الاتصال، وتعيين مسؤولين جدد.',
    add_admin: '+ تعيين مسؤول جديد',
    refresh_users: 'تحديث المستخدمين',
    search_users: 'بحث بالاسم أو البريد أو الهاتف...',
    user_name: 'الاسم الكامل',
    user_email: 'البريد الإلكتروني',
    user_phone: 'الهاتف والواتساب',
    user_role: 'الدور والصلاحية',
    user_status: 'حالة الحساب',
    joined_date: 'تاريخ التسجيل',
    client_role: 'عميل',
    admin_role: 'مسؤول نظام',
    block_account: 'حظر الحساب',
    unblock_account: 'إلغاء الحظر',
    verified: 'مفعّل',
    unverified: 'غير مفعّل',
    view_user_orders: 'عرض طلبات المستخدم',

    // Overview KPIs
    kpi_orders: 'إجمالي الطلبات',
    kpi_revenue: 'إجمالي الإيرادات',
    kpi_customers: 'العملاء المسجلين',
    kpi_products: 'منتجات الكتالوج',
    kpi_custom_orders: 'طلبات مخصصة',
    kpi_avg_rating: 'متوسط التقييمات',
    recent_orders_title: 'أحدث طلبات العملاء',
    best_sellers_title: 'المنتجات الأكثر مبيعاً',
    view_all_orders: 'عرض كل الطلبات &larr;',
    sold: 'مبيعة',

    // Custom Orders
    custom_orders_title: 'طلبات التصاميم المخصصة',
    custom_orders_subtitle: 'الطلبات الميكانيكية الخاصة والمجسمات المفصلة حسب رغبة العميل.',

    // Advertisements
    ads_title: 'الإعلانات والبنرات الترويجية',
    ads_subtitle: 'إدارة البنرات والعروض الترويجية في المتجر والتطبيق.',
    add_ad: '+ إضافة إعلان جديد',

    // Reviews
    reviews_title: 'مراجعة واعتماد التقييمات',
    reviews_subtitle: 'اعتماد أو رفض تقييمات وتعليقات العملاء على المنتجات.',
    approve: 'اعتماد',
    reject: 'رفض'
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('admin_lang') || 'en';
    this.listeners = new Set();
    this.applyDocumentDirection();
  }

  getLanguage() {
    return this.currentLang;
  }

  isRtl() {
    return this.currentLang === 'ar';
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'ar') return;
    this.currentLang = lang;
    localStorage.setItem('admin_lang', lang);
    this.applyDocumentDirection();
    this.notify();
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'en' ? 'ar' : 'en');
  }

  applyDocumentDirection() {
    const isAr = this.currentLang === 'ar';
    document.documentElement.setAttribute('lang', this.currentLang);
    document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    document.body.classList.toggle('rtl-mode', isAr);
  }

  t(key, fallback = '') {
    const dict = translations[this.currentLang] || translations.en;
    if (dict[key] !== undefined) return dict[key];
    if (translations.en[key] !== undefined) return translations.en[key];
    return fallback || key;
  }

  // Localized field helper: returns Arabic or English value according to current language
  localizeField(obj, fieldName) {
    if (!obj) return '';
    const cap = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const arField = `${fieldName}Ar`;
    const enField = `${fieldName}En`;
    const arFieldCap = `${cap}Ar`;
    const enFieldCap = `${cap}En`;

    if (this.currentLang === 'ar') {
      return obj[arField] || obj[arFieldCap] || obj[enField] || obj[enFieldCap] || obj[fieldName] || '';
    } else {
      return obj[enField] || obj[enFieldCap] || obj[arField] || obj[arFieldCap] || obj[fieldName] || '';
    }
  }

  formatCurrency(amount) {
    const num = Number(amount || 0);
    if (this.currentLang === 'ar') {
      return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
    }
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  formatDate(dateVal) {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const locale = this.currentLang === 'ar' ? 'ar-EG' : 'en-US';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateVal) {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const locale = this.currentLang === 'ar' ? 'ar-EG' : 'en-US';
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.currentLang); } catch (e) { console.error('i18n listener error:', e); }
    });
  }
}

export const i18n = new I18nManager();
