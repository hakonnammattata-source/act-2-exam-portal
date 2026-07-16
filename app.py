import os
from dotenv import load_dotenv
import smtplib
from email.message import EmailMessage
from flask import Flask, jsonify, render_template, request

load_dotenv()

app = Flask(__name__)

@app.get('/')
def index():
    return render_template('index.html')


def send_results_email(payload: dict) -> tuple[bool, str]:
    host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    port = int(os.getenv('SMTP_PORT', '587'))
    username = os.getenv('SMTP_USERNAME', '')
    password = os.getenv('SMTP_PASSWORD', '')
    recipient = os.getenv('RESULTS_EMAIL', '')
    sender = os.getenv('FROM_EMAIL', username)

    if not all([username, password, recipient, sender]):
        return False, 'Email is not configured. Set SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL, and RESULTS_EMAIL.'

    student = payload.get('student', {})
    rows = payload.get('results', [])
    score = payload.get('score', 0)
    total = payload.get('total', len(rows))
    exam_title = payload.get('examTitle', 'ACT 2 Mathematics Exam')
    submitted_early = payload.get('submittedEarly', False)
    elapsed = payload.get('elapsed', '')

    html_rows = []
    for row in rows:
        status = 'Correct' if row.get('correct') else 'Wrong'
        html_rows.append(
            '<tr>'
            f"<td>{row.get('number')}</td>"
            f"<td>{status}</td>"
            f"<td>{row.get('selectedText') or 'No answer'}</td>"
            f"<td>{row.get('correctText')}</td>"
            '</tr>'
        )

    msg = EmailMessage()
    msg['Subject'] = f"{exam_title} result - {student.get('name', 'Student')} - {score}/{total}"
    msg['From'] = sender
    msg['To'] = recipient
    msg.set_content(
        f"Student: {student.get('name', '')}\n"
        f"Student email: {student.get('email', '')}\n"
        f"Phone: {student.get('phone', '')}\n"
        f"Score: {score}/{total}\n"
        f"Elapsed: {elapsed}\n"
        f"Submitted early: {'Yes' if submitted_early else 'No'}\n"
    )
    msg.add_alternative(f"""
    <html><body style="font-family:Arial,sans-serif">
      <h2>{exam_title}</h2>
      <p><strong>Teacher:</strong> Eng. Abdelrahman Ghoneem - 01116004434</p>
      <p><strong>Student:</strong> {student.get('name', '')}<br>
      <strong>Student email:</strong> {student.get('email', '')}<br>
      <strong>Phone:</strong> {student.get('phone', '')}<br>
      <strong>Score:</strong> {score}/{total}<br>
      <strong>Elapsed:</strong> {elapsed}<br>
      <strong>Submitted early:</strong> {'Yes' if submitted_early else 'No'}</p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
        <thead><tr><th>#</th><th>Status</th><th>Student answer</th><th>Correct answer</th></tr></thead>
        <tbody>{''.join(html_rows)}</tbody>
      </table>
    </body></html>
    """, subtype='html')

    try:
        with smtplib.SMTP(host, port, timeout=20) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)
        return True, 'Results emailed successfully.'
    except Exception as exc:
        return False, f'Could not send email: {exc}'


@app.post('/api/submit')
def submit():
    payload = request.get_json(silent=True) or {}
    sent, message = send_results_email(payload)
    return jsonify({'ok': True, 'emailSent': sent, 'message': message})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')), debug=False)
