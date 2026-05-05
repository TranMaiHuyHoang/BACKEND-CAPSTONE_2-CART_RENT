const request = require('supertest');
const app = require('../app'); // Express app

describe('Contact Us API Tests', () => {
    let token;

    const contactData = {
        name: 'Nguyen Van A',
        email: 'vana@example.com',
        message: 'I need support for my booking system',
    };
    test("allows user to enter contact information", () => {
        render(<ContactUs />);

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: "Nguyen Van A" },
        });

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "user@example.com" },
        });

        fireEvent.change(screen.getByLabelText(/message/i), {
            target: { value: "I want to rent a car from SmartRentCar." },
        });

        expect(screen.getByLabelText(/name/i)).toHaveValue("Nguyen Van A");
        expect(screen.getByLabelText(/email/i)).toHaveValue("user@example.com");
        expect(screen.getByLabelText(/message/i)).toHaveValue(
            "I want to rent a car from SmartRentCar."
        );
    });
});
