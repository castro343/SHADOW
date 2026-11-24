# Original ADEEL-MD command migration inventory

Source: [Adeel-Xtech/ADEEL-MD](https://github.com/Adeel-Xtech/ADEEL-MD), whose fork payload is loaded by the upstream bootstrap from [the external payload repository](https://github.com/jvgucuhihkvjkjbh/zovvkvchghhGogjYurubvVbbbbZz).

This is a source inventory, not a claim that the commands have already been ported. It records every JavaScript plugin in the inspected payload so migration can preserve names and aliases while replacing unsafe implementation details. SHADOW now includes the first migrated command batch in `plugins/core.js`; the remaining plugin migration remains in progress.

**Plugin files discovered: 158.**

## AI, chat and knowledge

- `plugins/Gemini.js`
- `plugins/Quran.js`
- `plugins/ai-chat.js`
- `plugins/chatbot.js`
- `plugins/define-word.js`
- `plugins/get-news.js`
- `plugins/prayertime.js`
- `plugins/tool-wikipedia.js`
- `plugins/translate-en-ur.js`
- `plugins/translate-ur-en.js`

## Media, downloads and creative tools

- `plugins/capcut.js`
- `plugins/couples-dp.js`
- `plugins/dl-fb.js`
- `plugins/dl-img.js`
- `plugins/dl-ringtones.js`
- `plugins/dl-tiktok.js`
- `plugins/dl-tiktok2.js`
- `plugins/dl-ytcommunity.js`
- `plugins/download.js`
- `plugins/gen-pass.js`
- `plugins/images-fun.js`
- `plugins/imagescan.js`
- `plugins/imagine.js`
- `plugins/img-ad.js`
- `plugins/img-blur.js`
- `plugins/img-grey.js`
- `plugins/img-invert.js`
- `plugins/img-jail.js`
- `plugins/img-joke.js`
- `plugins/img-nokia.js`
- `plugins/img-wanted.js`
- `plugins/insta-dl.js`
- `plugins/logo-maker.js`
- `plugins/movie.js`
- `plugins/pinterest-dl.js`
- `plugins/remini.js`
- `plugins/remove-bg.js`
- `plugins/snapchat.js`
- `plugins/sora.js`
- `plugins/spotify.js`
- `plugins/ss.js`
- `plugins/terabox.js`
- `plugins/tiktok-picdl.js`
- `plugins/tiktok-search.js`
- `plugins/viral-video.js`
- `plugins/yt-movie.js`
- `plugins/yt-seaech.js`
- `plugins/yt-stalk.js`
- `plugins/ytdl-drama.js`
- `plugins/ytdl-play.js`
- `plugins/ytdl-video.js`

## Group and moderation

- `plugins/anti-bad.js`
- `plugins/anti-link.js`
- `plugins/anti-once.js`
- `plugins/anti-vv.js`
- `plugins/block-unblock.js`
- `plugins/copy-name-group.js`
- `plugins/delete-links.js`
- `plugins/group-add.js`
- `plugins/group-demote.js`
- `plugins/group-gdesc.js`
- `plugins/group-join.js`
- `plugins/group-kick.js`
- `plugins/group-leave.js`
- `plugins/group-link.js`
- `plugins/group-mute-unmute.js`
- `plugins/group-newgc.js`
- `plugins/group-photo.js`
- `plugins/group-poll.js`
- `plugins/group-promote.js`
- `plugins/group-req-accept.js`
- `plugins/group-req-reject.js`
- `plugins/group-resetlink.js`
- `plugins/group-status.js`
- `plugins/group-tag.js`
- `plugins/group-tagall.js`
- `plugins/group-tool.js`
- `plugins/jid-autofix.js`
- `plugins/once-send-all-media.js`
- `plugins/out-remove.js`
- `plugins/tag-admins.js`

## Owner, system and configuration

- `plugins/check-update.js`
- `plugins/check-uptime.js`
- `plugins/check-weather.js`
- `plugins/env-list.js`
- `plugins/env.js`
- `plugins/heroku-del-skip-app.js`
- `plugins/heroku-del.js`
- `plugins/heroku-one-app-del.js`
- `plugins/main-alive.js`
- `plugins/main-ban.js`
- `plugins/main-menu.js`
- `plugins/main-ping.js`
- `plugins/main-repo.js`
- `plugins/main-sudo.js`
- `plugins/main-updater.js`
- `plugins/manage-env.js`
- `plugins/owner-setting.js`
- `plugins/presence.js`
- `plugins/privacy-tool.js`
- `plugins/system.js`
- `plugins/tool-broadcast.js`
- `plugins/tool-cinfo.js`
- `plugins/tool-fetch.js`
- `plugins/tool-number.js`
- `plugins/tool-profile.js`
- `plugins/tool-request.js`
- `plugins/tool-url.js`

## Fun, social and utilities

- `plugins/auto-sticker.js`
- `plugins/emix-fun.js`
- `plugins/emotions-tool.js`
- `plugins/fancy-text-english.js`
- `plugins/fun-etc.js`
- `plugins/fun-match.js`
- `plugins/fun-ship.js`
- `plugins/gen-pass.js`
- `plugins/get-jid.js`
- `plugins/get-owner.js`
- `plugins/get-pair.js`
- `plugins/gitclone.js`
- `plugins/gitstalk.js`
- `plugins/mention-reply.js`
- `plugins/name-photo.js`
- `plugins/npm-search.js`
- `plugins/qr.js`
- `plugins/re-caption.js`
- `plugins/reactions.js`
- `plugins/rw-tool.js`
- `plugins/search-npm.js`
- `plugins/sexy.js`
- `plugins/sim.js`
- `plugins/sms.js`
- `plugins/sticker-maker.js`
- `plugins/tiny-url.js`
- `plugins/tool-converter.js`
- `plugins/tool-new.js`
- `plugins/tool-pdf.js`
- `plugins/tool-sticker.js`
- `plugins/tool-tempmail.js`
- `plugins/tool-tts.js`
- `plugins/tool-vfc.js`
- `plugins/tool-wstalk.js`
- `plugins/tools-fun.js`
- `plugins/ttstalk-tool.js`
- `plugins/tweet-stalk.js`

## Other plugin files

- `plugins/auto-recoding.js`
- `plugins/auto-reply.js`
- `plugins/auto-typing.js`
- `plugins/auto-voice.js`
- `plugins/bomber.js`
- `plugins/channel-id.js`
- `plugins/crancy.js`
- `plugins/creator.js`
- `plugins/hack.js`
- `plugins/list-cmd.js`
- `plugins/menu-new.js`
- `plugins/menu-old.js`
- `plugins/repo-search.js`
- `plugins/status-saver.js`

## Migration rules

- Preserve each original command name, alias, and intended user-facing behaviour where lawful and technically viable.
- Port reviewed handlers into SHADOW's explicit plugin registry; do not restore directory-wide implicit loading or remote code execution.
- Do not import obfuscated bootstrap code, embedded credentials, destructive account-deletion automation, SMS-bombing behaviour, or unbounded arbitrary-URL fetching.
- Review group administration, broadcast, privacy, media-download, and external-service commands individually; enforce owner/admin permissions and validate inputs.
- Add tests for each migrated command and record unavailable third-party APIs or required credentials.

## Known high-risk areas

The inspected payload includes files for Heroku app deletion, SMS bombing, arbitrary URL fetching, external pairing relays, update/restart automation, and broad broadcast or chat-management operations. These are not copied blindly. Safe equivalents or documented exclusions are required.

## First migrated command batch

Ported into SHADOW's reviewed core registry from the original payload:

| Original source file | Commands and aliases now registered |
|---|---|
| `plugins/main-ping.js` | `.ping` (aliases: `.speed`, `.pong`), `.ping2` |
| `plugins/main-alive.js` | `.alive` (aliases: `.status`, `.online`, `.a`) |
| `plugins/list-cmd.js` | `.list` (aliases: `.listcmd`, `.commands`) |
| SHADOW core menu | `.menu` (alias: `.help`) |

The above command names and aliases are registered and covered by unit tests. Their responses are rebranded for SHADOW; advanced presentation details from the upstream handlers are intentionally not copied where they depend on the original newsletter identity or unsafe assumptions.
