/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Constructs a human readable curls encoded proxy domain using the following
 * algorithm:
 *   Convert domain from punycode to utf-8 (if applicable)
 *   Replace every '-' with '--'
 *   Replace every '.' with '-'
 *   Convert back to punycode (if applicable)
 *
 * @param {string} domain The publisher domain
 * @return {string} The curls encoded domain
 * @private
 */
function constructHumanReadableCurlsProxyDomain_(domain) {
  domain = toUnicode(domain.toLowerCase());
  domain = domain.split('-').join('--');
  domain = domain.split('.').join('-');
  return toAscii(domain);
}

function getCertUrl(result) {
  const resultArray = result.split(';');
  if (resultArray.length >= 3) {
    for (let i = 0; i < resultArray.length; i++) {
      var pair = resultArray[2].split('=');
      if (pair[0] != 'cert-url') {
        continue;
      }
      if (pair.length >= 2) {
        return pair[1];
      }
    }
  }
  return null;
}

async function setCertDisplayFields(result) {
  const contentType = result.headers.get('Content-Type');
  const warning = result.headers.get('Warning');
  const location = result.headers.get('Location');

  var correctContentType = contentType == 'application/cert-chain+cbor';
  document.getElementById('certurl').textContent = result.url;
  document.getElementById('certcontenttype').textContent = contentType;
  document.getElementById('certwarning').textContent = warning;
  document.getElementById('certlocation').textContent = location;

  let buffer = await result.arrayBuffer();
  var enc = new TextDecoder("utf-8");
  var s = enc.decode(buffer);
  if (correctContentType) {
    if (warning == null && location != null) {
      document.getElementById('certimg').innerHTML = "⌛";
    } else {
      document.getElementById('certimg').innerHTML = "✅";
    }
  } else {
    document.getElementById('certimg').innerHTML = "❌";
  }
}

async function setDisplayFields(result, urlFieldId, contentTypeFieldId,
                                imgFieldId) {
  const contentType = result.headers.get('Content-Type');
  const warning = result.headers.get('Warning');
  const location = result.headers.get('Location');

  var correctContentType = contentType == 'application/signed-exchange;v=b3';
  document.getElementById(urlFieldId).textContent = result.url;
  document.getElementById(contentTypeFieldId).textContent = contentType;
  if (urlFieldId === "cacheurl") {
    document.getElementById('cachewarning').textContent = warning;
    document.getElementById('cachelocation').textContent = location;
  }

  let buffer = await result.arrayBuffer();
  var enc = new TextDecoder("utf-8");
  var s = enc.decode(buffer);
  if (correctContentType && s.startsWith('sxg1-b3\0')) {
    if (warning == null && location != null) {
      document.getElementById(imgFieldId).innerHTML = "⌛";
    } else {
      document.getElementById(imgFieldId).innerHTML = "✅";
    }
  } else {
    document.getElementById(imgFieldId).innerHTML = "❌";
  }
  let certUrl = getCertUrl(s);

  if (certUrl) {
    let certResult = await fetch(certUrl.slice(1, -1), {
      method: "GET",
      headers: { 
        "Accept": "application/cert-chain+cbor",
      }});

    setCertDisplayFields(certResult);
  }
}

// Update the relevant fields with the new data.
function setDOMInfo(url) {
    fetch(url, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"}
    }).then(result => {
      setDisplayFields(result, 'url', 'contenttype', 'originimg');
    })

    const urlObject = new URL(url);
    cacheUrl = 'https://' 
      + constructHumanReadableCurlsProxyDomain_(urlObject.host) 
      + '.webpkgcache.com/doc/-/s/'
      + urlObject.host
      + urlObject.pathname;

    var certUrl;
    fetch(cacheUrl, {
      method: "GET",
      headers: { 
        "Accept": "application/signed-exchange;v=b3",
      }
    }).then(result => {
      setDisplayFields(result, 'cacheurl', 'cachecontenttype', 'cacheimg');
    });
};

window.addEventListener('DOMContentLoaded', () => {
  // Query for the active tab
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    setDOMInfo(tabs[0].url);
  });
});
