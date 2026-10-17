/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7a704c5f'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "index.html",
    "revision": "dd45397c082d5f701db43b12f9a1be67"
  }, {
    "url": "icon.svg",
    "revision": "967998e2264e62e7ad3fe9e687fa7acd"
  }, {
    "url": "icon-maskable-512.png",
    "revision": "a97aa8d6017ef28dc5be4bb66aa83dd6"
  }, {
    "url": "icon-512.png",
    "revision": "a97aa8d6017ef28dc5be4bb66aa83dd6"
  }, {
    "url": "icon-192.png",
    "revision": "fc0b47a2a68d56fcb730a413c4badcaf"
  }, {
    "url": "favicon.ico",
    "revision": "62862385101e9fde083322b3b408ddae"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0d9fb6ccd1b15c47ae77a88ea113e65b"
  }, {
    "url": "404.html",
    "revision": "dd45397c082d5f701db43b12f9a1be67"
  }, {
    "url": "assets/index-Dv7p3SgU.js",
    "revision": null
  }, {
    "url": "assets/index-DEmddeu9.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0d9fb6ccd1b15c47ae77a88ea113e65b"
  }, {
    "url": "favicon.ico",
    "revision": "62862385101e9fde083322b3b408ddae"
  }, {
    "url": "icon-192.png",
    "revision": "fc0b47a2a68d56fcb730a413c4badcaf"
  }, {
    "url": "icon-512.png",
    "revision": "a97aa8d6017ef28dc5be4bb66aa83dd6"
  }, {
    "url": "icon-maskable-512.png",
    "revision": "a97aa8d6017ef28dc5be4bb66aa83dd6"
  }, {
    "url": "icon.svg",
    "revision": "967998e2264e62e7ad3fe9e687fa7acd"
  }, {
    "url": "manifest.webmanifest",
    "revision": "1cee20edacd4026f56e546cb753b6047"
  }], {});
  workbox.cleanupOutdatedCaches();

}));
