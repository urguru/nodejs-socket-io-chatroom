const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/message");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDirectoryPath = path.join(__dirname, "../public");
const view_paths = path.join(__dirname, "../views/layouts");
const partial_paths = path.join(__dirname, "../views/partials");

app.use(express.static(publicDirectoryPath));
app.set('view engine','hbs')
app.set('views',view_paths)

io.on("connection", (socket) => {
  console.log("New web socket connection");
  socket.on("join", ({ username, room },callback) => {

    const {error,user}=addUser({
        id:socket.id,
        username,
        room
    })

    if(error){
        return callback(error)
    }
    socket.join(room);
    socket.broadcast
      .to(room)
      .emit("newUserAdded", generateMessage(`${user.username} has been added`),user.room);
    io.to(user.room).emit('updateUsers',user.room,getUsersInRoom(user.room))
    callback()
  });

  socket.on("disconnect", () => {
    const user=removeUser(socket.id)
    if(user){
        io.to(user.room).emit("userDisconnected", generateMessage(`${user.username} has left the chat`),user.room);
        io.to(user.room).emit(
          "updateUsers",
          user.room,
          getUsersInRoom(user.room)
        );
    }
  });

  socket.on("messageSent", (text, callback) => {
    const filter = new Filter();
    if (filter.isProfane(text)) {
      return callback("Profanity is not allowed");
    }
    const user = getUser(socket.id);

    io.to(user.room).emit("messageToUsers", generateMessage(text),user.username);
    callback();
  });

  socket.on("sendLocation", (position, callback) => {
    const user = getUser(socket.id);
    console.log(user)
    io.to(user.room).emit(
      "location",
      generateMessage(
        `https://google.com/maps?q=${position.lat},${position.long}`
      ),user.username
    );
    callback("Location has been shared successfully");
  });
});


app.get('/*',(req,res)=>{
    res.render('404')
})
server.listen(port, () => {
  console.log(`Server successfully started on port ${port}`);
});
