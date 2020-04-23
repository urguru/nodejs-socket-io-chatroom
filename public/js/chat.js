const socket = io();
const msg_form = document.getElementById("message-form");
const msg_btn = document.getElementById("msg-btn");
const send_location = document.getElementById("send-location");
const message_input = document.getElementById("message");
const messages_all = document.getElementById("messages-all");
const message_template = document.getElementById("message-template");
const map_template = document.getElementById("map-template");
const users_all = document.getElementById("side-bar");
const sidebar_template = document.getElementById("side-bar-template");

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});


const autoscroll=()=>{
    //New Message elemenet
    const newMessage=messages_all.lastElementChild

    //Height of the newMessage
    const newMessageStyles=getComputedStyle(newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=newMessage.offsetHeight+newMessageMargin

    //visible height
    const visibleHeight=messages_all.offsetHeight

    //height of messages container
    const containerHeight=messages_all.scrollHeight
    const scrollOffset=messages_all.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        messages_all.scrollTop=messages_all.scrollHeight
    }
}



msg_form.addEventListener("submit", (e) => {
  msg_btn.setAttribute("disabled", "disabled");
  e.preventDefault();
  const text = e.target.elements.message.value;
  socket.emit("messageSent", text, (e) => {
    msg_btn.removeAttribute("disabled", "");
    message_input.value = "";
    message_input.focus();
    if (e) {
      console.log(e);
    } else {
      console.log("Delivered");
    }
  });
});

send_location.addEventListener("click", (e) => {
  send_location.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Your browser doesnt support geo-location");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      (message) => {
        send_location.removeAttribute("disabled");
        console.log(message);
      }
    );
  });
});

socket.on("newUserAdded", (text, username) => {
  html = Mustache.render(message_template.innerHTML, {
    message: text.text,
    createdAt: moment(text.createdAt).format("LLL"),
    username,
  });
  messages_all.innerHTML = html + messages_all.innerHTML;
});

socket.on("userDisconnected", (text, username) => {
  html = Mustache.render(message_template.innerHTML, {
    message: text.text,
    createdAt: moment(text.createdAt).format("LLL"),
    username,
  });
  messages_all.innerHTML = html + messages_all.innerHTML;
});

socket.on("messageToUsers", (text, username) => {
  html = Mustache.render(message_template.innerHTML, {
    message: text.text,
    createdAt: moment(text.createdAt).format("LLL"),
    username,
  });
  messages_all.innerHTML = messages_all.innerHTML+html;
  autoscroll()
});

socket.on("location", (position, username) => {
  html = Mustache.render(map_template.innerHTML, {
    message: position.text,
    createdAt: moment(position.createdAt).format("LLL"),
    username,
  });
  messages_all.innerHTML =  messages_all.innerHTML+html;
  autoscroll()
});

socket.on("updateUsers", (room, users) => {
  html = Mustache.render(sidebar_template.innerHTML, {
    room,
    users,
  });
  users_all.innerHTML=html
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
