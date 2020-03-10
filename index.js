const express = require("express");
const socket = require("./socket");

const app = express();
const server = app.listen(9000, () => console.log("Server is running"));
const io = socket.init(server);

io.on("connection", socket => {
    console.log(socket.id);

    socket.on("user_connected", ({ socketID, username }) => {
        console.log(socketID);
        console.log(username);
    });

    socket.on("disconnect", () => {
        console.log("DISCONNECTING");
        console.log(socket.id);
    });
});
