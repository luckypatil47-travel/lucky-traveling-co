const WHATSAPP_NUMBER = "919730518043";
const $ = (s) => document.querySelector(s);
const vehicleOptions = {
    Transport: ["Tata Ace", "Pickup Truck", "Bolero Pickup", "Eicher Truck", "6 Wheeler", "10 Wheeler", "12 Wheeler", "Other Loading Vehicle"],
    Travelling: ["Auto Rickshaw", "Taxi", "4 Seater", "5 Seater", "12 Seater", "22 Seater", "36 Seater", "40 Seater"]
};

function fillVehicles() {
    const service = $("#service"),
        vehicle = $("#vehicle");
    if (!service || !vehicle) return;
    vehicle.innerHTML = vehicleOptions[service.value].map(v => `<option>${v}</option>`).join("");
}
if ($("#service")) {
    fillVehicles();
    $("#service").addEventListener("change", fillVehicles);
}
if ($("#year")) $("#year").textContent = new Date().getFullYear();
if ($("#contactWhatsApp")) $("#contactWhatsApp").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Lucky Travelling Co., I need information about your services.")}`;
async function api(url, options = {}) {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
}
const bookingForm = $("#bookingForm");
if (bookingForm) bookingForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(bookingForm).entries());
    const msg = $("#bookingMessage");
    msg.textContent = "Submitting request...";
    try {
        const result = await api("/api/bookings", { method: "POST", body: JSON.stringify(data) });
        const whatsappText = [
            "NEW BOOKING REQUEST - Lucky Travelling Co.",
            `Booking ID: ${result.bookingId}`, `Name: ${data.customer_name}`,
            `Mobile: ${data.phone}`, `Service: ${data.service}`, `Vehicle: ${data.vehicle}`,
            `Pickup: ${data.pickup}`, `Destination: ${data.destination}`,
            `Date: ${data.travel_date}`, `Passengers/load: ${data.passengers}`,
            `Details: ${data.notes || "None"}`, "Payment: Offline"
        ].join("\n");
        msg.textContent = "Booking request saved. Opening WhatsApp; press Send there to notify the business.";
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
        if (WHATSAPP_NUMBER === "91XXXXXXXXXX") msg.textContent += " Set the real WhatsApp number in public/app.js first.";
        else window.open(url, "_blank", "noopener");
        bookingForm.reset();
        fillVehicles();
    } catch (err) {
        msg.textContent = err.message;
        msg.style.color = "#b42318";
    }
});
if ($("#loginForm")) $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
        await api("/api/login", { method: "POST", body: JSON.stringify(data) });
        location.href = "/";
    } catch (err) { $("#authMessage").textContent = err.message; }
});
if ($("#registerForm")) $("#registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
        await api("/api/register", { method: "POST", body: JSON.stringify(data) });
        location.href = "/";
    } catch (err) { $("#authMessage").textContent = err.message; }
});
if ($("#logoutBtn")) {
    api("/api/me").then(d => { if (d.user) $("#logoutBtn").classList.remove("hidden"); });
    $("#logoutBtn").addEventListener("click", async() => {
        await api("/api/logout", { method: "POST" });
        location.reload();
    });
}
if ($("#myBookingsForm")) $("#myBookingsForm").addEventListener("submit", async e => {
    e.preventDefault();
    const phone = new FormData(e.currentTarget).get("phone");
    try {
        const d = await api(`/api/my-bookings?phone=${encodeURIComponent(phone)}`);
        renderTable($("#myBookings"), d.bookings, false);
    } catch (err) { $("#myBookings").textContent = err.message; }
});

function renderTable(target, rows, admin) {
    if (!rows.length) { target.textContent = "No bookings found."; return; }
    target.innerHTML = `<table><thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th>Service / Vehicle</th><th>Route</th><th>Date</th><th>Status</th>${admin?"<th>Update</th>":""}</tr></thead><tbody>${rows.map(b=>`<tr><td>${b.id}</td><td>${esc(b.customer_name)}</td><td>${esc(b.phone)}</td><td>${esc(b.service)} / ${esc(b.vehicle)}</td><td>${esc(b.pickup)} → ${esc(b.destination)}</td><td>${esc(b.travel_date)}</td><td class="status">${esc(b.status)}</td>${admin?`<td><select data-id="${b.id}" class="statusSelect">${["Pending","Confirmed","Rejected","Completed"].map(s=>`<option ${s===b.status?"selected":""}>${s}</option>`).join("")}</select></td>`:""}</tr>`).join("")}</tbody></table>`;
  if(admin) target.querySelectorAll(".statusSelect").forEach(sel=>sel.addEventListener("change",async()=>{
    try{await api(`/api/admin/bookings/${sel.dataset.id}`,{method:"PATCH",body:JSON.stringify({status:sel.value})});}
    catch(err){$("#adminMessage").textContent=err.message;}
  }));
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
if($("#loadAdmin")) $("#loadAdmin").addEventListener("click",async()=>{
  try{const d=await api("/api/admin/bookings");renderTable($("#adminBookings"),d.bookings,true);$("#adminMessage").textContent="Bookings loaded.";}
  catch(err){$("#adminMessage").textContent=err.message;}
});