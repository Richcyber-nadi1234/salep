import { Sidebar } from "./Sidebar";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { PageTransition } from "./PageTransition";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 glass-effect border-b">
          <div className="flex justify-end items-center gap-3 p-4">
            <ThemeToggle />
            <NotificationCenter />
          </div>
        </div>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
};
