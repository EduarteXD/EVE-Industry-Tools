import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { to, name, subject, body } = req.body

  const { SMTP_MAILER, SMTP_KEY } = process.env

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.qiye.aliyun.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_MAILER,
        pass: SMTP_KEY,
      },
    })

    await transporter.sendMail({
      from: 'i@m.oxdl.cn',
      to,
      subject,
      text: body,
      html: `<p>Hello ${name},</p><p>${body}</p>`,
    })

    res.status(200).json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ message: 'Error sending email' })
  }
}