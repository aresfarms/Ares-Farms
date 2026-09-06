# furlong-scanner — private ClamAV malware-scanning service for the sovereign
# vault. IAM-private: only the core runtime service account may invoke it.
# Bytes come in, a verdict comes out; nothing is stored, logged, or forwarded.
#
# Build ClamAV and refresh signatures in a mutable stage, then copy only clamd,
# its runtime libraries, configuration, definitions, and the HTTP shim into a
# digest-pinned distroless Python runtime.

FROM clamav/clamav-debian:1.4.5 AS clamav-builder

USER root

RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends ca-certificates pax-utils \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Fail the build if the engine pin is not the approved patched release.
RUN clamd --version | grep -F 'ClamAV 1.4.5'

# The official image is preloaded, so this is an incremental signature refresh.
RUN mkdir -p /var/lib/clamav /run/clamav /scanner-rootfs \
  && chown -R clamav:clamav /var/lib/clamav /run/clamav \
  && freshclam --foreground --stdout

# Stream-only scanning over loopback. The HTTP shim is the only network surface.
RUN printf 'DatabaseDirectory /var/lib/clamav\nTCPSocket 3310\nTCPAddr 127.0.0.1\nMaxFileSize 60M\nMaxScanSize 60M\nStreamMaxLength 60M\nForeground yes\nLogSyslog no\n' > /etc/clamav/clamd.conf
# Resolve and preserve exactly the dynamic runtime closure for clamd. Build
# utilities, freshclam, a shell, and the package manager do not cross this line.
RUN lddtree -l /usr/sbin/clamd | sort -u \
  | while IFS= read -r file; do \
      case "$file" in \
        */libc.so.6|*/libm.so.6|*/libpthread.so.0|*/libdl.so.2|*/librt.so.1|*/libresolv.so.2|*/ld-linux-x86-64.so.2|*/libssl.so.3|*/libcrypto.so.3|*/libexpat.so.1) continue ;; \
        /lib/*) destination="/usr$file" ;; \
        *) destination="$file" ;; \
      esac; \
      mkdir -p "/scanner-rootfs$(dirname "$destination")"; \
      cp -L "$file" "/scanner-rootfs$destination"; \
    done

FROM gcr.io/distroless/python3-debian13@sha256:f2b206661cee3edb44f132d7f054a9ced96f671d8a973de0db750895c9acb2fb

WORKDIR /srv
ENV PORT=8080

COPY --from=clamav-builder /scanner-rootfs/ /
COPY --from=clamav-builder --chown=65532:65532 /etc/clamav/clamd.conf /etc/clamav/clamd.conf
COPY --from=clamav-builder --chown=65532:65532 /var/lib/clamav/ /var/lib/clamav/
COPY --chown=65532:65532 server.py /srv/server.py

USER 65532:65532
EXPOSE 8080

# Distroless Python supplies the interpreter entrypoint. The shim starts clamd
# directly and refuses readiness until its baked signature database is loaded.
CMD ["/srv/server.py"]
