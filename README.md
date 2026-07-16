# ACT 2 Mathematics Examination Portal

Branded for **Eng. Abdelrahman Ghoneem - 01116004434**.

## Included
- 50-question ACT 2 mathematics exam
- 60-minute countdown
- Submit Early button
- Automatic submission when time ends
- Immediate correct/wrong review with explanations
- Email report containing every correct and wrong response
- Responsive phone/tablet/computer design
- Visible branding and page watermark

## Run locally
1. Install Python 3.10 or later.
2. Open a terminal in this folder.
3. Run:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and enter the teacher's email settings.
5. Start the portal:

```bash
python app.py
```

6. Open `http://127.0.0.1:5000`.

## Gmail setup
Use a Google **App Password**, not the normal Gmail password. Two-step verification must be enabled on the sending Google account. Put the 16-character App Password in `SMTP_PASSWORD`.

## Hosting
This Flask app can be hosted on Render, Railway, PythonAnywhere, or a VPS. Add the same environment variables in the hosting dashboard. Do not upload the `.env` file publicly.
