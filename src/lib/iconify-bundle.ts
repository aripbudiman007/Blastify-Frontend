/**
 * Iconify offline bundle — registers brand logos locally (no CDN required).
 *
 * We extract only the ~20 slugs we actually render from the 4.5 MB
 * @iconify-json/simple-icons package. The pre-extracted subset is
 * simple-icons-subset.json (~20 KB).  Importing the full 4.5 MB JSON
 * directly would bloat the production bundle unnecessarily.
 *
 * Import this file once at app entry (main.tsx) — it runs synchronously
 * so icons are available before the first React render.
 */
import { addCollection } from '@iconify/react'
import subsetData from './simple-icons-subset.json'

// Register the pre-extracted simple-icons subset into the Iconify runtime.
// After this call, any <Icon icon="simple-icons:shopify" /> etc. resolves
// from local data instead of making an API call to api.iconify.design.
addCollection(subsetData as Parameters<typeof addCollection>[0])
