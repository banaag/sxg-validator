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

/**
 * Parses the url into separate URL components.
 * @param {string} url 
 * @returns {object} An object containing parsed out URL components.
 */
function parseUrl(url) {
  var elem = document.createElement('a');
  elem.href = url;
  return {
    protocol: elem.protocol,
    host:     elem.host,
    hostname: elem.hostname,
    port:     elem.port,
    pathname: elem.pathname,
    hash:     elem.hash
  };
}

function getCertUrl(result) {
  const resultArray = result.split(';');
  if (resultArray.length >= 3) {
    var pair = resultArray[2].split('=');
    if (pair.length >= 2) {
      return pair[1];
    }
  }
  return null;
}

function setCertDisplayFields(result) {
  var correctContentType = result.headers.get('Content-Type') ==
      'application/cert-chain+cbor';
  document.getElementById('certurl').textContent = result.url;
  document.getElementById('certcontenttype').textContent =
      result.headers.get('Content-Type');
  document.getElementById('certwarning').textContent = 
    result.headers.get('Warning');
  document.getElementById('certlocation').textContent =
    result.headers.get('Location');

  let ret = result.arrayBuffer().then(function(buffer) {
    var enc = new TextDecoder("utf-8");
    var s = enc.decode(buffer);
    if (correctContentType) {
      if (result.headers.get('Warning') == null &&
          result.headers.get('Location') != null) {
        document.getElementById('certimg').innerHTML = "⌛";
      } else {
        document.getElementById('certimg').innerHTML = "✅";
      }
    } else {
      document.getElementById('certimg').innerHTML = "❌";
    }
  });
}

function setDisplayFields(result, urlFieldId, contentTypeFieldId, imgFieldId) {
  var correctContentType = result.headers.get('Content-Type') ==
      'application/signed-exchange;v=b3';
  document.getElementById(urlFieldId).textContent = result.url;
  document.getElementById(contentTypeFieldId).textContent =
      result.headers.get('Content-Type');
  if (urlFieldId === "cacheurl") {
    document.getElementById('cachewarning').textContent = 
      result.headers.get('Warning');
    document.getElementById('cachelocation').textContent =
      result.headers.get('Location');
  }

  let ret = result.arrayBuffer().then(function(buffer) {
    var enc = new TextDecoder("utf-8");
    var s = enc.decode(buffer);
    if (correctContentType && s.startsWith('sxg1-b3\0')) {
      if (result.headers.get('Warning') == null &&
          result.headers.get('Location') != null) {
        document.getElementById(imgFieldId).innerHTML = "⌛";
      } else {
        document.getElementById(imgFieldId).innerHTML = "✅";
      }
    } else {
      document.getElementById(imgFieldId).innerHTML = "❌";
    }
    return getCertUrl(s);
  });

  ret.then(certUrl => {
    fetch(certUrl.slice(1, -1), {
      method: "GET",
      headers: { 
        "Accept": "application/cert-chain+cbor",
      }
    }).then(result => {
      setCertDisplayFields(result);
    })
  });
}

// Update the relevant fields with the new data.
const setDOMInfo = info => {
    fetch(info.url, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"}
    }).then(result => {
      setDisplayFields(result, 'url', 'contenttype', 'originimg');
    })

    var urlObject = parseUrl(info.url);
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
    // Send a request for the DOM info.
    chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'popup', subject: 'DOMInfo'},
        // Specify a callback to be called 
        // from the receiving end (content script).
        setDOMInfo);
  });
});