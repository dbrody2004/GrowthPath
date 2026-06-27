export function JobsPage() {
  return (
    <section className="card">
      <h2>Jobs</h2>
      <p className="muted">
        Background jobs are processed by the worker via RabbitMQ. Use the API to enqueue sample
        jobs during development.
      </p>
    </section>
  );
}
