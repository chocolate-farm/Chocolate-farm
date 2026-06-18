document.addEventListener("DOMContentLoaded", () => {

const API_URL = "https://script.google.com/macros/s/AKfycbzMK5jdiMKk9oauRjMtPiMyFDiLS1RXwlXZcO8NwfnuX9PviFYRiBXeLXPdpzWpS7xZ-Q/exec"

const form = document.getElementById("orderForm")
const status = document.getElementById("formStatus")

form.addEventListener("submit", async function(e){

e.preventDefault()

const fd = new FormData(form)

const data = Object.fromEntries(fd.entries())

status.innerText = "در حال ثبت سفارش..."

try{

const res = await fetch(API_URL,{
method:"POST",
body:JSON.stringify(data)
})

const result = await res.json()

if(result.result === "success"){

status.innerText = "✅ سفارش شما ثبت شد"
form.reset()

}else{

status.innerText = "خطا در ثبت سفارش"

}

}catch(err){

status.innerText = "ارتباط با سرور برقرار نشد"

}

})

})
