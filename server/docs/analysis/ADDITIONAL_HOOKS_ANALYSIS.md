# Additional Database Hooks Analysis

## 🎯 **เป้าหมาย:** วิเคราะห์ความจำเป็นในการสร้าง API endpoints สำหรับ Additional Database Hooks (23 files)

---

## 📊 **การวิเคราะห์การใช้งาน:**

### **🔍 High Priority Hooks (จำเป็นต้องทำ API):**

#### **1. useUserData.ts - ⭐⭐⭐⭐⭐ (CRITICAL)**
- **Usage:** 8 files
- **Purpose:** User data management
- **Database Tables:** users, sales_team_with_user_info
- **API Needed:** ✅ **YES** - Core user functionality
- **Reason:** Used in App.tsx, LeadManagement, Auth components

#### **2. useAuth.tsx - ⭐⭐⭐⭐⭐ (CRITICAL)**
- **Usage:** 6 files
- **Purpose:** Authentication system
- **Database Tables:** users, auth
- **API Needed:** ✅ **YES** - Critical for security
- **Reason:** Used in LoginForm, ProtectedRoute, Auth pages

#### **3. useSalesTeam.ts - ⭐⭐⭐⭐ (HIGH)**
- **Usage:** 4 files
- **Purpose:** Sales team management
- **Database Tables:** sales_team_with_user_info
- **API Needed:** ✅ **YES** - Business critical
- **Reason:** Used in SalesTeam page, reports

#### **4. useLeadsOptimized.ts - ⭐⭐⭐⭐ (HIGH)**
- **Usage:** 3 files
- **Purpose:** Optimized lead queries
- **Database Tables:** leads, users, lead_productivity_logs
- **API Needed:** ✅ **YES** - Performance optimization
- **Reason:** Used in LeadAddOptimized, reports

#### **5. useProducts.ts - ⭐⭐⭐⭐ (HIGH)**
- **Usage:** 3 files
- **Purpose:** Product management
- **Database Tables:** products
- **API Needed:** ✅ **YES** - Inventory system
- **Reason:** Used in ProductManagement, QuotationSearchDialog

---

### **🔍 Medium Priority Hooks (ควรทำ API):**

#### **6. useSaleFollowUp.ts - ⭐⭐⭐ (MEDIUM)**
- **Usage:** 2 files
- **Purpose:** Sales follow-up management
- **Database Tables:** leads, lead_productivity_logs
- **API Needed:** ✅ **YES** - Business process
- **Reason:** Used in service tracking components

#### **7. useServiceAppointments.ts - ⭐⭐⭐ (MEDIUM)**
- **Usage:** 2 files
- **Purpose:** Service appointment management
- **Database Tables:** appointments, lead_productivity_logs
- **API Needed:** ✅ **YES** - Service tracking
- **Reason:** Used in service tracking components

#### **8. useServiceVisits.ts - ⭐⭐⭐ (MEDIUM)**
- **Usage:** 2 files
- **Purpose:** Service visit management
- **Database Tables:** service_visits, customer_services
- **API Needed:** ✅ **YES** - Service tracking
- **Reason:** Used in service tracking components

#### **9. useProductivityLogSubmission.ts - ⭐⭐⭐ (MEDIUM)**
- **Usage:** 2 files
- **Purpose:** Productivity log management
- **Database Tables:** lead_productivity_logs
- **API Needed:** ✅ **YES** - Business process
- **Reason:** Used in productivity log forms

#### **10. useEditProductivityLogSubmission.ts - ⭐⭐⭐ (MEDIUM)**
- **Usage:** 1 file
- **Purpose:** Edit productivity logs
- **Database Tables:** lead_productivity_logs
- **API Needed:** ✅ **YES** - Business process
- **Reason:** Used in productivity log forms

---

### **🔍 Low Priority Hooks (ไม่จำเป็นต้องทำ API):**

#### **11. useFollowupStats.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Follow-up statistics
- **Database Tables:** leads, lead_productivity_logs
- **API Needed:** ❌ **NO** - Can use existing APIs
- **Reason:** Statistics can be calculated from existing data

#### **12. useSaleChanceStats.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Sales chance statistics
- **Database Tables:** leads, quotations
- **API Needed:** ❌ **NO** - Can use existing APIs
- **Reason:** Statistics can be calculated from existing data

#### **13. useRealtimeUpdates.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Realtime updates
- **Database Tables:** Multiple
- **API Needed:** ❌ **NO** - Supabase handles realtime
- **Reason:** Supabase realtime is already optimized

