import { PropsWithChildren } from "react";

function MainLayout({ children }: PropsWithChildren) {
  return <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>{children}</main>;
}

export default MainLayout;
