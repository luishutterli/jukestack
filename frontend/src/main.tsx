import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Landing from "./Landing.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import LoginSignup from "./LoginSignup.tsx";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route index element={<Landing />} />
                <Route path="/app" element={<App />} />
                <Route path="/app/login" element={<LoginSignup />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
