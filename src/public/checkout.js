
import axiosClient from "./axiosClient.js";

const api = axiosClient;

// Khởi tạo Stripe với public key của bạn
const stripe = Stripe("pk_test_51TDoRKBn9AulH7lmRgTPg6jtA8YsMjQHm1xk0NrTQimgIVsdP1EMxYk58cLk4jAqr8FSMp1NEiCe2Iorr4Q6lHkB00mFsmVUMM"); // thay bằng publishable key thực tế



// Lấy bookingId từ query string khi vào checkout.html
const bookingId = new URLSearchParams(window.location.search).get("bookingId");
initPaymentFlow(bookingId);





// Hàm lấy chi tiết booking kèm theo user, vehicle, showroom
async function getBookingWithDetails(bookingId) {
  try {
    // Lấy booking gốc
    const bookingRes = await api.get(`/booking/getBookingById/${bookingId}`, {
  headers: { "Cache-Control": "no-cache" }
});
    const booking = bookingRes;
    console.log("booking:", booking);
    console.log("booking.vehicle_id:", booking.vehicle_id);
    // Nếu backend không populate, gọi thêm các API liên quan
    const [ vehicleRes] = await Promise.all([
      // api.get(`/users/${booking.user_id}`), //hiện chưa có api này, nếu có thì gọi để lấy thông tin user
      api.get(`/vehicles/getVehicleById/${booking.vehicle_id}`, {
        headers: { "Cache-Control": "no-cache" }
      }),
    //   api.get(`/showrooms/${booking.showroom_id}`) //hiện chưa có api này, nếu có thì gọi để lấy thông tin showroom
    ]);
    console.log("vehicle:", vehicleRes);

    // Gộp dữ liệu lại
    return {
      ...booking,
      vehicle: vehicleRes,
    };
  } catch (err) {
    console.error("Lỗi khi lấy booking với chi tiết:", err);
    throw err;
  }
}

function renderBookingDetail(booking) {
  const detailEl = document.getElementById("booking-detail");
  detailEl.innerHTML = `
    <li><strong>Xe thuê:</strong> ${booking.vehicle.vehicle_model}</li>
    <li><strong>Tổng cộng:</strong> ${booking.total_price}₫</li>
  `;
}

async function createPaymentForBooking(bookingId) {
    const booking = await getBookingWithDetails(bookingId);

  // render detail
  renderBookingDetail(booking);

  const res = await api.post(`/booking/${bookingId}/createPayment/`);
  console.log("Create Payment:", res);

  if (res?.client_secret) {
    const appearance = { theme: 'stripe' };
    const elements = stripe.elements({ locale: 'vi',appearance, clientSecret: res.client_secret });
    return elements;
  }
  return null;
}

function mountPaymentElement(elements, selector = '#payment-element') {
  const paymentElement = elements.create('payment', { layout: 'accordion' });
  paymentElement.mount(selector);
}

function attachSubmitHandler(elements) {
  const form = document.querySelector("#payment-form");
  if (!form) {
    console.error("Không tìm thấy #payment-form trong DOM");
    return;
  }

  form.addEventListener("submit", (e) => handleSubmit(e, elements));
}

async function initPaymentFlow(bookingId) {
  try {
    if (!bookingId) {
      alert("Không có bookingId");
      return;
    }

    const elements = await createPaymentForBooking(bookingId);
    if (!elements) {
      console.error("Không tạo được Payment Element");
      return;
    }
    mountPaymentElement(elements);

    const form = document.querySelector("#payment-form");
    if (!form) {
      console.error("Không tìm thấy #payment-form trong DOM");
      return;
    }

    attachSubmitHandler(elements);
  } catch (err) {
    console.error("Lỗi khi khởi tạo Payment Flow:", err);
  }
}


async function handleSubmit(e, elements) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: "http://localhost:3000/complete.html",
    },
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occurred.");
  }

  setLoading(false);
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}


