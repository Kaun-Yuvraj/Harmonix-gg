# Lavalink Configuration

This website is the frontend/marketing site for your Harmonix Discord music bot. The Lavalink configuration you provided should be used in your **Discord bot backend code**, not in this website.

## Your Lavalink Credentials

```
Host: pnode1.danbot.host:1186
Auth: Yuvraj.APK
```

## Where to Use These Credentials

These credentials should be configured in your Discord bot's backend code (typically Node.js with Discord.js and a Lavalink client like erela.js or lavalink.js).

Example configuration in your bot:

```javascript
const { Manager } = require("erela.js");

const manager = new Manager({
  nodes: [
    {
      host: "pnode1.danbot.host",
      port: 1186,
      password: "Yuvraj.APK",
    },
  ],
  // ... other configuration
});
```

## About This Website

This React website serves as:
- Landing page for your bot
- Feature showcase
- Command documentation
- Privacy policy and Terms of Service
- Spotify authentication callback handler

## Next Steps

1. **Update Bot Invite Link**: Replace `YOUR_BOT_ID` in the navigation and hero sections with your actual Discord bot's client ID
2. **Customize Links**: Update Discord server invite links in the footer and CTA sections
3. **Deploy Website**: Deploy this website to show off your bot
4. **Connect Backend**: Use the Lavalink credentials in your actual Discord bot code

## Files to Update

- `src/components/Navigation.tsx` - Update bot invite URL
- `src/components/Hero.tsx` - Update bot invite URL
- `src/components/CallToAction.tsx` - Update bot invite and support server URLs
- `src/components/Footer.tsx` - Update social/Discord links
