import { INITIAL_MOCK_DATA } from './mockData.js';

// Deep clone to keep in-memory mutable state during session
let state = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));

export function resetMockData() {
  state = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}

// Generate realistic JWT simulation strings
function generateToken(type) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'usr_admin_1',
    role: 'Admin',
    type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (type === 'access' ? 900 : 2592000) // 15 mins vs 30 days
  }));
  const signature = btoa(`sig_${Math.random().toString(36).substring(2)}`);
  return `${header}.${payload}.${signature}`;
}

export async function handleMockRequest(method, path, body, queryParams = {}) {
  // Simulate natural network latency (80ms - 220ms)
  await new Promise(res => setTimeout(res, 90 + Math.random() * 110));

  const url = path.split('?')[0];
  if (url === '/api/admin/contact-messages/count' && method === 'GET') {
    return { status: 200, data: { totalCount: state.contactMessages.length } };
  }
  if (url === '/api/admin/contact-messages' && method === 'GET') {
    const params = { ...Object.fromEntries(new URLSearchParams(path.split('?')[1])), ...queryParams };
    const page = Number(params.page ?? 1), pageSize = Number(params.pageSize ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return { status: 400, data: { message: 'Invalid pagination parameters.' } };
    }
    const rows = [...state.contactMessages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { status: 200, data: { items: structuredClone(rows.slice((page - 1) * pageSize, page * pageSize)), totalCount: rows.length, page, pageSize } };
  }
  const contactMessageMatch = url.match(/^\/api\/admin\/contact-messages\/([^/]+)$/);
  if (contactMessageMatch && method === 'GET') {
    const row = state.contactMessages.find(row => row.id === decodeURIComponent(contactMessageMatch[1]));
    return row ? { status: 200, data: structuredClone(row) } : { status: 404, data: { message: 'Message not found.' } };
  }

  if (url === '/api/admin/delivery-governorates' && method === 'GET') {
    return { status: 200, data: structuredClone(state.deliveryGovernorates) };
  }
  const deliveryMatch = url.match(/^\/api\/admin\/delivery-governorates\/([^/]+)$/);
  if (deliveryMatch && method === 'PUT') {
    const row = state.deliveryGovernorates.find(row => row.id === deliveryMatch[1]);
    if (!row) return { status: 404, data: { message: 'Governorate not found.' } };
    if (!body || (body.deliveryFee !== null && (typeof body.deliveryFee !== 'number' || !Number.isFinite(body.deliveryFee) || body.deliveryFee < 0)) || typeof body.isActive !== 'boolean') {
      return { status: 400, data: { message: 'Provide a non-negative delivery fee or null, and an active status.' } };
    }
    Object.assign(row, { deliveryFee: body.deliveryFee, isActive: body.isActive });
    return { status: 200, data: structuredClone(row) };
  }

  // ==================== AUTH ====================
  if (url === '/api/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    if (!email || !password) {
      return { status: 400, data: { message: 'Email and password are required' } };
    }
    const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
      id: 'usr_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      role: 'Admin'
    };

    const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return {
      status: 200,
      data: {
        user,
        accessToken: generateToken('access'),
        refreshToken: generateToken('refresh'),
        accessTokenExpiresAt
      }
    };
  }

  if (url === '/api/auth/refresh' && method === 'POST') {
    return {
      status: 200,
      data: {
        accessToken: generateToken('access'),
        refreshToken: generateToken('refresh'),
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    };
  }

  if (url === '/api/auth/me' && method === 'GET') {
    const adminUser = state.users.find(u => u.role === 'Admin') || state.users[0];
    return { status: 200, data: adminUser };
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    return { status: 200, data: { success: true, message: 'Session terminated and refresh token revoked' } };
  }

  if (url === '/api/admin/authorization-check' && method === 'GET') {
    return { status: 200, data: { authorized: true, role: 'Admin', verifiedAt: new Date().toISOString() } };
  }

  // ==================== DASHBOARD OVERVIEW ====================
  if (url === '/api/admin/dashboard/overview' && method === 'GET') {
    // Dynamically compute totals from in-memory state
    const totalOrders = state.orders.length;
    const totalRevenue = state.orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0) + 184250.00;
    const totalProducts = state.products.length;
    const totalCustomers = state.users.filter(u => u.role !== 'Admin').length + 890;

    return {
      status: 200,
      data: {
        kpis: {
          ...state.overview.kpis,
          totalOrders,
          totalRevenue,
          totalProducts,
          totalCustomers,
          customOrders: state.customOrders.length,
          reviews: state.reviews.length
        },
        revenueTimeline: state.overview.revenueTimeline
      }
    };
  }

  if (url === '/api/admin/dashboard/recent-orders' && method === 'GET') {
    return { status: 200, data: state.orders.slice(0, 10) };
  }

  if (url === '/api/admin/dashboard/best-selling-products' && method === 'GET') {
    const sorted = [...state.products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    return { status: 200, data: sorted.slice(0, 5) };
  }

  // ==================== ORDERS ====================
  if (url === '/api/admin/orders' && method === 'GET') {
    let result = [...state.orders];
    if (queryParams.status && queryParams.status !== 'All') {
      result = result.filter(o => o.status.toLowerCase() === queryParams.status.toLowerCase());
    }
    return { status: 200, data: result };
  }

  const orderDetailMatch = url.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if (orderDetailMatch && method === 'GET') {
    const orderId = orderDetailMatch[1];
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return { status: 404, data: { message: `Order ${orderId} not found` } };
    return { status: 200, data: order };
  }

  const orderStatusMatch = url.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (orderStatusMatch && method === 'PATCH') {
    const orderId = orderStatusMatch[1];
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return { status: 404, data: { message: 'Order not found' } };
    if (body.status) order.status = body.status;
    if (body.notes) order.notes = body.notes;
    return { status: 200, data: order };
  }

  const orderPaymentMatch = url.match(/^\/api\/admin\/orders\/([^/]+)\/payment-status$/);
  if (orderPaymentMatch && method === 'PATCH') {
    const orderId = orderPaymentMatch[1];
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return { status: 404, data: { message: 'Order not found' } };
    if (body.status) order.paymentStatus = body.status;
    return { status: 200, data: order };
  }

  const orderItemStatusMatch = url.match(/^\/api\/admin\/orders\/([^/]+)\/items\/([^/]+)\/status$/);
  if (orderItemStatusMatch && method === 'PATCH') {
    const [, orderId, itemId] = orderItemStatusMatch;
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return { status: 404, data: { message: 'Order not found' } };
    const item = order.items.find(i => i.id === itemId);
    if (!item) return { status: 404, data: { message: 'Item not found' } };
    if (body.status) item.status = body.status;
    return { status: 200, data: item };
  }

  // ==================== PRODUCTS & IMAGES ====================
  if (url === '/api/admin/products' && method === 'GET') {
    let list = [...state.products];
    if (queryParams.search) {
      const q = queryParams.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }
    return {
      status: 200,
      data: {
        items: list,
        total: list.length,
        page: Number(queryParams.page || 1),
        pageSize: Number(queryParams.pageSize || 20)
      }
    };
  }

  if (url === '/api/admin/products' && method === 'POST') {
    const newProd = {
      id: 'prod_' + (state.products.length + 1) + '_' + Math.random().toString(36).substring(2, 6),
      name: body.name || 'Untitled Product',
      description: body.description || '',
      price: parseFloat(body.price) || 0,
      stockQuantity: parseInt(body.stockQuantity, 10) || 0,
      categoryId: body.categoryId || 'cat_1',
      isActive: body.isActive !== undefined ? body.isActive : true,
      images: body.images || [{ id: 'img_' + Date.now(), url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', isPrimary: true, displayOrder: 1 }],
      salesCount: 0
    };
    state.products.unshift(newProd);
    return { status: 201, data: newProd };
  }

  const prodIdMatch = url.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (prodIdMatch) {
    const prodId = prodIdMatch[1];
    const index = state.products.findIndex(p => p.id === prodId);

    if (method === 'GET') {
      if (index === -1) return { status: 404, data: { message: 'Product not found' } };
      return { status: 200, data: state.products[index] };
    }

    if (method === 'PUT') {
      if (index === -1) return { status: 404, data: { message: 'Product not found' } };
      state.products[index] = { ...state.products[index], ...body };
      return { status: 200, data: state.products[index] };
    }

    if (method === 'DELETE') {
      if (index === -1) return { status: 404, data: { message: 'Product not found' } };
      const deleted = state.products.splice(index, 1)[0];
      return { status: 200, data: { success: true, deletedId: deleted.id } };
    }
  }

  const prodStatusMatch = url.match(/^\/api\/admin\/products\/([^/]+)\/status$/);
  if (prodStatusMatch && method === 'PATCH') {
    const prod = state.products.find(p => p.id === prodStatusMatch[1]);
    if (!prod) return { status: 404, data: { message: 'Product not found' } };
    prod.isActive = Boolean(body.isActive);
    return { status: 200, data: prod };
  }

  const prodStockMatch = url.match(/^\/api\/admin\/products\/([^/]+)\/stock$/);
  if (prodStockMatch && method === 'PATCH') {
    const prod = state.products.find(p => p.id === prodStockMatch[1]);
    if (!prod) return { status: 404, data: { message: 'Product not found' } };
    prod.stockQuantity = parseInt(body.stockQuantity, 10) || 0;
    return { status: 200, data: prod };
  }

  const prodAddImageMatch = url.match(/^\/api\/admin\/products\/([^/]+)\/images$/);
  if (prodAddImageMatch && method === 'POST') {
    const prod = state.products.find(p => p.id === prodAddImageMatch[1]);
    if (!prod) return { status: 404, data: { message: 'Product not found' } };
    const newImg = {
      id: 'img_' + Date.now(),
      url: body.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      isPrimary: Boolean(body.isPrimary),
      displayOrder: body.displayOrder || prod.images.length + 1
    };
    if (newImg.isPrimary) {
      prod.images.forEach(img => img.isPrimary = false);
    }
    prod.images.push(newImg);
    return { status: 201, data: newImg };
  }

  const prodUploadImageMatch = url.match(/^\/api\/admin\/products\/([^/]+)\/images\/upload$/);
  if (prodUploadImageMatch && method === 'POST') {
    const prod = state.products.find(p => p.id === prodUploadImageMatch[1]);
    if (!prod) return { status: 404, data: { message: 'Product not found' } };
    const uploadedImg = {
      id: 'img_up_' + Date.now(),
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      isPrimary: Boolean(body?.isPrimary),
      displayOrder: body?.displayOrder || prod.images.length + 1
    };
    if (uploadedImg.isPrimary) {
      prod.images.forEach(img => img.isPrimary = false);
    }
    prod.images.push(uploadedImg);
    return { status: 201, data: uploadedImg };
  }

  const prodDeleteImageMatch = url.match(/^\/api\/admin\/products\/([^/]+)\/images\/([^/]+)$/);
  if (prodDeleteImageMatch && method === 'DELETE') {
    const [, prodId, imgId] = prodDeleteImageMatch;
    const prod = state.products.find(p => p.id === prodId);
    if (!prod) return { status: 404, data: { message: 'Product not found' } };
    prod.images = prod.images.filter(img => img.id !== imgId);
    return { status: 200, data: { success: true, message: 'Image deleted' } };
  }

  // ==================== CATEGORIES ====================
  if (url === '/api/admin/categories') {
    if (method === 'GET') {
      return { status: 200, data: state.categories };
    }
    if (method === 'POST') {
      const newCat = {
        id: 'cat_' + (state.categories.length + 1),
        name: body.name || 'New Category',
        slug: body.slug || (body.name || '').toLowerCase().replace(/\s+/g, '-'),
        description: body.description || '',
        isActive: body.isActive !== undefined ? body.isActive : true,
        productCount: 0
      };
      state.categories.push(newCat);
      return { status: 201, data: newCat };
    }
  }

  const catIdMatch = url.match(/^\/api\/admin\/categories\/([^/]+)$/);
  if (catIdMatch) {
    const catId = catIdMatch[1];
    const index = state.categories.findIndex(c => c.id === catId);
    if (index === -1) return { status: 404, data: { message: 'Category not found' } };

    if (method === 'PUT') {
      state.categories[index] = { ...state.categories[index], ...body };
      return { status: 200, data: state.categories[index] };
    }
    if (method === 'DELETE') {
      state.categories.splice(index, 1);
      return { status: 200, data: { success: true } };
    }
  }

  const catStatusMatch = url.match(/^\/api\/admin\/categories\/([^/]+)\/status$/);
  if (catStatusMatch && method === 'PATCH') {
    const cat = state.categories.find(c => c.id === catStatusMatch[1]);
    if (!cat) return { status: 404, data: { message: 'Category not found' } };
    cat.isActive = Boolean(body.isActive);
    return { status: 200, data: cat };
  }

  // ==================== REVIEWS ====================
  if (url === '/api/admin/reviews' && method === 'GET') {
    return { status: 200, data: state.reviews };
  }

  const reviewApproveMatch = url.match(/^\/api\/admin\/reviews\/([^/]+)\/approve$/);
  if (reviewApproveMatch && method === 'PATCH') {
    const rev = state.reviews.find(r => r.id === reviewApproveMatch[1]);
    if (!rev) return { status: 404, data: { message: 'Review not found' } };
    rev.status = 'Approved';
    return { status: 200, data: rev };
  }

  const reviewRejectMatch = url.match(/^\/api\/admin\/reviews\/([^/]+)\/reject$/);
  if (reviewRejectMatch && method === 'PATCH') {
    const rev = state.reviews.find(r => r.id === reviewRejectMatch[1]);
    if (!rev) return { status: 404, data: { message: 'Review not found' } };
    rev.status = 'Rejected';
    return { status: 200, data: rev };
  }

  const reviewDeleteMatch = url.match(/^\/api\/admin\/reviews\/([^/]+)$/);
  if (reviewDeleteMatch && method === 'DELETE') {
    const index = state.reviews.findIndex(r => r.id === reviewDeleteMatch[1]);
    if (index === -1) return { status: 404, data: { message: 'Review not found' } };
    state.reviews.splice(index, 1);
    return { status: 200, data: { success: true } };
  }

  // ==================== CUSTOM ORDERS ====================
  if (url === '/api/admin/custom-orders' && method === 'GET') {
    let list = state.customOrders;
    if (queryParams.status && queryParams.status !== 'All') {
      list = list.filter(co => co.status.toLowerCase() === queryParams.status.toLowerCase());
    }
    return { status: 200, data: list };
  }

  const customOrderImagesMatch = url.match(/^\/api\/admin\/custom-orders\/([^/]+)\/images$/);
  if (customOrderImagesMatch && method === 'GET') {
    const co = state.customOrders.find(o => o.id === customOrderImagesMatch[1]);
    if (!co) return { status: 404, data: { message: 'Custom order not found' } };
    return { status: 200, data: { orderId: co.id, images: co.images } };
  }

  const customOrderStatusMatch = url.match(/^\/api\/admin\/custom-orders\/([^/]+)\/status$/);
  if (customOrderStatusMatch && method === 'PATCH') {
    const co = state.customOrders.find(o => o.id === customOrderStatusMatch[1]);
    if (!co) return { status: 404, data: { message: 'Custom order not found' } };
    if (body.status) co.status = body.status;
    return { status: 200, data: co };
  }

  // ==================== ADVERTISEMENTS ====================
  if (url === '/api/admin/advertisements') {
    if (method === 'GET') return { status: 200, data: state.advertisements };
    if (method === 'POST') {
      const newAd = {
        id: 'ad_' + (state.advertisements.length + 1),
        titleEn: body.titleEn || '',
        titleAr: body.titleAr || '',
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
        linkUrl: body.linkUrl || '/',
        position: body.position || 'HeroBanner',
        isActive: body.isActive !== undefined ? body.isActive : true,
        clicks: 0,
        createdAt: new Date().toISOString()
      };
      state.advertisements.push(newAd);
      return { status: 201, data: newAd };
    }
  }

  const adIdMatch = url.match(/^\/api\/admin\/advertisements\/([^/]+)$/);
  if (adIdMatch) {
    const adId = adIdMatch[1];
    const index = state.advertisements.findIndex(a => a.id === adId);
    if (index === -1) return { status: 404, data: { message: 'Ad not found' } };

    if (method === 'PUT') {
      state.advertisements[index] = { ...state.advertisements[index], ...body };
      return { status: 200, data: state.advertisements[index] };
    }
    if (method === 'DELETE') {
      state.advertisements.splice(index, 1);
      return { status: 200, data: { success: true } };
    }
  }

  const adStatusMatch = url.match(/^\/api\/admin\/advertisements\/([^/]+)\/status$/);
  if (adStatusMatch && method === 'PATCH') {
    const ad = state.advertisements.find(a => a.id === adStatusMatch[1]);
    if (!ad) return { status: 404, data: { message: 'Ad not found' } };
    ad.isActive = Boolean(body.isActive);
    return { status: 200, data: ad };
  }

  // ==================== USERS & ADMINS ====================
  if (url === '/api/admin/users' && method === 'GET') {
    let list = state.users;
    if (queryParams.search) {
      const q = queryParams.search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return { status: 200, data: list };
  }

  // Create another Admin: POST /api/admin/users/admins
  if (url === '/api/admin/users/admins' && method === 'POST') {
    const { name, email, password, phoneNumber, whatsAppNumber } = body || {};
    if (!name || !email || !password) {
      return {
        status: 400,
        data: { message: 'Name, email, and password are required.' }
      };
    }
    if (password.length < 12) {
      return {
        status: 400,
        data: { message: 'Password must be at least 12 characters long.' }
      };
    }
    const newAdmin = {
      id: 'usr_admin_' + (state.users.length + 1),
      name,
      email,
      role: 'Admin',
      phoneNumber: phoneNumber || '',
      whatsAppNumber: whatsAppNumber || '',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    };
    state.users.unshift(newAdmin);
    return {
      status: 201,
      data: {
        success: true,
        message: `Admin account '${email}' provisioned successfully. Current session remains active.`,
        user: newAdmin
      }
    };
  }

  const userBlockMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/block$/);
  if (userBlockMatch && method === 'PATCH') {
    const usr = state.users.find(u => u.id === userBlockMatch[1]);
    if (!usr) return { status: 404, data: { message: 'User not found' } };
    usr.isBlocked = true;
    return { status: 200, data: { success: true, isBlocked: true } };
  }

  const userUnblockMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/unblock$/);
  if (userUnblockMatch && method === 'PATCH') {
    const usr = state.users.find(u => u.id === userUnblockMatch[1]);
    if (!usr) return { status: 404, data: { message: 'User not found' } };
    usr.isBlocked = false;
    return { status: 200, data: { success: true, isBlocked: false } };
  }

  const userOrdersMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/orders$/);
  if (userOrdersMatch && method === 'GET') {
    const usrId = userOrdersMatch[1];
    const orders = state.orders.filter(o => o.customer && o.customer.id === usrId);
    return { status: 200, data: orders };
  }

  const userReviewsMatch = url.match(/^\/api\/admin\/users\/([^/]+)\/reviews$/);
  if (userReviewsMatch && method === 'GET') {
    const usrId = userReviewsMatch[1];
    const reviews = state.reviews.filter(r => r.user && r.user.id === usrId);
    return { status: 200, data: reviews };
  }

  const userDetailMatch = url.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userDetailMatch && method === 'GET') {
    const usr = state.users.find(u => u.id === userDetailMatch[1]);
    if (!usr) return { status: 404, data: { message: 'User not found' } };
    return { status: 200, data: usr };
  }

  // Fallback for unknown endpoints
  return { status: 200, data: { message: `Mock simulated response for [${method}] ${path}`, timestamp: new Date().toISOString() } };
}
