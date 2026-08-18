import emailjs from '@emailjs/browser'

export const sendAmcExpiryEmail = ({ email, customerName, expiryDate }) => emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  {
    email,
    customer_name: customerName,
    expiry_date: expiryDate,
  },
  {
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  },
)

export const emailJsService = { sendAmcExpiryEmail }
