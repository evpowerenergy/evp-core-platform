import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Enable zod .openapi() extension
extendZodWithOpenApi(z);

// Initialize registry
const registry = new OpenAPIRegistry();

// Basic info
const info = {
  title: 'EV Power Energy CRM API',
  version: '1.0.0',
  description: 'OpenAPI documentation generated from Zod schemas',
};

// Base schemas
const LeadSchema = z.object({
  id: z.number().int(),
  customerName: z.string().optional(),
  tel: z.string().optional(),
  category: z.string().optional(),
});

registry.register('Lead', LeadSchema);

// Common wrappers
const SuccessSchema = z.object({ success: z.boolean().default(true) }).passthrough();
const PaginationQuery = z.object({ limit: z.string().optional(), page: z.string().optional() }).partial();

// Helper to register simple GET with optional query and generic success
function registerGet(path: string, opts?: { summary?: string; description?: string; tags?: string[]; querySchema?: z.ZodTypeAny; responseSchema?: z.ZodTypeAny; }) {
  registry.registerPath({
    method: 'get',
    path,
    summary: opts?.summary,
    description: opts?.description,
    tags: opts?.tags,
    request: opts?.querySchema
      ? { query: [{ name: 'query', schema: opts.querySchema, in: 'query' as const }] }
      : undefined,
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: opts?.responseSchema ?? SuccessSchema } }
      }
    }
  });
}

// Helper to register POST with generic body
function registerPost(path: string, opts?: { summary?: string; description?: string; tags?: string[]; bodySchema?: z.ZodTypeAny; responseSchema?: z.ZodTypeAny; }) {
  registry.registerPath({
    method: 'post',
    path,
    summary: opts?.summary,
    description: opts?.description,
    tags: opts?.tags,
    request: opts?.bodySchema ? { body: { content: { 'application/json': { schema: opts.bodySchema } } } } : undefined,
    responses: { 200: { description: 'OK', content: { 'application/json': { schema: opts?.responseSchema ?? SuccessSchema } } } }
  });
}

// ===== Core: Leads & My Leads =====
registerGet('/api/endpoints/core/leads/lead-management', { tags: ['leads'], summary: 'Lead management' });
registerPost('/api/endpoints/core/leads/lead-mutations', {
  tags: ['leads'],
  summary: 'Lead mutations',
  bodySchema: z.object({ action: z.string() }).passthrough()
});
// ❌ DELETED (2025-01-27): leads-complete - Legacy/Unused
// ❌ DELETED (2025-01-27): leads-optimized - Experimental/Unused
registerGet('/api/endpoints/core/leads/leads-list', { tags: ['leads'], summary: 'Leads list' });
registerGet('/api/endpoints/core/leads/leads-for-dashboard', { tags: ['leads'], summary: 'Leads for dashboard' });
registerGet('/api/endpoints/core/leads/lead-detail', { tags: ['leads'], summary: 'Lead detail' });
registerPost('/api/endpoints/core/leads/phone-validation', { tags: ['leads'], summary: 'Phone validation', bodySchema: z.object({ phone: z.string(), excludeId: z.number().nullable().optional() }) });
registerGet('/api/endpoints/core/my-leads/my-leads-data', { tags: ['my-leads'], summary: 'My leads data' });
registerGet('/api/endpoints/core/my-leads/my-leads', { tags: ['my-leads'], summary: 'My leads' });

// ===== Core: Sales Team =====
registerGet('/api/endpoints/core/sales-team/sales-team', { tags: ['sales-team'], summary: 'Sales team' });
registerGet('/api/endpoints/core/sales-team/sales-team-data', { tags: ['sales-team'], summary: 'Sales team data' });
registerGet('/api/endpoints/core/sales-team/filtered-sales-team', { tags: ['sales-team'], summary: 'Filtered sales team' });
registerGet('/api/endpoints/core/leads/sales-team-list', { tags: ['sales-team'], summary: 'Sales team list' });

