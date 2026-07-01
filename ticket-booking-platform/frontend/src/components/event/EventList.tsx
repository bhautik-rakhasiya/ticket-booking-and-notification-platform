function EventList() {
  const events = ["Sample Concert", "Sample Movie"];

  return (
    <section>
      <h2>Events</h2>
      <ul>
        {events.map((event) => (
          <li key={event}>{event}</li>
        ))}
      </ul>
    </section>
  );
}

export default EventList;
