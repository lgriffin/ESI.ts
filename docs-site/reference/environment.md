# Environment Variables

ESI.ts reads these environment variables when no explicit config is provided.

## Variables

| Variable           | Description                                      | Default                   |
| ------------------ | ------------------------------------------------ | ------------------------- |
| `ESI_ACCESS_TOKEN` | EVE SSO access token for authenticated endpoints | none                      |
| `ESI_CLIENT_ID`    | User-Agent identifier sent with every request    | `esi-client`              |
| `ESI_BASE_URL`     | ESI API base URL                                 | `https://esi.evetech.net` |
| `ESI_DATASOURCE`   | Server: `tranquility` or `singularity`           | `tranquility`             |
| `ESI_LOG_LEVEL`    | Log level: `error`, `warn`, `info`, `debug`      | `warn`                    |

## .env File Setup

Copy the included example and fill in your values:

```bash
cp .env.example .env
```

```env
ESI_ACCESS_TOKEN=your-eve-sso-access-token
ESI_CLIENT_ID=my-app-name
ESI_LOG_LEVEL=info
```

Use a `.env` loader like [dotenv](https://www.npmjs.com/package/dotenv):

```typescript
import 'dotenv/config';
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
// Token picked up from process.env.ESI_ACCESS_TOKEN
```

## Precedence

Explicit constructor config takes precedence over environment variables:

```typescript
// This uses the constructor token, not ESI_ACCESS_TOKEN
const client = new EsiClient({ accessToken: 'explicit-token' });
```
