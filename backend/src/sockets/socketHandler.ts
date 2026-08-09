import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * initSocketHandler
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY FIX #4: Socket.io room join is now authenticated.
 *
 * Previously, any connected client could emit 'join-room' with any userId and
 * join that room — including SOS alert rooms for other users.
 *
 * Fix: The client must send a valid Bearer token in socket.handshake.auth.token.
 * On join-room, the token is verified and the userId in the token is used to
 * join the room — the client-supplied userId is IGNORED. This prevents a
 * malicious actor from joining another user's room.
 */
export const initSocketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // SECURITY: Verify the token provided during socket handshake
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      console.warn(`⚠️  Socket ${socket.id} connected without auth token. Disconnecting.`);
      socket.disconnect(true);
      return;
    }

    let decodedUser: { id: string; role: string };
    try {
      decodedUser = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch (err) {
      console.warn(`⚠️  Socket ${socket.id} provided invalid token. Disconnecting.`);
      socket.disconnect(true);
      return;
    }

    // Automatically join the authenticated user's own room.
    // Guardians receive SOS alerts via their user ID room.
    // The client-supplied userId is NEVER used — we use the token's verified ID.
    const roomName = decodedUser.id.toString();
    socket.join(roomName);
    console.log(`🚪 Socket ${socket.id} (user ${decodedUser.id}, role: ${decodedUser.role}) joined room: ${roomName}`);

    // Optionally handle explicit join-room requests (server overrides with verified ID)
    socket.on("join-room", (_ignoredUserId: string | number) => {
      // Client cannot choose which room to join — they are auto-joined to their own room.
      // This event is kept for backward compatibility but the client-supplied ID is ignored.
      console.log(`🔒 Socket ${socket.id} join-room request ignored (auto-joined to verified room ${roomName})`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
