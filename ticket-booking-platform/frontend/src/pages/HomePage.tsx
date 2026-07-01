import BookingCard from "../components/booking/BookingCard";
import EventList from "../components/event/EventList";
import MainLayout from "../layouts/MainLayout";

function HomePage() {
  return (
    <MainLayout>
      <h1>Ticket Booking Platform</h1>
      <p>A simple starter frontend for events and bookings.</p>
      <EventList />
      <BookingCard />
    </MainLayout>
  );
}

export default HomePage;
