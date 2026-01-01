import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <LanguageProvider>
            <TooltipProvider>
                <HashRouter>
                    <Routes>
                        <Route
                            path="/"
                            element={<Index />}
                        />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route
                            path="*"
                            element={<NotFound />}
                        />
                    </Routes>
                </HashRouter>
            </TooltipProvider>
        </LanguageProvider>
    </QueryClientProvider>
);

export default App;
