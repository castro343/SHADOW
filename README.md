# 𝐒𝐇𝐀𝐃𝐎𝐖

**A WhatsApp Multi-Device Bot — built and customized by CASTRO.**

SHADOW retains the upstream command framework and feature implementations while receiving its own identity, configuration, documentation and deployment setup.

## Identity
- Name: SHADOW
- Maintainer: CASTRO
- Default prefix: `.`
- Default mode: `public`
- Runtime: Node.js 24+

## Setup
1. Install Node.js 24 or newer.
2. Run `npm install`.
3. Set the environment variables below in your host dashboard.
4. Start with `npm start`.

## Environment configuration
| Variable | Purpose | Default |
| --- | --- | --- |
| `SESSION_ID` | WhatsApp session credential | empty |
| `PREFIX` | Command prefix | `.` |
| `BOT_NAME` | Bot display name | `SHADOW` |
| `OWNER_NAME` | Owner display name | `CASTRO` |
| `OWNER_NUMBER` | Owner number in international format | empty |
| `DEV` | Developer contact number | empty |
| `MODE` | Bot mode | `public` |
| `MENU_IMAGE_URL` | Optional menu image URL | empty |
| `ALIVE_IMG` | Optional alive-message image URL | empty |

Other supported automation switches are documented in `config.js`. Keep session credentials private and never commit them.

## Deployment
For Render, create a Background Worker connected to this repository. Use `npm install` as the build command and `npm start` as the start command. Add the required environment variables in the service dashboard.

A pairing/session-generation service is a separate component. We will configure a SHADOW-controlled pairing endpoint before publishing pairing instructions.

## Upstream attribution
SHADOW is based on the Apache-2.0-licensed [ADEEL-MD](https://github.com/Adeel-Xtech/ADEEL-MD) project. The upstream LICENSE and required notices are retained. SHADOW's branding and project configuration are maintained by CASTRO.

## Disclaimer
SHADOW is an independent community project and is not affiliated with or endorsed by WhatsApp or Meta. Use responsibly and follow WhatsApp's terms and applicable laws. Unofficial automation may result in account restrictions.
