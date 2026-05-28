-- DN-007: Client-facing delivery URL.
--
-- When the admin "sends" a finished brand pack to the client, we
-- generate an opaque token and stash it on the request. The client's
-- delivery email links to /deliver/<token>; that page validates the
-- token against this column to authorise the download without
-- requiring an account.
--
-- The token is unguessable (32 random bytes hex-encoded) so the URL
-- is the auth — same model as the request id itself.

alter table requests
  add column if not exists delivery_token text;

create unique index if not exists idx_requests_delivery_token
  on requests(delivery_token)
  where delivery_token is not null;
