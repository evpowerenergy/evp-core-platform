# Hooks to API Mapping Diagram

## 🎯 **Mermaid Diagram: Hooks to API Endpoints Mapping**

```mermaid
graph TB
    %% Hook Files
    subgraph "Hook Files"
        A1[useAppData.ts<br/>952 lines<br/>5 functions]
        A2[useInventoryData.ts<br/>615 lines<br/>8 functions]
        A3[useCustomerServices.ts<br/>305 lines<br/>12 functions]
        A4[useAppointments.ts<br/>162 lines<br/>1 function]
        A5[useSalesTeamOptimized.ts<br/>173 lines<br/>1 function]
        A6[useLeads.ts<br/>304 lines<br/>1 function]
    end

    %% API Endpoints
    subgraph "API Endpoints"
        B1[/api/lead-management<br/>Query: User, Sales Team, Leads]
        B2[/api/lead-mutations<br/>Mutations: acceptLead, assignSalesOwner, transferLead, addLead]
        B3[/api/my-leads-data<br/>Query: User, Sales Member, Leads with productivity logs]
        B4[/api/my-leads<br/>Query: User, Sales Member, Leads with productivity logs]
        B5[/api/sales-team-data<br/>Query: Sales Team with metrics, leads, quotations]
        B6[/api/filtered-sales-team<br/>Query: Sales Team filtered by role]
        B7[/api/inventory<br/>Query: Products, Inventory Units, Purchase Orders, Suppliers, Customers, Sales Docs]
        B8[/api/inventory-mutations<br/>Mutations: addProduct, addInventoryUnit, addPurchaseOrder]
        B9[/api/products<br/>Query: Products with filters]
        B10[/api/inventory-units<br/>Query: Inventory Units with JOINs]
        B11[/api/purchase-orders<br/>Query: Purchase Orders with JOINs + Single PO Detail]
        B12[/api/purchase-order-mutations<br/>Mutations: updatePurchaseOrder, deletePurchaseOrder]
        B13[/api/customer-services<br/>Query: Customer services with filters + Single service]
        B14[/api/customer-service-stats<br/>Query: Customer service statistics]
        B15[/api/customer-service-mutations<br/>Mutations: createCustomerService, updateCustomerService, deleteCustomerService]
        B16[/api/customer-service-filters<br/>Query: Provinces, Installers, Sales, Technicians]
        B17[/api/appointments<br/>Query: Follow-up, Engineer, Payment appointments]
        B18[/api/sales-team<br/>Query: Sales team with metrics, leads, quotations, conversion rates]
        B19[/api/leads-complete<br/>Query: Leads with creator info, productivity logs, sales team<br/>Mutations: acceptLead, assignSalesOwner, transferLead, addLead]
    end

    %% Connections from useAppData.ts
    A1 --> B1
    A1 --> B2
    A1 --> B3
    A1 --> B4
    A1 --> B5
    A1 --> B6

    %% Connections from useInventoryData.ts
    A2 --> B7
    A2 --> B8
    A2 --> B9
    A2 --> B10
    A2 --> B11
    A2 --> B12

    %% Connections from useCustomerServices.ts
    A3 --> B13
    A3 --> B14
    A3 --> B15
    A3 --> B16

    %% Connections from useAppointments.ts
    A4 --> B17

    %% Connections from useSalesTeamOptimized.ts
    A5 --> B18

    %% Connections from useLeads.ts
    A6 --> B19

    %% Styling
    classDef hookFile fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef apiEndpoint fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef queryAPI fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef mutationAPI fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class A1,A2,A3,A4,A5,A6 hookFile
    class B1,B3,B4,B5,B6,B7,B9,B10,B11,B13,B14,B16,B17,B18,B19 queryAPI
    class B2,B8,B12,B15 mutationAPI
```

## 📊 **Mapping Summary:**

### **useAppData.ts (5 functions → 6 API endpoints)**
- useAppData → `/api/lead-management` + `/api/lead-mutations`
- useMyLeadsData → `/api/my-leads-data`
- useMyLeadsWithMutations → `/api/my-leads` + `/api/lead-mutations`
- useSalesTeamData → `/api/sales-team-data`
- useFilteredSalesTeamData → `/api/filtered-sales-team`

### **useInventoryData.ts (8 functions → 6 API endpoints)**
- useInventoryData → `/api/inventory` + `/api/inventory-mutations`
- useAddInventoryUnit → `/api/inventory-mutations`
- useProductsData → `/api/products`
- useInventoryUnitsData → `/api/inventory-units`
- usePurchaseOrdersData → `/api/purchase-orders`
- usePurchaseOrderDetail → `/api/purchase-orders` (with poId parameter)
- useUpdatePurchaseOrder → `/api/purchase-order-mutations`
- useDeletePurchaseOrder → `/api/purchase-order-mutations`

### **useCustomerServices.ts (12 functions → 4 API endpoints)**
- useCustomerServices → `/api/customer-services`
- useCustomerService → `/api/customer-services` (with id parameter)
- useCustomerServiceStats → `/api/customer-service-stats`
- useCreateCustomerService → `/api/customer-service-mutations`
- useUpdateCustomerService → `/api/customer-service-mutations`
- useDeleteCustomerService → `/api/customer-service-mutations`
- useCustomerServiceProvinces → `/api/customer-service-filters` (filterType=provinces)
- useCustomerServiceInstallers → `/api/customer-service-filters` (filterType=installers)
- useCustomerServiceSales → `/api/customer-service-filters` (filterType=sales)
- useCustomerServiceTechnicians → `/api/customer-service-filters` (filterType=technicians)

### **useAppointments.ts (1 function → 1 API endpoint)**
- useAppointments → `/api/appointments`

### **useSalesTeamOptimized.ts (1 function → 1 API endpoint)**
- useSalesTeamOptimized → `/api/sales-team`

### **useLeads.ts (1 function → 1 API endpoint)**
- useLeads → `/api/leads-complete`

---

## 🎯 **Key Insights:**

1. **Total Functions:** 28 functions
2. **Total API Endpoints:** 18 endpoints
3. **Efficiency Ratio:** 1.56 functions per endpoint (optimized)
4. **Coverage:** 100% - All functions have corresponding APIs
5. **Architecture:** Clean separation with proper query/mutation separation
