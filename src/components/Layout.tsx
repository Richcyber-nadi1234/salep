import { Sidebar } from "./Sidebar";
import { NotificationCenter } from "./NotificationCenter";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex justify-end items-center p-4">
            <NotificationCenter />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};
