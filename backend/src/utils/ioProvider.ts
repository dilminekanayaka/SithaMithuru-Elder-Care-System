import { Server } from "socket.io";

/**
 * IoProvider — Intermediate singleton to break the circular import
 * between server.ts and emergencyController.ts.
 *
 * Usage:
 *   server.ts        → setIo(io) after creating the Server instance
 *   emergencyController.ts → getIo() to emit events
 *
 * This avoids the circular dependency:
 *   server.ts → emergencyController.ts → server.ts (CIRCULAR)
 */

let _io: Server | null = null;

export const setIo = (io: Server): void => {
  _io = io;
};

export const getIo = (): Server => {
  if (!_io) {
    throw new Error(
      "Socket.io server has not been initialized. Call setIo(io) in server.ts first."
    );
  }
  return _io;
};
