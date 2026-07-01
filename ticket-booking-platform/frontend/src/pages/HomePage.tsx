import EventList from "../components/event/EventList";
import MainLayout from "../layouts/MainLayout";

export function HomePage() {
  return (
    <MainLayout>
      <div className="hero">
        <h1>
          Book Tickets for the <span className="gradient-text">Best Events</span> Instantly
        </h1>
        <p>
          Secure your entry to technical conferences, live music concerts, sports matches, and summits with our high-performance concurrent booking engine.
        </p>
      </div>
      <EventList />
    </MainLayout>
  );
}

export default HomePage;
