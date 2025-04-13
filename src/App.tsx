
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import SalesPage from "@/pages/SalesPage";
import InventoryPage from "@/pages/InventoryPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                <MainLayout requireAuth={false}>
                  <LoginPage />
                </MainLayout>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              } 
            />
            <Route 
              path="/products" 
              element={
                <MainLayout>
                  <ProductsPage />
                </MainLayout>
              } 
            />
            <Route 
              path="/sales" 
              element={
                <MainLayout>
                  <SalesPage />
                </MainLayout>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              } 
            />
            
            {/* Redirect from home to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
