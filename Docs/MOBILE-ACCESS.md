# Private mobile access

**Status: in progress, not complete.** App-side access and pairing are built and covered by automated checks. The Tailscale installer was downloaded and verified, but installation is waiting for Windows administrator approval. Automated approval attempts did not dismiss the prompt, and installation has not been confirmed. Work is on hold until the user returns to the home PC.

Resume by approving the pending installer (or restarting it if the prompt has expired), confirming installation, signing in on the PC and phone, enabling HTTPS, and testing pairing and cellular access. Do not mark remote access complete until the actual phone connection and disable/revocation behavior are verified.

After setup, Muse is designed to be reachable on your phone at home or away. Its ideas and model stay on the home PC. Access uses [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve), which shares HTTPS services only inside your private Tailscale network. Muse adds browser pairing before allowing library access.

## First-time setup

1. Install [Tailscale](https://tailscale.com/download) on the Windows PC and phone. Sign both into the same personal account. Keep that network limited to your own trusted devices.
2. Connect Tailscale on both devices. In the [Tailscale DNS settings](https://login.tailscale.com/admin/dns), enable MagicDNS and HTTPS certificates. See [HTTPS setup](https://tailscale.com/docs/how-to/set-up-https-certificates). Certificate issuance records the device hostname in public certificate-transparency logs; the Muse library remains behind private network access and pairing.
3. Open **Start Muse.cmd** on the PC. Open **Library tools → Mobile access** and choose **Enable / new pairing code**.
4. Open the displayed HTTPS address in the phone browser, with Tailscale connected. Enter the ten-character code shown on the PC. The code is single-use and expires after ten minutes.
5. Bookmark the HTTPS address. Browse/search saved ideas, pin and add notes, roll ideas, explore variations, and create/download Codex kits using the same PC library. There is no separate phone library to sync.

## Before leaving home

Keep the PC powered on, connected to the internet, and awake. Muse cannot wake a sleeping PC. Enable mobile access before leaving. With access enabled, closing the desktop browser does not stop the lightweight Muse server. Generation and source fetching still happen only when you press Roll or request variations. All inference runs on the PC using its existing local model.

Pairing lasts up to twelve hours. After expiration, obtain a new code from the PC. **Enable / new pairing code** leaves existing paired browsers connected. **Disable and disconnect phones** revokes all browsers and closes Muse's gateway. **Disconnect phone** signs out only that browser. **Stop Muse** on the PC also closes mobile access. Restarting Muse defaults to access off; it does not restore pairing secrets or silently start remote access.

Tailscale is a separate network client and may remain connected after Muse stops; Muse does not stop that shared system service. The Muse-owned Serve process is stopped with mobile access. Existing Tailscale services are preserved. Muse refuses setup if HTTPS port 8443 is occupied or public Funnel is already enabled; it never uses Funnel or configures router port forwarding.

## Troubleshooting

- **Install / sign in to Tailscale:** complete PC sign-in and press **Check connection**. Installation alone does not connect the account. Muse checks the standard Windows installation under Program Files.
- **HTTPS setup required:** enable MagicDNS and HTTPS certificates in Tailscale DNS settings, then retry. A restricted Tailscale account may require its administrator to permit Serve.
- **Address will not open:** check Tailscale is connected on both devices, the PC is awake, and mobile access is still enabled. Your Tailscale device access policy must permit port 8443. Keep the port in the displayed URL.
- **Code expired / already used:** generate a new code on the PC. Five guesses are allowed per ten-minute cooldown across this gateway. Disabling/re-enabling resets pairing state and disconnects all browsers.
- **Phone asks to pair again:** sessions expire, and disabling access or restarting Muse revokes them.

The implementation has automated pairing/proxy checks. Installation, account sign-in, and a physical phone test over cellular data are still needed to validate this PC's complete remote connection.
