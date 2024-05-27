import { env } from '@/env'
import nodemailer from 'nodemailer'
import { emailTemplate } from './email-template'

export const sendEmail = async (email: string, code: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      service: env.EMAIL_SERVICE,
      port: 465,
      secure: true,
      auth: {
        user: env.EMAIL_ADDRESS,
        pass: env.EMAIL_PASSWORD,
      },
    })
    await transporter.sendMail({
      from: env.EMAIL_ADDRESS,
      to: email,
      subject: 'Password recovery',
      html: emailTemplate(code),
    })
    console.log('Email was send')
  } catch (error) {
    console.log('email not send >>>', error)
  }
}
