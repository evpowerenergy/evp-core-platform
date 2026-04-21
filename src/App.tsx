import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/AppLayout";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { lazy, Suspense } from 'react';
import { LoadingProvider, PageLoading } from "@/components/ui/loading";
import { 
  ProtectedRoute, 
  CRMOnlyRoute, 
  PackageSalesOnlyRoute, 
  WholesaleSalesOnlyRoute,
  SalesOnlyRoute,
  ManagerOnlyRoute,
  AdminPageRoute,
  AllRolesRoute,
  InventoryOnlyRoute,
  ServiceTrackingOnlyRoute,
  MarketingOnlyRoute,
  CRMOnlyRouteNew
} from "@/components/ProtectedRoute";
// Lazy load main pages
const Index = lazy(() => import("./pages/Index"));
const LeadManagement = lazy(() => import("./pages/LeadManagement"));
const Auth = lazy(() => import("./pages/Auth"));
const LeadAdd = lazy(() => import("./pages/LeadAdd"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const LeadTimeline = lazy(() => import("./pages/LeadTimeline"));
const ProductivityLogAdd = lazy(() => import("./pages/ProductivityLogAdd"));
const MyLeads = lazy(() => import("./pages/MyLeads"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const SalesTeam = lazy(() => import("./pages/SalesTeam"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const QuotationPage = lazy(() => import("./pages/Index").then(module => ({ default: module.QuotationPage })));
const LoadingTest = lazy(() => import("./pages/LoadingTest"));

// Marketing pages
const MarketingDashboard = lazy(() => import("./pages/marketing/MarketingDashboard"));
const Analytics = lazy(() => import("./pages/marketing/Analytics"));
const AdsCampaignManagement = lazy(() => import("./pages/marketing/AdsCampaignManagement"));
const AdsPerformanceReport = lazy(() => import("./pages/marketing/AdsPerformanceReport"));

// Chat Bot Monitor pages
const ChatBotMonitorPage = lazy(() => import("./pages/ChatBotMonitorPage"));
const ChatBotPerformancePage = lazy(() => import("./pages/ChatBotPerformancePage"));

// Package pages - Lazy loaded
const PackageDashboard = lazy(() => import("./pages/package/Dashboard"));
const PackageLeadDetail = lazy(() => import("./pages/package/LeadDetail"));
const PackageLeadTimeline = lazy(() => import("./pages/package/LeadTimeline"));
const PackageMyLeads = lazy(() => import("./pages/package/MyLeads"));
const PackageMyAppointments = lazy(() => import("./pages/package/MyAppointments"));
const PackageSalesTeam = lazy(() => import("./pages/package/SalesTeam"));

// Wholesale pages - Lazy loaded
const WholesaleLeadManagement = lazy(() => import("./pages/wholesale/LeadManagement"));
const WholesaleLeadDetail = lazy(() => import("./pages/wholesale/LeadDetail"));
const WholesaleLeadTimeline = lazy(() => import("./pages/wholesale/LeadTimeline"));
const WholesaleProductivityLogAdd = lazy(() => import("./pages/wholesale/ProductivityLogAdd"));
const WholesaleMyLeads = lazy(() => import("./pages/wholesale/MyLeads"));
const WholesaleMyAppointments = lazy(() => import("./pages/wholesale/MyAppointments"));
const WholesaleSalesTeam = lazy(() => import("./pages/wholesale/SalesTeam"));
const ProductManagement = lazy(() => import("./pages/wholesale/ProductManagement"));

// Reports pages - Lazy loaded
const AllLeadsReport = lazy(() => import("./pages/reports/AllLeadsReport"));
const LeadSummary = lazy(() => import("./pages/reports/LeadSummary"));
const PackageDashboardReport = lazy(() => import("./pages/reports/PackageDashboard"));
const WholesaleDashboardReport = lazy(() => import("./pages/reports/WholesaleDashboard"));
const CustomerStatus = lazy(() => import("./pages/reports/CustomerStatus"));
const SalesOpportunity = lazy(() => import("./pages/reports/SalesOpportunity"));
const SalesClosed = lazy(() => import("./pages/reports/SalesClosed"));
const SalesUnsuccessful = lazy(() => import("./pages/reports/SalesUnsuccessful"));
const CustomerList = lazy(() => import("./pages/reports/CustomerList"));
const SalesFunnel = lazy(() => import("./pages/reports/SalesFunnel"));

// Inventory pages - Lazy loaded
const InventoryDashboard = lazy(() => import("./pages/inventory/Dashboard"));
const InventoryProductManagement = lazy(() => import("./pages/inventory/ProductManagement"));
const InventoryManagement = lazy(() => import("./pages/inventory/InventoryManagement"));
const PurchaseOrders = lazy(() => import("./pages/inventory/PurchaseOrders"));
const PurchaseOrderNew = lazy(() => import("./pages/inventory/PurchaseOrderNew"));
const PODetail = lazy(() => import("./pages/inventory/PODetail"));
const POEdit = lazy(() => import("./pages/inventory/POEdit"));
const Suppliers = lazy(() => import("./pages/inventory/Suppliers"));
const SupplierNew = lazy(() => import("./pages/inventory/SupplierNew"));
const InventorySerialLedger = lazy(() => import("./pages/inventory/InventorySerialLedger"));
const BackofficePortal = lazy(() => import("./pages/BackofficePortal"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const EvMemberDashboard = lazy(() => import("./pages/ev-member/EvMemberDashboard"));
const ChargingStationDashboard = lazy(() => import("./pages/charging-station/ChargingStationDashboard"));

// Inventory Layout
import { InventoryLayout } from "./components/inventory/InventoryLayout";
import { EvMemberLayout } from "./components/ev-member/EvMemberLayout";
import { ChargingStationLayout } from "./components/charging-station/ChargingStationLayout";

// Service Tracking pages - Lazy loaded
const ServiceTrackingDashboard = lazy(() => import("./pages/service-tracking/Dashboard"));
const RequestsList = lazy(() => import("./pages/service-tracking/RequestsList"));
const RequestForm = lazy(() => import("./pages/service-tracking/RequestForm"));
const RequestDetail = lazy(() => import("./pages/service-tracking/RequestDetail"));
const PermitReports = lazy(() => import("./pages/service-tracking/PermitReports"));
const PermitDashboard = lazy(() => import("./pages/service-tracking/PermitDashboard"));

// Customer Service pages - Lazy loaded
const CustomerServiceList = lazy(() => import("./pages/service-tracking/CustomerServiceList"));
const CustomerServiceForm = lazy(() => import("./pages/service-tracking/CustomerServiceForm"));
const CustomerServiceDetail = lazy(() => import("./pages/service-tracking/CustomerServiceDetail"));
const ServiceVisitForm = lazy(() => import("./pages/service-tracking/ServiceVisitForm"));
const CustomerServiceDashboard = lazy(() => import("./pages/service-tracking/CustomerServiceDashboard"));
const ServiceAppointments = lazy(() => import("./pages/service-tracking/ServiceAppointments"));
const WeeklyAppointmentsList = lazy(() => import("./pages/service-tracking/WeeklyAppointmentsList"));

// Sale Follow-up pages - Lazy loaded
const SaleFollowUpManagement = lazy(() => import("./pages/service-tracking/sale-follow-up/SaleFollowUpManagement"));
const SaleFollowUpDashboard = lazy(() => import("./pages/service-tracking/sale-follow-up/SaleFollowUpDashboard"));
const SaleFollowUpDetail = lazy(() => import("./pages/service-tracking/sale-follow-up/SaleFollowUpDetail"));

// Service Tracking Layout - Lazy loaded
const ServiceTrackingLayout = lazy(() => import("./components/service-tracking/ServiceTrackingLayout"));

// Marketing Layout - Lazy loaded
const MarketingLayout = lazy(() => import("./components/marketing/MarketingLayout"));

// Chat Bot Monitor Layout - Lazy loaded
const ChatBotMonitorLayout = lazy(() => import("./components/chat-bot-monitor/ChatBotMonitorLayout"));

// Sales pages (moved to inventory system) - Lazy loaded
const SalesOrders = lazy(() => import("./pages/sales").then(module => ({ default: module.SalesOrders })));
const NewSale = lazy(() => import("./pages/sales").then(module => ({ default: module.NewSale })));
const Customers = lazy(() => import("./pages/sales").then(module => ({ default: module.Customers })));
const SalesOrderDetail = lazy(() => import("./pages/sales").then(module => ({ default: module.SalesOrderDetail })));
const SalesOrderEdit = lazy(() => import("./pages/sales").then(module => ({ default: module.SalesOrderEdit })));

import { useAuth } from "@/hooks/useAuth";
// import { keepAliveService } from "@/utils/keepAlive"; // ปิด client-side keep-alive
import { useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Loading component for Suspense
const PageLoader = () => <PageLoading type="dashboard" />;

const IS_DEV = import.meta.env.MODE === "development";

// ✅ ปรับปรุง React Query configuration ให้สอดคล้องกับ Cache Strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ใช้ STANDARD strategy เป็น default
      staleTime: 1000 * 60 * 2, // 2 minutes - สมดุลระหว่าง fresh data และ performance
      gcTime: 1000 * 60 * 10,   // 10 minutes - เก็บ cache นานขึ้น
      refetchOnWindowFocus: true, // refetch เมื่อ window ได้ focus
      refetchOnReconnect: true,
      networkMode: 'online',
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: 'online',
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  // ปิด client-side keep-alive service เพื่อลดการซ้ำซ้อน
  // ใช้ Vercel cron job และ Uptime Robot แทน
  // useEffect(() => {
  //   // Start keep-alive service when user is authenticated
  //   if (user && !keepAliveService.isRunning()) {
  //     keepAliveService.start();
  //   } else if (!user && keepAliveService.isRunning()) {
  //     keepAliveService.stop();
  //   }
  // }, [user]);

  // Cleanup keep-alive service when component unmounts
  // useEffect(() => {
  //   return () => {
  //     if (keepAliveService.isRunning()) {
  //       keepAliveService.stop();
  //     }
  //   };
  // }, []);

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={
              !user ? <Navigate to="/auth" /> : 
              <CRMOnlyRouteNew>
                <Index />
              </CRMOnlyRouteNew>
            } />
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/backoffice" />} />
            <Route path="/quotation" element={!user ? <Navigate to="/auth" /> : <QuotationPage />} />
            <Route path="/backoffice" element={!user ? <Navigate to="/auth" /> : <BackofficePortal />} />
            <Route path="/executive-dashboard" element={!user ? <Navigate to="/auth" /> : <ExecutiveDashboard />} />
            
            {/* Protected Routes */}
            {user ? (
              <>
                {/* Sales Features - All sales roles can access (including admin_page) */}
                <Route path="/leads/add" element={
                  <SalesOnlyRoute>
                    <AppLayout><LeadAdd /></AppLayout>
                  </SalesOnlyRoute>
                } />
                <Route path="/leads/new" element={
                  <SalesOnlyRoute>
                    <AppLayout><LeadAdd /></AppLayout>
                  </SalesOnlyRoute>
                } />
                
                {/* Package Routes - Only package sales can access */}
                <Route path="/lead-management" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><LeadManagement /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                <Route path="/leads/:id" element={
                  <AllRolesRoute>
                    <AppLayout><LeadDetail /></AppLayout>
                  </AllRolesRoute>
                } />
                <Route path="/leads/:id/timeline" element={
                  <SalesOnlyRoute>
                    <AppLayout><LeadTimeline /></AppLayout>
                  </SalesOnlyRoute>
                } />
                <Route path="/productivity-log/add/:id" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><ProductivityLogAdd /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                <Route path="/my-leads" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><MyLeads /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                <Route path="/my-appointments" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><MyAppointments /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                
                {/* Wholesale Routes - Only wholesale sales can access */}
                <Route path="/wholesale/lead-management" element={
                  <WholesaleSalesOnlyRoute>
                    <AppLayout><WholesaleLeadManagement /></AppLayout>
                  </WholesaleSalesOnlyRoute>
                } />
                <Route path="/wholesale/leads/:id" element={
                  <AllRolesRoute>
                    <AppLayout><WholesaleLeadDetail /></AppLayout>
                  </AllRolesRoute>
                } />
                <Route path="/wholesale/leads/:id/timeline" element={
                  <WholesaleSalesOnlyRoute>
                    <AppLayout><WholesaleLeadTimeline /></AppLayout>
                  </WholesaleSalesOnlyRoute>
                } />
                <Route path="/wholesale/productivity-log/add/:id" element={
                  <WholesaleSalesOnlyRoute>
                    <AppLayout><WholesaleProductivityLogAdd /></AppLayout>
                  </WholesaleSalesOnlyRoute>
                } />
                <Route path="/wholesale/my-leads" element={
                  <WholesaleSalesOnlyRoute>
                    <AppLayout><WholesaleMyLeads /></AppLayout>
                  </WholesaleSalesOnlyRoute>
                } />
                <Route path="/wholesale/my-appointments" element={
                  <WholesaleSalesOnlyRoute>
                    <AppLayout><WholesaleMyAppointments /></AppLayout>
                  </WholesaleSalesOnlyRoute>
                } />
                
                {/* Package Sub-routes */}
                <Route path="/package/dashboard" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><PackageDashboard /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                <Route path="/package/leads/:id" element={
                  <AllRolesRoute>
                    <AppLayout><PackageLeadDetail /></AppLayout>
                  </AllRolesRoute>
                } />
                <Route path="/package/leads/:id/timeline" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><PackageLeadTimeline /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                <Route path="/package/my-leads" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><PackageMyLeads /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                <Route path="/package/my-appointments" element={
                  <PackageSalesOnlyRoute>
                    <AppLayout><PackageMyAppointments /></AppLayout>
                  </PackageSalesOnlyRoute>
                } />
                
                {/* Manager/Admin Routes */}
                <Route path="/sales-team" element={
                  <ManagerOnlyRoute>
                    <AppLayout><SalesTeam /></AppLayout>
                  </ManagerOnlyRoute>
                } />
                <Route path="/package/sales-team" element={
                  <ManagerOnlyRoute>
                    <AppLayout><PackageSalesTeam /></AppLayout>
                  </ManagerOnlyRoute>
                } />
                <Route path="/wholesale/sales-team" element={
                  <ManagerOnlyRoute>
                    <AppLayout><WholesaleSalesTeam /></AppLayout>
                  </ManagerOnlyRoute>
                } />
                
                {/* Reports Routes - All sales roles can access (including admin_page) */}
                <Route path="/reports/all-leads" element={
                  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'admin_page', 'marketing', 'sale_package']}>
                    <AppLayout><AllLeadsReport /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports/lead-summary" element={
                  <SalesOnlyRoute>
                    <AppLayout><LeadSummary /></AppLayout>
                  </SalesOnlyRoute>
                } />
                <Route path="/reports/package" element={
                  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'sale_package', 'marketing']}>
                    <AppLayout><PackageDashboardReport /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports/wholesale" element={
                  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'sale_wholesale', 'marketing']}>
                    <AppLayout><WholesaleDashboardReport /></AppLayout>
                  </ProtectedRoute>
                } />
                {IS_DEV && (
                  <Route path="/reports/customer-status" element={
                    <ProtectedRoute requiredRoles={['manager_sale', 'manager_marketing', 'super_admin']}>
                      <AppLayout><CustomerStatus /></AppLayout>
                    </ProtectedRoute>
                  } />
                )}
                <Route path="/reports/sales-opportunity" element={
                  <ProtectedRoute requiredRoles={['manager_sale', 'manager_marketing', 'super_admin']}>
                    <AppLayout><SalesOpportunity /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports/sales-closed" element={
                  <ProtectedRoute requiredRoles={['manager_sale', 'manager_marketing', 'super_admin']}>
                    <AppLayout><SalesClosed /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/ev-member" element={
                  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'back_office']}>
                    <EvMemberLayout><EvMemberDashboard /></EvMemberLayout>
                  </ProtectedRoute>
                } />
                <Route path="/charging-station" element={
                  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'back_office']}>
                    <ChargingStationLayout><ChargingStationDashboard /></ChargingStationLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports/sales-unsuccessful" element={
                  <ProtectedRoute requiredRoles={['manager_sale', 'manager_marketing', 'super_admin']}>
                    <AppLayout><SalesUnsuccessful /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports/customer-list" element={
                  <ProtectedRoute requiredRoles={['manager_sale', 'manager_marketing', 'super_admin']}>
                    <AppLayout><CustomerList /></AppLayout>
                  </ProtectedRoute>
                } />
                {IS_DEV && (
                  <Route path="/reports/sales-funnel" element={
                    <ProtectedRoute requiredRoles={['manager_sale', 'manager_marketing', 'super_admin']}>
                      <AppLayout><SalesFunnel /></AppLayout>
                    </ProtectedRoute>
                  } />
                )}
                
                {/* Sale Follow-up Routes - All sales roles can access */}
                <Route path="/sale-follow-up" element={
                  <Navigate to="/sale-follow-up/dashboard" replace />
                } />
                <Route path="/sale-follow-up/dashboard" element={
                  <SalesOnlyRoute>
                    <AppLayout><SaleFollowUpDashboard /></AppLayout>
                  </SalesOnlyRoute>
                } />
                <Route path="/sale-follow-up/management" element={
                  <SalesOnlyRoute>
                    <AppLayout><SaleFollowUpManagement /></AppLayout>
                  </SalesOnlyRoute>
                } />
                <Route path="/sale-follow-up/detail/:id" element={
                  <SalesOnlyRoute>
                    <AppLayout><SaleFollowUpDetail /></AppLayout>
                  </SalesOnlyRoute>
                } />
                
                {/* Inventory Routes - super_admin, manager_sale, manager_marketing, manager_hr, back_office */}
                <Route path="/inventory" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><InventoryDashboard /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/products" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><InventoryProductManagement /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/stock" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><InventoryManagement /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/purchase-orders" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><PurchaseOrders /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/purchase-orders/new" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><PurchaseOrderNew /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/purchase-orders/:id" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><PODetail /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/purchase-orders/:id/edit" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><POEdit /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/suppliers" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><Suppliers /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/suppliers/new" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><SupplierNew /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />

                {/* Sales Routes - Moved to inventory system */}
                <Route path="/inventory/sales/orders" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><SalesOrders /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/sales/new" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><NewSale /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/sales/customers" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><Customers /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/sales/orders/:id" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><SalesOrderDetail /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/sales/orders/:id/edit" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><SalesOrderEdit /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />
                <Route path="/inventory/serial-ledger" element={
                  <InventoryOnlyRoute>
                    <InventoryLayout><InventorySerialLedger /></InventoryLayout>
                  </InventoryOnlyRoute>
                } />

                {/* Service Tracking Routes - super_admin, manager_sale, manager_marketing, manager_hr, engineer */}
                <Route path="/service-tracking" element={
                  <ServiceTrackingOnlyRoute>
                    <ServiceTrackingLayout />
                  </ServiceTrackingOnlyRoute>
                }>
                  <Route index element={<ServiceTrackingDashboard />} />
                  <Route path="requests" element={<RequestsList />} />
                  <Route path="requests/new" element={<RequestForm />} />
                  <Route path="requests/:id" element={<RequestDetail />} />
                  <Route path="requests/:id/edit" element={<RequestForm />} />
                  <Route path="permit-reports" element={<PermitReports />} />
                  <Route path="permit-dashboard" element={<PermitDashboard />} />
                  
                  {/* Customer Service Routes */}
                  <Route path="customer-services" element={<CustomerServiceList />} />
                  <Route path="customer-services/new" element={<CustomerServiceForm />} />
                  <Route path="customer-services/:id" element={<CustomerServiceDetail />} />
                  <Route path="customer-services/:id/edit" element={<CustomerServiceForm />} />
                  <Route path="customer-services/:id/service-visit" element={<ServiceVisitForm />} />
                  <Route path="customer-services-dashboard" element={<CustomerServiceDashboard />} />
                  
                  {/* Service Appointments Routes */}
                  <Route path="service-appointments" element={<ServiceAppointments />} />
                  <Route path="weekly-appointments" element={<WeeklyAppointmentsList />} />
                  
                </Route>

                {/* Marketing Routes - super_admin, manager_sale, manager_marketing, manager_hr, marketing */}
                <Route path="/marketing" element={
                  <MarketingOnlyRoute>
                    <MarketingLayout />
                  </MarketingOnlyRoute>
                }>
                  <Route index element={<MarketingDashboard />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="ads-management" element={<AdsCampaignManagement />} />
                  <Route path="ads-performance" element={<AdsPerformanceReport />} />
                </Route>

                {/* Chat Bot Monitor Routes - All roles can access */}
                <Route path="/chat-bot-monitor" element={
                  <AllRolesRoute>
                    <ChatBotMonitorLayout />
                  </AllRolesRoute>
                }>
                  <Route index element={<Navigate to="/chat-bot-monitor/performance" replace />} />
                  <Route path="performance" element={<ChatBotPerformancePage />} />
                </Route>

                {/* Pipeline route - Only managers and admin (including admin_page) */}
                <Route path="/pipeline" element={
                  <ManagerOnlyRoute>
                    <AppLayout><div>Pipeline Page</div></AppLayout>
                  </ManagerOnlyRoute>
                } />

                {/* Loading Test route - For testing loading system */}
                <Route path="/loading-test" element={
                  <AllRolesRoute>
                    <AppLayout><LoadingTest /></AppLayout>
                  </AllRolesRoute>
                } />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/auth" />} />
            )}
            
            <Route path="/unauthorized" element={<Unauthorized />} />
            {user && <Route path="*" element={<NotFound />} />}
            </Routes>
          </Suspense>
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

function App() {
  const isVercel = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname);
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <AppContent />
        <ReactQueryDevtools initialIsOpen={false} />
        {isVercel && <SpeedInsights />}
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
