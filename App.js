const API = "https://script.google.com/macros/s/AKfycbzMK5jdiMKk9oauRjMtPiMyFDiLS1RXwlXZcO8NwfnuX9PviFYRiBXeLXPdpzWpS7xZ-Q/exec"

const loginBtn = document.getElementById("loginBtn")
const mobileInput = document.getElementById("mobileInput")
const loginStatus = document.getElementById("loginStatus")

const panel = document.getElementById("panel")
const loginBox = document.getElementById("loginBox")

const userMobile = document.getElementById("userMobile")
const logoutBtn = document.getElementById("logoutBtn")

const ordersList = document.getElementById("ordersList")

const form = document.getElementById("orderForm")
const formStatus = document.getElementById("formStatus")

const savedMobile = localStorage.getItem("customerMobile")

if(savedMobile){

showPanel(savedMobile)
loadOrders(savedMobile)

}

loginBtn.addEventListener("click", async ()=>{

const mobile = mobileInput.value.trim()

loginStatus.innerText="در حال ورود..."

await fetch(API,{
method:"POST",
body:JSON.stringify({
action:"login",
mobile:mobile
})
})

localStorage.setItem("customerMobile",mobile)

showPanel(mobile)

loadOrders(mobile)

})

function showPanel(mobile){

loginBox.style.display="none"
panel.style.display="block"

userMobile.innerText="شماره شما: "+mobile

}

logoutBtn.addEventListener("click",()=>{

localStorage.removeItem("customerMobile")

location.reload()

})

async function loadOrders(mobile){

const res = await fetch(API,{
method:"POST",
body:JSON.stringify({
action:"getOrders",
mobile:mobile
})
})

const orders = await res.json()

ordersList.innerHTML=""

orders.forEach(o=>{

const div=document.createElement("div")

div.innerHTML=`${o.product} | ${o.weight} | ${o.qty}`

ordersList.appendChild(div)

})

}

form.addEventListener("submit", async function(e){

e.preventDefault()

const fd=new FormData(form)

const data=Object.fromEntries(fd.entries())

data.action="order"

formStatus.innerText="در حال ارسال..."

await fetch(API,{
method:"POST",
body:JSON.stringify(data)
})

formStatus.innerText="سفارش ثبت شد"

form.reset()

})