// ===== Core: Inventory =====
registerGet('/api/endpoints/core/inventory/inventory', { tags: ['inventory'], summary: 'Inventory', description: 'Products, Units, POs, Suppliers, Customers, Sales Docs' });
registerPost('/api/endpoints/core/inventory/inventory-mutations', { tags: ['inventory'], summary: 'Inventory mutations', bodySchema: z.object({ action: z.string() }).passthrough() });

// ===== Core: Appointments =====
registerGet('/api/endpoints/core/appointments/appointments', { tags: ['appointments'], summary: 'Appointments' });

// ===== Additional: Products/Inventory/PO =====
registerGet('/api/endpoints/additional/products/products', { tags: ['products'], summary: 'Products' });
registerGet('/api/endpoints/additional/inventory/inventory-units', { tags: ['inventory'], summary: 'Inventory units' });
registerGet('/api/endpoints/additional/purchase-orders/purchase-orders', { tags: ['purchase-orders'], summary: 'Purchase orders' });
registerPost('/api/endpoints/additional/purchase-orders/purchase-order-mutations', { tags: ['purchase-orders'], summary: 'Purchase order mutations', bodySchema: z.object({ action: z.string() }).passthrough() });

// ===== Additional: Customer Services =====
registerGet('/api/endpoints/additional/customer/customer-services', { tags: ['customer-services'], summary: 'Customer services' });
registerGet('/api/endpoints/additional/customer/customer-service-stats', { tags: ['customer-services'], summary: 'Customer service stats' });
registerPost('/api/endpoints/additional/customer/customer-service-mutations', { tags: ['customer-services'], summary: 'Customer service mutations', bodySchema: z.object({ action: z.string() }).passthrough() });
registerGet('/api/endpoints/additional/customer/customer-service-filters', { tags: ['customer-services'], summary: 'Customer service filters' });

// ===== Additional: Auth =====
// ❌ DELETED (2025-01-27): additional/auth/auth - Frontend uses Supabase client directly
registerGet('/api/endpoints/additional/auth/user-data', { tags: ['auth'], summary: 'User data' });

// ===== System: Management / Service / Productivity / Infra =====
registerGet('/api/endpoints/system/management/sales-team-management', { tags: ['system-management'], summary: 'Sales team management' });
registerGet('/api/endpoints/system/management/products-management', { tags: ['system-management'], summary: 'Products management' });
registerGet('/api/endpoints/system/service/service-appointments', { tags: ['system-service'], summary: 'Service appointments' });
registerGet('/api/endpoints/system/service/service-visits', { tags: ['system-service'], summary: 'Service visits' });
registerPost('/api/endpoints/system/productivity/productivity-log-submission', { tags: ['system-productivity'], summary: 'Productivity log submission', bodySchema: z.object({ leadId: z.number().optional() }).passthrough() });
registerPost('/api/endpoints/system/follow-up/sale-follow-up', { tags: ['system-follow-up'], summary: 'Sale follow-up', bodySchema: z.object({ action: z.string() }).passthrough() });
registerGet('/api/endpoints/system/follow-up/sale-follow-up', { tags: ['system-follow-up'], summary: 'Sale follow-up (GET)' });
// ❌ DELETED (2025-01-27): /api/openai-usage - Legacy
registerPost('/api/openai-sync', { tags: ['infra'], summary: 'OpenAI sync' });
registerGet('/api/keep-alive', { tags: ['infra'], summary: 'Keep alive' });
registerPost('/api/csp-report', { tags: ['infra'], summary: 'CSP report', bodySchema: z.any() });
registerGet('/api/health', { tags: ['infra'], summary: 'Health' });

// Generate document
const generator = new OpenApiGeneratorV31(registry.definitions);
const doc = generator.generateDocument({
  openapi: '3.1.0',
  info,
  servers: [{ url: '/' }],
});

// Write file
const outDir = join(process.cwd(), 'server/docs/openapi');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'openapi.json');
writeFileSync(outFile, JSON.stringify(doc, null, 2), 'utf-8');
console.log(`✅ OpenAPI spec generated at ${outFile}`);


