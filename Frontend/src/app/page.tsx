import {FinanceProvider} from "@/hooks/useFinanceData";

export default function Home() {
  return (
      <FinanceProvider>
          <section className="p-6">
            <h1 className="text-2xl font-bold">Welcome back, commander.</h1>
            <p className="text-muted-foreground mt-2">Here’s what’s happening today.</p>
            {/* Dashboard cards, recent activity, etc. */}
          </section>
      </FinanceProvider>
  );
}