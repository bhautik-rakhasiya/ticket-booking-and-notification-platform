import EventList from "../components/event/EventList";
import MainLayout from "../layouts/MainLayout";
import { useUser } from "../context/UserContext";

export function HomePage() {
  const { selectedUser } = useUser();

  return (
    <MainLayout>
      {/* Hero section */}
      <div className="py-8 mb-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-3">
            Book Tickets for the{" "}
            <span className="gradient-text">Best Events</span>{" "}
            Instantly
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Secure your entry to technical conferences, live music concerts, sports matches, and summits with our high-performance concurrent booking engine.
          </p>
        </div>
      </div>

      <EventList />
    </MainLayout>
  );
}

export default HomePage;
