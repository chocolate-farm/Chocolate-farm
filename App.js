const form=document.getElementById("orderForm")
const dateInput=document.getElementById("dateInput")

const holidays=[
"2026-03-21",
"2026-03-22"
]

dateInput.addEventListener("input",()=>{

const d=new Date(dateInput.value)

const day=d.getDay()

if(day===5){

alert("ارسال در روز جمعه انجام نمی‌شود")
dateInput.value=""

}

if(holidays.includes(dateInput.value)){

alert("این روز تعطیل رسمی است")

dateInput.value=""

}

})


form.addEventListener("submit",e=>{

e.preventDefault()

alert("سفارش ثبت شد. تیم فروش با شما تماس می‌گیرد.")

form.reset()

})
