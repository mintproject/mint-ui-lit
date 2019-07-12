let initCalled = false;
const callbackPromise = new Promise((res, rej) => {
    window._resolveGoogleMapsAPI = res;
    window._rejectGoogleMapsAPI = rej;
});
export const loadGoogleMapsAPI = async (apiKey) => {
    if (!initCalled) {
        const script = document.createElement('script');
        script.addEventListener('error', (e) => {
            window._rejectGoogleMapsAPI(e);
        });
        script.src = `https://maps.googleapis.com/maps/api/js?${apiKey ? `key=${apiKey}&` : ''}callback=_resolveGoogleMapsAPI`;
        document.head.appendChild(script);
        initCalled = true;
    }
    await callbackPromise;
    return google.maps;
};
// export const forwardEvent = (instance: object, name: string, target: EventTarget) => {
//   google.maps.event.addListener(instance, name, (event: Event) => {
//     target.dispatchEvent(new CustomEvent(`google-map-marker-${name}`, {
//       detail: {
//         mapsEvent: event,
//       }
//     }));
//   });
// }
