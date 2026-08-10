# furlong-scanner — private ClamAV malware-scanning service for the sovereign
# vault. IAM-private: only the core runtime service account may invoke it.
# Bytes come in, a verdict comes out; nothing is stored, logged, or forwarded.
#
# SECURITY-CLOSURE-002: pin the supported 1.4 patch line to 1.4.5. Debian's
# bookworm package was 1.4.3 and freshclam explicitly reported it outdated.
# The virus database is refreshed at image build time; runtime egress remains
# unnecessary and every deployed service image is pinned by final digest.

FROM clamav/clamav-debian:1.4.5

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Fail the build if the engine pin is not the security-patched release.
RUN clamd --version | grep -F 'ClamAV 1.4.5'

# Refresh definitions while building. The official image is preloaded, so this
# is an incremental refresh rather than a full cold-start download.
RUN mkdir -p /var/lib/clamav /run/clamav /srv \
  && chown -R clamav:clamav /var/lib/clamav /run/clamav /srv \
  && freshclam --foreground --stdout

# Stream-only scanning over a local TCP socket. Furlong's HTTP shim is the only
# network surface and the Cloud Run service itself remains IAM-private.
RUN printf 'User clamav\nTCPSocket 3310\nTCPAddr 127.0.0.1\nMaxFileSize 60M\nMaxScanSize 60M\nStreamMaxLength 60M\nForeground yes\nLogSyslog no\n' > /etc/clamav/clamd.conf

COPY --chown=clamav:clamav server.py /srv/server.py

ENV PORT=8080
EXPOSE 8080

USER clamav

CMD ["/bin/sh", "-c", "clamd & python3 /srv/server.py"]
