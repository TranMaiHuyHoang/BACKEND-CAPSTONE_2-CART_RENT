const request = require('supertest');
const app = require('../app'); // Express app

describe('Payment API Tests', () => {
    let token;
    let paymentId;

    const user = {
        email: 'paymenttest@example.com',
        password: '12345678',
    };

    const orderId = '1234567890abcdef';

});

test("renders payment form fields", () => {
    render(<Payment />);

    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/card holder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
});

