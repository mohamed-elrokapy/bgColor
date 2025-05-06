let mainbody = document.querySelector("body");
let buttons = document.querySelectorAll("button");
buttons.forEach((ele) => {
  ele.addEventListener("click", () => {
    mainbody.style.background = ele.innerHTML;
  });
});
