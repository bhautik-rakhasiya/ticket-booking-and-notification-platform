export const publisherService = {
  publish(eventName: string, payload: unknown) {
    return { eventName, payload, published: true };
  },
};
