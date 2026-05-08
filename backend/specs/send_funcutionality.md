```

import resend

resend.api_key = "re_LgW79W1U_4i1834nsbwRmdVi2UEMNdL8T"

r = resend.Emails.send({
  "from": "onboarding@resend.dev",
  "to": "napael@yahoo.com",
  "subject": "Hello World",
  "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
})

```
