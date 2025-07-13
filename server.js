   const express = require("express");
   const http = require("http");
   const WebSocket = require("ws");
   const app = express();
   const server = http.createServer(app);
   const wss = new WebSocket.Server({ server });

   let locations = {};
   let admins = new Set();

   wss.on("connection", (ws) => {
     let clientId = null;
     let isAdmin = false;

     ws.on("message", (msg) => {
       try {
         const data = JSON.parse(msg);
         if (data.type === "register" && data.role === "admin") {
           isAdmin = true;
           admins.add(ws);
           ws.send(JSON.stringify({ type: "all_locations", locations }));
         } else if (data.type === "register" && data.role === "user") {
           clientId = data.id;
         } else if (data.type === "location" && clientId) {
           locations[clientId] = { lat: data.lat, lng: data.lng, time: Date.now() };
           broadcastToAdmins();
         }
       } catch (e) {}
     });

     ws.on("close", () => {
       if (isAdmin) admins.delete(ws);
       if (clientId) {
         delete locations[clientId];
         broadcastToAdmins();
       }
     });
   });

   function broadcastToAdmins() {
     const locs = locations;
     admins.forEach((ws) => {
       ws.send(JSON.stringify({ type: "all_locations", locations: locs }));
     });
   }

   const PORT = process.env.PORT || 3000;
   server.listen(PORT, () => console.log("Server started"));
