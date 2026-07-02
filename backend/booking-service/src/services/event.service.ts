import { eventRepository } from "../repositories/event.repository";
import { EventResponse } from "../types";
import { NotFoundError } from "../utils/errors";

export const eventService = {
  /**
   * Returns all ACTIVE events.
   */
  async getAll(): Promise<EventResponse[]> {
    return eventRepository.findAll();
  },

  /**
   * Returns a single event by ID.
   * Throws NotFoundError if event does not exist.
   */
  async getById(eventId: string): Promise<EventResponse> {
    const event = await eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundError(`Event with id '${eventId}' not found`);
    }

    return event;
  },
};
