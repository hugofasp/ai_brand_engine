# ai brand engine — Email Templates

> Full copy and structure for all transactional emails sent by the
> platform. Built with React Email (https://react.email).
>
> Five email types: internal notification, client confirmation,
> client delivery, reminder, contact form.
>
> Companion to NINEYARDS_BUILD_SPEC.md.

---

## Sender addresses

| Address | Purpose | Display name |
|---|---|---|
| `hello@nineyards.pt` | Client-facing emails | "nineyards" |
| `notifications@nineyards.pt` | Internal alerts | "nineyards" |
| `info@nineyards.pt` | Reply-to address | — |

All emails set `Reply-To: info@nineyards.pt` so client replies route to Hugo.

---

## Brand styling for email

Emails use a constrained version of the platform's design system since email clients have limited CSS support.

**Email-safe palette:**
- Background: `#0A0A0A`
- Container background: `#141414`
- Text: `#FAFAF7`
- Secondary text: `#B8B8B0`
- Border: `#262626`
- Accent: none (strict monochrome)
- Footer text: `#6B6B66`

**Typography (with web font fallback to system serif/sans):**
- Display: Fraunces (with Georgia, serif fallback)
- Body: Inter (with system-ui, sans-serif fallback)

**Layout:**
- Container max-width: 600px
- Centered on dark background
- Logo at top, footer at bottom
- Generous padding (32px sides, 48px top/bottom)
- All emails include plain-text fallback

---

# Email 1 — Internal notification

**Trigger:** When `requests.status` changes to `interview_complete` (immediately after the user submits the interview)

**Recipient:** `info@nineyards.pt` (from `ADMIN_NOTIFICATION_EMAIL` env)

**Sender:** `notifications@nineyards.pt` (display name: "ai brand engine")

**Subject:** `[ai brand engine] New request — {{company_name}}`

**Plain text body:**
```
A new request was just submitted on nineyards.

Company:        {{company_name}}
Contact:        {{contact_name}} <{{contact_email}}>
Role:           {{contact_role}}
Product:        Brand Identity for LLMs (BETA)
Submitted:      {{submitted_at}}

Phases completed: {{completed_phases}} of 7
Locales:          {{locales}}
Pillar count:     {{pillar_count}}
Segment count:    {{segment_count}}
Examples:         {{example_count}}

Open in admin:    {{admin_link}}

—
This is an internal notification. Reply to this email to discuss
with the team.
```

**HTML body (React Email JSX-style):**
```jsx
<Email>
  <Container style={{ maxWidth: 600 }}>
    <Heading as="h1" size="display-sm">
      New request — {{company_name}}
    </Heading>

    <Section>
      <Text>A new request was just submitted on nineyards.</Text>
    </Section>

    <Section style={{ borderTop: '1px solid #262626', padding: '24px 0' }}>
      <Row>
        <Column>
          <Text className="caption">Company</Text>
          <Text>{{company_name}}</Text>
        </Column>
        <Column>
          <Text className="caption">Contact</Text>
          <Link href="mailto:{{contact_email}}">{{contact_name}}</Link>
          <Text className="secondary">{{contact_email}}</Text>
        </Column>
      </Row>

      <Row>
        <Column>
          <Text className="caption">Role</Text>
          <Text>{{contact_role}}</Text>
        </Column>
        <Column>
          <Text className="caption">Product</Text>
          <Text>Brand Identity for LLMs (BETA)</Text>
        </Column>
      </Row>

      <Row>
        <Column>
          <Text className="caption">Submitted</Text>
          <Text>{{submitted_at}}</Text>
        </Column>
      </Row>
    </Section>

    <Section style={{ borderTop: '1px solid #262626', padding: '24px 0' }}>
      <Heading as="h3" size="heading-sm">Submission summary</Heading>
      <Text>Phases completed: {{completed_phases}} of 7</Text>
      <Text>Locales: {{locales}}</Text>
      <Text>Pillar count: {{pillar_count}}</Text>
      <Text>Segment count: {{segment_count}}</Text>
      <Text>Examples: {{example_count}}</Text>
    </Section>

    <Section>
      <Button href="{{admin_link}}" variant="primary">
        Open in admin
      </Button>
    </Section>

    <Footer>
      Internal notification. Do not forward.
    </Footer>
  </Container>
</Email>
```

**Variables:**
- `company_name`, `contact_name`, `contact_email`, `contact_role` from `requests`
- `submitted_at` from `requests.interview_completed_at`
- `completed_phases`, `locales`, `pillar_count`, `segment_count`, `example_count` computed from `interview_answers.answers`
- `admin_link` = `${NEXT_PUBLIC_APP_URL}/admin/requests/{{request_id}}`

---

# Email 2 — Client confirmation

**Trigger:** Immediately after the user submits the interview (parallel with internal notification)

**Recipient:** `requests.contact_email`

**Sender:** `hello@nineyards.pt` (display name: "ai brand engine")

**Reply-To:** `info@nineyards.pt`

**Subject:** `Your ai brand engine request is in`

**Plain text body:**
```
Hi {{contact_name}},

Thanks for completing the interview. We've received your submission
for {{company_name}}.

What happens next:
You'll get your brand DNA file pack at this email address within 5-10
minutes for most requests. During higher-volume periods, allow up to
24 hours. If it doesn't land — check spam first — drop us a line at
info@nineyards.pt and we'll resend.

What you'll receive:
— A zip with your customized brand DNA file pack (12 files for
  mono-lingual brands, 16 for bilingual, 20 for trilingual)
— Implementation Manual PDF (how to set up Claude or ChatGPT)
— How-to-Use 3-sheet Quickstart PDF
— Universal Custom Instructions + ChatGPT addendum (paste-in text
  delivered in the email body)

While you wait:
Read the How-to-Use page on the platform — it covers what the file
pack does, how the two modes (content + analytical) work, and the
basic commands your team will use:
{{how_to_use_link}}

Questions? Reply to this email — it reaches us directly.

—
nineyards
{{footer_year}}
```

**HTML body (React Email):**
```jsx
<Email>
  <Container>
    <Logo />

    <Heading as="h1" size="display-md">
      Your request is in.
    </Heading>

    <Text>
      Hi {{contact_name}},
    </Text>

    <Text>
      Thanks for completing the interview. We've received your submission
      for <strong>{{company_name}}</strong>.
    </Text>

    <Section className="callout">
      <Heading as="h3" size="heading-md">What happens next</Heading>
      <Text>
        You'll get your brand DNA file pack at this email address within
        5-10 minutes for most requests. During higher-volume periods,
        allow up to 24 hours.
      </Text>
      <Text className="secondary">
        If it doesn't land (check spam first), drop us a line at{' '}
        <Link href="mailto:info@nineyards.pt">info@nineyards.pt</Link>{' '}
        and we'll resend.
      </Text>
    </Section>

    <Section>
      <Heading as="h3" size="heading-md">What you'll receive</Heading>
      <ul>
        <li>A zip with your customized brand DNA file pack</li>
        <li>Implementation Manual PDF</li>
        <li>How-to-Use 3-sheet Quickstart PDF</li>
        <li>Universal Custom Instructions + ChatGPT addendum (in the email body)</li>
      </ul>
    </Section>

    <Section>
      <Heading as="h3" size="heading-md">While you wait</Heading>
      <Text>
        Read the How-to-Use page on the platform — it covers what the
        file pack does, how the two modes (content + analytical) work,
        and the basic commands your team will use.
      </Text>
      <Button href="{{how_to_use_link}}" variant="secondary">
        Read the How-to-Use guide
      </Button>
    </Section>

    <Footer>
      <Text>Questions? Reply to this email — it reaches us directly.</Text>
      <Text className="muted">ai brand engine · powered by nineyards · {{footer_year}}</Text>
    </Footer>
  </Container>
</Email>
```

**Variables:**
- `contact_name`, `company_name` from `requests`
- `how_to_use_link` = `${NEXT_PUBLIC_APP_URL}/how-to-use`
- `footer_year` = current year

---

# Email 3 — Client delivery

**Trigger:** Manual — admin clicks "Send to client" in the request detail page

**Recipient:** `requests.contact_email`

**Sender:** `hello@nineyards.pt` (display name: "ai brand engine")

**Reply-To:** `info@nineyards.pt`

**Subject (editable in admin, default):** `Your {{company_name}} brand DNA from nineyards`

**Plain text body (editable in admin, default):**
```
Hi {{contact_name}},

Your brand DNA file pack is ready. Three attachments are coming with
this email:

1. {{brand_slug}}-dna-pack-v{{framework_version}}.zip
   — Your customized brand DNA file pack ({{file_count}} files).

2. nineyards-implementation-manual.pdf
   — How to set up Claude Projects or ChatGPT Custom GPT with these
     files. Start here.

3. nineyards-how-to-use-quickstart.pdf
   — A 3-sheet visual quickstart your team can refer to daily.

Start with the Implementation Manual — it walks you through the
upload, configuration, and verification steps. The Quickstart is
the laminated-card-on-the-wall version for your team.

Two pieces of paste-in text below this email. Copy these into your
Claude Project's Custom Instructions field (or your ChatGPT Custom
GPT's Instructions field) before using the file pack:

— — — UNIVERSAL CUSTOM INSTRUCTIONS — — —

{{universal_custom_instructions}}

— — — END UNIVERSAL — — —

If you're deploying on ChatGPT, also append this:

— — — CHATGPT ADDENDUM — — —

{{chatgpt_addendum}}

— — — END ADDENDUM — — —

Once installed, run "system check" in a new conversation to verify
everything's loaded.

Questions or issues? Reply directly to this email — it reaches us
without going through any forms.

—
nineyards
{{footer_year}}
```

**HTML body:**
```jsx
<Email>
  <Container>
    <Logo />

    <Heading as="h1" size="display-md">
      Your {{company_name}} brand DNA is ready.
    </Heading>

    <Text>Hi {{contact_name}},</Text>

    <Text>
      Three attachments are coming with this email. Start with the
      Implementation Manual — it walks you through the upload,
      configuration, and verification steps. The Quickstart is the
      laminated-card-on-the-wall version for your team.
    </Text>

    <Section className="attachments-list">
      <Row>
        <Column className="icon">📦</Column>
        <Column>
          <Text className="caption">{{brand_slug}}-dna-pack-v{{framework_version}}.zip</Text>
          <Text className="secondary">Your customized file pack ({{file_count}} files)</Text>
        </Column>
      </Row>

      <Row>
        <Column className="icon">📘</Column>
        <Column>
          <Text className="caption">nineyards-implementation-manual.pdf</Text>
          <Text className="secondary">Setup instructions for Claude and ChatGPT — start here</Text>
        </Column>
      </Row>

      <Row>
        <Column className="icon">📄</Column>
        <Column>
          <Text className="caption">nineyards-how-to-use-quickstart.pdf</Text>
          <Text className="secondary">3-sheet visual quickstart for daily use</Text>
        </Column>
      </Row>
    </Section>

    <Section className="instructions-box">
      <Heading as="h3" size="heading-md">Paste-in: Universal Custom Instructions</Heading>
      <Text className="muted">
        Copy this into your Claude Project's Custom Instructions field,
        or your ChatGPT Custom GPT's Instructions field.
      </Text>
      <Pre>{{universal_custom_instructions}}</Pre>
    </Section>

    <Section className="instructions-box">
      <Heading as="h3" size="heading-md">If deploying on ChatGPT, also append:</Heading>
      <Pre>{{chatgpt_addendum}}</Pre>
    </Section>

    <Section>
      <Text>
        Once installed, run <code>system check</code> in a new
        conversation to verify everything's loaded.
      </Text>
    </Section>

    <Footer>
      <Text>
        Questions or issues? <Link href="mailto:info@nineyards.pt">
        Reply directly to this email
        </Link> — it reaches us without going through any forms.
      </Text>
      <Text className="muted">ai brand engine · powered by nineyards · {{footer_year}}</Text>
    </Footer>
  </Container>
</Email>
```

**Attachments:**
- `{{brand_slug}}-dna-pack-v{{framework_version}}.zip` (assembled from `generated_files`)
- `nineyards-implementation-manual.pdf` (static, from `framework-templates` bucket)
- `nineyards-how-to-use-quickstart.pdf` (static, from `framework-templates` bucket)

**Total attachment size budget:** 25 MB (Resend limit). PDFs should be optimized to <2 MB each. Zip typically <1 MB.

**Variables:**
- `contact_name`, `company_name` from `requests`
- `brand_slug` = slugified `company_name` (e.g., "inhabitus" or "my-company")
- `framework_version` from `generated_files.framework_version`
- `file_count` from count of finalized `generated_files` for this request
- `universal_custom_instructions` from `/templates/constants/universal_custom_instructions.txt` (full text)
- `chatgpt_addendum` from `/templates/constants/chatgpt_addendum.txt` (full text)

---

# Email 4 — Reminder

**Trigger:** Cron job (Vercel Cron or Supabase scheduled function). When `requests.status = 'interview_in_progress'` for >24 hours without activity (`interview_answers.updated_at < now() - interval '24 hours'`).

**Recipient:** `requests.contact_email`

**Sender:** `hello@nineyards.pt`

**Reply-To:** `info@nineyards.pt`

**Subject:** `Your ai brand engine interview is waiting`

**Frequency:** Only ONE reminder per request. After this, if still inactive after 7 days, mark `status = 'abandoned'` and stop emailing.

**Plain text body:**
```
Hi {{contact_name}},

You started a brand DNA interview for {{company_name}} but haven't
finished yet. Your progress is saved — you can pick up exactly where
you left off:

{{resume_link}}

You completed {{completed_phases_count}} of 7 phases. Most brands
finish the remaining work in {{estimated_remaining}}.

If you've decided not to continue, no action needed — we'll close the
session in 7 days. If you'd like help finishing or have questions,
reply to this email.

—
nineyards
{{footer_year}}
```

**HTML body (same structure as confirmation, themed):**
```jsx
<Email>
  <Container>
    <Logo />

    <Heading as="h1" size="display-md">
      Your interview is waiting.
    </Heading>

    <Text>Hi {{contact_name}},</Text>

    <Text>
      You started a brand DNA interview for <strong>{{company_name}}</strong> but
      haven't finished yet. Your progress is saved — you can pick up
      exactly where you left off.
    </Text>

    <Section>
      <Button href="{{resume_link}}" variant="primary">
        Resume your interview
      </Button>
    </Section>

    <Section className="callout">
      <Text>
        You completed <strong>{{completed_phases_count}} of 7 phases</strong>.
        Most brands finish the remaining work in {{estimated_remaining}}.
      </Text>
    </Section>

    <Text className="secondary">
      If you've decided not to continue, no action needed — we'll close
      the session in 7 days. If you'd like help or have questions,
      reply to this email.
    </Text>

    <Footer>
      <Text className="muted">ai brand engine · powered by nineyards · {{footer_year}}</Text>
    </Footer>
  </Container>
</Email>
```

**Variables:**
- `resume_link` = `${NEXT_PUBLIC_APP_URL}/interview/{{request_id}}`
- `completed_phases_count` from `interview_answers.completed_phases | length`
- `estimated_remaining` = string like "10-15 minutes" computed from remaining phases

---

# Email 5 — Contact form

**Trigger:** Submission of the contact form on `/contact`

**Recipient:** `info@nineyards.pt`

**Sender:** `notifications@nineyards.pt`

**Reply-To:** the form submitter's email

**Subject:** `[ai brand engine — contact] {{subject}}`

**Plain text body:**
```
A contact form was submitted on nineyards.pt.

Name:    {{name}}
Email:   {{email}}
Subject: {{subject}}

Message:
{{message}}

—
Reply directly to this email to respond to the submitter.
```

**HTML body:** minimal — same structure as internal notification but for contact context.

**Variables:**
- `name`, `email`, `subject`, `message` from form submission
- Form submission also logged in `email_log` with type `contact_form`

---

# Resend webhook handling

**Endpoint:** `POST /api/webhooks/resend`

**Events to handle:**

| Event | Action |
|---|---|
| `email.sent` | No-op (already logged on send) |
| `email.delivered` | Update `email_log.status = 'delivered'` |
| `email.opened` | Update `email_log.status = 'opened'`; set `metadata.opened_at` |
| `email.clicked` | Update `email_log.status = 'clicked'`; set `metadata.clicked_at`, `metadata.clicked_link` |
| `email.bounced` | Update `email_log.status = 'bounced'`; if type was `client_delivery`, also update `requests.status = 'failed'` and send internal notification |
| `email.complained` | Update `email_log.status = 'failed'`; flag the request for review |

**Signature verification:** Use `RESEND_WEBHOOK_SECRET` to verify the webhook signature on every request. Reject unverified requests with 401.

---

# Email content responsibilities

## Hugo / admin controls

Subjects and bodies of email types 1 (internal), 2 (confirmation), 4 (reminder) — fixed templates. Admin doesn't edit these per-send.

Email type 3 (delivery) — admin can edit subject and body per request in the request detail panel before sending. Default template is loaded; admin can customize.

Email type 5 (contact form) — fixed template.

## Platform-controlled content

Two pieces of static content delivered in the body of email 3 (delivery):

1. **Universal Custom Instructions** — stored at `/templates/constants/universal_custom_instructions.txt`, paired with framework version. Updated when framework versions bump.

2. **ChatGPT addendum** — stored at `/templates/constants/chatgpt_addendum.txt`, same versioning.

When a framework version updates, all subsequent deliveries include the new versions. Past requests are NOT auto-updated.

---

# Email testing

Before launch:
- Test deliverability across major providers: Gmail, Outlook, Apple Mail, Proton, Hey
- Test rendering across email clients: web Gmail, web Outlook, iOS Mail, Android Gmail
- Verify spam scores using mail-tester.com or similar
- Confirm SPF, DKIM, DMARC records on `nineyards.pt`
- Test plain-text fallback in each template
- Test attachment delivery on the delivery email (size, naming, MIME types)
- Test webhook signature verification end-to-end

---

End of email templates specification.
