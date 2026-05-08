
import axiosClient from "./axiosClient.js";

const api = axiosClient;

// Khởi tạo Stripe với public key của bạn
const stripe = Stripe("pk_test_51TDoRKBn9AulH7lmRgTPg6jtA8YsMjQHm1xk0NrTQimgIVsdP1EMxYk58cLk4jAqr8FSMp1NEiCe2Iorr4Q6lHkB00mFsmVUMM"); // thay bằng publishable key thực tế





window.addEventListener("DOMContentLoaded", () => {
  initPaymentFlow(localStorage.getItem("bookingId"));
});




//Render UI


function renderUI(booking, clientSecret) {
  renderBookingDetail(booking);
  // Nếu có clientSecret thì khởi tạo và mount payment UI
  if (clientSecret) {
    const appearance = { theme: 'stripe' };
    const elements = stripe.elements({
      locale: 'vi',
      appearance,
      clientSecret
    });

  mountPaymentElement(elements);
  attachSubmitHandler(elements);
}
}

function renderBookingDetail(booking) {
  const detailEl = document.getElementById("booking-detail");
  detailEl.innerHTML = `
    <li><strong>Model Xe thuê:</strong> ${booking.vehicle.vehicle_model}</li>

    <li><strong>Tổng cộng:</strong> ${booking.total_price}₫</li>
  `;
}

function attachSubmitHandler(elements) {
  const form = document.querySelector("#payment-form");
  if (!form) {
    console.error("Không tìm thấy #payment-form trong DOM");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // chặn reload
    handleSubmit(e, elements);
  });
}

function mountPaymentElement(elements, selector = '#payment-element') {
  const paymentElement = elements.create('payment', { layout: 'accordion' });
  paymentElement.mount(selector);
}

///

/// Data layer
async function createPaymentForBooking(bookingId) {
  // 1. Lấy trạng thái checkout hiện tại
  const data = await api.get(`/payment/getPaymentState/${bookingId}`, {
  });
  console.log("payment status:", data.paymentStatus, "booking status:", data.bookingStatus);
  // if (data.bookingStatus === "paid" && data.paymentStatus === "successful") {
  //   return {
  //     error: "Booking đã được thanh toán trước đó. Không thể thanh toán lại.",
  //     clientSecret: null
  //   };

  // }

  const res = await api.post(`/booking/${bookingId}/createPayment/`);
  console.log("Create Payment:", res);

  return {
    error: null,
    clientSecret: res?.client_secret || null
  };

}

// Hàm lấy chi tiết booking kèm theo user, vehicle, showroom
async function getBookingWithDetails(bookingId) {
  try {
    // Lấy booking gốc
    const bookingRes = await api.get(`/booking/getBookingById/${bookingId}`, {
  headers: { "Cache-Control": "no-cache" }
  });

    const booking = bookingRes;
    const [ vehicleRes] = await Promise.all([
      // api.get(`/users/${booking.user_id}`), //hiện chưa có api này, nếu có thì gọi để lấy thông tin user
      api.get(`/vehicles/getVehicleById/${booking.vehicle_id}`, {
        headers: { "Cache-Control": "no-cache" }
      }),
    ]);

    return {
      ...booking,
      vehicle: vehicleRes,
    };
  } catch (err) {
    console.error("Lỗi khi lấy booking với chi tiết:", err);
    throw err;
  }
}


///


async function handleCancelBooking(bookingId, paymentIntentId) {

    if (!confirm("Bạn có chắc chắn muốn hủy và nhả xe ngay lập tức?")) return;

    const btnCancel = document.getElementById('btn-cancel');
    const btnSubmit = document.getElementById('submit');

    // 2. Khóa UI ngay lập tức
    if (btnCancel) btnCancel.disabled = true;
    if (btnSubmit) btnSubmit.disabled = true;

    try {
        const response = await fetch('/api/booking/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, paymentIntentId,
              reason: 'requested_by_customer' // Lý do người dùng chủ động
             })
        });

        if (response.ok) {
            alert("Đã giải phóng xe thành công!");
            window.location.href = "/vehicles"; // Thoát luồng checkout
        } else {
            throw new Error("Không thể hủy đơn hàng trên hệ thống.");
        }
    } catch (err) {
        alert(err.message);
        // Nhả phanh nếu lỗi mạng để khách thử lại
        if (btnCancel) {
            btnCancel.disabled = false;
            btnCancel.innerText = "Hủy và chọn xe khác";
        }
    }
}

async function handleFullCancelTest(bookingId) {
  if (!confirm("Bạn có chắc chắn muốn gửi yêu cầu Full Cancel (test)?")) return;

  const btn = document.getElementById("btn-full-cancel-test");
  if (btn) btn.disabled = true;

  try {
    const response = await fetch(`/api/booking/${bookingId}/full-cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "requested_by_customer",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Gửi yêu cầu full-cancel thất bại.");
    }

    alert(data?.message || "Đã gửi yêu cầu full-cancel.");
    console.log("Full cancel response:", data);
  } catch (err) {
    alert(err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}


async function initPaymentFlow(bookingId) {
  try {
    if (!bookingId) {
      throw new Error("Không tìm thấy bookingId");
    }
    console.log("Khởi tạo Payment Flow cho bookingId:", bookingId);

    const booking = await getBookingWithDetails(bookingId);
    const { error, clientSecret } = await createPaymentForBooking(bookingId);
    if (error) {
      // Hiển thị lỗi (tạm thời dùng alert)
      alert(error);
      // Hoặc log ra console (cho dev)
      console.error(error);
      return;
    }

    renderUI(booking, clientSecret);
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) {
      // Dùng trực tiếp paymentIntentId
      btnCancel.onclick = () => handleCancelBooking(bookingId, paymentIntentId);
    }

    const btnFullCancelTest = document.getElementById("btn-full-cancel-test");
    if (btnFullCancelTest) {
      btnFullCancelTest.onclick = () => handleFullCancelTest(bookingId);
    }

  } catch (err) {
    console.error("Lỗi khi khởi tạo Payment Flow:", err);
    alert(err.message);
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


