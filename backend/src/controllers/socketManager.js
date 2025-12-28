import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        
 
        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Send chat history to the newly joined user
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    );
                }
            }

            // Notify everyone (including the new user) that someone joined and provide the full client list
            const clientsInRoom = connections[path];
            clientsInRoom.forEach((clientId) => {
                io.to(clientId).emit("user-joined", socket.id, clientsInRoom);
            });
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            let matchingRoom = '';
            let found = false;
            for (const [roomKey, roomValue] of Object.entries(connections)) {
                if (roomValue.includes(socket.id)) {
                    matchingRoom = roomKey;
                    found = true;
                    break;
                }
            }

            if (found) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({
                    'sender': sender,
                    "data": data,
                    "socket-id-sender": socket.id
                });
                console.log("message:", sender, data);

                connections[matchingRoom].forEach(elem => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            // Find the room of the disconnecting socket
            let matchedRoomKey = null;
            for (const [roomKey, clientIds] of Object.entries(connections)) {
                const indexInRoom = clientIds.indexOf(socket.id);
                if (indexInRoom !== -1) {
                    matchedRoomKey = roomKey;
                    // Remove the socket from the room
                    clientIds.splice(indexInRoom, 1);
                    // Notify remaining clients in the room
                    clientIds.forEach((clientId) => {
                        io.to(clientId).emit("user-left", socket.id);
                    });
                    // Clean up the room if it's empty
                    if (clientIds.length === 0) {
                        delete connections[roomKey];
                    }
                    break;
                }
            }

            delete timeOnline[socket.id];
        });

    });

    return io;
}

