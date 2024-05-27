import { env } from '@/env'

//This function generates a html page to test password recovery
//This is for testing only, don't do this in production
export const htmlTemplate = (code: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Recovery</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #dddddd;
            border-radius: 10px;
        }
        .header {
            text-align: center;
            padding: 10px 0;
            border-bottom: 1px solid #dddddd;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333333;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            color: #333333;
            line-height: 1.5;
        }
        .content form {
            text-align: center;
        }
        .content input[type="password"] {
            padding: 10px;
            margin-top: 10px;
            width: calc(100% - 22px);
            border: 1px solid #dddddd;
            border-radius: 5px;
        }
        .content button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: #ffffff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            border-top: 1px solid #dddddd;
            margin-top: 20px;
        }
        .footer p {
            font-size: 12px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Recovery</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Please enter your new password below and click "Reset Password".</p>
            <form id="resetForm">
                <input type="hidden" id="code" value="${code}">
                <input type="password" id="newPassword" placeholder="Enter new password" required>
                <button type="button">Reset Password</button>
            </form>
            <p>If you did not request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
    <script>
        const button = document.querySelector('button')
        function submitForm() {
            const code = document.getElementById('code').value;
            const newPassword = document.getElementById('newPassword').value;

            fetch('http://localhost:${env.PORT}/user/recover-password/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    password: newPassword
                })
            })
            .then(response => alert('success!'))
            .catch((error) => {
                console.error('Error:', error);
                alert('something was wrong')
            });
        }
        button.addEventListener('click', submitForm)
    </script>
</body>
</html>
`
}
