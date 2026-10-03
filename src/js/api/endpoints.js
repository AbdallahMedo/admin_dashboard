// Complete Dictionary & Specifications of All Admin API Endpoints
// Based directly on ADMIN_DASHBOARD_FRONTEND.md

export const ENDPOINTS_CATALOG = [
  { id: 'contact-messages-list', category: 'Contact Messages', method: 'GET', path: '/api/admin/contact-messages', description: 'List contact messages, newest first', queryParams: [{ name: 'page', example: '1' }, { name: 'pageSize', example: '20' }], requiresAuth: true },
  { id: 'contact-messages-count', category: 'Contact Messages', method: 'GET', path: '/api/admin/contact-messages/count', description: 'Total saved contact messages for the sidebar badge', requiresAuth: true },
  { id: 'contact-messages-detail', category: 'Contact Messages', method: 'GET', path: '/api/admin/contact-messages/{id}', description: 'Get contact message details', pathParams: [{ name: 'id', example: 'b6b427fd-8a99-4fe0-b8bd-214123049648' }], requiresAuth: true },
  { id: 'delivery-governorates-list', category: 'Delivery Fees', method: 'GET', path: '/api/admin/delivery-governorates', description: 'List all 27 governorates, including unconfigured and inactive entries', requiresAuth: true },
  { id: 'delivery-governorates-update', category: 'Delivery Fees', method: 'PUT', path: '/api/admin/delivery-governorates/{id}', description: 'Set a non-negative EGP fee (or null) and active status', requiresAuth: true, bodyTemplate: { deliveryFee: 75, isActive: true } },
  // ==================== AUTH & SESSION ====================
  {
    id: 'auth-login',
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Submit credentials to log in as an Admin and receive JWT tokens',
    requiresAuth: false,
    bodyTemplate: {
      email: 'admin@example.com',
      password: 'AdminPassword123!'
    }
  },
  {
    id: 'auth-refresh',
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/refresh',
    description: 'Rotate refresh token and acquire new access token',
    requiresAuth: false,
    bodyTemplate: {
      refreshToken: '{{REFRESH_TOKEN}}'
    }
  },
  {
    id: 'auth-me',
    category: 'Authentication',
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get current user profile and verify active Admin role',
    requiresAuth: true
  },
  {
    id: 'auth-logout',
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/logout',
    description: 'Revoke refresh token and invalidate the active session',
    requiresAuth: true,
    bodyTemplate: {
      refreshToken: '{{REFRESH_TOKEN}}'
    }
  },
  {
    id: 'admin-auth-check',
    category: 'Authentication',
    method: 'GET',
    path: '/api/admin/authorization-check',
    description: 'Strict authorization check ensuring caller has full Admin privileges',
    requiresAuth: true
  },

  // ==================== DASHBOARD OVERVIEW ====================
  {
    id: 'dashboard-overview',
    category: 'Dashboard',
    method: 'GET',
    path: '/api/admin/dashboard/overview',
    description: 'Fetch KPI metric cards: orders, customers, products, revenue, custom orders, reviews',
    requiresAuth: true
  },
  {
    id: 'dashboard-recent-orders',
    category: 'Dashboard',
    method: 'GET',
    path: '/api/admin/dashboard/recent-orders',
    description: 'Fetch the latest 10 orders table for real-time monitoring',
    requiresAuth: true
  },
  {
    id: 'dashboard-best-sellers',
    category: 'Dashboard',
    method: 'GET',
    path: '/api/admin/dashboard/best-selling-products',
    description: 'Fetch top-performing and best-selling products list',
    requiresAuth: true
  },

  // ==================== ORDERS ====================
  {
    id: 'orders-list',
    category: 'Orders',
    method: 'GET',
    path: '/api/admin/orders',
    description: 'List orders with optional status filter (e.g. PendingConfirmation, Confirmed, Shipped, Delivered)',
    queryParams: [
      { name: 'status', example: 'PendingConfirmation', description: 'Filter by order status' }
    ],
    requiresAuth: true
  },
  {
    id: 'orders-detail',
    category: 'Orders',
    method: 'GET',
    path: '/api/admin/orders/{id}',
    description: 'Get complete order details including customer, shipping address, and line items',
    pathParams: [{ name: 'id', example: 'ord_101' }],
    requiresAuth: true
  },
  {
    id: 'orders-update-status',
    category: 'Orders',
    method: 'PATCH',
    path: '/api/admin/orders/{id}/status',
    description: 'Update the status of an order and optionally append administrative notes',
    pathParams: [{ name: 'id', example: 'ord_101' }],
    bodyTemplate: {
      status: 'Confirmed',
      notes: 'Confirmed by telephone.'
    },
    requiresAuth: true
  },
  {
    id: 'orders-update-payment',
    category: 'Orders',
    method: 'PATCH',
    path: '/api/admin/orders/{id}/payment-status',
    description: 'Update the payment status of an order (e.g. Paid, Pending, Refunded)',
    pathParams: [{ name: 'id', example: 'ord_101' }],
    bodyTemplate: {
      status: 'Paid'
    },
    requiresAuth: true
  },
  {
    id: 'orders-update-item-status',
    category: 'Orders',
    method: 'PATCH',
    path: '/api/admin/orders/{orderId}/items/{itemId}/status',
    description: 'Update an individual item status within a composite order',
    pathParams: [
      { name: 'orderId', example: 'ord_101' },
      { name: 'itemId', example: 'item_1' }
    ],
    bodyTemplate: {
      status: 'Prepared'
    },
    requiresAuth: true
  },

  // ==================== PRODUCTS & IMAGES ====================
  {
    id: 'products-list',
    category: 'Products',
    method: 'GET',
    path: '/api/admin/products',
    description: 'List and paginate through products catalog with search filtering',
    queryParams: [
      { name: 'page', example: '1' },
      { name: 'pageSize', example: '20' }
    ],
    requiresAuth: true
  },
  {
    id: 'products-create',
    category: 'Products',
    method: 'POST',
    path: '/api/admin/products',
    description: 'Create a new product in the store catalog',
    bodyTemplate: {
      name: 'Titanium Chrono Watch',
      description: 'Precision aerospace titanium casing with sapphire glass.',
      price: 499.00,
      stockQuantity: 25,
      categoryId: 'cat_watch_1',
      isActive: true
    },
    requiresAuth: true
  },
  {
    id: 'products-update',
    category: 'Products',
    method: 'PUT',
    path: '/api/admin/products/{id}',
    description: 'Modify product specifications and properties',
    pathParams: [{ name: 'id', example: 'prod_1' }],
    bodyTemplate: {
      name: 'Titanium Chrono Watch (Updated)',
      description: 'Updated casing specs.',
      price: 529.00,
      categoryId: 'cat_watch_1'
    },
    requiresAuth: true
  },
  {
    id: 'products-update-status',
    category: 'Products',
    method: 'PATCH',
    path: '/api/admin/products/{id}/status',
    description: 'Toggle product active/inactive visibility status',
    pathParams: [{ name: 'id', example: 'prod_1' }],
    bodyTemplate: {
      isActive: true
    },
    requiresAuth: true
  },
  {
    id: 'products-update-stock',
    category: 'Products',
    method: 'PATCH',
    path: '/api/admin/products/{id}/stock',
    description: 'Adjust available warehouse inventory stock level',
    pathParams: [{ name: 'id', example: 'prod_1' }],
    bodyTemplate: {
      stockQuantity: 15
    },
    requiresAuth: true
  },
  {
    id: 'products-delete',
    category: 'Products',
    method: 'DELETE',
    path: '/api/admin/products/{id}',
    description: 'Permanently remove product from inventory',
    pathParams: [{ name: 'id', example: 'prod_1' }],
    requiresAuth: true
  },
  {
    id: 'products-add-image-url',
    category: 'Products',
    method: 'POST',
    path: '/api/admin/products/{productId}/images',
    description: 'Attach a hosted image URL to a product gallery',
    pathParams: [{ name: 'productId', example: 'prod_1' }],
    bodyTemplate: {
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      displayOrder: 1,
      isPrimary: true
    },
    requiresAuth: true
  },
  {
    id: 'products-upload-image',
    category: 'Products',
    method: 'POST',
    path: '/api/admin/products/{productId}/images/upload',
    description: 'Upload multipart form image: file, displayOrder, isPrimary',
    pathParams: [{ name: 'productId', example: 'prod_1' }],
    isMultipart: true,
    requiresAuth: true
  },
  {
    id: 'products-delete-image',
    category: 'Products',
    method: 'DELETE',
    path: '/api/admin/products/{productId}/images/{imageId}',
    description: 'Delete an image from a product gallery',
    pathParams: [
      { name: 'productId', example: 'prod_1' },
      { name: 'imageId', example: 'img_101' }
    ],
    requiresAuth: true
  },

  // ==================== CATEGORIES ====================
  {
    id: 'categories-list',
    category: 'Categories',
    method: 'GET',
    path: '/api/admin/categories',
    description: 'List all store categories including inactive ones',
    requiresAuth: true
  },
  {
    id: 'categories-create',
    category: 'Categories',
    method: 'POST',
    path: '/api/admin/categories',
    description: 'Create a new product category',
    bodyTemplate: {
      name: 'Luxury Watches',
      slug: 'luxury-watches',
      description: 'Fine timepieces and collectors editions.',
      isActive: true
    },
    requiresAuth: true
  },
  {
    id: 'categories-update',
    category: 'Categories',
    method: 'PUT',
    path: '/api/admin/categories/{id}',
    description: 'Update category details and hierarchy',
    pathParams: [{ name: 'id', example: 'cat_1' }],
    bodyTemplate: {
      name: 'Luxury Timepieces',
      slug: 'luxury-timepieces',
      description: 'Exclusive chronographs.'
    },
    requiresAuth: true
  },
  {
    id: 'categories-status',
    category: 'Categories',
    method: 'PATCH',
    path: '/api/admin/categories/{id}/status',
    description: 'Toggle category active status',
    pathParams: [{ name: 'id', example: 'cat_1' }],
    bodyTemplate: {
      isActive: true
    },
    requiresAuth: true
  },
  {
    id: 'categories-delete',
    category: 'Categories',
    method: 'DELETE',
    path: '/api/admin/categories/{id}',
    description: 'Delete a category from the system',
    pathParams: [{ name: 'id', example: 'cat_1' }],
    requiresAuth: true
  },

  // ==================== REVIEWS ====================
  {
    id: 'reviews-list',
    category: 'Reviews',
    method: 'GET',
    path: '/api/admin/reviews',
    description: 'List customer reviews for moderation with status/product filter',
    queryParams: [
      { name: 'page', example: '1' },
      { name: 'pageSize', example: '20' }
    ],
    requiresAuth: true
  },
  {
    id: 'reviews-approve',
    category: 'Reviews',
    method: 'PATCH',
    path: '/api/admin/reviews/{id}/approve',
    description: 'Approve review for public display on the store',
    pathParams: [{ name: 'id', example: 'rev_1' }],
    requiresAuth: true
  },
  {
    id: 'reviews-reject',
    category: 'Reviews',
    method: 'PATCH',
    path: '/api/admin/reviews/{id}/reject',
    description: 'Reject an inappropriate review',
    pathParams: [{ name: 'id', example: 'rev_1' }],
    requiresAuth: true
  },
  {
    id: 'reviews-delete',
    category: 'Reviews',
    method: 'DELETE',
    path: '/api/admin/reviews/{id}',
    description: 'Delete a customer review',
    pathParams: [{ name: 'id', example: 'rev_1' }],
    requiresAuth: true
  },

  // ==================== CUSTOM ORDERS ====================
  {
    id: 'custom-orders-list',
    category: 'Custom Orders',
    method: 'GET',
    path: '/api/admin/custom-orders',
    description: 'List custom-design inquiries and bespoke requests (filter by status e.g. New)',
    queryParams: [
      { name: 'status', example: 'New' }
    ],
    requiresAuth: true
  },
  {
    id: 'custom-orders-images',
    category: 'Custom Orders',
    method: 'GET',
    path: '/api/admin/custom-orders/{id}/images',
    description: 'View client reference inspiration images uploaded for custom work',
    pathParams: [{ name: 'id', example: 'cust_ord_1' }],
    requiresAuth: true
  },
  {
    id: 'custom-orders-status',
    category: 'Custom Orders',
    method: 'PATCH',
    path: '/api/admin/custom-orders/{id}/status',
    description: 'Update custom order inquiry status (e.g. Contacted, Quoted, InProgress, Completed)',
    pathParams: [{ name: 'id', example: 'cust_ord_1' }],
    bodyTemplate: {
      status: 'Contacted'
    },
    requiresAuth: true
  },

  // ==================== ADVERTISEMENTS ====================
  {
    id: 'ads-list',
    category: 'Advertisements',
    method: 'GET',
    path: '/api/admin/advertisements',
    description: 'List all promotional banners and marketing advertisements',
    requiresAuth: true
  },
  {
    id: 'ads-create',
    category: 'Advertisements',
    method: 'POST',
    path: '/api/admin/advertisements',
    description: 'Create a new promotional advertisement banner',
    bodyTemplate: {
      titleEn: 'Summer Flash Sale',
      titleAr: 'تخفيضات الصيف',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      linkUrl: '/promotions/summer',
      position: 'HeroBanner',
      isActive: true
    },
    requiresAuth: true
  },
  {
    id: 'ads-update',
    category: 'Advertisements',
    method: 'PUT',
    path: '/api/admin/advertisements/{id}',
    description: 'Update advertisement details and link',
    pathParams: [{ name: 'id', example: 'ad_1' }],
    bodyTemplate: {
      titleEn: 'Summer Flash Sale - Extended',
      titleAr: 'تمديد تخفيضات الصيف',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      mobileImageUrl: null,
      linkUrl: '/promotions/summer-extended',
      displayOrder: 0,
      startDate: null,
      endDate: null
    },
    requiresAuth: true
  },
  {
    id: 'ads-status',
    category: 'Advertisements',
    method: 'PATCH',
    path: '/api/admin/advertisements/{id}/status',
    description: 'Toggle advertisement active status',
    pathParams: [{ name: 'id', example: 'ad_1' }],
    bodyTemplate: {
      isActive: true
    },
    requiresAuth: true
  },
  {
    id: 'ads-delete',
    category: 'Advertisements',
    method: 'DELETE',
    path: '/api/admin/advertisements/{id}',
    description: 'Delete an advertisement banner',
    pathParams: [{ name: 'id', example: 'ad_1' }],
    requiresAuth: true
  },

  // ==================== USERS & ADMINS ====================
  {
    id: 'users-list',
    category: 'Users & Admins',
    method: 'GET',
    path: '/api/admin/users',
    description: 'List user directory with search query support',
    queryParams: [
      { name: 'search', example: 'alex' }
    ],
    requiresAuth: true
  },
  {
    id: 'users-detail',
    category: 'Users & Admins',
    method: 'GET',
    path: '/api/admin/users/{id}',
    description: 'Retrieve full user profile and account status',
    pathParams: [{ name: 'id', example: 'usr_1' }],
    requiresAuth: true
  },
  {
    id: 'admins-create',
    category: 'Users & Admins',
    method: 'POST',
    path: '/api/admin/users/admins',
    description: 'Provision a new Admin account without modifying the active session (password >= 12 chars required)',
    bodyTemplate: {
      name: 'Sales Administrator',
      email: 'sales.admin@example.com',
      password: 'Use-a-unique-12-character-password',
      phoneNumber: '01000000000',
      whatsAppNumber: '01000000000'
    },
    requiresAuth: true
  },
  {
    id: 'users-block',
    category: 'Users & Admins',
    method: 'PATCH',
    path: '/api/admin/users/{id}/block',
    description: 'Block user account from accessing the platform',
    pathParams: [{ name: 'id', example: 'usr_1' }],
    requiresAuth: true
  },
  {
    id: 'users-unblock',
    category: 'Users & Admins',
    method: 'PATCH',
    path: '/api/admin/users/{id}/unblock',
    description: 'Restore and unblock a previously blocked user account',
    pathParams: [{ name: 'id', example: 'usr_1' }],
    requiresAuth: true
  },
  {
    id: 'users-orders',
    category: 'Users & Admins',
    method: 'GET',
    path: '/api/admin/users/{id}/orders',
    description: 'Get historical order list placed by a specific user',
    pathParams: [{ name: 'id', example: 'usr_1' }],
    requiresAuth: true
  },
  {
    id: 'users-reviews',
    category: 'Users & Admins',
    method: 'GET',
    path: '/api/admin/users/{id}/reviews',
    description: 'Get all product reviews submitted by a specific user',
    pathParams: [{ name: 'id', example: 'usr_1' }],
    requiresAuth: true
  }
];
