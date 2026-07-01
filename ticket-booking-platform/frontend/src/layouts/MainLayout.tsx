import { PropsWithChildren } from "react";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <div className="logo-icon">T</div>
            <span>TicketEase</span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Booking Engine v1.0
          </div>
        </div>
      </header>
      <main className="container" style={{ minHeight: "calc(100vh - 120px)" }}>
        {children}
      </main>
      <footer style={{ borderTop: "1px solid var(--border-color)", padding: "2rem 0", marginTop: "auto", backgroundColor: "white" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-light)", fontSize: "0.85rem" }}>
          <span>&copy; 2026 TicketEase Inc. All rights reserved.</span>
          <span>Lightweight, Real-time Ticket Platform</span>
        </div>
      </footer>
    </>
  );
}

export default MainLayout;
