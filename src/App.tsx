import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RepairProvider } from "@/context/RepairContext";
import Index from "./pages/Index.tsx";
import RepairDetail from "./pages/RepairDetail.tsx";
import Customers from "./pages/Customers.tsx";
import CalendarView from "./pages/CalendarView.tsx";
import SmsSettings from "./pages/SmsSettings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RepairProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/repair/:id" element={<RepairDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RepairProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