#### **14. useGlobalRealtime.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Global realtime updates
- **Database Tables:** Multiple
- **API Needed:** ❌ **NO** - Supabase handles realtime
- **Reason:** Supabase realtime is already optimized

#### **15. useOpenAICost.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** OpenAI cost tracking
- **Database Tables:** openai_usage
- **API Needed:** ❌ **NO** - Internal tracking
- **Reason:** Internal system, not business critical

#### **16. useChatBotMonitor.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Chatbot monitoring
- **Database Tables:** chatbot_logs
- **API Needed:** ❌ **NO** - Internal monitoring
- **Reason:** Internal system, not business critical

#### **17. useChatBotPerformance.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Chatbot performance tracking
- **Database Tables:** chatbot_logs
- **API Needed:** ❌ **NO** - Internal monitoring
- **Reason:** Internal system, not business critical

#### **18. useAdsCampaigns.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Ads campaign management
- **Database Tables:** ads_campaigns
- **API Needed:** ❌ **NO** - Marketing tool
- **Reason:** Marketing tool, not core business

#### **19. usePermitRequests.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Permit request management
- **Database Tables:** permit_requests
- **API Needed:** ❌ **NO** - Administrative
- **Reason:** Administrative function, not core business

#### **20. useAuthActions.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Auth actions
- **Database Tables:** users, auth
- **API Needed:** ❌ **NO** - Can use existing auth APIs
- **Reason:** Can be handled by existing auth endpoints

#### **21. useAuthSession.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Session management
- **Database Tables:** auth
- **API Needed:** ❌ **NO** - Can use existing auth APIs
- **Reason:** Can be handled by existing auth endpoints

#### **22. useProfile.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** User profile management
- **Database Tables:** users
- **API Needed:** ❌ **NO** - Can use existing user APIs
- **Reason:** Can be handled by existing user endpoints

#### **23. useProductivityLogFormSubmission.ts - ⭐⭐ (LOW)**
- **Usage:** 1 file
- **Purpose:** Form submission
- **Database Tables:** lead_productivity_logs
- **API Needed:** ❌ **NO** - Can use existing productivity APIs
- **Reason:** Can be handled by existing productivity endpoints

---

## 📊 **สรุปการวิเคราะห์:**

### **✅ จำเป็นต้องทำ API (10 hooks):**
1. **useUserData.ts** - ⭐⭐⭐⭐⭐ (CRITICAL)
2. **useAuth.tsx** - ⭐⭐⭐⭐⭐ (CRITICAL)
3. **useSalesTeam.ts** - ⭐⭐⭐⭐ (HIGH)
4. **useLeadsOptimized.ts** - ⭐⭐⭐⭐ (HIGH)
5. **useProducts.ts** - ⭐⭐⭐⭐ (HIGH)
6. **useSaleFollowUp.ts** - ⭐⭐⭐ (MEDIUM)
7. **useServiceAppointments.ts** - ⭐⭐⭐ (MEDIUM)
8. **useServiceVisits.ts** - ⭐⭐⭐ (MEDIUM)
9. **useProductivityLogSubmission.ts** - ⭐⭐⭐ (MEDIUM)
10. **useEditProductivityLogSubmission.ts** - ⭐⭐⭐ (MEDIUM)

### **❌ ไม่จำเป็นต้องทำ API (13 hooks):**
- Statistics hooks (can use existing APIs)
- Realtime hooks (Supabase handles)
- Internal monitoring hooks
- Marketing tools
- Administrative functions

---

## 🎯 **Recommendations:**

### **Phase 2A: Critical APIs (5 hooks)**
- useUserData.ts
- useAuth.tsx
- useSalesTeam.ts
- useLeadsOptimized.ts
- useProducts.ts

### **Phase 2B: Medium Priority APIs (5 hooks)**
- useSaleFollowUp.ts
- useServiceAppointments.ts
- useServiceVisits.ts
- useProductivityLogSubmission.ts
- useEditProductivityLogSubmission.ts

### **Phase 2C: Skip (13 hooks)**
- All low priority hooks can be handled by existing APIs or don't need APIs

---

## ✅ **Conclusion:**

**จำเป็นต้องทำ API สำหรับ 10 hooks จาก 23 hooks (43.5%)**

- **Critical:** 5 hooks (ต้องทำ)
- **Medium:** 5 hooks (ควรทำ)
- **Skip:** 13 hooks (ไม่จำเป็น)

**Total API Endpoints Needed:** 10 additional endpoints
