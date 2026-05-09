import Razorpay from 'razorpay';
import 'dotenv/config';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

razorpay.orders.create({ amount: 177000, currency: 'INR', receipt: 'receipt#1' })
  .then(order => console.log('Success:', order))
  .catch(err => console.error('Error:', err));
