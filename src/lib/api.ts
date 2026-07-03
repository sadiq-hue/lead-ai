const BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(url, {
    headers: isFormData ? options?.headers : { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || body.message || res.statusText);
  }
  return res.json();
}

function list<T>(resource: string) {
  return (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ resource: string; count: number; rows: T[] }>(`/api/${resource}${qs}`);
  };
}

function get<T>(resource: string) {
  return (id: string) => request<T>(`/api/${resource}/${id}`);
}

function create<T>(resource: string) {
  return (data: Partial<T>) =>
    request<T>(`/api/${resource}`, { method: 'POST', body: JSON.stringify(data) });
}

function update<T>(resource: string) {
  return (id: string, data: Partial<T>) =>
    request<T>(`/api/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

function remove(resource: string) {
  return (id: string) =>
    request<{ success: boolean; deleted: Record<string, unknown> }>(`/api/${resource}/${id}`, { method: 'DELETE' });
}

export interface Business {
  id: string; name: string; industry: string | null; tier: 'starter' | 'growth' | 'pro';
  whatsapp_number: string | null; meta_page_id: string | null; mpesa_shortcode: string | null;
  country_code: string; currency: string; timezone: string; logo_url: string | null;
  active: boolean; description: string | null; products: string | null;
  created_at: string; updated_at: string;
}

export interface User {
  id: string; business_id: string; full_name: string; email: string; phone: string | null;
  role: 'owner' | 'admin' | 'agent' | 'viewer'; is_active: boolean;
  last_login_at: string | null; created_at: string; updated_at: string;
}

export interface Lead {
  id: string; business_id: string; channel: string; phone_number: string | null;
  name: string | null; status: string; score: number; assigned_to: string | null;
  source_ref: string | null; metadata: Record<string, unknown>;
  first_contact_at: string; last_activity_at: string; created_at: string; updated_at: string;
}

export interface Conversation {
  id: string; lead_id: string; business_id: string; channel: string;
  direction: 'inbound' | 'outbound'; content: string; media_url: string | null;
  ai_confidence_tier: string | null; confidence_score: number | null;
  auto_sent: boolean; escalated: boolean; sent_at: string; created_at: string;
}

export interface AiSession {
  id: string; conversation_id: string; lead_id: string; business_id: string;
  model: string; confidence_score: number | null; confidence_tier: string | null;
  escalated: boolean; tokens_input: number; tokens_output: number;
  latency_ms: number | null; prompt_snapshot: unknown; created_at: string;
}

export interface Deal {
  id: string; lead_id: string; business_id: string; assigned_to: string | null;
  title: string; status: string; amount: number; currency: string;
  notes: string | null; closed_at: string | null; created_at: string; updated_at: string;
}

export interface Booking {
  id: string; deal_id: string; lead_id: string; business_id: string;
  scheduled_at: string; duration_minutes: number; status: string;
  location: string | null; calendar_event_id: string | null;
  deposit_amount: number | null; deposit_paid: boolean; notes: string | null;
  created_at: string; updated_at: string;
}

export interface Payment {
  id: string; deal_id: string; business_id: string; provider: string;
  provider_ref: string | null; checkout_request_id: string | null;
  amount: number; currency: string; status: string;
  mpesa_phone: string | null; failure_reason: string | null;
  retry_count: number; receipt_url: string | null;
  paid_at: string | null; created_at: string; updated_at: string;
}

export interface Transaction {
  id: string; payment_id: string | null; expense_id: string | null;
  business_id: string; type: string; amount: number; currency: string;
  description: string | null; source: string | null; reconciled: boolean;
  transacted_at: string; created_at: string;
}

export interface Contact {
  id: string; business_id: string; lead_id: string | null;
  full_name: string; phone_primary: string | null; phone_secondary: string | null;
  email: string | null; company: string | null; job_title: string | null;
  contact_type: string; status: string; source_channel: string | null;
  assigned_to: string | null; notes: string | null;
  lifetime_value: number; total_deals: number; won_deals: number;
  last_contacted_at: string | null; created_at: string; updated_at: string;
}

export interface Expense {
  id: string; business_id: string; category_id: string | null;
  title: string; amount: number; currency: string; status: string;
  payment_method: string; reference_number: string | null;
  receipt_url: string | null; notes: string | null;
  is_recurring: boolean; reconciled: boolean;
  incurred_at: string; created_at: string; updated_at: string;
}

export interface Task {
  id: string; contact_id: string | null; deal_id: string | null;
  business_id: string; assigned_to: string | null; created_by: string | null;
  title: string; description: string | null;
  priority: string; status: string;
  due_at: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
}

export interface Vendor {
  id: string; business_id: string; name: string; phone: string | null;
  email: string | null; category_id: string | null;
  mpesa_till: string | null; mpesa_paybill: string | null;
  website: string | null; total_paid: number; transaction_count: number;
  last_paid_at: string | null; created_at: string; updated_at: string;
}

export interface PipelineStage {
  id: string; business_id: string; name: string; position: number;
  color_hex: string; is_won: boolean; is_lost: boolean; created_at: string;
}

export interface Activity {
  id: string; contact_id: string; deal_id: string | null;
  business_id: string; user_id: string | null;
  type: string; direction: string; channel: string | null;
  summary: string; outcome: string | null;
  duration_seconds: number | null; occurred_at: string; created_at: string;
}

export interface Notification {
  id: string; business_id: string; user_id: string | null;
  type: string; channel: string; title: string; body: string;
  read: boolean; ref_id: string | null; ref_type: string | null;
  sent_at: string; read_at: string | null;
}

export interface ExpenseCategory {
  id: string; business_id: string; parent_id: string | null;
  name: string; color_hex: string; is_system: boolean; is_active: boolean;
}

export interface FinancialSummary {
  id: string; business_id: string; period_year: number; period_month: number;
  total_revenue: number; total_expenses: number;
  cash_in: number; cash_out: number;
  new_leads: number; qualified_leads: number;
  won_deals: number; lost_deals: number;
  avg_deal_value: number; conversion_rate_pct: number;
  revenue_by_channel: Record<string, unknown>;
  expense_by_category: Record<string, unknown>;
  top_customers: Record<string, unknown>[];
}

export interface KnowledgeEntry {
  id: string; business_id: string;
  title: string; content: string;
  keywords: string[]; category: string;
  is_active: boolean;
  created_at: string; updated_at: string;
}

export interface NseStock {
  id: string; ticker: string; company_name: string;
  sector: string | null; market_cap: number | null;
  active: boolean; statement_count?: number; fundamentals_count?: number;
  created_at: string; updated_at: string;
}

export interface FinancialStatement {
  id: string; stock_id: string; file_url: string | null; file_name: string;
  period_type: string; fiscal_year: number; period: string | null;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  raw_text: string | null; error_message: string | null;
  created_at: string; updated_at: string;
}

export interface StockFundamental {
  id: string; stock_id: string; statement_id: string;
  revenue: number | null; net_profit: number | null;
  eps: number | null; dps: number | null;
  total_assets: number | null; total_liabilities: number | null;
  book_value: number | null; pe_ratio: number | null;
  fiscal_year: number; period: string | null;
  file_name?: string; period_type?: string;
  extracted_at: string; created_at: string;
}

// Specific route response types
interface SpecificListResponse<T, K extends string> {
  count: number;
  [key: K]: T[];
}

// Generic CRUD helpers
export const api = {
  // Health
  health: () => request<{ status: string; timestamp: string }>('/health'),

  // Email
  sendPaymentEmail: (data: {
    to: string; subject: string; html: string; text: string;
    customerName: string; company?: string; amount: string;
    paymentMethod: string; dueDate?: string; description?: string;
  }) => request<{ success: boolean; message: string; provider: string; messageId: string; recipient: string }>(
    '/api/send-payment-email', { method: 'POST', body: JSON.stringify(data) }
  ),

  // Businesses (specific routes)
  businesses: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Business, 'businesses'>>('/api/businesses' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Business>(`/api/businesses/${id}`),
    create: (data: Partial<Business>) =>
      request<Business>('/api/businesses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Business>) =>
      request<Business>(`/api/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; name: string } }>(`/api/businesses/${id}`, { method: 'DELETE' }),
  },

  // Leads (specific routes)
  leads: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Lead, 'leads'>>('/api/leads' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Lead>(`/api/leads/${id}`),
    create: (data: Partial<Lead>) =>
      request<Lead>('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Lead>) =>
      request<Lead>(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; name: string | null } }>(`/api/leads/${id}`, { method: 'DELETE' }),
  },

  // Payments (specific routes)
  payments: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Payment, 'payments'>>('/api/payments' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Payment>(`/api/payments/${id}`),
    create: (data: Partial<Payment>) =>
      request<Payment>('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Payment>) =>
      request<Payment>(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; amount: number } }>(`/api/payments/${id}`, { method: 'DELETE' }),
  },

  // Expenses (specific routes)
  expenses: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Expense, 'expenses'>>('/api/expenses' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Expense>(`/api/expenses/${id}`),
    create: (data: Partial<Expense>) =>
      request<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Expense>) =>
      request<Expense>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; title: string; amount: number } }>(`/api/expenses/${id}`, { method: 'DELETE' }),
  },

  // Contacts (specific routes)
  contacts: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Contact, 'contacts'>>('/api/contacts' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Contact>(`/api/contacts/${id}`),
    create: (data: Partial<Contact>) =>
      request<Contact>('/api/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Contact>) =>
      request<Contact>(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; full_name: string } }>(`/api/contacts/${id}`, { method: 'DELETE' }),
  },

  // Tasks (specific routes)
  tasks: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Task, 'tasks'>>('/api/tasks' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Task>(`/api/tasks/${id}`),
    create: (data: Partial<Task>) =>
      request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Task>) =>
      request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; title: string } }>(`/api/tasks/${id}`, { method: 'DELETE' }),
  },

  // Vendors (specific routes)
  vendors: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Vendor, 'vendors'>>('/api/vendors' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Vendor>(`/api/vendors/${id}`),
    create: (data: Partial<Vendor>) =>
      request<Vendor>('/api/vendors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Vendor>) =>
      request<Vendor>(`/api/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; name: string } }>(`/api/vendors/${id}`, { method: 'DELETE' }),
  },

  // Pipeline Stages (specific routes)
  pipelineStages: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<PipelineStage, 'pipelineStages'>>('/api/pipeline_stages' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<PipelineStage>(`/api/pipeline_stages/${id}`),
    create: (data: Partial<PipelineStage>) =>
      request<PipelineStage>('/api/pipeline_stages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PipelineStage>) =>
      request<PipelineStage>(`/api/pipeline_stages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; name: string } }>(`/api/pipeline_stages/${id}`, { method: 'DELETE' }),
  },

  // Activities (specific routes)
  activities: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<Activity, 'activities'>>('/api/activities' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<Activity>(`/api/activities/${id}`),
    create: (data: Partial<Activity>) =>
      request<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Activity>) =>
      request<Activity>(`/api/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; summary: string } }>(`/api/activities/${id}`, { method: 'DELETE' }),
  },

  // Reconciliation Rules (specific routes)
  reconciliationRules: {
    list: (params?: Record<string, string>) =>
      request<SpecificListResponse<any, 'reconciliationRules'>>('/api/reconciliation_rules' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<any>(`/api/reconciliation_rules/${id}`),
    create: (data: any) =>
      request<any>('/api/reconciliation_rules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/reconciliation_rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; name: string } }>(`/api/reconciliation_rules/${id}`, { method: 'DELETE' }),
  },

  // Generic CRUD for all other resources
  users: { list: list<User>('users'), get: get<User>('users'), create: create<User>('users'), update: update<User>('users'), delete: remove('users') },
  conversations: { list: list<Conversation>('conversations'), get: get<Conversation>('conversations'), create: create<Conversation>('conversations'), update: update<Conversation>('conversations'), delete: remove('conversations') },
  aiSessions: { list: list<AiSession>('ai_sessions'), get: get<AiSession>('ai_sessions'), create: create<AiSession>('ai_sessions'), update: update<AiSession>('ai_sessions'), delete: remove('ai_sessions') },
  deals: { list: list<Deal>('deals'), get: get<Deal>('deals'), create: create<Deal>('deals'), update: update<Deal>('deals'), delete: remove('deals') },
  bookings: { list: list<Booking>('bookings'), get: get<Booking>('bookings'), create: create<Booking>('bookings'), update: update<Booking>('bookings'), delete: remove('bookings') },
  transactions: { list: list<Transaction>('transactions'), get: get<Transaction>('transactions'), create: create<Transaction>('transactions'), update: update<Transaction>('transactions'), delete: remove('transactions') },
  notifications: { list: list<Notification>('notifications'), get: get<Notification>('notifications'), create: create<Notification>('notifications'), update: update<Notification>('notifications'), delete: remove('notifications') },
  tags: { list: list<any>('tags'), get: get<any>('tags'), create: create<any>('tags'), update: update<any>('tags'), delete: remove('tags') },
  pipelineEntries: { list: list<any>('pipeline_entries'), get: get<any>('pipeline_entries'), create: create<any>('pipeline_entries'), update: update<any>('pipeline_entries'), delete: remove('pipeline_entries') },
  expenseCategories: { list: list<ExpenseCategory>('expense_categories'), get: get<ExpenseCategory>('expense_categories'), create: create<ExpenseCategory>('expense_categories'), update: update<ExpenseCategory>('expense_categories'), delete: remove('expense_categories') },
  financialSummaries: { list: list<FinancialSummary>('financial_summaries'), get: get<FinancialSummary>('financial_summaries'), create: create<FinancialSummary>('financial_summaries'), update: update<FinancialSummary>('financial_summaries'), delete: remove('financial_summaries') },

  // WhatsApp integration
  whatsapp: {
    simulate: (data: { business_id?: string; phone_number: string; message: string; name?: string }) =>
      request<{ lead: Lead; conversations: ApiConversation[] }>('/api/whatsapp/simulate', { method: 'POST', body: JSON.stringify(data) }),
    messages: (lead_id: string) =>
      request<{ messages: ApiConversation[]; count: number }>('/api/whatsapp/messages?lead_id=' + encodeURIComponent(lead_id)),
    send: (data: { lead_id: string; business_id: string; message: string }) =>
      request<{ conversation: ApiConversation; lead: Lead }>('/api/whatsapp/send', { method: 'POST', body: JSON.stringify(data) }),
  },

  // AI response generation
  ai: {
    respond: (data: { lead_id: string; business_id: string; user_message: string; conversation_id?: string }) =>
      request<{ ai_response: string; conversation: ApiConversation; lead: Lead }>('/api/ai/respond', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Business knowledge base
  knowledge: {
    list: (business_id: string, params?: Record<string, string>) =>
      request<{ count: number; entries: KnowledgeEntry[] }>('/api/knowledge/business/' + business_id + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<KnowledgeEntry>(`/api/knowledge/${id}`),
    create: (business_id: string, data: { title: string; content: string; keywords?: string[]; category?: string; is_active?: boolean }) =>
      request<KnowledgeEntry>(`/api/knowledge/business/${business_id}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<KnowledgeEntry>) =>
      request<KnowledgeEntry>(`/api/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: { id: string; title: string } }>(`/api/knowledge/${id}`, { method: 'DELETE' }),
    upload: (business_id: string, file: File, title?: string, category?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('business_id', business_id);
      if (title) formData.append('title', title);
      if (category) formData.append('category', category);
      return request<KnowledgeEntry>('/api/knowledge/upload', { method: 'POST', body: formData });
    },
  },

  // NSE Stock Financial Statements
  stocks: {
    list: (params?: Record<string, string>) =>
      request<{ stocks: NseStock[]; count: number }>('/api/stocks' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => request<NseStock & { fundamentals: StockFundamental[]; statements: FinancialStatement[] }>(`/api/stocks/${id}`),
    create: (data: { ticker: string; company_name: string; sector?: string; market_cap?: number }) =>
      request<NseStock>('/api/stocks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<NseStock>) =>
      request<NseStock>(`/api/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; deleted: NseStock }>(`/api/stocks/${id}`, { method: 'DELETE' }),
    upload: (stock_id: string, file: File, fiscal_year: number, period_type?: string, period?: string) => {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('stock_id', stock_id);
      formData.append('fiscal_year', String(fiscal_year));
      if (period_type) formData.append('period_type', period_type);
      if (period) formData.append('period', period);
      return request<FinancialStatement & { message: string }>('/api/stocks/upload', { method: 'POST', body: formData });
    },
    fundamentals: (stock_id: string) =>
      request<{ fundamentals: StockFundamental[]; count: number }>(`/api/stocks/${stock_id}/fundamentals`),
    statements: (stock_id: string) =>
      request<{ statements: FinancialStatement[]; count: number }>(`/api/stocks/${stock_id}/statements`),
    pdfUrl: (statementId: string) => `${BASE_URL}/api/stocks/pdf/${statementId}`,
  },
};

export type Api = typeof api;
export { ApiError };
