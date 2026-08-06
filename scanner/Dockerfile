# furlong-scanner — private ClamAV malware-scanning service for the sovereign
# vault (founder-approved quarantine build, 2026-08-06). IAM-private Cloud Run
# service; ONLY the core runtime SA may invoke it. Bytes come in, a verdict
# comes out — nothing is stored, logged, or forwarded.
#
# The virus database is baked at IMAGE BUILD time (freshclam during build) so
# cold starts are fast and the container needs no egress at runtime.
# Definitions are as fresh as the last image build — rebuild refreshes them.

FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends clamav clamav-daemon python3 \
  && rm -rf /var/lib/apt/lists/*

# Bake definitions at build time (freshclam needs the db dir writable).
RUN mkdir -p /var/lib/clamav && chown -R clamav:clamav /var/lib/clamav \
  && freshclam --foreground --stdout || freshclam --foreground --stdout

# clamd config: stream-only scanning over a local TCP socket.
RUN printf 'TCPSocket 3310\nTCPAddr 127.0.0.1\nMaxFileSize 60M\nMaxScanSize 60M\nStreamMaxLength 60M\nForeground yes\nLogSyslog no\n' > /etc/clamav/clamd.conf

COPY server.py /srv/server.py

ENV PORT=8080
EXPOSE 8080

# Start clamd in the background, then the HTTP shim (which waits for clamd).
CMD ["/bin/sh", "-c", "clamd & python3 /srv/server.py"]
