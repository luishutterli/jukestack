import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Landing from "./Landing.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import LoginSignup from "./LoginSignup.tsx";
import App from "./App.tsx";
import {AdminApp, AdminUserLends} from "./AdminApp.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route index element={<Landing />} />
                <Route path="/app" element={<App />} />
                <Route path="/app/login" element={<LoginSignup />} />
                <Route path="/app/admin" element={<AdminApp />} />
                <Route path="/app/admin/user/:id" element={<AdminUserLends />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
