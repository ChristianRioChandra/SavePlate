import emailjs from '@emailjs/browser'

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const res = await emailjs.send(
      'service_saylemc',
      'template_7wx8hkd',
      {
        to_email: email,
        otp_code: otp,
      },
      'KLoV0pbERPjmQTQjS'
    )

    console.log('EMAIL SUCCESS:', res)
  } catch (err) {
    console.error('EMAIL FAILED:', err)
  }
}
