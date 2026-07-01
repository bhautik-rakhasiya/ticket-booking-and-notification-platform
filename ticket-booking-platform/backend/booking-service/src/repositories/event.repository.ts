import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../config/database/prisma.client";
import { EventResponse } from "../types";

/**
 * Maps a Prisma Event row to the public API shape.
 * Prisma returns Decimal fields as Decimal objects → convert to number.
 */
function toEventResponse(event: {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  availableSeats: number;
  price: Decimal;
  status: string;
}): EventResponse {
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    totalSeats: event.totalSeats,
    availableSeats: event.availableSeats,
    price: event.price.toNumber(),
    status: event.status as EventResponse["status"],
  };
}

export const eventRepository = {
  /**
   * Returns all ACTIVE events.
   */
  async findAll(): Promise<EventResponse[]> {
    const events = await prisma.event.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    return events.map(toEventResponse);
  },

  /**
   * Returns a single event by ID (any status).
   */
  async findById(id: string): Promise<EventResponse | null> {
    const event = await prisma.event.findUnique({ where: { id } });
    return event ? toEventResponse(event) : null;
  },
};
