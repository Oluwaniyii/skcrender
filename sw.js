self.addEventListener("push", function (e) {
  const data = e.data.json();
  console.log("sw");
  console.log(data);
  self.registration.showNotification(data.from, data);
});
