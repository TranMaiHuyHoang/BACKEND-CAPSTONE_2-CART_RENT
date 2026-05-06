const request = require('supertest');
const app = require('../app'); // Express app

describe('Booking API Tests', () => {
    let token;
    let bookingId;

    const user = {
        email: 'bookingtest@example.com',
        password: '12345678',
    };

    const bookingData = {
        serviceId: '1234567890abcdef',
        date: '2026-05-10',
        time: '10:00',
        note: 'Test booking',
    };
    test("POST /api/bookings - should create new booking", async () => {
        const res = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                roomId: 1,
                checkInDate: "2026-05-10",
                checkOutDate: "2026-05-15",
                guests: 2,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("booking");

        bookingId = res.body.booking.id;
    });

});
