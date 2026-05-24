import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  addItemSchema,
  addressSchema,
  apiErrorSchema,
  authSessionSchema,
  cartSchema,
  cardSchema,
  categorySchema,
  changePasswordSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  listProductsQuerySchema,
  loginSchema,
  orderListResponseSchema,
  orderSchema,
  productListResponseSchema,
  productSchema,
  publicUserSchema,
  registerSchema,
  updateItemSchema,
  updateProfileSchema,
} from '@shared/contracts';

extendZodWithOpenApi(z);

export function buildOpenApiDocument() {
  const r = new OpenAPIRegistry();

  // ----- Security -----
  r.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'access_token',
    description: 'HttpOnly cookie set by /v1/auth/login or /v1/auth/register',
  });
  r.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  // ----- Reusable schemas -----
  r.register('PublicUser', publicUserSchema);
  r.register('AuthSession', authSessionSchema);
  r.register('RegisterInput', registerSchema);
  r.register('LoginInput', loginSchema);
  r.register('Category', categorySchema);
  r.register('Product', productSchema);
  r.register('ProductListResponse', productListResponseSchema);
  r.register('Cart', cartSchema);
  r.register('AddItemInput', addItemSchema);
  r.register('UpdateItemInput', updateItemSchema);
  r.register('Address', addressSchema);
  r.register('CardInput', cardSchema);
  r.register('CreateOrderInput', createOrderSchema);
  r.register('Order', orderSchema);
  r.register('OrderListResponse', orderListResponseSchema);
  r.register('UpdateProfileInput', updateProfileSchema);
  r.register('ChangePasswordInput', changePasswordSchema);
  r.register('ApiError', apiErrorSchema);

  const errorRefs = {
    400: { description: 'Validation error', content: { 'application/json': { schema: apiErrorSchema } } },
    401: { description: 'Not authenticated', content: { 'application/json': { schema: apiErrorSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: apiErrorSchema } } },
    409: { description: 'Conflict', content: { 'application/json': { schema: apiErrorSchema } } },
    429: { description: 'Rate limited', content: { 'application/json': { schema: apiErrorSchema } } },
  } as const;

  // ----- Auth -----
  r.registerPath({
    method: 'post',
    path: '/v1/auth/register',
    tags: ['Auth'],
    summary: 'Create an account',
    request: { body: { content: { 'application/json': { schema: registerSchema } } } },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: authSessionSchema } } },
      400: errorRefs[400],
      409: errorRefs[409],
      429: errorRefs[429],
    },
  });

  r.registerPath({
    method: 'post',
    path: '/v1/auth/login',
    tags: ['Auth'],
    summary: 'Authenticate with email + password',
    request: { body: { content: { 'application/json': { schema: loginSchema } } } },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: authSessionSchema } } },
      401: errorRefs[401],
      429: errorRefs[429],
    },
  });

  r.registerPath({
    method: 'post',
    path: '/v1/auth/refresh',
    tags: ['Auth'],
    summary: 'Rotate the refresh-token pair',
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: authSessionSchema } } },
      401: errorRefs[401],
    },
  });

  r.registerPath({
    method: 'post',
    path: '/v1/auth/logout',
    tags: ['Auth'],
    summary: 'Clear cookies and revoke the refresh token',
    responses: { 204: { description: 'No content' } },
  });

  r.registerPath({
    method: 'get',
    path: '/v1/auth/me',
    tags: ['Auth'],
    summary: 'Return the current user',
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: publicUserSchema } } },
      401: errorRefs[401],
    },
  });

  // ----- Products -----
  r.registerPath({
    method: 'get',
    path: '/v1/products',
    tags: ['Products'],
    summary: 'List products (cursor-paginated)',
    request: { query: listProductsQuerySchema },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: productListResponseSchema } } },
    },
  });

  r.registerPath({
    method: 'get',
    path: '/v1/products/categories',
    tags: ['Products'],
    summary: 'List all categories',
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.object({ items: z.array(categorySchema) }) } },
      },
    },
  });

  r.registerPath({
    method: 'get',
    path: '/v1/products/{slug}',
    tags: ['Products'],
    summary: 'Fetch a product by slug',
    request: { params: z.object({ slug: z.string() }) },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: productSchema } } },
      404: errorRefs[404],
    },
  });

  // ----- Cart -----
  r.registerPath({
    method: 'get',
    path: '/v1/cart',
    tags: ['Cart'],
    summary: 'Get the current user cart',
    security: [{ cookieAuth: [] }],
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: cartSchema } } },
      401: errorRefs[401],
    },
  });

  r.registerPath({
    method: 'post',
    path: '/v1/cart/items',
    tags: ['Cart'],
    summary: 'Add an item to the cart',
    security: [{ cookieAuth: [] }],
    request: { body: { content: { 'application/json': { schema: addItemSchema } } } },
    responses: {
      201: { description: 'Updated cart', content: { 'application/json': { schema: cartSchema } } },
      400: errorRefs[400],
      401: errorRefs[401],
    },
  });

  r.registerPath({
    method: 'patch',
    path: '/v1/cart/items/{productId}',
    tags: ['Cart'],
    summary: 'Set the quantity of a cart item',
    security: [{ cookieAuth: [] }],
    request: {
      params: z.object({ productId: z.string() }),
      body: { content: { 'application/json': { schema: updateItemSchema } } },
    },
    responses: {
      200: { description: 'Updated cart', content: { 'application/json': { schema: cartSchema } } },
      401: errorRefs[401],
    },
  });

  r.registerPath({
    method: 'delete',
    path: '/v1/cart/items/{productId}',
    tags: ['Cart'],
    summary: 'Remove an item from the cart',
    security: [{ cookieAuth: [] }],
    request: { params: z.object({ productId: z.string() }) },
    responses: {
      200: { description: 'Updated cart', content: { 'application/json': { schema: cartSchema } } },
      401: errorRefs[401],
    },
  });

  // ----- Orders -----
  r.registerPath({
    method: 'post',
    path: '/v1/orders',
    tags: ['Orders'],
    summary: 'Place an order (atomic: charge + persist + decrement stock)',
    security: [{ cookieAuth: [] }],
    request: {
      headers: z.object({
        'idempotency-key': z.string().optional().describe('Replay-safe key — same input + key returns the original order'),
      }),
      body: { content: { 'application/json': { schema: createOrderSchema } } },
    },
    responses: {
      201: { description: 'Order created', content: { 'application/json': { schema: orderSchema } } },
      400: errorRefs[400],
      401: errorRefs[401],
    },
  });

  r.registerPath({
    method: 'get',
    path: '/v1/orders',
    tags: ['Orders'],
    summary: 'List the current user orders (cursor-paginated)',
    security: [{ cookieAuth: [] }],
    request: { query: listOrdersQuerySchema },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: orderListResponseSchema } } },
      401: errorRefs[401],
    },
  });

  r.registerPath({
    method: 'get',
    path: '/v1/orders/{orderId}',
    tags: ['Orders'],
    summary: 'Fetch a single order by id',
    security: [{ cookieAuth: [] }],
    request: { params: z.object({ orderId: z.string() }) },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: orderSchema } } },
      404: errorRefs[404],
      401: errorRefs[401],
    },
  });

  // ----- Users -----
  r.registerPath({
    method: 'patch',
    path: '/v1/users/me',
    tags: ['Users'],
    summary: 'Update the current profile',
    security: [{ cookieAuth: [] }],
    request: { body: { content: { 'application/json': { schema: updateProfileSchema } } } },
    responses: { 204: { description: 'No content' }, 401: errorRefs[401] },
  });

  r.registerPath({
    method: 'post',
    path: '/v1/users/me/password',
    tags: ['Users'],
    summary: 'Change password',
    security: [{ cookieAuth: [] }],
    request: { body: { content: { 'application/json': { schema: changePasswordSchema } } } },
    responses: { 204: { description: 'No content' }, 400: errorRefs[400], 401: errorRefs[401] },
  });

  const generator = new OpenApiGeneratorV3(r.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Aurora eCommerce API',
      version: '0.1.0',
      description:
        'Production-grade eCommerce API.\n\n' +
        '- Auth: JWT access (15 min) + opaque refresh (30 days), rotated, family-revocation on theft\n' +
        '- Persistence: MySQL via Prisma\n' +
        '- Validation: Zod on every body/query/param\n' +
        '- Idempotency: order creation supports `Idempotency-Key` header',
      license: { name: 'MIT' },
    },
    servers: [{ url: 'http://localhost:4000', description: 'Local development' }],
    tags: [
      { name: 'Auth', description: 'Sign-up, sign-in, refresh, logout, me' },
      { name: 'Products', description: 'Catalog browse + detail' },
      { name: 'Cart', description: 'Add / update / remove cart items' },
      { name: 'Orders', description: 'Checkout + order history' },
      { name: 'Users', description: 'Profile + password change' },
    ],
  });
}
