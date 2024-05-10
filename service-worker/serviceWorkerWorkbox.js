/* eslint-disable no-restricted-globals */
import { clientsClaim, skipWaiting } from "workbox-core"
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"
skipWaiting()
clientsClaim()

const precacheManifest = [].concat(self.__WB_MANIFEST || [])
precacheAndRoute(precacheManifest)

const handler = createHandlerBoundToURL("/index.html")
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
})
registerRoute(navigationRoute)
